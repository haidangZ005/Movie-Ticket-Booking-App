import { Router } from 'express';
import { AdminController } from '../../controllers/admin/admin.controller';
import * as movieController from '../../controllers/movie/movie.controller';
import * as cinemaController from '../../controllers/cinema/cinema.controller';
import * as showController from '../../controllers/show/show.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

/**
 * Admin Routes (TV5)
 * Prefix: /api/admin
 */

// === Quản lý Phim (M1) ===
router.post('/movies', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), movieController.createMovie);
router.put('/movies/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), movieController.updateMovie);
router.delete('/movies/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), movieController.deleteMovie);
router.put('/movies/:id/featured', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), movieController.toggleFeaturedMovie);

// === Quản lý Rạp & Phòng chiếu (M1) ===
router.post('/cinemas', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.createCinema);
router.put('/cinemas/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.updateCinema);
router.delete('/cinemas/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.deleteCinema);
// router.post('/cinemas/:id/halls', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.createHall);
// router.put('/cinemas/:id/halls', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.updateHallSeats);
// router.put('/halls/:id/seats', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.updateHallSeats);

// === Quản lý Suất chiếu (M1) ===
router.post('/shows', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.createShow);
router.put('/shows/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.updateShow);
router.delete('/shows/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.deleteShow);

// === Thống kê & Báo cáo (M8) ===
router.get('/stats/revenue', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getStats);
router.get('/stats/tickets', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getStats); // TODO: Tạo controller riêng
router.get('/stats/accounts', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getStats); // TODO: Tạo controller riêng

// === Nhật ký & Cài đặt (M8) ===
router.get('/audit-logs', authMiddleware, roleMiddleware(['SUPER_ADMIN']), AdminController.getAuditLogs);
router.get('/settings', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getSettings);
// router.put('/settings', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.updateSettings); // TODO: Tạo controller method

// === Quản lý tài khoản ===
router.put('/accounts/:id/status', authMiddleware, roleMiddleware(['SUPER_ADMIN']), AdminController.patchAccountStatus);

export default router;
