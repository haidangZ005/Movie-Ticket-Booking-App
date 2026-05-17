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
    const result = await pool.request()
      .input('code', sql.NVarChar(50), voucher.Code)
      .input('discountType', sql.NVarChar(10), voucher.DiscountType)
      .input('discountValue', sql.Decimal(10, 2), voucher.DiscountValue)
      .input('maxDiscount', sql.Decimal(10, 2), voucher.MaxDiscount ?? null)
      .input('startDate', sql.Date, voucher.StartDate)
      .input('endDate', sql.Date, voucher.EndDate)
      .input('isActive', sql.Bit, voucher.IsActive ?? true)
      .input('usageLimit', sql.Int, voucher.UsageLimit)
      .input('minTicketQty', sql.Int, voucher.MinTicketQty ?? null)
      .input('minOrderValue', sql.Decimal(10, 2), voucher.MinOrderValue ?? null)
      .input('applicableFormat', sql.NVarChar(10), voucher.ApplicableFormat ?? null)
      .query(`
        INSERT INTO Voucher (
          Code, DiscountType, DiscountValue, MaxDiscount, 
          StartDate, EndDate, IsActive, UsageLimit, UsageCount, 
          MinTicketQty, MinOrderValue, ApplicableFormat, CreatedAt
        )
        OUTPUT inserted.*
        VALUES (
          @code, @discountType, @discountValue, @maxDiscount, 
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
}
