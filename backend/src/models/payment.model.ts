import sql from 'mssql';
import { getPool } from '../config/database';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod = 'QR_MOMO' | 'QR_VNPAY' | 'CREDIT_CARD';

export interface CreatePaymentPayload {
  bookingId: number;
  amount: number;
  method?: PaymentMethod;
  voucherId?: number;
  discountAmount?: number;
}

export interface Payment {
  PaymentID: number;
  BookingID: number;
  VoucherID: number | null;
  Amount: number;
  DiscountAmount: number;
  PaymentMethod: PaymentMethod | null;
  PaymentDate: Date;
  Status: PaymentStatus;
  RefundAmount: number;
  RefundAt: Date | null;
}

/**
 * Model thao tác trực tiếp với bảng Payment trong SQL Server.
 * Quan hệ 1:1 với Booking — khi retry thanh toán chỉ UPDATE Status, không tạo mới.
 */
export class PaymentModel {
  /**
   * Tạo bản ghi Payment mới với trạng thái CREATED.
   * Gọi ngay sau khi khóa ghế Redis thành công (trong booking flow).
   */
  static async create(data: CreatePaymentPayload): Promise<Payment> {
    const pool = getPool();
    const result = await pool
      .request()
      .input('BookingID', sql.Int, data.bookingId)
      .input('VoucherID', sql.Int, data.voucherId ?? null)
      .input('Amount', sql.Decimal(10, 2), data.amount)
      .input('DiscountAmount', sql.Decimal(10, 2), data.discountAmount ?? 0)
      .input('PaymentMethod', sql.NVarChar(20), data.method ?? null)
      .query(`
        INSERT INTO Payment (
          BookingID, VoucherID, Amount, DiscountAmount,
          PaymentMethod, PaymentDate, Status, RefundAmount, RefundAt
        )
        OUTPUT
          INSERTED.PaymentID, INSERTED.BookingID, INSERTED.VoucherID,
          INSERTED.Amount, INSERTED.DiscountAmount, INSERTED.PaymentMethod,
          INSERTED.PaymentDate, INSERTED.Status, INSERTED.RefundAmount, INSERTED.RefundAt
        VALUES (
          @BookingID, @VoucherID, @Amount, @DiscountAmount,
          @PaymentMethod, GETDATE(), 'CREATED', 0, NULL
        )
      `);
    return result.recordset[0];
  }

  /**
   * Lấy thông tin Payment theo BookingID.
   */
  static async findByBookingId(bookingId: number): Promise<Payment | null> {
    const pool = getPool();
    const result = await pool
      .request()
      .input('BookingID', sql.Int, bookingId)
      .query('SELECT * FROM Payment WHERE BookingID = @BookingID');
    return result.recordset[0] ?? null;
  }

  /**
   * Lấy thông tin Payment theo PaymentID.
   */
  static async findById(paymentId: number): Promise<Payment | null> {
    const pool = getPool();
    const result = await pool
      .request()
      .input('PaymentID', sql.Int, paymentId)
      .query('SELECT * FROM Payment WHERE PaymentID = @PaymentID');
    return result.recordset[0] ?? null;
  }

  /**
   * Cập nhật trạng thái Payment (state machine).
   * Khi retry thanh toán: UPDATE Status thay vì INSERT mới.
   */
  static async updateStatus(
    bookingId: number,
    status: PaymentStatus,
    extra?: { refundAmount?: number; refundAt?: Date }
  ): Promise<Payment | null> {
    const pool = getPool();
    const result = await pool
      .request()
      .input('BookingID', sql.Int, bookingId)
      .input('Status', sql.NVarChar(20), status)
      .input('RefundAmount', sql.Decimal(10, 2), extra?.refundAmount ?? null)
      .input('RefundAt', sql.DateTime, extra?.refundAt ?? null)
      .query(`
        UPDATE Payment
        SET
          Status = @Status,
          RefundAmount = COALESCE(@RefundAmount, RefundAmount),
          RefundAt    = COALESCE(@RefundAt, RefundAt)
        OUTPUT
          INSERTED.PaymentID, INSERTED.BookingID, INSERTED.VoucherID,
          INSERTED.Amount, INSERTED.DiscountAmount, INSERTED.PaymentMethod,
          INSERTED.PaymentDate, INSERTED.Status, INSERTED.RefundAmount, INSERTED.RefundAt
        WHERE BookingID = @BookingID
      `);
    return result.recordset[0] ?? null;
  }
}
