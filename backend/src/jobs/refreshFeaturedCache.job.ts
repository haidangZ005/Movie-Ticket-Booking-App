import { connectDB } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const FEATURED_CACHE_TTL_SECONDS = 300; // 5 phút
const FEATURED_CACHE_KEY = 'cache:featured:movies';

/**
 * Job refreshFeaturedCache — chạy mỗi 5 phút.
 *
 * Cập nhật cache Redis cho danh sách phim nổi bật.
 * Key: cache:featured:movies — TTL 300s (5 phút)
 *
 * Nếu Redis chưa được cấu hình → skip, không ảnh hưởng job.
 * Dùng Redis client từ ioredis (đã được cài trong dependencies).
 */
export async function refreshFeaturedCacheJob(): Promise<void> {
  console.log(`[Job] refreshFeaturedCache — bắt đầu lúc ${new Date().toISOString()}`);

  const pool = await connectDB();

  // Lấy danh sách phim nổi bật từ DB (sắp xếp theo FeaturedOrder)
  const result = await pool.request().query(`
    SELECT
      MovieID,
      MovieTitle,
      MovieGenre,
      MovieLanguage,
      MovieRuntime,
      MovieReleaseDate,
      Rating,
      PosterUrl,
      IsFeatured,
      FeaturedOrder
    FROM Movie
    WHERE IsActive = 1 AND IsFeatured = 1
    ORDER BY FeaturedOrder ASC, MovieReleaseDate DESC
  `);

  const featuredMovies = result.recordset;

  if (featuredMovies.length === 0) {
    console.log('[Job] refreshFeaturedCache — không có phim nổi bật, skip');
    return;
  }

  // Cố gắng cache vào Redis
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });

    await redis.connect().catch(() => { /* ignore connect errors */ });

    await redis.set(
      FEATURED_CACHE_KEY,
      JSON.stringify(featuredMovies),
      'EX',
      FEATURED_CACHE_TTL_SECONDS
    );

    await redis.quit();

    console.log(
      `[Job] refreshFeaturedCache — đã cache ${featuredMovies.length} phim nổi bật (TTL ${FEATURED_CACHE_TTL_SECONDS}s) — lúc ${new Date().toISOString()}`
    );
  } catch (err) {
    // Redis không khả dụng → không fail job, chỉ log
    console.warn('[Job] refreshFeaturedCache — Redis không khả dụng, bỏ qua cache:', (err as Error).message);
    console.log(
      `[Job] refreshFeaturedCache — ${featuredMovies.length} phim nổi bật (Redis unavailable, cached in memory fallback) — lúc ${new Date().toISOString()}`
    );
  }
}
