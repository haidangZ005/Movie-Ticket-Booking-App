import * as sql from 'mssql';
import { connectDB } from '../config/database';
import { NotificationService } from '../services/notification.service';
import dotenv from 'dotenv';

dotenv.config();

const SEAT_HOLD_TTL_SECONDS = Number(process.env.SEAT_HOLD_TTL_SECONDS) || 600; // 10 phút
const MAX_RETRIES = 3;

/**
 * Job releaseExpiredSeats — chạy mỗi 1 phút.
 *
 * Tuần tự xử lý mỗi booking PENDING_PAYMENT quá hạn SEAT_HOLD_TTL_SECONDS:
 *  1. Chuyển Booking.Status → EXPIRED
 *  2. Chuyển BookingSeat.Status → CANCELLED
 *  3. Xóa Redis seat lock (nếu có)
 *  4. Broadcast WebSocket: ghế → AVAILABLE
 *  5. Gửi notification cho khách
 *
 * Retry: Tối đa MAX_RETRIES (3) lần nếu lỗi.
 * Side-effects (Redis/WS/Notification) không làm fail step — ghi log và tiếp tục.
 */
export async function releaseExpiredSeatsJob(): Promise<void> {
  console.log(`[Job] releaseExpiredSeats — bắt đầu lúc ${new Date().toISOString()}`);

  const pool = await connectDB();
  const expiredThreshold = new Date(Date.now() - SEAT_HOLD_TTL_SECONDS * 1000);

  // Tìm tất cả booking PENDING_PAYMENT đã quá hạn
  const expiredResult = await pool.request()
    .input('Threshold', sql.DateTime2, expiredThreshold)
    .query(`
      SELECT
        b.BookingID,
        b.CustomerID,
        cust.FullName,
        a.Email,
        m.MovieTitle
      FROM Booking b
      INNER JOIN Customer cust ON b.CustomerID = cust.CustomerID
      INNER JOIN Account a ON cust.AccountID = a.AccountID
      INNER JOIN BookingSeat bs ON bs.BookingID = b.BookingID
      INNER JOIN [Show] s ON b.ShowID = s.ShowID
      INNER JOIN Movie m ON s.MovieID = m.MovieID
      WHERE b.Status = 'PENDING_PAYMENT'
        AND bs.Status IN ('HOLDING', 'BOOKED')
        AND bs.HoldUntil IS NOT NULL
        AND bs.HoldUntil < @Threshold
      GROUP BY b.BookingID, b.CustomerID, cust.FullName, a.Email, m.MovieTitle
    `);

  if (expiredResult.recordset.length === 0) {
    console.log('[Job] releaseExpiredSeats — không có booking nào quá hạn');
    return;
  }

  console.log(`[Job] releaseExpiredSeats — tìm thấy ${expiredResult.recordset.length} booking quá hạn`);

  for (const booking of expiredResult.recordset) {
    let retryCount = 0;
    let success = false;

    while (retryCount < MAX_RETRIES && !success) {
      try {
        // 1. Cập nhật Booking → EXPIRED
        await pool.request()
          .input('BookingID', sql.Int, booking.BookingID)
          .query(`
            UPDATE Booking
            SET Status = 'EXPIRED', UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID
          `);

        // 2. Cập nhật BookingSeat → CANCELLED
        await pool.request()
          .input('BookingID', sql.Int, booking.BookingID)
          .query(`
            UPDATE BookingSeat
            SET Status = 'CANCELLED'
            WHERE BookingID = @BookingID
          `);

        // 3. Cố gắng xóa Redis lock (không fail nếu lỗi)
        try {
          const Redis = (await import('ioredis')).default;
          const redis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            lazyConnect: true,
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
          });

          await redis.connect().catch(() => { /* ignore */ });

          // Lấy danh sách seatIds của booking này
          const seatsResult = await pool.request()
            .input('BookingID', sql.Int, booking.BookingID)
            .query(`
              SELECT bs.SeatID, bs.ShowID
              FROM BookingSeat bs
              WHERE bs.BookingID = @BookingID AND bs.Status = 'CANCELLED'
            `);

          for (const seat of seatsResult.recordset) {
            await redis.del(`seat:hold:${seat.ShowID}:${seat.SeatID}`);
          }

          await redis.quit();
        } catch (redisErr) {
          console.warn(`[Job] Redis cleanup failed for Booking #${booking.BookingID}:`, (redisErr as Error).message);
        }

        // 4. Broadcast WebSocket (Socket.IO server instance)
        // Nếu server chưa init Socket.IO → skip, không fail
        try {
          const { getSocketIO } = await import('../socket');
          const io = getSocketIO();
          if (io) {
            const seatsResult = await pool.request()
              .input('BookingID', sql.Int, booking.BookingID)
              .query('SELECT SeatID, ShowID FROM BookingSeat WHERE BookingID = @BookingID');

            for (const seat of seatsResult.recordset) {
              io.to(`show_${seat.ShowID}`).emit('booking:expired', {
                showId: seat.ShowID,
                seatId: seat.SeatID,
                bookingId: booking.BookingID,
              });
            }
          }
        } catch (socketErr) {
          console.warn(`[Job] Socket.IO broadcast skipped (not initialized):`, (socketErr as Error).message);
        }

        // 5. Gửi notification
        await NotificationService.send({
          customerId: booking.CustomerID,
          title: 'Đơn đặt vé đã hết hạn ⏰',
          message: `Đơn đặt vé cho phim "${booking.MovieTitle}" đã hết hạn thanh toán. Vui lòng đặt lại nếu muốn.`,
          type: 'BOOKING',
          email: booking.Email,
          emailSubject: `CineBook — Đơn đặt vé #${booking.BookingID} đã hết hạn`,
        });

        console.log(
          `[Job] Đã giải phóng ghế cho Booking #${booking.BookingID} (${booking.Email}) — Show ${booking.MovieTitle}`
        );

        success = true;
      } catch (err) {
        retryCount++;
        console.error(
          `[Job] Lỗi xử lý Booking #${booking.BookingID} (lần thử ${retryCount}/${MAX_RETRIES}):`,
          err
        );
        if (retryCount >= MAX_RETRIES) {
          console.error(`[Job] Booking #${booking.BookingID} đã đạt số lần retry tối đa, bỏ qua.`);
        }
      }
    }
  }

  console.log(`[Job] releaseExpiredSeats — hoàn thành lúc ${new Date().toISOString()}`);
}
