import { Response } from 'express';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { NotificationModel } from '../../models/notification.model';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

// GET /api/notifications?page=&limit=
// Lấy danh sách thông báo của customer (mới nhất trước, phân trang)
export const getUserNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { notifications, total } = await NotificationModel.findByCustomerId(customerId, page, limit);

  return res.status(200).json(ApiResponse.paginate(ResponseCode.SUCCESS, notifications, { page, limit, total }));
});

// PUT /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc
export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const notificationId = parseInt(req.params.id);

  const updated = await NotificationModel.markAsRead(notificationId, customerId);
  if (!updated) throw new AppException(ErrorCode.DATA_NOT_FOUND);

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, null));
});

// PUT /api/notifications/read-all — Đánh dấu tất cả đã đọc
export const markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const count = await NotificationModel.markAllAsRead(customerId);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, { updated: count }));
});

// GET /api/notifications/unread-count — Số thông báo chưa đọc (badge count)
export const getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const count = await NotificationModel.getUnreadCount(customerId);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, { unreadCount: count }));
});

