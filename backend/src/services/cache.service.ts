import redisClient from '../config/redis';

const FEATURED_MOVIES_KEY = 'cache:featured:movies';
const FEATURED_MOVIES_TTL = 300; // 5 phút (theo AGENTS.md)

/**
 * Service quản lý cache Redis cho các dữ liệu dùng chung.
 * Hiện tại phụ trách cache danh sách phim nổi bật (TTL 5 phút).
 *
 * Pattern: Cache-Aside
 *   1. Đọc từ Redis → nếu có → trả về ngay (cache hit)
 *   2. Nếu không có → gọi DB → lưu vào Redis → trả về (cache miss)
 *   3. Nếu Redis down → bỏ qua cache, đọc thẳng DB (graceful degradation)
 */
export class CacheService {
  /**
   * Lấy danh sách phim nổi bật từ Redis cache.
   * @returns Mảng phim nếu cache hit, null nếu cache miss hoặc Redis lỗi
   */
  static async getFeaturedMovies(): Promise<any[] | null> {
    try {
      const cached = await redisClient.get(FEATURED_MOVIES_KEY);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch {
      // Redis không khả dụng → fallback DB, không throw
      return null;
    }
  }

  /**
   * Lưu danh sách phim nổi bật vào Redis cache (TTL 5 phút).
   * @param movies Mảng phim cần cache
   */
  static async setFeaturedMovies(movies: any[]): Promise<void> {
    try {
      await redisClient.setex(
        FEATURED_MOVIES_KEY,
        FEATURED_MOVIES_TTL,
        JSON.stringify(movies)
      );
    } catch {
      // Redis không khả dụng → bỏ qua, không throw
    }
  }

  /**
   * Xóa cache phim nổi bật.
   * Gọi khi Admin bật/tắt trạng thái "nổi bật" của phim
   * hoặc khi job refreshFeaturedCache chạy.
   */
  static async invalidateFeaturedMovies(): Promise<void> {
    try {
      await redisClient.del(FEATURED_MOVIES_KEY);
    } catch {
      // Redis không khả dụng → bỏ qua
    }
  }
}
