import * as sql from 'mssql';
import { connectDB } from '../config/database';

export interface IVoucher {
  VoucherID?: number;
  Code: string;
  DiscountType: string;
  DiscountValue: number;
  MaxDiscount?: number;
  StartDate: string | Date;
  EndDate: string | Date;
  IsActive?: boolean;
  UsageLimit: number;
  UsageCount?: number;
  MinTicketQty?: number;
  MinOrderValue?: number;
  ApplicableFormat?: string;
  CreatedAt?: string | Date;
}

// Request params để kiểm tra điều kiện voucher
export interface VoucherCheckParams {
  customerId: number;
  totalAmount: number;   // Tổng tiền đơn (trước giảm)
  totalSeats: number;    // Số ghế
  showFormat: string;    // '2D' | '3D' | 'IMAX'
}

export class VoucherModel {
  static async getAll() {
    const pool = await connectDB();
    const result = await pool.request()
      .query('SELECT * FROM Voucher ORDER BY VoucherID DESC');
    return result.recordset;
  }

  static async getById(id: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Voucher WHERE VoucherID = @id');
    return result.recordset[0];
  }

  static async create(voucher: IVoucher) {
    const pool = await connectDB();
    // Normalize: API gửi snake_case (code, discountType) nhưng interface dùng PascalCase
    const normalized = {
      Code: voucher.Code || (voucher as any).code,
      DiscountType: voucher.DiscountType || (voucher as any).discountType,
      DiscountValue: voucher.DiscountValue ?? (voucher as any).discountValue,
      MaxDiscount: voucher.MaxDiscount ?? (voucher as any).maxDiscount,
      StartDate: voucher.StartDate || (voucher as any).startDate,
      EndDate: voucher.EndDate || (voucher as any).endDate,
      IsActive: voucher.IsActive ?? (voucher as any).isActive ?? true,
      UsageLimit: voucher.UsageLimit ?? (voucher as any).usageLimit,
      MinTicketQty: voucher.MinTicketQty ?? (voucher as any).minTicketQty,
      MinOrderValue: voucher.MinOrderValue ?? (voucher as any).minOrderValue,
      ApplicableFormat: voucher.ApplicableFormat ?? (voucher as any).applicableFormat,
    };

    const result = await pool.request()
      .input('Code', sql.NVarChar(50), normalized.Code)
      .input('discountType', sql.NVarChar(10), normalized.DiscountType)
      .input('discountValue', sql.Decimal(10, 2), normalized.DiscountValue)
      .input('maxDiscount', sql.Decimal(10, 2), normalized.MaxDiscount ?? null)
      .input('startDate', sql.Date, normalized.StartDate)
      .input('endDate', sql.Date, normalized.EndDate)
      .input('isActive', sql.Bit, normalized.IsActive)
      .input('usageLimit', sql.Int, normalized.UsageLimit)
      .input('minTicketQty', sql.Int, normalized.MinTicketQty ?? null)
      .input('minOrderValue', sql.Decimal(10, 2), normalized.MinOrderValue ?? null)
      .input('applicableFormat', sql.NVarChar(10), normalized.ApplicableFormat ?? null)
      .query(`
        INSERT INTO Voucher (
          Code, DiscountType, DiscountValue, MaxDiscount,
          StartDate, EndDate, IsActive, UsageLimit, UsageCount,
          MinTicketQty, MinOrderValue, ApplicableFormat, CreatedAt
        )
        OUTPUT inserted.*
        VALUES (
          @Code, @discountType, @discountValue, @maxDiscount,
          @startDate, @endDate, @isActive, @usageLimit, 0,
          @minTicketQty, @minOrderValue, @applicableFormat, GETDATE()
        )
      `);
    return result.recordset[0];
  }

