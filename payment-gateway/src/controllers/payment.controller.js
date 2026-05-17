const qrcode = require('qrcode');
const ApiResponse = require('../utils/apiResponse');
const config = require('../config');
const { sendWebhookToMainApi } = require('../services/webhook.service');


// Controller giả lập tạo mã QR động
const createQr = async (req, res, next) => {
  try {
    const { orderId, amount, currency } = req.body;

    // Giả lập nội dung mã QR thanh toán (chứa TTL đồng bộ Redis lock)
    const qrData = JSON.stringify({
      orderId,
      amount,
      currency: currency || 'VND',
      ttl: config.qrTtlSeconds,
      timestamp: Date.now()
    });

    // Tạo Base64 QR Image
    const qrImage = await qrcode.toDataURL(qrData);

    return ApiResponse.created(res, {
      orderId,
      qrImage,
      ttl: config.qrTtlSeconds
    }, 'Tạo mã QR thanh toán thành công');
  } catch (error) {
    next(error);
  }
};

// Controller giả lập hành động quét QR và thanh toán thành công
const mockPay = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return ApiResponse.error(res, 'Thiếu thông tin orderId hoặc amount', 'BAD_REQUEST', 400);
    }

    // Giả lập giao dịch thành công tại cổng thanh toán
    const mockResult = {
      orderId,
      amount,
      status: 'SUCCESS', // Hoặc 'FAILED' để test luồng lỗi
      transactionId: `MOCK_TXN_${Date.now()}`
    };

    // Bắn Webhook về Main API
    const webhookSuccess = await sendWebhookToMainApi(mockResult);

    if (webhookSuccess) {
      return ApiResponse.ok(res, mockResult, 'Thanh toán giả lập thành công và đã gửi Webhook');
    } else {
      return ApiResponse.error(res, 'Thanh toán thành công nhưng gửi Webhook thất bại', 'WEBHOOK_FAILED', 500);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQr,
  mockPay
};
