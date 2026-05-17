import { Router } from 'express';
import * as movieController from '../../controllers/movie/movie.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// ===============================
// PUBLIC ROUTES (không cần đăng nhập)
// ===============================

// GET /api/movies — Danh sách phim (phân trang)
router.get('/', movieController.getMovies);

// GET /api/movies/featured — Danh sách phim nổi bật
router.get('/featured', movieController.getFeaturedMovies);

// GET /api/movies/search — Tìm kiếm phim
router.get('/search', movieController.searchMovies);

// GET /api/movies/:id — Chi tiết phim
router.get('/:id', movieController.getMovieById);


// ===============================
// CUSTOMER ROUTES (cần đăng nhập)
// ===============================

// POST /api/movies/:id/like — Thích phim
router.post('/:id/like', authMiddleware, movieController.likeMovie);

// DELETE /api/movies/:id/like — Bỏ thích phim
router.delete('/:id/like', authMiddleware, movieController.likeMovie);

export default router;
