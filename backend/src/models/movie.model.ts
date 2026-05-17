import * as mssql from 'mssql';
import { connectDB } from '../config/database';

export interface MovieData {
  title: string;
  genre: string;
  language: string;
  runtime: number;
  releaseDate: Date;
  actor?: string;
  director?: string;
  description?: string;
  trailerUrl?: string;
  rating?: number;
  isFeatured?: boolean;
  featuredOrder?: number;
  isActive?: boolean;
}

export interface MovieFilters {
  genre?: string;
  language?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export class MovieModel {
  /**
   * Lấy danh sách phim có phân trang và bộ lọc
   */
  static async findAll({ offset = 0, limit = 20, filters = {} }: { offset?: number; limit?: number; filters?: MovieFilters }) {
    const pool = await connectDB();
    
    // Tạo request riêng cho count và data (tránh xung đột input params)
    const countRequest = pool.request();
    const dataRequest = pool.request();
    
    let whereConditions: string[] = [];
    
    if (filters.genre) {
      whereConditions.push('MovieGenre LIKE @genre');
      countRequest.input('genre', mssql.NVarChar, `%${filters.genre}%`);
      dataRequest.input('genre', mssql.NVarChar, `%${filters.genre}%`);
    }
    
    if (filters.language) {
      whereConditions.push('MovieLanguage = @language');
      countRequest.input('language', mssql.NVarChar, filters.language);
      dataRequest.input('language', mssql.NVarChar, filters.language);
    }
    
    if (filters.isActive !== undefined) {
      whereConditions.push('IsActive = @isActive');
      const isActiveVal = filters.isActive ? 1 : 0;
      countRequest.input('isActive', mssql.Bit, isActiveVal);
      dataRequest.input('isActive', mssql.Bit, isActiveVal);
    }
    
    if (filters.isFeatured !== undefined) {
      whereConditions.push('IsFeatured = @isFeatured');
      const isFeaturedVal = filters.isFeatured ? 1 : 0;
      countRequest.input('isFeatured', mssql.Bit, isFeaturedVal);
      dataRequest.input('isFeatured', mssql.Bit, isFeaturedVal);
    }
    
    const whereSQL = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Đếm tổng số bản ghi
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total 
      FROM Movie 
      ${whereSQL}
    `);
    
    const total = countResult.recordset[0].total;
    
    // Lấy dữ liệu phân trang
    dataRequest.input('offset', mssql.Int, offset);
    dataRequest.input('limit', mssql.Int, limit);
    
    const result = await dataRequest.query(`
      SELECT * FROM Movie 
      ${whereSQL}
      ORDER BY MovieID DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    
    return {
      movies: result.recordset,
      total
    };
  }
  
  /**
   * Lấy danh sách phim nổi bật (đang chiếu)
   */
  static async findFeatured() {
    const pool = await connectDB();
    const result = await pool.request()
      .query(`
        SELECT * FROM Movie 
        WHERE IsFeatured = 1 AND IsActive = 1
        ORDER BY FeaturedOrder ASC, MovieID DESC
      `);
    return { movies: result.recordset };
  }
  
  /**
   * Tìm kiếm phim theo từ khóa (tên, thể loại, ngôn ngữ)
   */
  static async search(query: string, { offset = 0, limit = 20 }: { offset?: number; limit?: number }) {
    const pool = await connectDB();
    
    // Đếm tổng số kết quả
    const countResult = await pool.request()
      .input('query', mssql.NVarChar, `%${query}%`)
      .query(`
        SELECT COUNT(*) AS total 
        FROM Movie 
        WHERE (MovieTitle LIKE @query OR MovieGenre LIKE @query OR MovieLanguage LIKE @query)
          AND IsActive = 1
      `);
    
    const total = countResult.recordset[0].total;
    
    // Lấy dữ liệu phân trang
    const result = await pool.request()
      .input('query', mssql.NVarChar, `%${query}%`)
      .input('offset', mssql.Int, offset)
      .input('limit', mssql.Int, limit)
      .query(`
        SELECT * FROM Movie 
        WHERE (MovieTitle LIKE @query OR MovieGenre LIKE @query OR MovieLanguage LIKE @query)
          AND IsActive = 1
        ORDER BY MovieID DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    return {
      movies: result.recordset,
      total
    };
  }
  
  /**
   * Lấy chi tiết phim theo ID
   */
  static async findById(id: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .query('SELECT * FROM Movie WHERE MovieID = @id');
    return result.recordset[0] || null;
  }
  
  /**
   * Thêm phim mới
   */
  static async create(movieData: MovieData) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('title', mssql.NVarChar, movieData.title)
      .input('genre', mssql.NVarChar, movieData.genre)
      .input('language', mssql.NVarChar, movieData.language)
      .input('runtime', mssql.Int, movieData.runtime)
      .input('releaseDate', mssql.Date, movieData.releaseDate)
      .input('actor', mssql.NVarChar, movieData.actor || null)
      .input('director', mssql.NVarChar, movieData.director || null)
      .input('description', mssql.NVarChar, movieData.description || null)
      .input('trailerUrl', mssql.NVarChar, movieData.trailerUrl || null)
      .input('rating', mssql.Decimal(3, 1), movieData.rating || null)
      .input('isFeatured', mssql.Bit, movieData.isFeatured ? 1 : 0)
      .input('featuredOrder', mssql.Int, movieData.featuredOrder || 0)
      .input('isActive', mssql.Bit, movieData.isActive !== undefined ? movieData.isActive : 1)
      .query(`
        INSERT INTO Movie (
          MovieTitle, MovieGenre, MovieLanguage, MovieRuntime, MovieReleaseDate,
          MovieActor, MovieDirector, MovieDescription, TrailerUrl, Rating,
          IsFeatured, FeaturedOrder, IsActive
        ) 
        OUTPUT INSERTED.*
        VALUES (
          @title, @genre, @language, @runtime, @releaseDate,
          @actor, @director, @description, @trailerUrl, @rating,
          @isFeatured, @featuredOrder, @isActive
        )
      `);
    return result.recordset[0];
  }
  
  /**
   * Cập nhật thông tin phim
   */
  static async update(id: number, movieData: Partial<MovieData>) {
    const pool = await connectDB();
    await pool.request()
      .input('id', mssql.Int, id)
      .input('title', mssql.NVarChar, movieData.title)
      .input('genre', mssql.NVarChar, movieData.genre)
      .input('language', mssql.NVarChar, movieData.language)
      .input('runtime', mssql.Int, movieData.runtime)
      .input('releaseDate', mssql.Date, movieData.releaseDate)
      .input('actor', mssql.NVarChar, movieData.actor || null)
      .input('director', mssql.NVarChar, movieData.director || null)
      .input('description', mssql.NVarChar, movieData.description || null)
      .input('trailerUrl', mssql.NVarChar, movieData.trailerUrl || null)
      .input('rating', mssql.Decimal(3, 1), movieData.rating || null)
      .input('isFeatured', mssql.Bit, movieData.isFeatured ? 1 : 0)
      .input('featuredOrder', mssql.Int, movieData.featuredOrder || 0)
      .input('isActive', mssql.Bit, movieData.isActive !== undefined ? movieData.isActive : 1)
      .query(`
        UPDATE Movie SET
          MovieTitle = @title,
          MovieGenre = @genre,
          MovieLanguage = @language,
          MovieRuntime = @runtime,
          MovieReleaseDate = @releaseDate,
          MovieActor = @actor,
          MovieDirector = @director,
          MovieDescription = @description,
          TrailerUrl = @trailerUrl,
          Rating = @rating,
          IsFeatured = @isFeatured,
          FeaturedOrder = @featuredOrder,
          IsActive = @isActive
        WHERE MovieID = @id
      `);
    return { ...movieData, MovieID: id };
  }
  
  /**
   * Xóa mềm phim (chỉ set IsActive = 0)
   */
  static async softDelete(id: number) {
    const pool = await connectDB();
    await pool.request()
      .input('id', mssql.Int, id)
      .query('UPDATE Movie SET IsActive = 0 WHERE MovieID = @id');
    return { MovieID: id };
  }
  
  /**
   * Bật/tắt trạng thái phim nổi bật
   */
  static async toggleFeatured(id: number) {
    const pool = await connectDB();
    
    // Lấy thông tin phim hiện tại
    const movieResult = await pool.request()
      .input('id', mssql.Int, id)
      .query('SELECT * FROM Movie WHERE MovieID = @id');
    
    const movie = movieResult.recordset[0];
    if (!movie) throw new Error('Phim không tồn tại');
    
    const newFeatured = !movie.IsFeatured;
    let newFeaturedOrder = movie.FeaturedOrder;
    
    if (newFeatured) {
      // Lấy thứ tự nổi bật lớn nhất + 1
      const maxResult = await pool.request()
        .query('SELECT ISNULL(MAX(FeaturedOrder), 0) AS maxOrder FROM Movie WHERE IsFeatured = 1');
      newFeaturedOrder = maxResult.recordset[0].maxOrder + 1;
    } else {
      // Đặt về 0 khi bỏ nổi bật
      newFeaturedOrder = 0;
    }
    
    // Cập nhật phim
    await pool.request()
      .input('id', mssql.Int, id)
      .input('isFeatured', mssql.Bit, newFeatured ? 1 : 0)
      .input('featuredOrder', mssql.Int, newFeaturedOrder)
      .query(`
        UPDATE Movie SET
          IsFeatured = @isFeatured,
          FeaturedOrder = @featuredOrder
        WHERE MovieID = @id
      `);
    
    return { ...movie, IsFeatured: newFeatured, FeaturedOrder: newFeaturedOrder };
  }
  
  /**
   * Lấy thứ tự nổi bật lớn nhất (dùng cho admin)
   */
  static async getMaxFeaturedOrder() {
    const pool = await connectDB();
    const result = await pool.request()
      .query('SELECT ISNULL(MAX(FeaturedOrder), 0) AS maxOrder FROM Movie WHERE IsFeatured = 1');
    return result.recordset[0].maxOrder;
  }
  
  /**
   * Thích/bỏ thích phim (toggle)
   */
  static async toggleLike(movieId: number, customerId: number) {
    const pool = await connectDB();
    
    // Kiểm tra đã thích chưa
    const existing = await pool.request()
      .input('movieId', mssql.Int, movieId)
      .input('customerId', mssql.Int, customerId)
      .query('SELECT * FROM LikeMovie WHERE MovieID = @movieId AND CustomerID = @customerId');
    
    if (existing.recordset.length > 0) {
      // Bỏ thích
      await pool.request()
        .input('movieId', mssql.Int, movieId)
        .input('customerId', mssql.Int, customerId)
        .query('DELETE FROM LikeMovie WHERE MovieID = @movieId AND CustomerID = @customerId');
      return false;
    } else {
      // Thích
      await pool.request()
        .input('movieId', mssql.Int, movieId)
        .input('customerId', mssql.Int, customerId)
        .query(`
          INSERT INTO LikeMovie (MovieID, CustomerID, IsLiked)
          VALUES (@movieId, @customerId, 1)
        `);
      return true;
    }
  }
  
  /**
   * Lấy trạng thái thích phim của khách hàng
   */
  static async getLikeStatus(movieId: number, customerId: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('movieId', mssql.Int, movieId)
      .input('customerId', mssql.Int, customerId)
      .query('SELECT IsLiked FROM LikeMovie WHERE MovieID = @movieId AND CustomerID = @customerId');
    
    return result.recordset.length > 0 ? result.recordset[0].IsLiked : false;
  }
}

export default MovieModel;
