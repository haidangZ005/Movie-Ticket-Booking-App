import axios from 'axios';
import { PaymentModel } from '../models/payment.model';
import { LoyaltyService } from './loyalty.service';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
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
      await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');
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
      const signature = generateSignature(payloadData);

      const gwResponse = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadData, {
        headers: {
          'Content-Type': 'application/json',
          'x-hmac-signature': signature,
        },
      });

      // 3. Cập nhật Payment → PENDING_PAYMENT
      await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');

      // PaymentGW trả thẳng data (không có wrapper { success, data })
      return gwResponse.data;
    }
  }

  /**
   * Xử lý webhook từ Payment Gateway.
   */
  static async handleWebhook(bookingId: number, status: string) {
    if (status === 'SUCCESS') {
      await PaymentModel.updateStatus(bookingId, 'SUCCESS');

      const pool = getPool();
      const bookingRes = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
          SELECT
            b.CustomerID, b.TotalAmount,
            a.Email,
            m.MovieTitle,
            STRING_AGG(chs.SeatNumber, ', ') AS Seats
          FROM Booking b
          JOIN Customer c ON b.CustomerID = c.CustomerID
          JOIN Account a ON c.AccountID = a.AccountID
          LEFT JOIN BookingSeat bs ON b.BookingID = bs.BookingID
          LEFT JOIN CinemaHallSeat chs ON bs.SeatID = chs.SeatID
          LEFT JOIN Show sh ON b.ShowID = sh.ShowID
          LEFT JOIN Movie m ON sh.MovieID = m.MovieID
          WHERE b.BookingID = @BookingID
          GROUP BY b.CustomerID, b.TotalAmount, a.Email, m.MovieTitle
        `);

      const booking = bookingRes.recordset[0];

      if (booking) {
        try {
          await LoyaltyService.addPointsFromPayment(booking.CustomerID, booking.TotalAmount);

          await EmailService.sendTicketEmail(booking.Email, {
            bookingId,
            amount: booking.TotalAmount,
            movieTitle: booking.MovieTitle,
            seats: booking.Seats,
          });

          await NotificationService.notifyBookingSuccess(
            booking.CustomerID, booking.Email, bookingId, booking.MovieTitle || 'Phim'
          );
        } catch (err) {
          console.error(`[PaymentService] Side-effect error for Booking #${bookingId}:`, err);
        }
      }

    } else if (status === 'FAILED') {
      await PaymentModel.updateStatus(bookingId, 'FAILED');
    }
  }

  /**
   * Thử lại thanh toán (Retry).
   */
  static async retryPayment(bookingId: number, amount: number, method: string) {
    const existing = await PaymentModel.findByBookingId(bookingId);
    if (!existing) {
      throw new AppException(ErrorCode.DATA_NOT_FOUND);
    }
    if (existing.Status !== 'FAILED' && existing.Status !== 'EXPIRED') {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');

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
    const signature = generateSignature(payloadData);

    const gwResponse = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadData, {
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-signature': signature,
      },
    });

    return gwResponse.data;
  }

  /**
   * Xử lý hoàn tiền khi hủy vé.
   */
  static async processRefund(bookingId: number) {
    const payment = await PaymentModel.findByBookingId(bookingId);
    if (!payment || payment.Status !== 'SUCCESS') {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const refundAmount = payment.Amount - payment.DiscountAmount;

    await PaymentModel.updateStatus(bookingId, 'REFUNDED', {
      refundAmount,
      refundAt: new Date(),
    });

    try {
      const refundPayload = {
        orderId: bookingId.toString(),
        amount: refundAmount,
        action: 'REFUND',
      };
      const signature = generateSignature(refundPayload);

      await axios.post(`${PAYMENT_GW_URL}/refund`, refundPayload, {
        headers: {
          'Content-Type': 'application/json',
          'x-hmac-signature': signature,
        },
      });
    } catch (err) {
      console.error(`[PaymentService] GW refund failed for Booking #${bookingId}:`, err);
    }

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
        await LoyaltyService.addPointsFromPayment(booking.CustomerID, -booking.TotalAmount);

        if (payment.VoucherID) {
          const { VoucherService } = await import('./voucher.service');
          await VoucherService.restoreVoucher(payment.VoucherID, booking.CustomerID, bookingId);
        }

        await EmailService.sendRefundEmail(booking.Email, { bookingId, refundAmount });

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
