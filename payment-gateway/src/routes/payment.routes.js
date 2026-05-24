const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const verifyHmac = require('../middlewares/hmac.middleware');

// POST /api/payment/create-qr — Sinh mã QR thanh toán (yêu cầu HMAC từ Main API)
router.post('/create-qr', verifyHmac, paymentController.createQr);

// POST /api/payment/credit-card — Xử lý thanh toán thẻ tín dụng (yêu cầu HMAC)
router.post('/credit-card', verifyHmac, paymentController.processCreditCard);

// POST /api/payment/refund — Xử lý hoàn tiền (yêu cầu HMAC)
router.post('/refund', verifyHmac, paymentController.processRefund);

module.exports = router;

