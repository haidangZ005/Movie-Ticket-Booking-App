import { Router } from 'express';
import { initPayment, handleWebhook } from '../../controllers/payment/payment.controller';

const router = Router();

// Test endpoint init payment (chưa có auth để test E2E dễ dàng qua Postman)
router.post('/:bookingId/pay', initPayment);

// Webhook endpoint nhận từ Payment Gateway
router.post('/webhook', handleWebhook);

export default router;
