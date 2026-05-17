import { getPool } from '../config/database';
import sql from 'mssql';

/**
 * Admin Model (TV5)
 * Handles Database operations for Reports, Audits, and Settings.
 */
export class AdminModel {
  
  /**
   * Lấy doanh thu theo bộ lọc
   */
  static async getRevenueStats() {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          SUM(TotalAmount) as totalRevenue,
          COUNT(BookingID) as totalTickets,
          AVG(TotalAmount) as avgTicketValue
        FROM [dbo].[Booking]
        WHERE Status = 'COMPLETED'
      `);
    return result.recordset[0];
  }

  /**
   * Lấy Top 5 phim bán chạy nhất
   */
  static async getTopMovies() {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT TOP 5 
          m.Title, 
          COUNT(bs.BookingSeatID) as ticketCount
        FROM [dbo].[BookingSeat] bs
        JOIN [dbo].[Show] s ON bs.ShowID = s.ShowID
        JOIN [dbo].[Movie] m ON s.MovieID = m.MovieID
        WHERE bs.Status = 'BOOKED'
        GROUP BY m.Title
        ORDER BY ticketCount DESC
      `);
    return result.recordset;
  }

  /**
   * Lấy doanh thu theo rạp (Market Share)
   */
  static async getMarketShare() {
     const pool = getPool();
     const result = await pool.request()
       .query(`
         SELECT 
           c.CinemaName, 
           SUM(b.TotalAmount) as revenue
         FROM [dbo].[Booking] b
         JOIN [dbo].[Show] s ON b.ShowID = s.ShowID
         JOIN [dbo].[CinemaHall] ch ON s.HallID = ch.HallID
         JOIN [dbo].[Cinema] c ON ch.CinemaID = c.CinemaID
         WHERE b.Status = 'COMPLETED'
         GROUP BY c.CinemaName
       `);
     return result.recordset;
  }

  /**
   * Lấy nhật ký thao tác
   */
  static async getAuditLogs() {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT TOP 50 
          al.*, 
          a.AccountName 
        FROM [dbo].[AuditLog] al
        JOIN [dbo].[Account] a ON al.AccountID = a.AccountID
        ORDER BY al.CreatedAt DESC
      `);
    return result.recordset;
  }

  /**
   * Lấy toàn bộ cài đặt hệ thống
   */
  static async getSystemSettings() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM [dbo].[SystemSettings]');
    return result.recordset;
  }

  /**
   * Cập nhật trạng thái tài khoản (TV5 responsibility)
   */
  static async updateAccountStatus(accountId: number, isActive: boolean) {
    const pool = getPool();
    await pool.request()
      .input('accountId', sql.Int, accountId)
      .input('status', sql.Bit, isActive)
      .query('UPDATE [dbo].[Account] SET IsActive = @status WHERE AccountID = @accountId');
  }
}
