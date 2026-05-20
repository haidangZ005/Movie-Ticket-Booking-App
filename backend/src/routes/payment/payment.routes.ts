import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { initPayment, handleWebhook } from '../../controllers/payment/payment.controller';

const router = Router();

// POST /api/payments/:bookingId/pay — Khởi tạo thanh toán (yêu cầu đăng nhập)
router.post('/:bookingId/pay', authMiddleware, initPayment);

// POST /api/payments/webhook — Nhận callback từ Payment Gateway (bảo vệ bằng HMAC)
router.post('/webhook', handleWebhook);

export default router;

