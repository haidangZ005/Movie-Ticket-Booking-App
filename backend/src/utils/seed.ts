import { getPool } from '../config/database';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL    = 'admin@movieticket.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * Seed tài khoản ADMIN mặc định khi khởi động server lần đầu.
 * Chỉ tạo nếu chưa tồn tại.
 * Admin KHÔNG cần Customer record.
 */
async function seedAdmin() {
  try {
    const pool = getPool();

    // 1. Kiểm tra đã có admin chưa
    const checkResult = await pool.request()
      .input('Email', sql.NVarChar(100), ADMIN_EMAIL)
      .query(`
        SELECT AccountID, Email, AccountType
        FROM [dbo].[Account]
        WHERE Email = @Email
      `);

    if (checkResult.recordset.length > 0) {
      console.log(`[Seed] Tài khoản admin đã tồn tại (${ADMIN_EMAIL}).`);
      
      const accountId = checkResult.recordset[0].AccountID;
      
      // Kiểm tra xem đã có Customer record chưa
      const customerCheck = await pool.request()
        .input('AccountID', sql.Int, accountId)
        .query('SELECT CustomerID FROM [dbo].[Customer] WHERE AccountID = @AccountID');
        
      if (customerCheck.recordset.length === 0) {
        console.log(`[Seed] Đang tạo dummy Customer cho tài khoản admin...`);
        await pool.request()
          .input('AccountID', sql.Int, accountId)
          .query(`
            INSERT INTO [dbo].[Customer] (AccountID, FullName, LoyaltyPoints)
            VALUES (@AccountID, 'Admin', 0)
          `);
        console.log(`[Seed] ✅ Đã tạo bổ sung dummy Customer.`);
      } else {
        console.log(`[Seed] Dummy Customer đã tồn tại. Bỏ qua.`);
      }
      return;
    }

    // 2. Hash mật khẩu
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // 3. Tạo Account với AccountType = ADMIN
    const result = await pool.request()
      .input('Email',        sql.NVarChar(100), ADMIN_EMAIL)
      .input('PasswordHash', sql.NVarChar(255), hashedPassword)
      .input('AccountType',  sql.NVarChar(20),  'ADMIN')
      .query(`
        INSERT INTO [dbo].[Account]
          (Email, PasswordHash, AccountType, IsActive, IsVerified, CreatedAt)
        OUTPUT INSERTED.AccountID
        VALUES
          (@Email, @PasswordHash, @AccountType, 1, 1, GETDATE())
      `);

    const accountId = result.recordset[0].AccountID;

    // 4. Tạo dummy Customer record (để pass qua logic loginBasic hiện tại chưa sửa)
    await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`
        INSERT INTO [dbo].[Customer] (AccountID, FullName, LoyaltyPoints)
        VALUES (@AccountID, 'Admin', 0)
      `);

    console.log(`[Seed] ✅ Đã tạo tài khoản admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  } catch (error: any) {
    // Không crash server nếu seed thất bại
    console.error('[Seed] ⚠️  Seed admin thất bại (server vẫn chạy bình thường):', error?.message ?? error);
  }
}

export { seedAdmin };
