import { Response } from 'express';
import BookingService from '../../services/booking.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';

export const getMyBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const bookings = await BookingService.getMyBookings(customerId);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, bookings));
});
