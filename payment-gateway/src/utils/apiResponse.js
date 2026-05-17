class ApiResponse {
  static ok(res, data, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  }

  static created(res, data, message = 'Tạo thành công') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message, errorCode, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: { code: errorCode }
    });
  }
}

module.exports = ApiResponse;
