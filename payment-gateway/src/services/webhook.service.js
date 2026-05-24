const axios = require('axios');
const config = require('../config');
const { generateSignature } = require('../utils/hmac');

/**
 * Gửi Webhook callback về Main API kèm chữ ký HMAC.
 * @param {Object} paymentResult Kết quả thanh toán
 * @param {string} paymentResult.orderId - Mã đơn hàng
 * @param {number} paymentResult.amount - Số tiền
 * @param {string} paymentResult.status - Trạng thái ('SUCCESS' | 'FAILED')
 * @param {string} [paymentResult.transactionId] - Mã giao dịch của đối tác
 * @returns {Promise<boolean>} true nếu Main API nhận thành công
 */
const sendWebhookToMainApi = async (paymentResult) => {
  const payloadString = JSON.stringify(paymentResult);
  const signature = generateSignature(payloadString);

  try {
    await axios.post(config.mainApiWebhookUrl, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-signature': signature,
      },
    });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Webhook] Lỗi gửi về Main API:', error.message);
    }
    return false;
  }
};

module.exports = {
  sendWebhookToMainApi,
};

