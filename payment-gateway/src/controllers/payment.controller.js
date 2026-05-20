const qrcode = require('qrcode');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const config = require('../config');
const { sendWebhookToMainApi } = require('../services/webhook.service');

/**
 * POST /api/payment/create-qr
 * Sinh mã QR thanh toán động. Payload QR chứa orderId, amount và TTL.
 * Chỉ được gọi từ Main API (có HMAC verify qua middleware).
 */
const createQr = async (req, res, next) => {
  try {
    const { orderId, amount, currency } = req.body;

    if (!orderId || !amount) {
      throw AppError.badRequest('Thiếu thông tin orderId hoặc amount', 'BAD_REQUEST');
    }

    const qrPayload = JSON.stringify({
      orderId,
      amount,
      currency: currency || 'VND',
      ttl: config.qrTtlSeconds,
      issuedAt: Date.now(),
    });

    const qrImage = await qrcode.toDataURL(qrPayload);

    return ApiResponse.created(res, {
      orderId,
      qrImage,
      ttl: config.qrTtlSeconds,
    }, 'Tạo mã QR thanh toán thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment/mock-pay
 * Mô phỏng kết quả thanh toán từ nhà cung cấp (dùng trong môi trường dev/staging).
 * Gửi webhook callback về Main API sau khi nhận kết quả.
 */
const mockPay = async (req, res, next) => {
  try {
    const { orderId, amount, status = 'SUCCESS' } = req.body;

    if (!orderId || !amount) {
      throw AppError.badRequest('Thiếu thông tin orderId hoặc amount', 'BAD_REQUEST');
    }

    const paymentResult = {
      orderId,
      amount,
      status,
      transactionId: `TXN_${Date.now()}`,
    };

    const webhookSent = await sendWebhookToMainApi(paymentResult);

    if (!webhookSent) {
      throw AppError.internal('Gửi webhook về Main API thất bại', 'WEBHOOK_FAILED');
    }

    return ApiResponse.ok(res, paymentResult, 'Xử lý thanh toán thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQr,
  mockPay,
};

