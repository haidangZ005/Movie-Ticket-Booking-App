export type ErrorCodeType = {
  code: number;
  message: string;
  statusCode: number; // Dành riêng cho Express để định tuyến HTTP Status Code
};

/**
 * Tập hợp danh sách các Business Error Code (Thất bại)
 */
export const ErrorCode = {
  UNCATEGORIZED_EXCEPTION: { code: 9999, message: 'Uncategorized error', statusCode: 500 },
  USER_NOT_EXISTED: { code: 1000, message: 'User not existed', statusCode: 404 },
  USER_EXISTED: { code: 1001, message: 'User existed', statusCode: 400 },
  INVALID_OTP: { code: 1002, message: 'Invalid or expired OTP', statusCode: 400 },
  INVALID_DATA: { code: 1003, message: 'Invalid data', statusCode: 400 },
  UNVERIFIED_ACCOUNT: { code: 1004, message: 'Account is not verified', statusCode: 403 },
  INVALID_OLD_PASSWORD: { code: 1005, message: 'Invalid old password', statusCode: 400 },
  PHONE_NUMBER_EXISTED: { code: 1006, message: 'Phone number already in use', statusCode: 400 },
  TOO_MANY_REQUESTS: { code: 4290, message: 'Too many requests. Please try again later.', statusCode: 429 },
  UNAUTHENTICATED: { code: 3000, message: 'Unauthenticated', statusCode: 401 },
  FORBIDDEN: { code: 3001, message: 'Forbidden: You do not have permission', statusCode: 403 },
  RESET_OTP_NOT_VERIFIED: { code: 1007, message: 'Reset OTP verification expired. Please request a new OTP.', statusCode: 400 },
  ROUTE_NOT_FOUND: { code: 4040, message: 'Route not found', statusCode: 404 },
} as const;

export type ErrorCodeKeys = keyof typeof ErrorCode;
