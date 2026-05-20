const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Payment GW Error]:', err.message);
  }

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.errorCode, err.statusCode);
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(res, 'Dữ liệu không hợp lệ', 'BAD_REQUEST_JSON', 400);
  }

  return ApiResponse.error(res, 'Lỗi hệ thống', 'INTERNAL_SERVER_ERROR', 500);
};

module.exports = errorHandler;