  static async update(id: number, voucher: Partial<IVoucher>) {
    const pool = await connectDB();
    const request = pool.request().input('id', sql.Int, id);
    let query = 'UPDATE Voucher SET ';
    const updates: string[] = [];

    if (voucher.Code !== undefined) {
      request.input('Code', sql.NVarChar(50), voucher.Code);
      updates.push('Code = @Code');
    }
    if (voucher.DiscountType !== undefined) {
      request.input('DiscountType', sql.NVarChar(10), voucher.DiscountType);
      updates.push('DiscountType = @DiscountType');
    }
    if (voucher.DiscountValue !== undefined) {
      request.input('DiscountValue', sql.Decimal(10, 2), voucher.DiscountValue);
      updates.push('DiscountValue = @DiscountValue');
    }
    if (voucher.MaxDiscount !== undefined) {
      request.input('MaxDiscount', sql.Decimal(10, 2), voucher.MaxDiscount);
      updates.push('MaxDiscount = @MaxDiscount');
    }
    if (voucher.StartDate !== undefined) {
      request.input('StartDate', sql.Date, voucher.StartDate);
      updates.push('StartDate = @StartDate');
    }
    if (voucher.EndDate !== undefined) {
      request.input('EndDate', sql.Date, voucher.EndDate);
      updates.push('EndDate = @EndDate');
    }
    if (voucher.IsActive !== undefined) {
      request.input('IsActive', sql.Bit, voucher.IsActive);
      updates.push('IsActive = @IsActive');
    }
    if (voucher.UsageLimit !== undefined) {
      request.input('UsageLimit', sql.Int, voucher.UsageLimit);
      updates.push('UsageLimit = @UsageLimit');
    }
    if (voucher.MinTicketQty !== undefined) {
      request.input('MinTicketQty', sql.Int, voucher.MinTicketQty);
      updates.push('MinTicketQty = @MinTicketQty');
    }
    if (voucher.MinOrderValue !== undefined) {
      request.input('MinOrderValue', sql.Decimal(10, 2), voucher.MinOrderValue);
      updates.push('MinOrderValue = @MinOrderValue');
    }
    if (voucher.ApplicableFormat !== undefined) {
      request.input('ApplicableFormat', sql.NVarChar(10), voucher.ApplicableFormat);
      updates.push('ApplicableFormat = @ApplicableFormat');
    }

    if (updates.length === 0) return this.getById(id);
    query += updates.join(', ') + ' OUTPUT inserted.* WHERE VoucherID = @id';
    
    const result = await request.query(query);
    return result.recordset[0];
  }

  static async delete(id: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Voucher SET IsActive = 0 
        OUTPUT inserted.*
        WHERE VoucherID = @id
      `);
    return result.recordset[0];
  }

  /**
   * Lấy danh sách voucher hợp lệ của customer — FEFO (sắp hết hạn trước)
   * Áp dụng đầy đủ điều kiện theo AGENTS.md:
   *   - Còn hiệu lực (StartDate ≤ NOW ≤ EndDate)
   *   - Còn lượt dùng (UsageCount < UsageLimit)
   *   - Đủ giá trị đơn (MinOrderValue ≤ totalAmount)
   *   - Đủ số vé (MinTicketQty ≤ totalSeats)
   *   - Đúng định dạng phim (ApplicableFormat = showFormat hoặc 'ALL')
   *   - Chưa dùng voucher này (không có VoucherUsage)
   */
  static async getAvailableVouchers(params: VoucherCheckParams) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CustomerID', sql.Int, params.customerId)
      .input('TotalAmount', sql.Decimal(10, 2), params.totalAmount)
      .input('TotalSeats', sql.Int, params.totalSeats)
      .input('ShowFormat', sql.NVarChar(10), params.showFormat)
      .query(`
        SELECT v.*, vc.AssignedAt
        FROM Voucher v
        LEFT JOIN VoucherCustomer vc
          ON v.VoucherID = vc.VoucherID
          AND vc.CustomerID = @CustomerID
        WHERE (vc.CustomerID = @CustomerID OR NOT EXISTS (
            SELECT 1 FROM VoucherCustomer vcAny WHERE vcAny.VoucherID = v.VoucherID
          ))
          AND v.IsActive = 1
          AND (v.MinOrderValue IS NULL OR v.MinOrderValue <= @TotalAmount)
          AND (v.MinTicketQty IS NULL OR v.MinTicketQty <= @TotalSeats)
          AND (v.ApplicableFormat IS NULL OR UPPER(v.ApplicableFormat) IN (UPPER(@ShowFormat), 'ALL'))
          AND CAST(GETDATE() AS DATE) BETWEEN v.StartDate AND v.EndDate
          AND (v.UsageLimit IS NULL OR v.UsageCount < v.UsageLimit)
          AND NOT EXISTS (
            SELECT 1
            FROM VoucherUsage vu
            WHERE vu.VoucherID = v.VoucherID
              AND vu.CustomerID = @CustomerID
          )
        ORDER BY v.EndDate ASC
      `);
    return result.recordset;
  }

  /**
   * Lấy tất cả voucher visible cho customer (cả applicable và không applicable).
   * Bao gồm voucher public + voucher được gán cho customer.
   * Mỗi voucher kèm isApplicable, reasonCode, discountAmount, finalAmount.
   * Sort: applicable trước, sau đó theo EndDate ASC.
   */
  static async getCheckoutVouchers(params: VoucherCheckParams) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CustomerID', sql.Int, params.customerId)
      .input('TotalAmount', sql.Decimal(10, 2), params.totalAmount)
      .input('TotalSeats', sql.Int, params.totalSeats)
      .input('ShowFormat', sql.NVarChar(10), params.showFormat)
      .query(`
        SELECT v.*, vc.AssignedAt,
          CASE WHEN EXISTS (
            SELECT 1 FROM VoucherUsage vu WHERE vu.VoucherID = v.VoucherID AND vu.CustomerID = @CustomerID
          ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS HasUsed
        FROM Voucher v
        LEFT JOIN VoucherCustomer vc
          ON v.VoucherID = vc.VoucherID
          AND vc.CustomerID = @CustomerID
        WHERE (vc.CustomerID = @CustomerID OR NOT EXISTS (
            SELECT 1 FROM VoucherCustomer vcAny WHERE vcAny.VoucherID = v.VoucherID
          ))
          AND v.IsActive = 1
        ORDER BY v.EndDate ASC
      `);

    const vouchers = result.recordset;
    const now = new Date();

    const enriched = vouchers.map((v: any) => {
      const isApplicable = evaluateVoucherApplicability(v, params, now);
      return {
        VoucherID: v.VoucherID,
        Code: v.Code,
        DiscountType: v.DiscountType,
        DiscountValue: v.DiscountValue,
        MaxDiscount: v.MaxDiscount,
        MinOrderValue: v.MinOrderValue,
        MinTicketQty: v.MinTicketQty,
        ApplicableFormat: v.ApplicableFormat,
        StartDate: v.StartDate,
        EndDate: v.EndDate,
        UsageLimit: v.UsageLimit,
        UsageCount: v.UsageCount,
        AssignedAt: v.AssignedAt,
        HasUsed: v.HasUsed,
        isApplicable: isApplicable.applicable,
        reasonCode: isApplicable.reasonCode || null,
        reasonText: isApplicable.reasonText || null,
        discountAmount: calculateDiscount(v, params.totalAmount),
        finalAmount: Math.max(params.totalAmount - calculateDiscount(v, params.totalAmount), 0),
      };
    });

    enriched.sort((a: any, b: any) => {
      if (a.isApplicable !== b.isApplicable) return a.isApplicable ? -1 : 1;
      return new Date(a.EndDate).getTime() - new Date(b.EndDate).getTime();
    });

    return enriched;
  }

  /**
   * Áp dụng voucher cho booking:
   *  1. Tăng UsageCount của voucher
   *  2. Ghi VoucherUsage (lịch sử dùng)
   * Gọi trong transaction cùng với tạo Payment.
   */
  static async applyVoucher(voucherId: number, customerId: number, bookingId: number) {
    const pool = await connectDB();

    // Tăng UsageCount
    const existing = await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .input('CustomerID', sql.Int, customerId)
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT TOP 1 VUsageID
        FROM VoucherUsage
        WHERE VoucherID = @VoucherID
          AND CustomerID = @CustomerID
          AND BookingID = @BookingID
      `);

    if (existing.recordset.length > 0) return;

    await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .query('UPDATE Voucher SET UsageCount = ISNULL(UsageCount, 0) + 1 WHERE VoucherID = @VoucherID');

    // Ghi VoucherUsage
    await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .input('CustomerID', sql.Int, customerId)
      .input('BookingID', sql.Int, bookingId)
      .query(`
        INSERT INTO VoucherUsage (VoucherID, CustomerID, BookingID, UsedAt)
        VALUES (@VoucherID, @CustomerID, @BookingID, GETDATE())
      `);
  }

