const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const verifyHmac = require('../middlewares/hmac.middleware');

// Route test tạo QR tĩnh (yêu cầu HMAC từ Main API)
// Middleware verifyHmac sẽ kiểm tra header 'x-hmac-signature'
router.post('/create-qr', verifyHmac, paymentController.createQr);

// Route giả lập khách hàng quét QR thành công (Không yêu cầu HMAC vì là API test)
router.post('/mock-pay', paymentController.mockPay);

module.exports = router;
