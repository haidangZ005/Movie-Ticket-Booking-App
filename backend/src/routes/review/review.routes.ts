import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  postReview,
  getMovieReviews,
  deleteReview,
} from '../../controllers/review/review.controller';

const router = Router();

// Lấy danh sách đánh giá của phim (Công khai - Guest cũng xem được)
// GET /api/reviews/movie/:movieId
router.get('/movie/:movieId', getMovieReviews);

// Đăng cảm nhận / Đánh giá phim (Yêu cầu đăng nhập)
// POST /api/reviews
router.post('/', authMiddleware, postReview);

// Xóa cảm nhận / Đánh giá phim (Yêu cầu đăng nhập)
// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', authMiddleware, deleteReview);

export default router;
