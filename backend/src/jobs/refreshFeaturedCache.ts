import cron from 'node-cron';
import MovieModel from '../models/movie.model';
import { CacheService } from '../services/cache.service';

/**
 * Job: refreshFeaturedCache
 * 
 * Chạy mỗi 5 phút — Cập nhật lại cache danh sách phim nổi bật trên Redis.
 * 
 * Mục đích:
 *   - Đảm bảo cache Redis luôn sẵn sàng phục vụ API GET /movies/featured
 *   - Nếu cache bị miss (TTL hết) → job này sẽ "warm" lại cache tự động
 *   - Giảm tải cho DB vào giờ cao điểm (không phải query mỗi request)
 * 
 * Theo AGENTS.md (TV2 - Buổi 8):
 *   "Tạo job `refreshFeaturedCache` — cập nhật cache phim nổi bật mỗi 5p"
 */

let isRunning = false;

const refreshFeaturedCache = async (): Promise<void> => {
  // Guard: tránh chạy chồng nếu job trước chưa xong
  if (isRunning) {
    console.log('[📦 Job] refreshFeaturedCache: Bỏ qua — lần chạy trước chưa hoàn thành');
    return;
  }

  isRunning = true;

  try {
    // 1. Xóa cache cũ
    await CacheService.invalidateFeaturedMovies();

    // 2. Query DB lấy danh sách phim nổi bật mới nhất
    const result = await MovieModel.findFeatured();
    const movies = result.movies || [];

    // 3. Ghi vào Redis cache (TTL 5 phút do CacheService quản lý)
    if (movies.length > 0) {
      await CacheService.setFeaturedMovies(movies);
    }

    console.log(`[📦 Job] refreshFeaturedCache: Đã cập nhật ${movies.length} phim nổi bật vào cache`);
  } catch (error: any) {
    // Không throw — job phải fail-safe, lần sau chạy lại tự khắc phục
    console.error('[📦 Job] refreshFeaturedCache: Lỗi —', error.message || error);
  } finally {
    isRunning = false;
  }
};

/**
 * Đăng ký cron schedule.
 * Gọi hàm này 1 lần trong server.ts sau khi kết nối DB thành công.
 */
export const startRefreshFeaturedCacheJob = (): void => {
  // Cron expression: mỗi 5 phút (0, 5, 10, 15, ...)
  cron.schedule('*/5 * * * *', () => {
    refreshFeaturedCache();
  });

  console.log('[📦 Job] refreshFeaturedCache: Đã đăng ký — chạy mỗi 5 phút');

  // Chạy ngay lần đầu khi server khởi động (warm cache)
  refreshFeaturedCache();
};

export default { startRefreshFeaturedCacheJob };