  /**
   * Kiểm tra customer đã dùng voucher này chưa.
   */
  static async hasCustomerUsedVoucher(voucherId: number, customerId: number): Promise<boolean> {
    const pool = await connectDB();
    const result = await pool.request()
      .input('VoucherID', sql.Int, voucherId)
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT TOP 1 VUsageID FROM VoucherUsage
        WHERE VoucherID = @VoucherID AND CustomerID = @CustomerID
      `);
    return result.recordset.length > 0;
  }
}

type ReasonCode = 'NOT_STARTED' | 'EXPIRED' | 'USAGE_LIMIT_REACHED' | 'MIN_ORDER_NOT_MET' | 'MIN_TICKET_NOT_MET' | 'FORMAT_NOT_MATCH' | 'ALREADY_USED';

function evaluateVoucherApplicability(voucher: any, params: VoucherCheckParams, now: Date): { applicable: boolean; reasonCode?: ReasonCode; reasonText?: string } {
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
  if (voucher.MinOrderValue && params.totalAmount < voucher.MinOrderValue) {
    return { applicable: false, reasonCode: 'MIN_ORDER_NOT_MET', reasonText: `Đơn tối thiểu ${Number(voucher.MinOrderValue).toLocaleString('vi-VN')}đ` };
  }
  if (voucher.MinTicketQty && params.totalSeats < voucher.MinTicketQty) {
    return { applicable: false, reasonCode: 'MIN_TICKET_NOT_MET', reasonText: `Cần ít nhất ${voucher.MinTicketQty} vé` };
  }
  if (voucher.ApplicableFormat && voucher.ApplicableFormat.toUpperCase() !== 'ALL' && voucher.ApplicableFormat.toUpperCase() !== params.showFormat.toUpperCase()) {
    return { applicable: false, reasonCode: 'FORMAT_NOT_MATCH', reasonText: `Chỉ áp dụng định dạng ${voucher.ApplicableFormat}` };
  }
  if (voucher.HasUsed) {
    return { applicable: false, reasonCode: 'ALREADY_USED', reasonText: 'Bạn đã sử dụng voucher này' };
  }
  return { applicable: true };
}

function calculateDiscount(voucher: any, totalAmount: number): number {
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

