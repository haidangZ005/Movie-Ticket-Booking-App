const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const verifyHmac = require('../middlewares/hmac.middleware');

// POST /api/payment/create-qr — Sinh mã QR thanh toán (yêu cầu HMAC từ Main API)
router.post('/create-qr', verifyHmac, paymentController.createQr);

module.exports = router;

