import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cấu hình khởi tạo và kết nối Redis Client sử dụng thư viện ioredis.
 * Đóng vai trò là In-Memory lưu trữ mã OTP, Blacklist JWT Token siêu tốc.
 */
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // lazyConnect = true để Redis không chặn ứng dụng nếu server dev chưa bật Redis
  lazyConnect: true,
  // Giới hạn retry để không treo request khi Redis chưa cài
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) {
      // Sau 3 lần thử, dừng reconnect (giảm spam log)
      return null;
    }
    return Math.min(times * 500, 3000);
  }
});

let redisErrorLogged = false;

redisClient.on('connect', () => {
  redisErrorLogged = false;
  console.log('[📦 Redis]   Kết nối thành công (Ready)');
});

redisClient.on('error', (err) => {
  if (!redisErrorLogged) {
    console.warn('[⚠️ Redis]   Chưa kết nối Redis — một số tính năng (OTP, blacklist token) sẽ không hoạt động.');
    redisErrorLogged = true;
  }
});

export default redisClient;

