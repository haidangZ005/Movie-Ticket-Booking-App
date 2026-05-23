import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { verifySignature } from '../../utils/hmac';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { AppException } from '../../utils/exceptions/app.exception';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { PaymentService } from '../../services/payment.service';

/**
 * POST /api/payments/:bookingId/pay
 * Khởi tạo thanh toán: Gọi PaymentService
 */
export const initPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = parseInt(req.params.bookingId);
  const { amount, currency, method, voucherId, discountAmount } = req.body;

  const result = await PaymentService.initPayment(bookingId, amount, method, currency, voucherId, discountAmount);

  res.status(200).json(ApiResponse.success(ResponseCode.PAYMENT_INIT_SUCCESS, result));
});

/**
 * POST /api/payments/:bookingId/retry
 * Thử lại thanh toán: Gọi PaymentService
 */
export const retryPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = parseInt(req.params.bookingId);
  const { amount, method } = req.body;

  const result = await PaymentService.retryPayment(bookingId, amount, method);

  res.status(200).json(ApiResponse.success(ResponseCode.PAYMENT_INIT_SUCCESS, result));
});

/**
 * POST /api/payments/webhook
 * Nhận kết quả thanh toán từ Payment Gateway qua HMAC-signed callback.
 */
export const handleWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const signature = req.headers['x-hmac-signature'] as string;

  if (!signature) {
    throw new AppException(ErrorCode.MISSING_HMAC_SIGNATURE);
  }

  const payloadString = (req as any).rawBody || JSON.stringify(req.body);
  const isValid = verifySignature(payloadString, signature);

  if (!isValid) {
    throw new AppException(ErrorCode.INVALID_HMAC_SIGNATURE);
  }

  const { orderId, status } = req.body;
  const bookingId = parseInt(orderId);

  await PaymentService.handleWebhook(bookingId, status);

  res.status(200).json(ApiResponse.success(ResponseCode.WEBHOOK_PROCESSED_SUCCESS));
});



