import axios from 'axios';
import { PaymentModel } from '../models/payment.model';
import { LoyaltyService } from './loyalty.service';
import { EmailService } from './email.service';
import { generateSignature } from '../utils/hmac';
import { getPool } from '../config/database';
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
    if (status === 'SUCCESS') {
      await PaymentModel.updateStatus(bookingId, 'SUCCESS');
      
      // TODO: Cần lấy customerId từ Booking (mock tạm 1 nếu không query DB)
      // Dưới đây là ví dụ query DB để lấy thông tin booking, email, customerId:
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
        // 1. Cộng LoyaltyPoints
        await LoyaltyService.addPointsFromPayment(booking.CustomerID, booking.TotalAmount);
        
        // 2. Gửi email vé + Push FCM (Push FCM sẽ làm sau nếu cần)
        await EmailService.sendTicketEmail(booking.Email, {
          bookingId,
          amount: booking.TotalAmount,
        });
      }

    } else if (status === 'FAILED') {
      await PaymentModel.updateStatus(bookingId, 'FAILED');
      // TODO (Buổi 5 - TV3): release Redis seat lock + broadcast WebSocket ghế → AVAILABLE
    }
  }

  /**
   * Thử lại thanh toán (Retry).
   */
  static async retryPayment(bookingId: number, amount: number, method: string) {
    // Chỉ cập nhật trạng thái chứ không tạo bản ghi mới
    await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');
    // ... gọi lại gateway (tương tự initPayment)
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
}
