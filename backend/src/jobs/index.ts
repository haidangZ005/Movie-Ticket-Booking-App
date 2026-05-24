import { startRefreshFeaturedCacheJob } from './refreshFeaturedCache';

/**
 * Khởi chạy toàn bộ Background Jobs.
 * Gọi hàm này 1 lần trong server.ts sau khi kết nối DB thành công.
 *
 * Danh sách jobs:
 *   - refreshFeaturedCache (TV2): Cập nhật cache phim nổi bật mỗi 5 phút
 *   - releaseExpiredSeats  (TV3): TODO — Mỗi 1 phút quét booking hết hạn, nhả ghế
 *   - reminderNotification (TV4): TODO — Mỗi 5 phút gửi push nhắc lịch 30p trước chiếu
 */
export const startAllJobs = (): void => {
  console.log('[⚙️ Jobs]  Đang đăng ký các Background Jobs...');

  // TV2: Cache phim nổi bật
  startRefreshFeaturedCacheJob();

  // TV3: Nhả ghế hết hạn (uncomment khi TV3 hoàn thành)
  // startReleaseExpiredSeatsJob();

  // TV4: Nhắc lịch chiếu (uncomment khi TV4 hoàn thành)
  // startReminderNotificationJob();

  console.log('[⚙️ Jobs]  Tất cả Background Jobs đã sẵn sàng');
};

export default { startAllJobs };
