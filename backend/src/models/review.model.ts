import * as mssql from 'mssql';
import { connectDB } from '../config/database';

export interface CreateReviewInput {
  movieId: number;
  customerId: number;
  rating: number;
  comment: string;
}

class ReviewModel {
  private static async refreshMovieRating(pool: mssql.ConnectionPool, movieId: number) {
    await pool.request()
      .input('MovieID', mssql.Int, movieId)
      .query(`
        UPDATE Movie
        SET Rating = (
          SELECT CAST(ISNULL(AVG(CAST(Rating AS DECIMAL(10, 2))), 0) AS DECIMAL(3, 1))
          FROM MovieReview
          WHERE MovieID = @MovieID
        )
        WHERE MovieID = @MovieID
      `);
  }

  static async create(data: CreateReviewInput) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('MovieID', mssql.Int, data.movieId)
      .input('CustomerID', mssql.Int, data.customerId)
      .input('Rating', mssql.Decimal(2, 1), data.rating)
      .input('Comment', mssql.NVarChar(1000), data.comment)
      .query(`
        DECLARE @InsertedReview TABLE (ReviewID INT);

        INSERT INTO MovieReview (MovieID, CustomerID, Rating, Comment, CreatedAt, UpdatedAt)
        OUTPUT inserted.ReviewID INTO @InsertedReview
        VALUES (@MovieID, @CustomerID, @Rating, @Comment, GETDATE(), GETDATE());

        SELECT r.*, c.FullName, c.AvatarUrl
        FROM MovieReview r
        INNER JOIN Customer c ON r.CustomerID = c.CustomerID
        INNER JOIN @InsertedReview ir ON ir.ReviewID = r.ReviewID;
      `);

    await this.refreshMovieRating(pool, data.movieId);
    return result.recordset[0];
  }

  static async findByMovieId(movieId: number, page: number = 1, limit: number = 20) {
    const pool = await connectDB();
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const offset = (safePage - 1) * safeLimit;

    const reviewsResult = await pool.request()
      .input('MovieID', mssql.Int, movieId)
      .input('Offset', mssql.Int, offset)
      .input('Limit', mssql.Int, safeLimit)
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
        ORDER BY r.CreatedAt DESC, r.ReviewID DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    const summaryResult = await pool.request()
      .input('MovieID', mssql.Int, movieId)
      .query(`
        SELECT
          COUNT(*) AS Total,
          CAST(ISNULL(AVG(CAST(Rating AS DECIMAL(10, 2))), 0) AS DECIMAL(3, 1)) AS AverageRating
        FROM MovieReview
        WHERE MovieID = @MovieID
      `);

    const total = summaryResult.recordset[0]?.Total ?? 0;
    return {
      items: reviewsResult.recordset,
      summary: {
        total,
        averageRating: Number(summaryResult.recordset[0]?.AverageRating ?? 0),
      },
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  static async delete(reviewId: number, customerId: number) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('ReviewID', mssql.Int, reviewId)
      .input('CustomerID', mssql.Int, customerId)
      .query(`
        DECLARE @DeletedMovie TABLE (MovieID INT);

        DELETE FROM MovieReview
        OUTPUT deleted.MovieID INTO @DeletedMovie
        WHERE ReviewID = @ReviewID AND CustomerID = @CustomerID

        SELECT TOP 1 MovieID FROM @DeletedMovie;
      `);

    const deleted = result.rowsAffected[0] > 0;
    const movieId = result.recordset[0]?.MovieID;
    if (deleted && movieId) {
      await this.refreshMovieRating(pool, movieId);
    }
    return deleted;
  }
}

export default ReviewModel;
