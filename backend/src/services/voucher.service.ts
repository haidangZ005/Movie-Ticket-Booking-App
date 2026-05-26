import * as sql from 'mssql';
import { connectDB } from '../config/database';
import { VoucherModel, VoucherCheckParams, IVoucher } from '../models/voucher.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

export class VoucherService {
  /**
   * Tính số tiền được giảm từ voucher.
   */
  static calculateDiscount(voucher: IVoucher, totalAmount: number): number {
    let discount = 0;
    if (voucher.DiscountType === 'PERCENT') {
      discount = (voucher.DiscountValue / 100) * totalAmount;
      if (voucher.MaxDiscount) {
        discount = Math.min(discount, voucher.MaxDiscount);
      }
    } else {
      // FIXED
      discount = Math.min(voucher.DiscountValue, totalAmount);
    }
    return Math.round(discount); // Làm tròn VND
  }

  /**
   * Validate voucher trước khi áp dụng — kiểm tra đầy đủ điều kiện nghiệp vụ.
   */
  static async validateVoucher(
    voucherId: number,
    customerId: number,
    totalAmount: number,
    totalSeats: number,
    showFormat: string
  ): Promise<IVoucher> {
    const voucher = await VoucherModel.getById(voucherId);
    if (!voucher) {
      throw new AppException(ErrorCode.DATA_NOT_FOUND);
    }

    // Kiểm tra voucher còn active
    if (!voucher.IsActive) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // Kiểm tra còn hiệu lực
    const now = new Date();
    if (now < new Date(voucher.StartDate) || now > new Date(voucher.EndDate)) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // Kiểm tra còn lượt dùng
    if (voucher.UsageLimit && (voucher.UsageCount ?? 0) >= voucher.UsageLimit) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // Kiểm tra giá trị đơn tối thiểu
    if (voucher.MinOrderValue && totalAmount < voucher.MinOrderValue) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // Kiểm tra số vé tối thiểu
    if (voucher.MinTicketQty && totalSeats < voucher.MinTicketQty) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // Kiểm tra định dạng phim
    if (
      voucher.ApplicableFormat &&
      voucher.ApplicableFormat.toUpperCase() !== 'ALL' &&
      voucher.ApplicableFormat.toUpperCase() !== showFormat.toUpperCase()
    ) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // Kiểm tra customer đã dùng voucher này chưa (first use only)
    return voucher;
  }

  /**
   * Áp dụng voucher + tính giá sau giảm.
   * Gọi validate → applyVoucher → trả về discountAmount + finalAmount.
   */
  static async applyAndCalculate(
    voucherId: number,
    customerId: number,
    bookingId: number | undefined,
    totalAmount: number,
    totalSeats: number,
    showFormat: string
  ) {
    // 1. Validate đầy đủ
    const voucher = await this.validateVoucher(voucherId, customerId, totalAmount, totalSeats, showFormat);

    // 2. Tính số tiền giảm
    const discountAmount = this.calculateDiscount(voucher, totalAmount);
    const finalAmount = totalAmount - discountAmount;

    // 3. Ghi nhận sử dụng voucher
    if (bookingId) {
      await VoucherModel.applyVoucher(voucherId, customerId, bookingId);
    }

    return {
      voucherId,
      voucherCode: voucher.Code,
      discountType: voucher.DiscountType,
      discountValue: voucher.DiscountValue,
      discountAmount,
      finalAmount: Math.max(finalAmount, 0),
    };
  }

  /**
   * Auto-suggest: Gợi ý voucher tốt nhất (giảm nhiều tiền nhất) cho customer.
   */
  static async suggestBestVoucher(params: VoucherCheckParams) {
    const vouchers = await VoucherModel.getAvailableVouchers(params);

    if (vouchers.length === 0) return null;

    // Tính discount cho từng voucher → chọn cái giảm nhiều nhất
    let bestVoucher = vouchers[0];
    let bestDiscount = this.calculateDiscount(bestVoucher, params.totalAmount);

    for (let i = 1; i < vouchers.length; i++) {
      const discount = this.calculateDiscount(vouchers[i], params.totalAmount);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestVoucher = vouchers[i];
      }
    }

    return {
      voucher: bestVoucher,
      discountAmount: bestDiscount,
      finalAmount: Math.max(params.totalAmount - bestDiscount, 0),
    };
  }

  /**
   * Khôi phục voucher khi hủy vé — rollback VoucherUsage + giảm UsageCount.
   * Gọi bởi TV3 khi cancel booking.
   */
  static async restoreVoucher(voucherId: number, customerId: number, bookingId: number) {
    const pool = await connectDB();

    // 1. Xóa bản ghi VoucherUsage
    await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .input('CustomerID', sql.Int, customerId)
      .input('BookingID', sql.Int, bookingId)
      .query(`
        DELETE FROM VoucherUsage
        WHERE VoucherID = @VoucherID
          AND CustomerID = @CustomerID
          AND BookingID = @BookingID
      `);

    // 2. Giảm UsageCount (không được < 0)
    await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .query(`
        UPDATE Voucher
        SET UsageCount = CASE WHEN UsageCount > 0 THEN UsageCount - 1 ELSE 0 END
        WHERE VoucherID = @VoucherID
      `);
  }
}
