import * as sql from 'mssql';
import { connectDB } from '../config/database';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

const REMINDER_MINUTES = 30;

/**
 * Job reminderNotification — chạy mỗi 5 phút.
 *
 * Mục tiêu: Tìm tất cả suất chiếu bắt đầu trong vòng REMINDER_MINUTES (30p)
 * tới và gửi thông báo nhắc nhở + email cho khách hàng đã đặt vé.
 *
 * Retry: Tối đa 3 lần nếu lỗi nghiêm trọng (không gửi được thông báo).
 * Side-effects (email/push) không làm fail job — ghi log và tiếp tục.
 */
export async function reminderNotificationJob(): Promise<void> {
  console.log(`[Job] reminderNotification — bắt đầu lúc ${new Date().toISOString()}`);

  const pool = await connectDB();

  // Tìm suất chiếu bắt đầu trong khoảng [now, now + REMINDER_MINUTES]
  const showsResult = await pool.request().query(`
    SELECT DISTINCT
      s.ShowID,
      s.ShowDate,
      CONVERT(varchar(5), s.ShowTime, 108) AS ShowTime,
      m.MovieTitle,
      c.CinemaName,
      ch.HallName
    FROM [Show] s
    INNER JOIN Movie m ON s.MovieID = m.MovieID
    INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
    INNER JOIN Cinema c ON ch.CinemaID = c.CinemaID
    INNER JOIN Booking b ON b.ShowID = s.ShowID
    INNER JOIN BookingSeat bs ON bs.BookingID = b.BookingID
    INNER JOIN Customer cust ON b.CustomerID = cust.CustomerID
    INNER JOIN Account a ON cust.AccountID = a.AccountID
    WHERE b.Status = 'CONFIRMED'
      AND bs.Status = 'BOOKED'
      AND CAST(s.ShowDate AS datetime) + CAST(s.ShowTime AS datetime)
          BETWEEN GETDATE() AND DATEADD(MINUTE, ${REMINDER_MINUTES}, GETDATE())
  `);

  if (showsResult.recordset.length === 0) {
    console.log('[Job] reminderNotification — không có suất chiếu nào cần nhắc');
    return;
  }

  console.log(`[Job] reminderNotification — tìm thấy ${showsResult.recordset.length} suất chiếu cần nhắc`);

  for (const show of showsResult.recordset) {
    // Lấy danh sách khách đã đặt vé cho suất này
    const customersResult = await pool.request()
      .input('ShowID', sql.Int, show.ShowID)
      .query(`
        SELECT DISTINCT
          cust.CustomerID,
          a.Email,
          cust.FullName
        FROM Booking b
        INNER JOIN Customer cust ON b.CustomerID = cust.CustomerID
        INNER JOIN Account a ON cust.AccountID = a.AccountID
        INNER JOIN BookingSeat bs ON bs.BookingID = b.BookingID
        WHERE b.ShowID = @ShowID
          AND b.Status = 'CONFIRMED'
          AND bs.Status = 'BOOKED'
      `);

    for (const customer of customersResult.recordset) {
      try {
        // 1. Tạo notification trong DB
        await NotificationService.send({
          customerId: customer.CustomerID,
          title: 'Nhắc lịch chiếu ⏰',
          message: `Phim "${show.MovieTitle}" sẽ chiếu trong ${REMINDER_MINUTES} phút tại ${show.CinemaName} - ${show.HallName}. Chúc bạn xem phim vui vẻ!`,
          type: 'SYSTEM',
          email: customer.Email,
          emailSubject: `CineBook — Nhắc lịch chiếu: ${show.MovieTitle}`,
        });

        console.log(
          `[Job] Đã gửi nhắc lịch cho ${customer.Email} — Show #${show.ShowID} (${show.ShowDate} ${show.ShowTime})`
        );
      } catch (err) {
        console.error(
          `[Job] Lỗi gửi nhắc cho ${customer.Email} (Show #${show.ShowID}):`,
          err
        );
      }
    }
  }

  console.log(`[Job] reminderNotification — hoàn thành lúc ${new Date().toISOString()}`);
}
