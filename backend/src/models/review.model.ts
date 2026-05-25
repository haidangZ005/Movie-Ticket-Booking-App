import * as mssql from 'mssql';
import { connectDB } from '../config/database';

export interface CreateReviewInput {
  movieId: number;
  customerId: number;
  rating: number;
  comment: string;
}

class ReviewModel {
  /**
   * Tạo mới hoặc cập nhật đánh giá phim của khách hàng (Atomic Upsert)
   */
  static async upsert(data: CreateReviewInput) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('MovieID', mssql.Int, data.movieId)
      .input('CustomerID', mssql.Int, data.customerId)
      .input('Rating', mssql.Decimal(2, 1), data.rating)
      .input('Comment', mssql.NVarChar(1000), data.comment)
      .query(`
        MERGE MovieReview AS target
        USING (SELECT @MovieID AS MovieID, @CustomerID AS CustomerID) AS source
        ON target.MovieID = source.MovieID AND target.CustomerID = source.CustomerID
        WHEN MATCHED THEN
            UPDATE SET Rating = @Rating, Comment = @Comment, UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (MovieID, CustomerID, Rating, Comment, CreatedAt, UpdatedAt)
            VALUES (source.MovieID, source.CustomerID, @Rating, @Comment, GETDATE(), GETDATE());
            
        -- Trả về bản ghi đầy đủ thông tin để hiển thị lập tức
        SELECT r.*, c.FullName, c.AvatarUrl 
        FROM MovieReview r
        INNER JOIN Customer c ON r.CustomerID = c.CustomerID
        WHERE r.MovieID = @MovieID AND r.CustomerID = @CustomerID;
      `);
    return result.recordset[0];
  }

  /**
   * Lấy danh sách đánh giá của một bộ phim
   */
  static async findByMovieId(movieId: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('MovieID', mssql.Int, movieId)
      .query(`
        SELECT 
          r.ReviewID,
          r.MovieID,
          r.CustomerID,
          r.Rating,
          r.Comment,
          r.CreatedAt,
          r.UpdatedAt,
          c.FullName,
          c.AvatarUrl
        FROM MovieReview r
        INNER JOIN Customer c ON r.CustomerID = c.CustomerID
        WHERE r.MovieID = @MovieID
        ORDER BY r.CreatedAt DESC
      `);
    return result.recordset;
  }

  /**
   * Xóa đánh giá (chỉ cho phép chính chủ nhân xóa)
   */
  static async delete(reviewId: number, customerId: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('ReviewID', mssql.Int, reviewId)
      .input('CustomerID', mssql.Int, customerId)
      .query(`
        DELETE FROM MovieReview 
        WHERE ReviewID = @ReviewID AND CustomerID = @CustomerID
      `);
    return result.rowsAffected[0] > 0;
  }
}

export default ReviewModel;
