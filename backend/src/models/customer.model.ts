import sql from 'mssql';
import { getPool } from '../config/database';

export interface UpdateCustomerPayload {
  FullName?: string;
  CustomerEmail?: string;
  PhoneNumber?: string;
  Gender?: string;
  DateOfBirth?: string | Date;
  AvatarUrl?: string;
  LoyaltyPoints?: number;
}

export interface AdminCustomerPayload extends UpdateCustomerPayload {
  Email?: string;
  PasswordHash?: string;
  AccountType?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  IsActive?: boolean;
  IsVerified?: boolean;
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
        INSERT INTO Customer (AccountID, FullName, CustomerEmail, LoyaltyPoints)
        OUTPUT INSERTED.CustomerID, INSERTED.AccountID
        VALUES (@AccountID, @FullName, @CustomerEmail, 0)
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
          AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl)
        WHERE AccountID = @AccountID
      `);
      
    // Gọi lại findByAccountId để lấy và trả về model data chuẩn sau update
    return this.findByAccountId(accountId);
  }

  static async adminGetAll(options: {
    page: number;
    limit: number;
    keyword?: string;
    isActive?: boolean;
  }) {
    const pool = getPool();
    const offset = (options.page - 1) * options.limit;
    const request = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, options.limit);

    const where: string[] = ["a.AccountType = 'CUSTOMER'"];

    if (options.keyword) {
      request.input('keyword', sql.NVarChar(150), `%${options.keyword}%`);
      where.push(`(
        c.FullName LIKE @keyword OR
        c.CustomerEmail LIKE @keyword OR
        c.PhoneNumber LIKE @keyword OR
        a.Email LIKE @keyword
      )`);
    }

    if (options.isActive !== undefined) {
      request.input('isActive', sql.Bit, options.isActive);
      where.push('a.IsActive = @isActive');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await request.query(`
      SELECT
        c.CustomerID,
        c.AccountID,
        a.Email,
        a.AccountType,
        a.IsActive,
        a.IsVerified,
        a.CreatedAt,
        c.FullName,
        c.CustomerEmail,
        c.PhoneNumber,
        c.Gender,
        c.DateOfBirth,
        c.LoyaltyPoints,
        c.AvatarUrl,
        COUNT(*) OVER() AS TotalRows
      FROM Customer c
      INNER JOIN Account a ON c.AccountID = a.AccountID
      ${whereSql}
      ORDER BY c.CustomerID DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const customers = result.recordset.map(({ TotalRows, ...customer }) => customer);
    const total = result.recordset[0]?.TotalRows || 0;

    return { customers, total };
  }

  static async adminGetById(customerId: number) {
    const pool = getPool();
    const result = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT
          c.CustomerID,
          c.AccountID,
          a.Email,
          a.AccountType,
          a.IsActive,
          a.IsVerified,
          a.CreatedAt,
          c.FullName,
          c.CustomerEmail,
          c.PhoneNumber,
          c.Gender,
          c.DateOfBirth,
          c.LoyaltyPoints,
        c.AvatarUrl
        FROM Customer c
        INNER JOIN Account a ON c.AccountID = a.AccountID
        WHERE c.CustomerID = @CustomerID
      `);

    return result.recordset[0];
  }

  static async adminCreate(data: AdminCustomerPayload) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    let isActive = false;

    try {
      await transaction.begin();
      isActive = true;

      const accountResult = await transaction.request()
        .input('Email', sql.NVarChar(100), data.Email)
        .input('PasswordHash', sql.NVarChar(255), data.PasswordHash)
        .input('AccountType', sql.NVarChar(20), data.AccountType || 'CUSTOMER')
        .input('IsActive', sql.Bit, data.IsActive ?? true)
        .input('IsVerified', sql.Bit, data.IsVerified ?? true)
        .query(`
          INSERT INTO Account (Email, PasswordHash, AccountType, IsActive, IsVerified, CreatedAt)
          OUTPUT INSERTED.AccountID
          VALUES (@Email, @PasswordHash, @AccountType, @IsActive, @IsVerified, GETDATE())
        `);

      const accountId = accountResult.recordset[0].AccountID;

      const customerResult = await transaction.request()
        .input('AccountID', sql.Int, accountId)
        .input('FullName', sql.NVarChar(150), data.FullName || null)
        .input('CustomerEmail', sql.NVarChar(100), data.CustomerEmail || data.Email)
        .input('PhoneNumber', sql.NVarChar(20), data.PhoneNumber || null)
        .input('Gender', sql.NVarChar(10), data.Gender || null)
        .input('DateOfBirth', sql.Date, data.DateOfBirth || null)
        .input('LoyaltyPoints', sql.Int, data.LoyaltyPoints ?? 0)
        .input('AvatarUrl', sql.NVarChar(500), data.AvatarUrl || null)
        .query(`
          INSERT INTO Customer (
            AccountID, FullName, CustomerEmail, PhoneNumber, Gender,
            DateOfBirth, LoyaltyPoints, AvatarUrl
          )
          OUTPUT INSERTED.CustomerID
          VALUES (
            @AccountID, @FullName, @CustomerEmail, @PhoneNumber, @Gender,
            @DateOfBirth, @LoyaltyPoints, @AvatarUrl
          )
        `);

      await transaction.commit();
      isActive = false;

      return this.adminGetById(customerResult.recordset[0].CustomerID);
    } catch (error) {
      if (isActive) {
        try {
          await transaction.rollback();
        } catch {
          // Ignore rollback errors after transaction abort.
        }
      }
      throw error;
    }
  }

  static async adminUpdate(customerId: number, data: AdminCustomerPayload) {
    const pool = getPool();
    const existing = await this.adminGetById(customerId);
    if (!existing) return null;

    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('Email', sql.NVarChar(100), data.Email)
      .input('IsActive', sql.Bit, data.IsActive)
      .input('IsVerified', sql.Bit, data.IsVerified)
      .input('FullName', sql.NVarChar(150), data.FullName)
      .input('CustomerEmail', sql.NVarChar(100), data.CustomerEmail)
      .input('PhoneNumber', sql.NVarChar(20), data.PhoneNumber)
      .input('Gender', sql.NVarChar(10), data.Gender)
      .input('DateOfBirth', sql.Date, data.DateOfBirth)
      .input('LoyaltyPoints', sql.Int, data.LoyaltyPoints)
      .input('AvatarUrl', sql.NVarChar(500), data.AvatarUrl)
      .query(`
        UPDATE Account
        SET
          Email = COALESCE(@Email, Email),
          IsActive = COALESCE(@IsActive, IsActive),
          IsVerified = COALESCE(@IsVerified, IsVerified)
        WHERE AccountID = (SELECT AccountID FROM Customer WHERE CustomerID = @CustomerID);

        UPDATE Customer
        SET
          FullName = COALESCE(@FullName, FullName),
          CustomerEmail = COALESCE(@CustomerEmail, CustomerEmail),
          PhoneNumber = COALESCE(@PhoneNumber, PhoneNumber),
          Gender = COALESCE(@Gender, Gender),
          DateOfBirth = COALESCE(@DateOfBirth, DateOfBirth),
          LoyaltyPoints = COALESCE(@LoyaltyPoints, LoyaltyPoints),
          AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl)
        WHERE CustomerID = @CustomerID;
      `);

    return this.adminGetById(customerId);
  }

  static async adminSetAccountStatus(customerId: number, isActiveValue: boolean) {
    const pool = getPool();
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('IsActive', sql.Bit, isActiveValue)
      .query(`
        UPDATE Account
        SET IsActive = @IsActive
        WHERE AccountID = (SELECT AccountID FROM Customer WHERE CustomerID = @CustomerID)
      `);

    return this.adminGetById(customerId);
  }
}
