import * as mssql from 'mssql';
import { connectDB } from '../config/database';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

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

const normalizeSqlTime = (value: string) => {
  if (!value) throw new Error('Show time is required');
  const parts = String(value).split(':');
  if (parts.length < 2) throw new Error('Invalid show time');

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts[2] !== undefined ? Number(parts[2]) : 0;

  if (
    !Number.isInteger(hours) || hours < 0 || hours > 23 ||
    !Number.isInteger(minutes) || minutes < 0 || minutes > 59 ||
    !Number.isInteger(seconds) || seconds < 0 || seconds > 59
  ) {
    throw new Error('Invalid show time');
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const addMinutesToTime = (time: string, minutesToAdd: number) => {
  const [hours, minutes, seconds] = normalizeSqlTime(time).split(':').map(Number);
  const date = new Date(1970, 0, 1, hours, minutes, seconds);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date.toTimeString().split(' ')[0];
};

class ShowModel {
  private static buildListFilters(request: mssql.Request, filters: any = {}) {
    const conditions = ['m.IsActive = 1'];

    if (filters.cinemaId) {
      request.input('cinemaId', mssql.Int, filters.cinemaId);
      conditions.push('ch.CinemaID = @cinemaId');
    }

    if (filters.hallId) {
      request.input('hallId', mssql.Int, filters.hallId);
      conditions.push('s.HallID = @hallId');
    }

    if (filters.movieId) {
      request.input('movieId', mssql.Int, filters.movieId);
      conditions.push('s.MovieID = @movieId');
    }

    if (filters.showDate) {
      request.input('showDate', mssql.Date, filters.showDate);
      conditions.push('s.ShowDate = @showDate');
    }

    if (filters.format) {
      request.input('format', mssql.NVarChar(20), filters.format);
      conditions.push('s.Format = @format');
    }

    return conditions;
  }

  private static getListSelectSql(whereSql: string) {
    return `
      SELECT
        s.ShowID,
        s.MovieID,
        s.HallID,
        s.ShowDate,
        CONVERT(varchar(8), s.ShowTime, 108) AS ShowTime,
        CONVERT(varchar(8), s.EndTime, 108) AS EndTime,
        s.Format,
        s.BasePrice,
        m.MovieTitle,
        m.MovieGenre,
        m.MovieRuntime,
        m.MovieLanguage,
        m.PosterUrl,
        ch.HallName,
        ch.TotalRows,
        ch.TotalCols,
        ch.TotalSeats,
        ch.TotalSeats - (
          SELECT COUNT(*)
          FROM BookingSeat bs
          WHERE bs.ShowID = s.ShowID
            AND bs.Status IN ('HOLDING', 'BOOKED')
        ) AS AvailableSeats,
        c.CinemaID,
        c.CinemaName
      FROM [Show] s
      INNER JOIN Movie m ON s.MovieID = m.MovieID
      INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
      INNER JOIN Cinema c ON ch.CinemaID = c.CinemaID
      WHERE ${whereSql}
      ORDER BY s.ShowDate DESC, s.ShowTime ASC
    `;
  }

  static async findAll(filters: any = {}): Promise<any[]> {
    const pool = await connectDB();
    const request = pool.request();
    const conditions = this.buildListFilters(request, filters);
    const result = await request.query(this.getListSelectSql(conditions.join(' AND ')));

    return result.recordset;
  }

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
        FROM [Show] s
        INNER JOIN Movie m ON s.MovieID = m.MovieID
        INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
        INNER JOIN Cinema c ON ch.CinemaID = c.CinemaID
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
  static async getSeatsByShowId(showId: number): Promise<{ seats: SeatInfo[]; show: Show }> {
    const pool = await connectDB();
    
    // Lấy thông tin suất chiếu
    const showResult = await pool.request()
      .input('showId', mssql.Int, showId)
      .query(`
        SELECT
          s.ShowID,
          s.MovieID,
          s.HallID,
          s.ShowDate,
          CONVERT(varchar(8), s.ShowTime, 108) AS ShowTime,
          CONVERT(varchar(8), s.EndTime, 108) AS EndTime,
          s.Format,
          s.BasePrice,
          m.MovieTitle,
          ch.HallName,
          c.CinemaID,
          c.CinemaName
        FROM [Show] s
        INNER JOIN Movie m ON s.MovieID = m.MovieID
        INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
        INNER JOIN Cinema c ON ch.CinemaID = c.CinemaID
        WHERE s.ShowID = @showId
      `);
    
    if (showResult.recordset.length === 0) throw new Error('Suất chiếu không tồn tại');
    
    const show = showResult.recordset[0];
    
    // Lấy sơ đồ ghế từ CinemaHallSeat
    const seatsResult = await pool.request()
      .input('hallId', mssql.Int, show.HallID)
      .input('showId', mssql.Int, showId)
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
    const movieResult = await pool.request()
      .input('movieId', mssql.Int, showData.movieId)
      .query('SELECT MovieRuntime FROM Movie WHERE MovieID = @movieId');

    if (movieResult.recordset.length === 0) throw new Error('Phim không tồn tại');

    const runtime = movieResult.recordset[0].MovieRuntime;
    const showTime = normalizeSqlTime(showData.showTime);
    const endTime = addMinutesToTime(showTime, runtime + 15);
    
    // Kiểm tra xung đột thời gian trong cùng phòng chiếu
    const conflictResult = await pool.request()
      .input('hallId', mssql.Int, showData.hallId)
      .input('showDate', mssql.Date, showData.showDate)
      .input('showTime', mssql.VarChar(8), showTime)
      .input('endTime', mssql.VarChar(8), endTime)
      .query(`
        SELECT COUNT(*) as cnt FROM [Show] 
        WHERE HallID = @hallId 
          AND ShowDate = @showDate
          AND (
            (ShowTime <= CONVERT(time, @showTime) AND EndTime > CONVERT(time, @showTime)) OR
            (ShowTime < CONVERT(time, @endTime) AND EndTime >= CONVERT(time, @endTime)) OR
            (ShowTime >= CONVERT(time, @showTime) AND EndTime <= CONVERT(time, @endTime))
          )
      `);
    
    if (conflictResult.recordset[0].cnt > 0) {
      throw new AppException(ErrorCode.SHOW_TIME_CONFLICT);
    }
    
    const result = await pool.request()
      .input('movieId', mssql.Int, showData.movieId)
      .input('hallId', mssql.Int, showData.hallId)
      .input('showDate', mssql.Date, showData.showDate)
      .input('showTime', mssql.VarChar(8), showTime)
      .input('endTime', mssql.VarChar(8), endTime)
      .input('format', mssql.NVarChar, showData.format)
      .input('basePrice', mssql.Decimal(10, 2), showData.basePrice)
      .query(`
        INSERT INTO [Show] (
          MovieID, HallID, ShowDate, ShowTime, EndTime, Format, BasePrice
        ) 
        OUTPUT INSERTED.*
        VALUES (
          @movieId, @hallId, @showDate, CONVERT(time, @showTime), CONVERT(time, @endTime), @format, @basePrice
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
      updates.push('ShowTime = CONVERT(time, @showTime)');
      request.input('showTime', mssql.VarChar(8), normalizeSqlTime(showData.showTime));
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
      UPDATE [Show] SET ${updates.join(', ')}
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
      .query('DELETE FROM [Show] WHERE ShowID = @id');
    
    return { ShowID: id };
  }

  static async getByCinemaId(cinemaId: number, filters: any = {}): Promise<Show[]> {
    const pool = await connectDB();
    const request = pool.request();
    const conditions = this.buildListFilters(request, { ...filters, cinemaId });
    const result = await request.query(this.getListSelectSql(conditions.join(' AND ')));

    return result.recordset;
  }

  static async getDatesByCinemaId(cinemaId: number, filters: any = {}): Promise<string[]> {
    const pool = await connectDB();
    const request = pool.request()
      .input('cinemaId', mssql.Int, cinemaId);

    const conditions = ['ch.CinemaID = @cinemaId', 'm.IsActive = 1'];

    if (filters.movieId) {
      request.input('movieId', mssql.Int, filters.movieId);
      conditions.push('s.MovieID = @movieId');
    }

    const result = await request.query(`
      SELECT DISTINCT CONVERT(varchar(10), s.ShowDate, 23) AS ShowDate
      FROM [Show] s
      INNER JOIN Movie m ON s.MovieID = m.MovieID
      INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
      WHERE ${conditions.join(' AND ')}
      ORDER BY ShowDate
    `);

    return result.recordset.map(row => row.ShowDate);
  }
}

export default ShowModel;




