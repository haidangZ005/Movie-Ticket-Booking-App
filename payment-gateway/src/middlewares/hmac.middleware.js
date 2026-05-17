const { verifySignature } = require('../utils/hmac');
const AppError = require('../utils/appError');

const verifyHmac = (req, res, next) => {
  try {
    const signature = req.headers['x-hmac-signature'];

    if (!signature) {
      throw AppError.unauthorized('Thiếu chữ ký HMAC', 'MISSING_HMAC_SIGNATURE');
    }

    // Express tự động parse body thành JSON nếu dùng express.json()
    // Để verify chuẩn xác, ta cần dùng raw body (chuỗi gốc gửi lên)
    // Tuy nhiên, để đơn giản trong phiên bản này, ta tái tạo lại chuỗi JSON
    // Trong thực tế, nên dùng middleware lấy raw body: express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })
    const payload = req.rawBody || JSON.stringify(req.body);

    const isValid = verifySignature(payload, signature);
    
    if (!isValid) {
      throw AppError.unauthorized('Chữ ký HMAC không hợp lệ', 'INVALID_HMAC_SIGNATURE');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verifyHmac;
