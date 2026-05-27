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
          AND GETDATE() BETWEEN v.StartDate AND v.EndDate
          AND (v.UsageLimit IS NULL OR v.UsageCount < v.UsageLimit)
        ORDER BY v.EndDate ASC
      `);
    return result.recordset;
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
}

