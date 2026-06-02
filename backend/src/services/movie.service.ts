import MovieModel from '../models/movie.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';
import { CacheService } from './cache.service';

interface MovieFilters {
  genre?: string;
  language?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  filters?: MovieFilters;
}

class MovieService {
  /**
   * Lấy danh sách phim có phân trang
   */
  static async getAll({ page = 1, limit = 20, filters = {} }: PaginationOptions) {
    const offset = (page - 1) * limit;
    return await MovieModel.findAll({ offset, limit, filters });
  }

  /**
   * Lấy danh sách phim nổi bật
   * Cache-Aside: đọc Redis trước (TTL 5 phút), miss thì query DB → set cache
   */
  static async getFeatured() {
    // 1. Thử đọc từ cache
    const cached = await CacheService.getFeaturedMovies();
    if (cached) return { movies: cached };

    // 2. Cache miss → query DB
    const result = await MovieModel.findFeatured();

    // 3. Lưu mảng phim vào cache (không await để không delay response)
    CacheService.setFeaturedMovies(result.movies);

    return result;
  }

  /**
   * Tìm kiếm phim theo từ khóa
   */
  static async search(query: string, { page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const offset = (page - 1) * limit;
    return await MovieModel.search(query, { offset, limit });
  }

  /**
   * Lấy chi tiết phim theo ID
   */
  static async getById(id: number) {
    const movie = await MovieModel.findById(id);
    if (!movie) {
      throw new AppException(ErrorCode.MOVIE_NOT_FOUND);
    }
    return movie;
  }

  /**
   * Thêm phim mới (Admin)
   */
  static async create(movieData: any) {
    this.validateMovieData(movieData);
    return await MovieModel.create(movieData);
  }

  /**
   * Cập nhật phim (Admin)
   */
  static async update(id: number, movieData: any) {
    await this.getById(id); // Kiểm tra tồn tại
    this.validateMovieData(movieData, false);
    return await MovieModel.update(id, movieData);
  }

  /**
   * Xóa mềm phim (Admin)
   */
  static async delete(id: number) {
    await this.getById(id); // Kiểm tra tồn tại
    await MovieModel.softDelete(id);
    return { MovieID: id };
  }

  /**
   * Bật/tắt phim nổi bật (Admin)
   * Invalidate cache sau khi thay đổi để lần sau lấy dữ liệu mới từ DB
   */
  static async toggleFeatured(id: number) {
    const result = await MovieModel.toggleFeatured(id);
    // Xóa cache để refresh lần sau
    await CacheService.invalidateFeaturedMovies();
    return result;
  }

  /**
   * Toggle like/unlike phim
   */
  static async toggleLike(movieId: number, customerId: number) {
    await this.getById(movieId); // Kiểm tra phim tồn tại
    return await MovieModel.toggleLike(movieId, customerId);
  }

  /**
   * Lấy trạng thái like của khách hàng
   */
  static async getLikeStatus(movieId: number, customerId: number) {
    return await MovieModel.getLikeStatus(movieId, customerId);
  }

  /**
   * Validate dữ liệu phim
   */
  private static validateMovieData(data: any, isCreate: boolean = true) {
    if (isCreate) {
      if (!data.title) throw this.createValidationError('Tên phim là bắt buộc', 'TITLE_REQUIRED');
      if (!data.genre) throw this.createValidationError('Thể loại là bắt buộc', 'GENRE_REQUIRED');
      if (!data.language) throw this.createValidationError('Ngôn ngữ là bắt buộc', 'LANGUAGE_REQUIRED');
      if (!data.runtime) throw this.createValidationError('Thời lượng là bắt buộc', 'RUNTIME_REQUIRED');
    }

    if (data.runtime && (isNaN(data.runtime) || data.runtime <= 0)) {
      throw this.createValidationError('Thời lượng phải là số dương', 'INVALID_RUNTIME');
    }

    if (data.rating && (isNaN(data.rating) || data.rating < 0 || data.rating > 10)) {
      throw this.createValidationError('Rating phải từ 0-10', 'INVALID_RATING');
    }
  }

  private static createValidationError(message: string, errorCode: string) {
    return new AppException({
      code: 4000,
      message: message,
      statusCode: 400
    });
  }
}

export default MovieService;
