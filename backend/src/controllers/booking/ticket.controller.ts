import { Response } from 'express';
import sql from 'mssql';
import { getPool } from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';

export const getMyTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = Number(req.user?.customerId);
  const pool = getPool();

  const result = await pool.request()
    .input('CustomerID', sql.Int, customerId)
    .query(`
      SELECT
        b.BookingID,
        b.CustomerID,
        b.ShowID,
        b.TotalSeats,
        b.TotalAmount,
        b.Status AS BookingStatus,
        b.CreatedAt,
        m.MovieID,
        m.MovieTitle,
        m.PosterUrl,
        c.CinemaName,
        c.Address,
        h.HallName,
        s.ShowDate,
        CONVERT(varchar(5), s.ShowTime, 108) AS ShowTime,
        CONVERT(varchar(5), s.EndTime, 108) AS EndTime,
        s.Format,
        COALESCE(p.Status, CASE WHEN b.Status = 'CONFIRMED' THEN 'SUCCESS' ELSE NULL END) AS PaymentStatus,
        STRING_AGG(chs.SeatNumber, ', ') WITHIN GROUP (ORDER BY chs.RowIndex, chs.ColIndex) AS Seats
      FROM Booking b
      INNER JOIN [Show] s ON s.ShowID = b.ShowID
      INNER JOIN Movie m ON m.MovieID = s.MovieID
      INNER JOIN CinemaHall h ON h.HallID = s.HallID
      INNER JOIN Cinema c ON c.CinemaID = h.CinemaID
      LEFT JOIN Payment p ON p.BookingID = b.BookingID
      LEFT JOIN BookingSeat bs ON bs.BookingID = b.BookingID
      LEFT JOIN CinemaHallSeat chs ON chs.SeatID = bs.SeatID
      WHERE b.CustomerID = @CustomerID
        AND b.Status IN ('CONFIRMED', 'PENDING_PAYMENT')
        AND (bs.Status IS NULL OR bs.Status IN ('BOOKED', 'HOLDING'))
      GROUP BY
        b.BookingID, b.CustomerID, b.ShowID, b.TotalSeats, b.TotalAmount,
        b.Status, b.CreatedAt, m.MovieID, m.MovieTitle, m.PosterUrl,
        c.CinemaName, c.Address, h.HallName, s.ShowDate, s.ShowTime,
        s.EndTime, s.Format, p.Status
      ORDER BY s.ShowDate DESC, s.ShowTime DESC, b.BookingID DESC
    `);

  const tickets = result.recordset.map((ticket) => ({
    ...ticket,
    TicketCode: `CINEBOOK-${ticket.BookingID}`,
    QrData: `CINEBOOK-${ticket.BookingID}`,
  }));

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, tickets));
});
