import { Request, Response, NextFunction } from 'express';
import { AppException } from './app.exception';
import { ErrorCode } from './error.code';
import { ApiResponse } from '../dto/api.response';

/**
 * Helper to recursively mask sensitive keys in request bodies
 */
const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  if (Array.isArray(body)) {
    return body.map(sanitizeBody);
  }
  
  const sanitized: any = {};
  const sensitiveKeys = ['password', 'newpassword', 'oldpassword', 'refreshtoken', 'accesstoken', 'otp'];
  
  for (const key of Object.keys(body)) {
    const value = body[key];
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.includes(lowerKey)) {
      sanitized[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Express Global Error Handling Middleware
 * (Lưu ý: Luôn add middleware này vào bước cuối cùng sau khi set up toàn bộ routes)
 */
export const globalExceptionHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Trường hợp ném lỗi nghiệp vụ chủ động: throw new AppException(ErrorCode.xxx)
  if (err instanceof AppException) {
    const errorConfig = err.errorCode;
    
    res.status(errorConfig.statusCode).json(ApiResponse.error(errorConfig));
    return;
  }

  // 2. Trường hợp lỗi server đứt gãy, chưa cấu hình, hoặc throw Error() mặc định
  console.error('[Uncategorized Error]:', err);
  
  // Log specific SQL Error info if available
  const sqlError = err as any;
  if (sqlError.number) {
    console.error(`[SQL Error] Number: ${sqlError.number}, State: ${sqlError.state}, Class: ${sqlError.class}`);
    if (sqlError.number === 1934) {
      console.error('[⚠️ SQL 1934] Lỗi thiết lập SET options (QUOTED_IDENTIFIER, ANSI_NULLS, etc.) khi làm việc với Filtered Index hoặc Trigger.');
    }
  }

  if (err.stack) {
    console.error(err.stack);
  }
  console.error('[Request Info]:', {
    method: req.method,
    url: req.url,
    body: sanitizeBody(req.body),
    user: (req as any).user
  });

  const defaultError = ErrorCode.UNCATEGORIZED_EXCEPTION;

  res.status(defaultError.statusCode).json(ApiResponse.error(defaultError));
};
