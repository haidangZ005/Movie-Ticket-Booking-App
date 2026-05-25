import { Response } from 'express';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { AppException } from '../../utils/exceptions/app.exception';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import ReviewModel from '../../models/review.model';

export const postReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const { movieId, rating, comment } = req.body;

  if (!movieId || rating === undefined || !comment) {
    throw new AppException({
      code: 1003,
      message: 'Vui lòng cung cấp đầy đủ: movieId, rating và comment',
      statusCode: 400,
    });
  }

  const ratingNum = parseFloat(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new AppException({
      code: 1003,
      message: 'Điểm đánh giá rating phải nằm trong khoảng từ 1.0 đến 5.0',
      statusCode: 400,
    });
  }

  if (comment.trim().length === 0) {
    throw new AppException({
      code: 1003,
      message: 'Ý kiến đánh giá không được để trống',
      statusCode: 400,
    });
  }

  const review = await ReviewModel.upsert({
    movieId: Number(movieId),
    customerId,
    rating: ratingNum,
    comment: comment.trim(),
  });

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, review));
});

export const getMovieReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { movieId } = req.params;

  if (!movieId) {
    throw new AppException({
      code: 1003,
      message: 'Vui lòng cung cấp movieId',
      statusCode: 400,
    });
  }

  const reviews = await ReviewModel.findByMovieId(Number(movieId));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, reviews));
});

export const deleteReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const { reviewId } = req.params;

  if (!reviewId) {
    throw new AppException({
      code: 1003,
      message: 'Vui lòng cung cấp reviewId',
      statusCode: 400,
    });
  }

  const deleted = await ReviewModel.delete(Number(reviewId), customerId);
  if (!deleted) {
    throw new AppException({
      code: 1015,
      message: 'Không tìm thấy đánh giá của bạn hoặc bạn không có quyền xóa đánh giá này',
      statusCode: 404,
    });
  }

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, null));
});
