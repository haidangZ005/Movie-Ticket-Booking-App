import sql from 'mssql';
import { getPool } from '../config/database';

export interface AccountPayload {
  Email: string;
  PasswordHash: string;
  AccountType: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  IsVerified?: number;
}

export class AccountModel {
  /**
   * Tìm kiếm tài khoản bằng Email phục vụ đăng nhập và kiểm tra trùng lặp
   */
  static async findByEmail(email: string) {
    const pool = getPool();
    const result = await pool.request()
      .input('Email', sql.NVarChar(100), email)
      .query(`
        SELECT AccountID, Email, PasswordHash, AccountType, IsActive, IsVerified 
        FROM Account 
        WHERE Email = @Email
      `);
    return result.recordset[0];
  }

  /**
   * Tạo tài khoản mới, trả về AccountID vừa tạo.
   * Hỗ trợ Transaction nếu được truyền vào.
   */
  static async create(data: AccountPayload, connection?: sql.ConnectionPool | sql.Transaction) {
    const conn = connection || getPool();
    const isVerified = data.IsVerified !== undefined ? data.IsVerified : 0;
    const result = await conn.request()
      .input('Email', sql.NVarChar(100), data.Email)
      .input('PasswordHash', sql.NVarChar(255), data.PasswordHash)
      .input('AccountType', sql.NVarChar(20), data.AccountType)
      .input('IsVerified', sql.Bit, isVerified)
      .query(`
        INSERT INTO Account (Email, PasswordHash, AccountType, IsActive, IsVerified, CreatedAt)
        OUTPUT INSERTED.AccountID, INSERTED.Email, INSERTED.AccountType
        VALUES (@Email, @PasswordHash, @AccountType, 1, @IsVerified, GETDATE())
      `);
    
    return result.recordset[0];
  }

  /**
   * Tìm tài khoản bằng AccountID
   */
  static async findById(accountId: number) {
    const pool = getPool();
    const result = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`
        SELECT AccountID, Email, PasswordHash, AccountType, IsActive, IsVerified 
        FROM Account 
        WHERE AccountID = @AccountID
      `);
    return result.recordset[0];
  }

  /**
   * Cập nhật PasswordHash cho tài khoản
   */
  static async updatePasswordHash(accountId: number, passwordHash: string) {
    const pool = getPool();
    await pool.request()
      .input('AccountID', sql.Int, accountId)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .query(`
        UPDATE Account 
        SET PasswordHash = @PasswordHash
        WHERE AccountID = @AccountID
      `);
  }
}
