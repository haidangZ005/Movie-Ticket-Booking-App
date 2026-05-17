import * as mssql from 'mssql';
import { connectDB } from '../config/database';

interface CinemaFilters {
  offset?: number;
  limit?: number;
  cityId?: number;
}

interface CinemaData {
  cinemaName: string;
  address?: string;
  district?: string;
  cityId: number;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

interface Cinema {
  CinemaID: number;
  CinemaName: string;
  Address?: string;
  District?: string;
  CityID: number;
  Latitude?: number;
  Longitude?: number;
  IsActive: boolean;
}

class CinemaModel {
  /**
   * Lấy danh sách cụm rạp có phân trang và lọc theo thành phố
   */
  static async findAll({ offset = 0, limit = 20, filters = {} }: { offset?: number; limit?: number; filters?: CinemaFilters }): Promise<{ cinemas: Cinema[]; total: number }> {
    const pool = await connectDB();
    
    const countRequest = pool.request();
    const dataRequest = pool.request();
    
    let whereConditions: string[] = ['IsActive = 1'];
    
    if (filters.cityId) {
      whereConditions.push('CityID = @cityId');
      countRequest.input('cityId', mssql.Int, filters.cityId);
      dataRequest.input('cityId', mssql.Int, filters.cityId);
    }
    
    const whereSQL = `WHERE ${whereConditions.join(' AND ')}`;
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total 
      FROM CinemaComplex 
      ${whereSQL}
    `);
    
    const total = countResult.recordset[0].total;
    
    dataRequest.input('offset', mssql.Int, offset);
    dataRequest.input('limit', mssql.Int, limit);
    
    const result = await dataRequest.query(`
      SELECT c.*, ct.CityName 
      FROM CinemaComplex c
      LEFT JOIN City ct ON c.CityID = ct.CityID
      ${whereSQL}
      ORDER BY c.CinemaName
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    
    return {
      cinemas: result.recordset,
      total
    };
  }

  /**
   * Lấy chi tiết cụm rạp kèm danh sách phòng chiếu
   */
  static async findById(id: number): Promise<{ cinema: Cinema; halls: any[] } | null> {
    const pool = await connectDB();
    
    const cinemaResult = await pool.request()
      .input('id', mssql.Int, id)
      .query('SELECT * FROM CinemaComplex WHERE CinemaID = @id AND IsActive = 1');
    
    if (cinemaResult.recordset.length === 0) return null;
    
    const cinema = cinemaResult.recordset[0];
    
    const hallsResult = await pool.request()
      .input('cinemaId', mssql.Int, id)
      .query('SELECT * FROM CinemaHall WHERE CinemaID = @cinemaId ORDER BY HallName');
    
    return {
      cinema,
      halls: hallsResult.recordset
    };
  }

  /**
   * Lấy lịch chiếu theo cụm rạp
   */
  static async getShows(id: number, date?: string): Promise<{ shows: any[] }> {
    const pool = await connectDB();
    
    let query = `
      SELECT s.*, m.MovieTitle, m.MovieGenre, m.MovieRuntime, m.Rating
      FROM Showtime s
      INNER JOIN CinemaHall ch ON s.HallID = ch.HallID
      INNER JOIN CinemaComplex c ON ch.CinemaID = c.CinemaID
      INNER JOIN Movie m ON s.MovieID = m.MovieID
      WHERE c.CinemaID = @cinemaId AND m.IsActive = 1
    `;
    
    const request = pool.request().input('cinemaId', mssql.Int, id);
    
    if (date) {
      query += ' AND s.ShowDate = @date';
      request.input('date', mssql.Date, date);
    }
    
    query += ' ORDER BY s.ShowDate, s.ShowTime';
    
    const result = await request.query(query);
    
    return { shows: result.recordset };
  }

  /**
   * Thêm cụm rạp mới (Admin)
   */
  static async create(cinemaData: CinemaData): Promise<Cinema> {
    const pool = await connectDB();
    const result = await pool.request()
      .input('cinemaName', mssql.NVarChar, cinemaData.cinemaName)
      .input('address', mssql.NVarChar, cinemaData.address || null)
      .input('district', mssql.NVarChar, cinemaData.district || null)
      .input('cityId', mssql.Int, cinemaData.cityId)
      .input('latitude', mssql.Decimal(9, 6), cinemaData.latitude || null)
      .input('longitude', mssql.Decimal(9, 6), cinemaData.longitude || null)
      .input('isActive', mssql.Bit, cinemaData.isActive !== undefined ? cinemaData.isActive : 1)
      .query(`
        INSERT INTO CinemaComplex (
          CinemaName, Address, District, CityID, Latitude, Longitude, IsActive
        ) 
        OUTPUT INSERTED.*
        VALUES (
          @cinemaName, @address, @district, @cityId, @latitude, @longitude, @isActive
        )
      `);
    return result.recordset[0];
  }

  /**
   * Cập nhật thông tin cụm rạp (Admin)
   */
  static async update(id: number, cinemaData: Partial<CinemaData>): Promise<Cinema> {
    const pool = await connectDB();
    await pool.request()
      .input('id', mssql.Int, id)
      .input('cinemaName', mssql.NVarChar, cinemaData.cinemaName)
      .input('address', mssql.NVarChar, cinemaData.address || null)
      .input('district', mssql.NVarChar, cinemaData.district || null)
      .input('cityId', mssql.Int, cinemaData.cityId)
      .input('latitude', mssql.Decimal(9, 6), cinemaData.latitude || null)
      .input('longitude', mssql.Decimal(9, 6), cinemaData.longitude || null)
      .query(`
        UPDATE CinemaComplex SET
          CinemaName = @cinemaName,
          Address = @address,
          District = @district,
          CityID = @cityId,
          Latitude = @latitude,
          Longitude = @longitude
        WHERE CinemaID = @id
      `);
    return { ...cinemaData, CinemaID: id } as Cinema;
  }
}

export default CinemaModel;
