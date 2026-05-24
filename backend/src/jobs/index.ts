import cron from 'node-cron';
import { reminderNotificationJob } from './reminderNotification.job';
import { autoIssueVouchersJob } from './autoIssueVouchers.job';
import { refreshFeaturedCacheJob } from './refreshFeaturedCache.job';
import { releaseExpiredSeatsJob } from './releaseExpiredSeats.job';

/**
 * Đăng ký tất cả cron jobs vào server.
 * Gọi trong server.ts sau khi kết nối DB thành công.
 *
 * Schedule:
 *  - releaseExpiredSeats      : mỗi 1 phút       (*/1 * * * *)
 *  - reminderNotification    : mỗi 5 phút       (*/5 * * * *)
 *  - cleanupExpiredBookings   : mỗi 10 phút      (*/10 * * * *) — gộp vào releaseExpiredSeats
 *  - refreshFeaturedCache    : mỗi 5 phút       (*/5 * * * *)
 *  - autoIssueVouchers       : mỗi ngày 00:00   (0 0 * * *)
 */
export function registerJobs(): void {
  // =============================================
  // releaseExpiredSeats — mỗi 1 phút
  // =============================================
  cron.schedule('*/1 * * * *', async () => {
    try {
      await releaseExpiredSeatsJob();
    } catch (err) {
      console.error('[Cron] releaseExpiredSeats error:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });
  console.log('[📋 Jobs] registered: releaseExpiredSeats (*/1 * * * *)');

  // =============================================
  // reminderNotification — mỗi 5 phút
  // =============================================
  cron.schedule('*/5 * * * *', async () => {
    try {
      await reminderNotificationJob();
    } catch (err) {
      console.error('[Cron] reminderNotification error:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });
  console.log('[📋 Jobs] registered: reminderNotification (*/5 * * * *)');

  // =============================================
  // refreshFeaturedCache — mỗi 5 phút
  // =============================================
  cron.schedule('*/5 * * * *', async () => {
    try {
      await refreshFeaturedCacheJob();
    } catch (err) {
      console.error('[Cron] refreshFeaturedCache error:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });
  console.log('[📋 Jobs] registered: refreshFeaturedCache (*/5 * * * *)');

  // =============================================
  // autoIssueVouchers — mỗi ngày lúc 00:00
  // =============================================
  cron.schedule('0 0 * * *', async () => {
    try {
      await autoIssueVouchersJob();
    } catch (err) {
      console.error('[Cron] autoIssueVouchers error:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });
  console.log('[📋 Jobs] registered: autoIssueVouchers (0 0 * * *)');

  console.log('[📋 Jobs] Tất cả cron jobs đã được đăng ký thành công!');
}
