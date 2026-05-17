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
    const summaryResult = await pool.request()
      .query(`
        SELECT 
          ISNULL(SUM(TotalAmount), 0) as totalRevenue,
          COUNT(BookingID) as totalBookings,
          ISNULL(SUM(TotalSeats), 0) as totalTickets,
          ISNULL(AVG(TotalAmount), 0) as avgTicketValue
        FROM [dbo].[Booking]
        WHERE Status IN ('CONFIRMED', 'COMPLETED')
      `);

    const customerResult = await pool.request()
      .query(`
        SELECT COUNT(*) as totalAccounts
        FROM [dbo].[Account]
        WHERE IsActive = 1
      `);

    const movieResult = await pool.request()
      .query(`
        SELECT COUNT(*) as activeMovies
        FROM [dbo].[Movie]
        WHERE IsActive = 1
      `);

    return {
      ...summaryResult.recordset[0],
      totalAccounts: customerResult.recordset[0].totalAccounts,
      activeMovies: movieResult.recordset[0].activeMovies
    };
  }

  /**
   * Lấy Top 5 phim bán chạy nhất
   */
  static async getTopMovies() {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT TOP 5 
          m.MovieTitle, 
          COUNT(bs.BookingSeatID) as ticketCount
        FROM [dbo].[BookingSeat] bs
        JOIN [dbo].[Showtime] s ON bs.ShowID = s.ShowID
        JOIN [dbo].[Movie] m ON s.MovieID = m.MovieID
        WHERE bs.Status = 'BOOKED'
        GROUP BY m.MovieTitle
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
         JOIN [dbo].[Showtime] s ON b.ShowID = s.ShowID
         JOIN [dbo].[CinemaHall] ch ON s.HallID = ch.HallID
         JOIN [dbo].[CinemaComplex] c ON ch.CinemaID = c.CinemaID
         WHERE b.Status IN ('CONFIRMED', 'COMPLETED')
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

  static async getAccounts() {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT TOP 200
          a.AccountID,
          a.Email,
          a.AccountType,
          a.IsActive,
          a.IsVerified,
          a.CreatedAt,
          c.CustomerID,
          c.FullName,
          c.PhoneNumber,
          c.LoyaltyPoints
        FROM [dbo].[Account] a
        LEFT JOIN [dbo].[Customer] c ON a.AccountID = c.AccountID
        ORDER BY a.CreatedAt DESC, a.AccountID DESC
      `);
    return result.recordset;
  }
}
