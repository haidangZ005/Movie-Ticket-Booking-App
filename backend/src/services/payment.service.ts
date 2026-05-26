import axios from 'axios';
import { PaymentModel } from '../models/payment.model';
import { LoyaltyService } from './loyalty.service';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { VoucherModel } from '../models/voucher.model';
import { generateSignature } from '../utils/hmac';
import { getPool } from '../config/database';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';
import sql from 'mssql';

const PAYMENT_GW_URL = process.env.PAYMENT_GW_URL || 'http://localhost:4000/api/payment';

export class PaymentService {
  /**
   * Khởi tạo thanh toán: 
   * Sinh QR code hoặc trả về thông báo thanh toán thẻ.
   */
  static async initPayment(bookingId: number, amount: number, method: string, currency: string = 'VND', voucherId?: number, discountAmount?: number) {
    // 1. Tạo Payment record trong DB (trạng thái CREATED)
    await PaymentModel.create({
      bookingId,
      amount,
      method: method as any || 'QR_MOMO',
      voucherId,
      discountAmount: discountAmount ?? 0,
    });

    if (method === 'CREDIT_CARD') {
      // Cập nhật Payment → PENDING_PAYMENT
      await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');
      // Với thẻ tín dụng, client sẽ tự gọi qua Payment GW hoặc popup, ở đây chỉ trả về OK
      return {
        orderId: bookingId,
        message: 'Vui lòng tiếp tục nhập thông tin thẻ.',
      };
    } else {
      // 2. Gọi Payment Gateway → sinh mã QR (kèm HMAC)
      const payloadData = {
        orderId: bookingId,
        amount,
        currency,
        method,
      };
      const payloadString = JSON.stringify(payloadData);
      const signature = generateSignature(payloadString);

      const gwResponse = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'x-hmac-signature': signature,
        },
      });

      // 3. Cập nhật Payment → PENDING_PAYMENT
      await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');

      return gwResponse.data.data;
    }
  }

  /**
   * Xử lý webhook từ Payment Gateway.
   */
  static async handleWebhook(bookingId: number, status: string) {
    const pool = getPool();
    if (status === 'SUCCESS') {
      await PaymentModel.updateStatus(bookingId, 'SUCCESS');
      await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
          UPDATE Booking
          SET Status = 'CONFIRMED', UpdatedAt = GETDATE()
          WHERE BookingID = @BookingID;

          UPDATE BookingSeat
          SET Status = 'BOOKED', HoldUntil = NULL
          WHERE BookingID = @BookingID;
        `);
      
      // Lấy thông tin booking + customer + phim để cộng điểm & gửi email vé
      const bookingRes = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
          SELECT 
            b.CustomerID, b.TotalAmount,
            p.VoucherID,
            a.Email,
            m.MovieTitle,
            STRING_AGG(chs.SeatNumber, ', ') WITHIN GROUP (ORDER BY chs.RowIndex, chs.ColIndex) AS Seats
          FROM Booking b
          JOIN Customer c ON b.CustomerID = c.CustomerID
          JOIN Account a ON c.AccountID = a.AccountID
          LEFT JOIN [Show] sh ON b.ShowID = sh.ShowID
          LEFT JOIN Movie m ON sh.MovieID = m.MovieID
          LEFT JOIN Payment p ON p.BookingID = b.BookingID
          LEFT JOIN BookingSeat bs ON b.BookingID = bs.BookingID
          LEFT JOIN CinemaHallSeat chs ON bs.SeatID = chs.SeatID
          WHERE b.BookingID = @BookingID
          GROUP BY b.CustomerID, b.TotalAmount, p.VoucherID, a.Email, m.MovieTitle
        `);
      
      const booking = bookingRes.recordset[0];
      
      if (booking) {
        // Side-effects (loyalty + email) không được phép làm fail webhook
        try {
          await LoyaltyService.addPointsFromPayment(booking.CustomerID, booking.TotalAmount, bookingId);
          if (booking.VoucherID) {
            await VoucherModel.applyVoucher(booking.VoucherID, booking.CustomerID, bookingId);
          }
          
          await EmailService.sendTicketEmail(booking.Email, {
            bookingId,
            amount: booking.TotalAmount,
            movieTitle: booking.MovieTitle,
            seats: booking.Seats,
          });

          // Tạo notification trong DB + gửi thông báo
          await NotificationService.notifyBookingSuccess(
            booking.CustomerID, booking.Email, bookingId, booking.MovieTitle || 'Phim'
          );
        } catch (err) {
          console.error(`[PaymentService] Side-effect error for Booking #${bookingId}:`, err);
        }
      }

    } else if (status === 'FAILED') {
      await PaymentModel.updateStatus(bookingId, 'FAILED');
      await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
          UPDATE Booking
          SET Status = 'CANCELLED', UpdatedAt = GETDATE()
          WHERE BookingID = @BookingID;

          UPDATE BookingSeat
          SET Status = 'CANCELLED', HoldUntil = NULL
          WHERE BookingID = @BookingID;
        `);
      // TV3 sẽ xử lý: release Redis seat lock + broadcast WebSocket ghế → AVAILABLE
    }
  }

  /**
   * Thử lại thanh toán (Retry).
   * Chỉ cho phép retry khi Payment đang ở trạng thái FAILED hoặc EXPIRED.
   */
  static async retryPayment(bookingId: number, amount: number, method: string) {
    // 1. Kiểm tra trạng thái hiện tại — chỉ cho retry FAILED hoặc EXPIRED
    const existing = await PaymentModel.findByBookingId(bookingId);
    if (!existing) {
      throw new AppException(ErrorCode.DATA_NOT_FOUND);
    }
    if (existing.Status !== 'FAILED' && existing.Status !== 'EXPIRED') {
      throw new AppException(ErrorCode.INVALID_DATA); // Không thể retry trạng thái khác
    }

    // 2. Cập nhật trạng thái → PENDING_PAYMENT (không tạo bản ghi mới)
    await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');

    // 3. Gọi lại gateway tùy method
    if (method === 'CREDIT_CARD') {
      return {
        orderId: bookingId,
        message: 'Vui lòng tiếp tục nhập thông tin thẻ.',
      };
    }

    const payloadData = {
      orderId: bookingId,
      amount,
      currency: 'VND',
      method,
    };
    const payloadString = JSON.stringify(payloadData);
    const signature = generateSignature(payloadString);

    const gwResponse = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-signature': signature,
      },
    });

    return gwResponse.data.data;
  }

  /**
   * Xử lý hoàn tiền khi hủy vé.
   * Gọi bởi TV3 (cancel.service) khi booking bị hủy.
   * Flow: cập nhật status → gọi GW refund → thu hồi loyalty → khôi phục voucher → gửi email
   */
  static async processRefund(bookingId: number) {
    // 1. Kiểm tra Payment tồn tại và đang ở trạng thái SUCCESS
    const payment = await PaymentModel.findByBookingId(bookingId);
    if (!payment || payment.Status !== 'SUCCESS') {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const refundAmount = payment.Amount - payment.DiscountAmount;

    // 2. Cập nhật Payment → REFUNDED
    await PaymentModel.updateStatus(bookingId, 'REFUNDED', {
      refundAmount,
      refundAt: new Date(),
    });

    // 3. Gọi Payment GW refund (mock — GW chỉ log lại)
    try {
      const refundPayload = {
        orderId: bookingId.toString(),
        amount: refundAmount,
        action: 'REFUND',
      };
      const payloadString = JSON.stringify(refundPayload);
      const signature = generateSignature(payloadString);

      await axios.post(`${PAYMENT_GW_URL}/refund`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'x-hmac-signature': signature,
        },
      });
    } catch (err) {
      console.error(`[PaymentService] GW refund failed for Booking #${bookingId}:`, err);
    }

    // 4. Thu hồi loyalty points + khôi phục voucher + gửi email — side-effects
    try {
      const pool = getPool();
      const bookingRes = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
          SELECT b.CustomerID, a.Email, b.TotalAmount
          FROM Booking b
          JOIN Customer c ON b.CustomerID = c.CustomerID
          JOIN Account a ON c.AccountID = a.AccountID
          WHERE b.BookingID = @BookingID
        `);

      const booking = bookingRes.recordset[0];
      if (booking) {
        // Thu hồi loyalty points
        await LoyaltyService.addPointsFromPayment(booking.CustomerID, -booking.TotalAmount);

        // Khôi phục voucher (nếu có)
        if (payment.VoucherID) {
          const { VoucherService } = await import('./voucher.service');
          await VoucherService.restoreVoucher(payment.VoucherID, booking.CustomerID, bookingId);
        }

        // Gửi email thông báo hoàn tiền
        await EmailService.sendRefundEmail(booking.Email, {
          bookingId,
          refundAmount,
        });

        // Tạo notification trong DB
        await NotificationService.notifyRefundSuccess(
          booking.CustomerID, booking.Email, bookingId, refundAmount
        );
      }
    } catch (err) {
      console.error(`[PaymentService] Refund side-effect error for Booking #${bookingId}:`, err);
    }

    return { bookingId, refundAmount, status: 'REFUNDED' };
  }
}
