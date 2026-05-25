import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/helpers/async.handler';
import * as SeatHoldService from '../../services/seat-hold.service';

export const holdSeats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const showId = Number(req.body.showId);
  const seatIds = Array.isArray(req.body.seatIds) ? req.body.seatIds.map(Number) : [];
  const customerId = Number(req.user?.customerId);

  const result = await SeatHoldService.holdSeats(showId, seatIds, customerId);

  return res.status(result.success ? 200 : 409).json({
    success: result.success,
    message: result.message || 'Giữ ghế thành công.',
    data: result,
  });
});

export const releaseSeats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const showId = Number(req.body.showId);
  const seatIds = Array.isArray(req.body.seatIds) ? req.body.seatIds.map(Number) : [];
  const customerId = Number(req.user?.customerId);

  const result = await SeatHoldService.releaseSeats(showId, seatIds, customerId);

  return res.status(200).json({
    success: true,
    message: 'Đã giải phóng ghế.',
    data: result,
  });
});
