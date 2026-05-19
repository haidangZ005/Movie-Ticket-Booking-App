const crypto = require('crypto');
const config = require('../config');

/**
 * Tạo chữ ký HMAC SHA256 cho payload
 * @param {Object|String} payload Dữ liệu cần ký
 * @returns {String} Chữ ký dạng hex
 */
const generateSignature = (payload) => {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', config.hmacSecret).update(data).digest('hex');
};

/**
 * Xác thực chữ ký HMAC
 * @param {Object|String} payload Dữ liệu nhận được
 * @param {String} signature Chữ ký đính kèm
 * @returns {Boolean} Hợp lệ hay không
 */
const verifySignature = (payload, signature) => {
  const expectedSignature = generateSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

module.exports = {
  generateSignature,
  verifySignature
};
