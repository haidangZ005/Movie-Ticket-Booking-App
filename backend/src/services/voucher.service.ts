import * as sql from 'mssql';
import { connectDB } from '../config/database';
import { VoucherModel, VoucherCheckParams, IVoucher } from '../models/voucher.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

type ReasonCode = 'NOT_STARTED' | 'EXPIRED' | 'USAGE_LIMIT_REACHED' | 'MIN_ORDER_NOT_MET' | 'MIN_TICKET_NOT_MET' | 'FORMAT_NOT_MATCH' | 'ALREADY_USED' | 'NOT_OWNED';

interface EvaluateResult {
  applicable: boolean;
  reasonCode?: ReasonCode;
  reasonText?: string;
}

export class VoucherService {
  /**
   * Tính số tiền được giảm từ voucher.
   */
  static calculateDiscount(voucher: IVoucher | any, totalAmount: number): number {
    let discount = 0;
    if (voucher.DiscountType === 'PERCENT') {
      discount = (voucher.DiscountValue / 100) * totalAmount;
      if (voucher.MaxDiscount) {
        discount = Math.min(discount, voucher.MaxDiscount);
      }
    } else {
      discount = Math.min(voucher.DiscountValue, totalAmount);
    }
    return Math.round(discount);
  }

  /**
   * Đánh giá điều kiện voucher — dùng chung cho checkout và apply.
   * Backend là nguồn sự thật cho business rule.
   */
  static evaluateVoucher(voucher: any, totalAmount: number, totalSeats: number, showFormat: string, hasUsed: boolean): EvaluateResult {
    const now = new Date();
    const endDate = new Date(voucher.EndDate);
    endDate.setHours(23, 59, 59, 999);

    if (now < new Date(voucher.StartDate)) {
      return { applicable: false, reasonCode: 'NOT_STARTED', reasonText: 'Voucher chưa đến thời gian sử dụng' };
    }
    if (now > endDate) {
      return { applicable: false, reasonCode: 'EXPIRED', reasonText: 'Voucher đã hết hạn' };
    }
    if (voucher.UsageLimit && (voucher.UsageCount ?? 0) >= voucher.UsageLimit) {
      return { applicable: false, reasonCode: 'USAGE_LIMIT_REACHED', reasonText: 'Voucher đã hết lượt sử dụng' };
    }
    if (voucher.MinOrderValue && totalAmount < voucher.MinOrderValue) {
      return { applicable: false, reasonCode: 'MIN_ORDER_NOT_MET', reasonText: `Đơn tối thiểu ${Number(voucher.MinOrderValue).toLocaleString('vi-VN')}đ` };
    }
    if (voucher.MinTicketQty && totalSeats < voucher.MinTicketQty) {
      return { applicable: false, reasonCode: 'MIN_TICKET_NOT_MET', reasonText: `Cần ít nhất ${voucher.MinTicketQty} vé` };
    }
    if (voucher.ApplicableFormat && voucher.ApplicableFormat.toUpperCase() !== 'ALL' && voucher.ApplicableFormat.toUpperCase() !== showFormat.toUpperCase()) {
      return { applicable: false, reasonCode: 'FORMAT_NOT_MATCH', reasonText: `Chỉ áp dụng định dạng ${voucher.ApplicableFormat}` };
    }
    if (hasUsed) {
      return { applicable: false, reasonCode: 'ALREADY_USED', reasonText: 'Bạn đã sử dụng voucher này' };
    }

    return { applicable: true };
  }

  /**
   * Kiểm tra customer có quyền dùng voucher: public hoặc được gán qua VoucherCustomer.
   */
  static async checkVoucherOwnership(voucherId: number, customerId: number): Promise<boolean> {
    const pool = await connectDB();
    const result = await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT COUNT(*) AS cnt FROM VoucherCustomer
        WHERE VoucherID = @VoucherID AND CustomerID = @CustomerID
      `);

    if (result.recordset[0].cnt > 0) return true;

    const isPublic = await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .query(`
        SELECT COUNT(*) AS cnt FROM VoucherCustomer
        WHERE VoucherID = @VoucherID
      `);

    return isPublic.recordset[0].cnt === 0;
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

    if (!voucher.IsActive) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const hasUsed = await VoucherModel.hasCustomerUsedVoucher(voucherId, customerId);
    const isOwner = await VoucherService.checkVoucherOwnership(voucherId, customerId);
    if (!isOwner) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }

    const evaluation = VoucherService.evaluateVoucher(voucher, totalAmount, totalSeats, showFormat, hasUsed);
    if (!evaluation.applicable) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

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
    const voucher = await VoucherService.validateVoucher(voucherId, customerId, totalAmount, totalSeats, showFormat);

    const discountAmount = VoucherService.calculateDiscount(voucher, totalAmount);
    const finalAmount = totalAmount - discountAmount;

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

    let bestVoucher = vouchers[0];
    let bestDiscount = VoucherService.calculateDiscount(bestVoucher, params.totalAmount);

    for (let i = 1; i < vouchers.length; i++) {
      const discount = VoucherService.calculateDiscount(vouchers[i], params.totalAmount);
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
   * Checkout vouchers — trả tất cả voucher visible cho customer cùng trạng thái applicable.
   */
  static async getCheckoutVouchers(params: VoucherCheckParams) {
    return VoucherModel.getCheckoutVouchers(params);
  }

  /**
   * Khôi phục voucher khi hủy vé — rollback VoucherUsage + giảm UsageCount.
   */
  static async restoreVoucher(voucherId: number, customerId: number, bookingId: number) {
    const pool = await connectDB();

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

    await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .query(`
        UPDATE Voucher
        SET UsageCount = CASE WHEN UsageCount > 0 THEN UsageCount - 1 ELSE 0 END
        WHERE VoucherID = @VoucherID
      `);
  }
}
