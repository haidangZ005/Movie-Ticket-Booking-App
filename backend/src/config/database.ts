import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

/**
 * Cấu hình kết nối SQL Server — theo AGENTS.md
 * Các thành viên KHÔNG được hardcode thông tin DB.
 * Toàn bộ giá trị lấy từ file .env (xem .env.example).
 */
const dbConfig: sql.config = {
  server: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'appDatvexemPhim',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    //instanceName: process.env.DB_INSTANCE // Thêm dòng này
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

/**
 * Singleton Pool — Toàn bộ backend dùng chung 1 connection pool duy nhất.
 * Import: import { getPool } from '../config/database';
 */
let pool: sql.ConnectionPool | null = null;

export const connectDB = async (): Promise<sql.ConnectionPool> => {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(dbConfig).connect();

      // Harden session settings for filtered indexes and triggers
      try {
        await pool.request().query(`
          SET QUOTED_IDENTIFIER ON;
          SET ANSI_NULLS ON;
          SET ANSI_PADDING ON;
          SET ANSI_WARNINGS ON;
          SET CONCAT_NULL_YIELDS_NULL ON;
          SET ARITHABORT ON;
          SET NUMERIC_ROUNDABORT OFF;
        `);
      } catch (setErr) {
        console.warn('[⚠️ Database] Không thể thiết lập các tùy chọn SET mặc định:', (setErr as any).message);
      }

      console.log('[✅ Database] Kết nối SQL Server thành công!');
    }
    return pool;
  } catch (error) {
    console.error('[❌ Database] Kết nối SQL Server thất bại:', error);
    process.exit(1);
  }
};

export const getPool = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error('Database chưa được kết nối. Gọi connectDB() trước.');
  }
  return pool;
};
