import { getPool } from '../config/database';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    const pool = getPool();
    
    // Kiểm tra xem đã có admin chưa
    const checkResult = await pool.request()
      .query("SELECT * FROM [dbo].[Account] WHERE Email = 'admin@movieticket.com'");
      
    if (checkResult.recordset.length > 0) {
      // Kiểm tra thêm: đã có bản ghi Customer chưa?
      const adminAccount = checkResult.recordset[0];
      const customerCheck = await pool.request()
        .input('AccountID', sql.Int, adminAccount.AccountID)
        .query('SELECT * FROM [dbo].[Customer] WHERE AccountID = @AccountID');
      
      if (customerCheck.recordset.length === 0) {
        // Tạo bản ghi Customer cho admin (thiếu từ lần seed trước)
        await pool.request()
          .input('AccountID', sql.Int, adminAccount.AccountID)
          .query('INSERT INTO [dbo].[Customer] (AccountID, LoyaltyPoints) VALUES (@AccountID, 0)');
        console.log('✅ Đã bổ sung bản ghi Customer cho admin.');
      }

      console.log('Tài khoản admin đã tồn tại. Bỏ qua.');
      return;
    }

    // Hash password 'admin123' (tối thiểu 8 ký tự theo validator)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Tạo tài khoản admin + Customer trong transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Tạo Account
      const accountResult = await transaction.request()
        .input('email', sql.NVarChar(100), 'admin@movieticket.com')
        .input('password', sql.NVarChar(255), hashedPassword)
        .input('role', sql.NVarChar(20), 'ADMIN')
        .query(`
          INSERT INTO [dbo].[Account] 
          (Email, PasswordHash, AccountType, IsActive, IsVerified, CreatedAt)
          OUTPUT INSERTED.AccountID
          VALUES (@email, @password, @role, 1, 1, GETDATE())
        `);

      const accountId = accountResult.recordset[0].AccountID;

      // 2. Tạo Customer (loginBasic yêu cầu bản ghi này)
      await transaction.request()
        .input('AccountID', sql.Int, accountId)
        .query('INSERT INTO [dbo].[Customer] (AccountID, LoyaltyPoints) VALUES (@AccountID, 0)');

      await transaction.commit();
      console.log('✅ Đã tạo tài khoản admin thành công (admin@movieticket.com / admin123)');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Lỗi khi seed admin:', error);
  }
}

// Hàm này có thể được gọi tại lúc khởi động server nếu cần
export { seedAdmin };
