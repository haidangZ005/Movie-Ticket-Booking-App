require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || 'development',
  hmacSecret: process.env.HMAC_SECRET || 'default_secret',
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
  },
  mainApiWebhookUrl: process.env.MAIN_API_WEBHOOK_URL || 'http://localhost:3000/api/payments/webhook',
  qrTtlSeconds: parseInt(process.env.QR_TTL_SECONDS || '600', 10),
};
