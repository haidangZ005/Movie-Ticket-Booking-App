const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('[Error]:', err);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.errorCode, err.statusCode);
  }

  // Handle SyntaxError from express.json() (vd: body lỗi JSON format)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(res, 'Dữ liệu không hợp lệ (Bad JSON)', 'BAD_REQUEST_JSON', 400);
  }

  // Default server error
  return ApiResponse.error(res, 'Lỗi hệ thống Payment Gateway', 'INTERNAL_SERVER_ERROR', 500);
};

module.exports = errorHandler;
