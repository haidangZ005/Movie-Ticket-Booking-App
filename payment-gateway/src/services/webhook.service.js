const axios = require('axios');
const config = require('../config');
const { generateSignature } = require('../utils/hmac');

/**
 * Gửi Webhook callback về Main API kèm chữ ký HMAC
 * @param {Object} paymentResult Kết quả thanh toán
 * @param {string} paymentResult.orderId - Mã đơn hàng
 * @param {number} paymentResult.amount - Số tiền
 * @param {string} paymentResult.status - Trạng thái ('SUCCESS' | 'FAILED')
 * @param {string} [paymentResult.transactionId] - Mã giao dịch của đối tác (nếu có)
 */
const sendWebhookToMainApi = async (paymentResult) => {
  try {
    const payloadString = JSON.stringify(paymentResult);
    
    // Tự sinh chữ ký HMAC từ kết quả thanh toán
    const signature = generateSignature(payloadString);

    console.log(`[Webhook] Gửi kết quả thanh toán cho đơn hàng ${paymentResult.orderId}...`);

    // Gửi POST request sang Main API
    const response = await axios.post(config.mainApiWebhookUrl, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-signature': signature // Đính kèm chữ ký vào Header
      }
    });

    console.log('[Webhook] Main API đã nhận thành công:', response.data);
    return true;
  } catch (error) {
    console.error('[Webhook] Lỗi gửi Webhook về Main API:', error.message);
    // Trong thực tế sẽ cần cơ chế Retry (thử lại) nếu Main API bị sập tạm thời
    return false;
  }
};

module.exports = {
  sendWebhookToMainApi
};
