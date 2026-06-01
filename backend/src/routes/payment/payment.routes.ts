import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { initPayment, handleWebhook, retryPayment, checkPaymentStatus } from '../../controllers/payment/payment.controller';

const router = Router();

// POST /api/payments/:bookingId/pay — Khởi tạo thanh toán (yêu cầu đăng nhập)
router.post('/:bookingId/pay', authMiddleware, initPayment);

// POST /api/payments/:bookingId/retry — Thử lại thanh toán (yêu cầu đăng nhập)
router.post('/:bookingId/retry', authMiddleware, retryPayment);

// GET /api/payments/:bookingId/status — Kiểm tra trạng thái thanh toán
router.get('/:bookingId/status', authMiddleware, checkPaymentStatus);

// POST /api/payments/webhook — Nhận callback từ Payment Gateway (bảo vệ bằng HMAC)
router.post('/webhook', handleWebhook);

export default router;

