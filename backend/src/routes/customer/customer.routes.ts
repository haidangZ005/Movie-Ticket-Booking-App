import { Router } from 'express';
import { CustomerController } from '../../controllers/customer/customer.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// Lấy thông tin Profile cá nhân
router.get('/profile', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.getProfile);

// Cập nhật thông tin Profile cá nhân
router.put('/profile', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.updateProfile);

// GET /api/customer/loyalty-points — Điểm tích lũy + lịch sử
router.get('/loyalty-points', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.getLoyaltyPoints);

// GET /api/customer/vouchers — Kho voucher cá nhân
router.get('/vouchers', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.getMyVouchers);

// POST /api/customer/redeem-voucher — Đổi điểm lấy voucher
router.post('/redeem-voucher', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.redeemPointsForVoucher);

router.get('/payment-history', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.getPaymentHistory);
router.get('/payment-history/:bookingId', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.getPaymentHistoryDetail);

export default router;
