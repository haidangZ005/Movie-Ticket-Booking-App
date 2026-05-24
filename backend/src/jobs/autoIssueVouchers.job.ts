import * as sql from 'mssql';
import { connectDB } from '../config/database';
import { NotificationService } from '../services/notification.service';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Job autoIssueVouchers — chạy mỗi ngày lúc 00:00 (nửa đêm).
 *
 * Phát hành voucher tự động cho:
 *  1. Sinh nhật khách hàng — voucher giảm 20% cho phim bất kỳ
 *  2. Các dịp lễ cấu hình trong SystemSettings (Tết, 8/3, 20/10, ...)
 *
 * Mỗi khách chỉ nhận 1 voucher cho 1 dịp trong ngày (kiểm tra chưa có trong VoucherCustomer).
 * Voucher được gán trực tiếp vào VoucherCustomer (không cần admin phát hành).
 */
export async function autoIssueVouchersJob(): Promise<void> {
  console.log(`[Job] autoIssueVouchers — bắt đầu lúc ${new Date().toISOString()}`);

  const pool = await connectDB();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  let issuedCount = 0;

  // =============================================
  // 1. Phát voucher sinh nhật
  // =============================================
  const birthdayResult = await pool.request()
    .input('TodayStr', sql.VarChar(10), todayStr)
    .query(`
      SELECT cust.CustomerID, cust.FullName, a.Email, cust.DateOfBirth
      FROM Customer cust
      INNER JOIN Account a ON cust.AccountID = a.AccountID
      WHERE a.IsActive = 1
        AND FORMAT(cust.DateOfBirth, 'MM-dd') = FORMAT(CAST(@TodayStr AS date), 'MM-dd')
    `);

  if (birthdayResult.recordset.length > 0) {
    console.log(`[Job] Tìm thấy ${birthdayResult.recordset.length} khách có sinh nhật hôm nay`);

    for (const customer of birthdayResult.recordset) {
      try {
        // Tạo voucher sinh nhật (20% giảm, tối đa 50.000đ)
        const voucherCode = `BDAY${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}_${customer.CustomerID}`;

        const voucherResult = await pool.request()
          .input('Code', sql.NVarChar(50), voucherCode)
          .input('DiscountType', sql.NVarChar(10), 'PERCENT')
          .input('DiscountValue', sql.Decimal(10, 2), 20)
          .input('MaxDiscount', sql.Decimal(10, 2), 50000)
          .input('StartDate', sql.Date, todayStr)
          .input('EndDate', sql.Date, todayStr)
          .input('UsageLimit', sql.Int, 1)
          .input('MinTicketQty', sql.Int, 1)
          .input('MinOrderValue', sql.Decimal(10, 2), 0)
          .query(`
            INSERT INTO Voucher (Code, DiscountType, DiscountValue, MaxDiscount, StartDate, EndDate, IsActive, UsageLimit, UsageCount, MinTicketQty, MinOrderValue, ApplicableFormat, CreatedAt)
            OUTPUT inserted.VoucherID
            VALUES (@Code, @DiscountType, @DiscountValue, @MaxDiscount, @StartDate, @EndDate, 1, @UsageLimit, 0, @MinTicketQty, @MinOrderValue, 'ALL', GETDATE())
          `);

        const voucherId = voucherResult.recordset[0].VoucherID;

        // Gán voucher cho khách
        await pool.request()
          .input('VoucherID', sql.Int, voucherId)
          .input('CustomerID', sql.Int, customer.CustomerID)
          .query(`
            INSERT INTO VoucherCustomer (VoucherID, CustomerID, AssignedAt)
            VALUES (@VoucherID, @CustomerID, GETDATE())
          `);

        // Gửi thông báo
        await NotificationService.send({
          customerId: customer.CustomerID,
          title: 'Chúc mừng sinh nhật! 🎂',
          message: `CineBook tặng bạn voucher giảm 20% (tối đa 50.000đ) nhân dịp sinh nhật. Mã: ${voucherCode}. HSD: hôm nay!`,
          type: 'PROMO',
          email: customer.Email,
          emailSubject: 'CineBook — Chúc mừng sinh nhật! Voucher 20% dành cho bạn',
        });

        console.log(`[Job] Đã phát voucher sinh nhật cho ${customer.Email}: ${voucherCode}`);
        issuedCount++;
      } catch (err) {
        console.error(`[Job] Lỗi phát voucher sinh nhật cho Customer #${customer.CustomerID}:`, err);
      }
    }
  }

  // =============================================
  // 2. Phát voucher dịp lễ (từ SystemSettings)
  // =============================================
  const holidaysResult = await pool.request()
    .input('TodayStr', sql.VarChar(10), todayStr)
    .query(`
      SELECT SettingKey, SettingValue
      FROM SystemSettings
      WHERE SettingKey LIKE 'HOLIDAY_VOUCHER_%'
        AND SettingValue LIKE @TodayStr + '%'
    `);

  if (holidaysResult.recordset.length > 0) {
    console.log(`[Job] Tìm thấy ${holidaysResult.recordset.length} dịp lễ cần phát hôm nay`);

    for (const holiday of holidaysResult.recordset) {
      // Format: "HOLIDAY_VOUCHER_<id>;discount;maxdiscount;days_valid;min_tickets"
      // Ví dụ: "HOLIDAY_VOUCHER_TET;15;30000;7;2"
      const parts = holiday.SettingValue.split(';');
      if (parts.length < 5) {
        console.warn(`[Job] Holiday voucher config không hợp lệ: ${holiday.SettingValue}`);
        continue;
      }

      const [, discount, maxDiscount, daysValid, minTickets] = parts;
      const discountNum = parseFloat(discount);
      const maxDiscountNum = parseFloat(maxDiscount);
      const daysValidNum = parseInt(daysValid);
      const minTicketsNum = parseInt(minTickets);

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + daysValidNum);

      const voucherCode = `HOLIDAY${todayStr.replace(/-/g, '')}_${holiday.SettingKey.split('_')[2]}`;

      try {
        const voucherResult = await pool.request()
          .input('Code', sql.NVarChar(50), voucherCode)
          .input('DiscountType', sql.NVarChar(10), 'PERCENT')
          .input('DiscountValue', sql.Decimal(10, 2), discountNum)
          .input('MaxDiscount', sql.Decimal(10, 2), maxDiscountNum)
          .input('StartDate', sql.Date, todayStr)
          .input('EndDate', sql.Date, endDate.toISOString().split('T')[0])
          .input('UsageLimit', sql.Int, 1)
          .input('MinTicketQty', sql.Int, minTicketsNum)
          .input('MinOrderValue', sql.Decimal(10, 2), 0)
          .query(`
            INSERT INTO Voucher (Code, DiscountType, DiscountValue, MaxDiscount, StartDate, EndDate, IsActive, UsageLimit, UsageCount, MinTicketQty, MinOrderValue, ApplicableFormat, CreatedAt)
            OUTPUT inserted.VoucherID
            VALUES (@Code, @DiscountType, @DiscountValue, @MaxDiscount, @StartDate, @EndDate, 1, @UsageLimit, 0, @MinTicketQty, @MinOrderValue, 'ALL', GETDATE())
          `);

        const voucherId = voucherResult.recordset[0].VoucherID;

        // Phát cho tất cả khách hàng đã xác minh (chỉ phát 1 lần/ngày)
        await pool.request()
          .input('VoucherID', sql.Int, voucherId)
          .input('TodayStr', sql.VarChar(10), todayStr)
          .query(`
            INSERT INTO VoucherCustomer (VoucherID, CustomerID, AssignedAt)
            SELECT @VoucherID, cust.CustomerID, GETDATE()
            FROM Customer cust
            INNER JOIN Account a ON cust.AccountID = a.AccountID
            WHERE a.IsActive = 1
              AND a.IsVerified = 1
              AND NOT EXISTS (
                SELECT 1 FROM VoucherCustomer vc
                JOIN Voucher v ON vc.VoucherID = v.VoucherID
                WHERE vc.CustomerID = cust.CustomerID
                  AND v.Code LIKE 'HOLIDAY%'
                  AND CAST(vc.AssignedAt AS date) = CAST(GETDATE() AS date)
              )
          `);

        const assignedResult = await pool.request()
          .input('VoucherID', sql.Int, voucherId)
          .query('SELECT @@ROWCOUNT AS AssignedCount');

        console.log(`[Job] Đã phát voucher lễ ${voucherCode} cho ${assignedResult.recordset[0].AssignedCount} khách`);
        issuedCount++;
      } catch (err) {
        console.error(`[Job] Lỗi phát voucher lễ ${voucherCode}:`, err);
      }
    }
  }

  console.log(
    `[Job] autoIssueVouchers — hoàn thành. Tổng voucher phát: ${issuedCount} — lúc ${new Date().toISOString()}`
  );
}
