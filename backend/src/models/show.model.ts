import * as mssql from 'mssql';
import { connectDB } from '../config/database';

interface ShowData {
  movieId: number;
  hallId: number;
  showDate: Date;
  showTime: string;
  format: string;
  basePrice: number;
}

interface Show {
  ShowID: number;
  MovieID: number;
  HallID: number;
  ShowDate: Date;
  ShowTime: string;
  EndTime: string;
  Format: string;
  BasePrice: number;
}

interface SeatInfo {
  SeatID: number;
  SeatNumber: string;
  SeatType: string;
  SeatPrice: number;
  RowIndex: number;
  ColIndex: number;
  IsAisle: boolean;
  Status?: string;
}

class ShowModel {
  /**
   * Lấy chi tiết suất chiếu
   */
  static async findById(id: number): Promise<{ show: Show; movie: any; hall: any; cinema: any } | null> {
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .query(`
        SELECT s.*, 
               m.MovieTitle, m.MovieGenre, m.MovieRuntime, m.MovieLanguage, m.Rating, m.IsFeatured,
               ch.HallName, ch.TotalRows, ch.TotalCols, ch.TotalSeats,
               c.CinemaName, c.Address, c.District
        FROM Showtime s
        INNER JOIN Movie m ON s.MovieID = m.MovieID
        INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
        INNER JOIN CinemaComplex c ON ch.CinemaID = c.CinemaID
        WHERE s.ShowID = @id AND m.IsActive = 1
      `);
    
    if (result.recordset.length === 0) return null;
    
    const row = result.recordset[0];
    return {
      show: {
        ShowID: row.ShowID,
        MovieID: row.MovieID,
        HallID: row.HallID,
        ShowDate: row.ShowDate,
        ShowTime: row.ShowTime,
        EndTime: row.EndTime,
        Format: row.Format,
        BasePrice: row.BasePrice
      },
      movie: {
        MovieID: row.MovieID,
        MovieTitle: row.MovieTitle,
        MovieGenre: row.MovieGenre,
        MovieRuntime: row.MovieRuntime,
        MovieLanguage: row.MovieLanguage,
        Rating: row.Rating,
        IsFeatured: row.IsFeatured
      },
      hall: {
        HallID: row.HallID,
        HallName: row.HallName,
        TotalRows: row.TotalRows,
        TotalCols: row.TotalCols,
        TotalSeats: row.TotalSeats
      },
      cinema: {
        CinemaName: row.CinemaName,
        Address: row.Address,
        District: row.District
      }
    };
  }

  /**
   * Lấy sơ đồ ghế theo suất chiếu kèm trạng thái từ Redis
   */
  static async getSeats(showId: number): Promise<{ seats: SeatInfo[]; show: Show }> {
    const pool = await connectDB();
    
    // Lấy thông tin suất chiếu
    const showResult = await pool.request()
      .input('showId', mssql.Int, showId)
      .query('SELECT * FROM Showtime WHERE ShowID = @showId');
    
    if (showResult.recordset.length === 0) throw new Error('Suất chiếu không tồn tại');
    
    const show = showResult.recordset[0];
    
    // Lấy sơ đồ ghế từ CinemaHallSeat
    const seatsResult = await pool.request()
      .input('hallId', mssql.Int, show.HallID)
      .query(`
        SELECT cs.*, 
               CASE WHEN bs.SeatID IS NOT NULL AND bs.Status = 'HOLDING' THEN 'HOLDING'
                    WHEN bs.SeatID IS NOT NULL AND bs.Status = 'BOOKED' THEN 'BOOKED'
                    ELSE 'AVAILABLE'
               END as Status,
               bs.HoldUntil,
               bs.BookingID
        FROM CinemaHallSeat cs
        LEFT JOIN BookingSeat bs ON cs.SeatID = bs.SeatID 
          AND bs.ShowID = @showId 
          AND bs.Status IN ('HOLDING', 'BOOKED')
        WHERE cs.HallID = @hallId
        ORDER BY cs.RowIndex, cs.ColIndex
      `);
    
    return {
      seats: seatsResult.recordset,
      show
    };
  }

