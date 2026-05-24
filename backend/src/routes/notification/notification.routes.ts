import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../../controllers/notification/notification.controller';

const router = Router();

// Tất cả notification routes yêu cầu đăng nhập
router.use(authMiddleware);

// GET  /api/notifications?page=&limit= — Danh sách thông báo (phân trang)
router.get('/', getUserNotifications);

// GET  /api/notifications/unread-count — Số thông báo chưa đọc (badge)
router.get('/unread-count', getUnreadCount);

// PUT  /api/notifications/read-all — Đánh dấu tất cả đã đọc
router.put('/read-all', markAllAsRead);

// PUT  /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc
router.put('/:id/read', markAsRead);

export default router;
