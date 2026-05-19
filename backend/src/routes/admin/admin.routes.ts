import { Router } from 'express';
import { AdminController } from '../../controllers/admin/admin.controller';
import * as movieController from '../../controllers/movie/movie.controller';
import * as cinemaController from '../../controllers/cinema/cinema.controller';
import * as showController from '../../controllers/show/show.controller';
import * as productController from '../../controllers/product/product.controller';
import * as voucherController from '../../controllers/voucher/voucher.controller';
import { CustomerController } from '../../controllers/customer/customer.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { uploadMoviePoster } from '../../middlewares/upload.middleware';
import * as seatLayoutController from '../../controllers/admin/seat-layout.controller';

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
router.post('/uploads/movie-poster', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), uploadMoviePoster.single('poster'), movieController.uploadMoviePoster);

// === Quản lý Rạp & Phòng chiếu (M1) ===
router.post('/cinemas', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.createCinema);
router.put('/cinemas/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.updateCinema);
router.delete('/cinemas/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.deleteCinema);
router.post('/cinemas/:id/halls', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.createHall);
router.put('/halls/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.updateHall);
router.delete('/halls/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), cinemaController.deleteHall);

// === Quản lý Suất chiếu (M1) ===
router.get('/shows', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.getAdminShows);
router.post('/shows', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.createShow);
router.put('/shows/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.updateShow);
router.delete('/shows/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), showController.deleteShow);

// === Quản lý Sản phẩm / Combo (Mới) ===
router.get('/products', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productController.getAllProducts);
router.get('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productController.getProductById);
router.post('/products', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productController.createProduct);
router.put('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productController.updateProduct);
router.delete('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), productController.deleteProduct);

// === Quản lý Khuyến mãi / Voucher (Mới) ===
router.get('/vouchers', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), voucherController.getAllVouchers);
router.get('/vouchers/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), voucherController.getVoucherById);
router.post('/vouchers', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), voucherController.createVoucher);
router.put('/vouchers/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), voucherController.updateVoucher);
router.delete('/vouchers/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), voucherController.deleteVoucher);

// === Thống kê & Báo cáo (M8) ===
router.get('/stats/revenue', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getStats);
router.get('/stats/tickets', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getStats); // TODO: Tạo controller riêng
router.get('/stats/accounts', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getStats); // TODO: Tạo controller riêng

// === Nhật ký & Cài đặt (M8) ===
router.get('/audit-logs', authMiddleware, roleMiddleware(['SUPER_ADMIN']), AdminController.getAuditLogs);
router.get('/settings', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.getSettings);
// router.put('/settings', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), AdminController.updateSettings); // TODO: Tạo controller method

// === Quản lý tài khoản ===
router.get('/customers', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), CustomerController.adminGetCustomers);
router.get('/customers/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), CustomerController.adminGetCustomerById);
router.post('/customers', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), CustomerController.adminCreateCustomer);
router.put('/customers/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), CustomerController.adminUpdateCustomer);
router.delete('/customers/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), CustomerController.adminDeleteCustomer);
router.put('/customers/:id/status', authMiddleware, roleMiddleware(['ADMIN', 'SUPER_ADMIN']), CustomerController.adminSetCustomerStatus);
router.put('/accounts/:id/status', authMiddleware, roleMiddleware(['SUPER_ADMIN']), AdminController.patchAccountStatus);

// Ghế + rạp chiếu

router.get(
    '/halls/:hallId/seats',
    authMiddleware,
    roleMiddleware(['ADMIN', 'SUPER_ADMIN']),
    seatLayoutController.getHallSeatLayout
);

router.put(
    '/halls/:hallId/seats',
    authMiddleware,
    roleMiddleware(['ADMIN', 'SUPER_ADMIN']),
    seatLayoutController.updateHallSeatLayout
);

export default router;