  /**
   * Tạo suất chiếu mới (Admin) - kiểm tra xung đột thời gian
   */
  static async create(showData: ShowData): Promise<Show> {
    const pool = await connectDB();
    
    // Kiểm tra xung đột thời gian trong cùng phòng chiếu
    const conflictResult = await pool.request()
      .input('hallId', mssql.Int, showData.hallId)
      .input('showDate', mssql.Date, showData.showDate)
      .input('showTime', mssql.Time, showData.showTime)
      .input('endTime', mssql.Time, showData.showTime) // Tạm thời, sẽ tính sau
      .query(`
        SELECT COUNT(*) as cnt FROM Showtime 
        WHERE HallID = @hallId 
          AND ShowDate = @showDate
          AND (
            (ShowTime <= @showTime AND EndTime > @showTime) OR
            (ShowTime < @endTime AND EndTime >= @endTime) OR
            (ShowTime >= @showTime AND EndTime <= @endTime)
          )
      `);
    
    if (conflictResult.recordset[0].cnt > 0) {
      throw new Error('Xung đột thời gian với suất chiếu khác trong cùng phòng');
    }
    
    // Lấy thông tin phim để tính EndTime
    const movieResult = await pool.request()
      .input('movieId', mssql.Int, showData.movieId)
      .query('SELECT MovieRuntime FROM Movie WHERE MovieID = @movieId');
    
    if (movieResult.recordset.length === 0) throw new Error('Phim không tồn tại');
    
    const runtime = movieResult.recordset[0].MovieRuntime;
    // Tính EndTime = ShowTime + Runtime + 15 phút dọn dẹp
    const endTime = new Date(`${showData.showDate}T${showData.showTime}`);
    endTime.setMinutes(endTime.getMinutes() + runtime + 15);
    
    const result = await pool.request()
      .input('movieId', mssql.Int, showData.movieId)
      .input('hallId', mssql.Int, showData.hallId)
      .input('showDate', mssql.Date, showData.showDate)
      .input('showTime', mssql.Time, showData.showTime)
      .input('endTime', mssql.Time, endTime.toTimeString().split(' ')[0])
      .input('format', mssql.NVarChar, showData.format)
      .input('basePrice', mssql.Decimal(10, 2), showData.basePrice)
      .query(`
        INSERT INTO Showtime (
          MovieID, HallID, ShowDate, ShowTime, EndTime, Format, BasePrice
        ) 
        OUTPUT INSERTED.*
        VALUES (
          @movieId, @hallId, @showDate, @showTime, @endTime, @format, @basePrice
        )
      `);
    
    return result.recordset[0];
  }

  /**
   * Cập nhật suất chiếu (Admin) - chỉ khi chưa có vé đặt
   */
  static async update(id: number, showData: Partial<ShowData>): Promise<Show> {
    const pool = await connectDB();
    
    // Kiểm tra xem đã có vé đặt chưa
    const bookingResult = await pool.request()
      .input('showId', mssql.Int, id)
      .query('SELECT COUNT(*) as cnt FROM Booking WHERE ShowID = @showId');
    
    if (bookingResult.recordset[0].cnt > 0) {
      throw new Error('Không thể sửa suất chiếu đã có vé đặt');
    }
    
    const updates: string[] = [];
    const request = pool.request().input('id', mssql.Int, id);
    
    if (showData.movieId !== undefined) {
      updates.push('MovieID = @movieId');
      request.input('movieId', mssql.Int, showData.movieId);
    }
    if (showData.hallId !== undefined) {
      updates.push('HallID = @hallId');
      request.input('hallId', mssql.Int, showData.hallId);
    }
    if (showData.showDate !== undefined) {
      updates.push('ShowDate = @showDate');
      request.input('showDate', mssql.Date, showData.showDate);
    }
    if (showData.showTime !== undefined) {
      updates.push('ShowTime = @showTime');
      request.input('showTime', mssql.Time, showData.showTime);
    }
    if (showData.format !== undefined) {
      updates.push('Format = @format');
      request.input('format', mssql.NVarChar, showData.format);
    }
    if (showData.basePrice !== undefined) {
      updates.push('BasePrice = @basePrice');
      request.input('basePrice', mssql.Decimal(10, 2), showData.basePrice);
    }
    
    if (updates.length === 0) throw new Error('Không có dữ liệu cập nhật');
    
    await request.query(`
      UPDATE Showtime SET ${updates.join(', ')}
      WHERE ShowID = @id
    `);
    
    return { ...showData, ShowID: id } as Show;
  }

  /**
   * Xóa suất chiếu (Admin) - kiểm tra không có vé
   */
  static async delete(id: number): Promise<{ ShowID: number }> {
    const pool = await connectDB();
    
    const bookingResult = await pool.request()
      .input('showId', mssql.Int, id)
      .query('SELECT COUNT(*) as cnt FROM Booking WHERE ShowID = @showId');
    
    if (bookingResult.recordset[0].cnt > 0) {
      throw new Error('Không thể xóa suất chiếu đã có vé đặt');
    }
    
    await pool.request()
      .input('id', mssql.Int, id)
      .query('DELETE FROM Showtime WHERE ShowID = @id');
    
    return { ShowID: id };
  }
}

export default ShowModel;
