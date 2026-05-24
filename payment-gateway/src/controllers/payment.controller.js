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
 * POST /api/payment/credit-card
 * Xử lý thanh toán thẻ tín dụng (mock).
 * Chấp nhận: cardNumber, cvv, expiryDate. Nếu cardNumber kết thúc bằng "0000" thì mock thất bại.
 * Gửi webhook kết quả về Main API bất đồng bộ.
 */
const processCreditCard = async (req, res, next) => {
  try {
    const { orderId, amount, cardNumber, cvv, expiryDate } = req.body;

    if (!orderId || !amount || !cardNumber || !cvv || !expiryDate) {
      throw AppError.badRequest('Thiếu thông tin thanh toán thẻ', 'BAD_REQUEST');
    }

    // Giả lập xử lý thanh toán mất 2 giây
    setTimeout(async () => {
      // Mock logic: đuôi 0000 là thanh toán thất bại
      const isSuccess = !cardNumber.endsWith('0000');
      const status = isSuccess ? 'SUCCESS' : 'FAILED';

      const webhookPayload = {
        orderId: orderId.toString(),
        amount,
        status,
        transactionId: `TXN-${Date.now()}`
      };

      // Gọi webhook về Main API
      await sendWebhookToMainApi(webhookPayload);
      console.log(`[Payment GW] Processed Credit Card for Order ${orderId}. Status: ${status}`);
    }, 2000);

    return ApiResponse.ok(res, {
      orderId,
      message: 'Đang xử lý thanh toán. Kết quả sẽ được gửi qua Webhook.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment/refund
 * Xử lý hoàn tiền (mock). Nhận orderId + amount, log lại và trả OK.
 * Chỉ được gọi từ Main API (có HMAC verify qua middleware).
 */
const processRefund = async (req, res, next) => {
  try {
    const { orderId, amount, action } = req.body;

    if (!orderId || !amount) {
      throw AppError.badRequest('Thiếu thông tin orderId hoặc amount', 'BAD_REQUEST');
    }

    console.log(`[Payment GW] 💸 REFUND Order #${orderId} — ${amount.toLocaleString('vi-VN')}đ — Action: ${action}`);

    return ApiResponse.ok(res, {
      orderId,
      refundAmount: amount,
      status: 'REFUNDED',
      refundedAt: new Date().toISOString(),
    }, 'Hoàn tiền thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQr,
  processCreditCard,
  processRefund,
};

