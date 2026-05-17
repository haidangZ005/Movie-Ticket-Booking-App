import * as mssql from 'mssql';
import { connectDB } from '../config/database';

class BookingModel {
  static async findByCustomerId(customerId: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('customerId', mssql.Int, customerId)
      .query(`
        SELECT
          b.BookingID,
          b.CustomerID,
          b.ShowID,
          b.TotalSeats,
          b.TotalAmount,
          b.Status,
          b.CreatedAt,
          st.ShowDate,
          st.ShowTime,
          st.Format,
          m.MovieID,
          m.MovieTitle,
          m.MovieRuntime,
          m.MovieImage,
          c.CinemaID,
          c.CinemaName,
          c.Address,
          h.HallID,
          h.HallName,
          STRING_AGG(s.SeatNumber, ', ') WITHIN GROUP (ORDER BY s.RowIndex, s.ColIndex) AS SeatNumbers
        FROM Booking b
        INNER JOIN Showtime st ON b.ShowID = st.ShowID
        INNER JOIN Movie m ON st.MovieID = m.MovieID
        INNER JOIN CinemaHall h ON st.HallID = h.HallID
        INNER JOIN CinemaComplex c ON h.CinemaID = c.CinemaID
        LEFT JOIN BookingSeat bs ON b.BookingID = bs.BookingID
        LEFT JOIN Seat s ON bs.SeatID = s.SeatID
        WHERE b.CustomerID = @customerId
        GROUP BY
          b.BookingID, b.CustomerID, b.ShowID, b.TotalSeats, b.TotalAmount, b.Status, b.CreatedAt,
          st.ShowDate, st.ShowTime, st.Format,
          m.MovieID, m.MovieTitle, m.MovieRuntime, m.MovieImage,
          c.CinemaID, c.CinemaName, c.Address,
          h.HallID, h.HallName
        ORDER BY b.CreatedAt DESC
      `);

    return result.recordset;
  }
}

export default BookingModel;
