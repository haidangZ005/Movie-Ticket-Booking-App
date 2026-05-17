import sql from 'mssql';
import { getPool } from '../config/database';

export interface UpdateCustomerPayload {
  FullName?: string;
  PhoneNumber?: string;
  Gender?: string;
  DateOfBirth?: string | Date;
  AvatarUrl?: string;
}


export class CustomerModel {
  /**
   * Tạo bản ghi Customer căn bản liên kết với AccountID.
   * Thường được gọi ngay sau khi tạo Account dành cho user mới (Register).
   * Hỗ trợ Transaction nếu được truyền vào.
   */
  static async create(accountId: number, customerEmail: string, customerName?: string, connection?: sql.ConnectionPool | sql.Transaction) {
    const conn = connection || getPool();
    const defaultName = customerName || customerEmail.split('@')[0] || 'Khách Hàng';
    const result = await conn.request()
      .input('AccountID', sql.Int, accountId)
      .input('FullName', sql.NVarChar(150), defaultName)
      .input('CustomerEmail', sql.NVarChar(100), customerEmail)
      .query(`
        INSERT INTO Customer (AccountID, FullName, CustomerEmail, LoyaltyPoints, UpdatedAt)
        OUTPUT INSERTED.CustomerID, INSERTED.AccountID
        VALUES (@AccountID, @FullName, @CustomerEmail, 0, GETDATE())
      `);
      
    return result.recordset[0];
  }

  /**
   * Lấy thông tin Profile chi tiết dựa vào AccountID.
   * Thực hiện JOIN với bảng Account để lấy Email phục vụ hiển thị.
   */
  static async findByAccountId(accountId: number) {
    const pool = getPool();
    const result = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`
        SELECT 
          c.CustomerID, 
          c.AccountID, 
          a.Email,
          c.FullName, 
          c.PhoneNumber, 
          c.Gender, 
          c.DateOfBirth, 
          c.AvatarUrl, 
          c.LoyaltyPoints,
          a.AccountType,
          a.IsActive,
          a.IsVerified
        FROM Customer c
        INNER JOIN Account a ON c.AccountID = a.AccountID
        WHERE c.AccountID = @AccountID
      `);
      
    return result.recordset[0];
  }

  /**
   * Cập nhật thông tin Profile cơ bản dựa trên AccountID.
   * Dùng COALESCE để nếu req body không truyền lên (null/undefined) thì giữ lại giá trị cũ dưới CSDL.
   * (Đã gỡ OUTPUT inserted.* để tránh lỗi runtime với SQL Server After Update Trigger)
   */
  static async updateProfileByAccountId(accountId: number, data: UpdateCustomerPayload) {
    const pool = getPool();
    await pool.request()
      .input('AccountID', sql.Int, accountId)
      .input('FullName', sql.NVarChar(150), data.FullName)
      .input('PhoneNumber', sql.NVarChar(20), data.PhoneNumber)
      .input('Gender', sql.NVarChar(10), data.Gender)
      .input('DateOfBirth', sql.Date, data.DateOfBirth)
      .input('AvatarUrl', sql.NVarChar(500), data.AvatarUrl)
      .query(`
        SET QUOTED_IDENTIFIER ON;
        SET ANSI_NULLS ON;
        SET ANSI_PADDING ON;
        SET ANSI_WARNINGS ON;
        SET CONCAT_NULL_YIELDS_NULL ON;
        SET ARITHABORT ON;
        SET NUMERIC_ROUNDABORT OFF;

        UPDATE Customer 
        SET 
          FullName = COALESCE(@FullName, FullName),
          PhoneNumber = COALESCE(@PhoneNumber, PhoneNumber),
          Gender = COALESCE(@Gender, Gender),
          DateOfBirth = COALESCE(@DateOfBirth, DateOfBirth),
          AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl),
          UpdatedAt = GETDATE()
        WHERE AccountID = @AccountID
      `);
      
    // Gọi lại findByAccountId để lấy và trả về model data chuẩn sau update
    return this.findByAccountId(accountId);
  }
}
