import { Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { generateSignature, verifySignature } from '../../utils/hmac';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { AppException } from '../../utils/exceptions/app.exception';
import { asyncHandler } from '../../utils/helpers/async.handler';

const PAYMENT_GW_URL = process.env.PAYMENT_GW_URL || 'http://localhost:4000/api/payment';

/**
 * POST /api/payments/:bookingId/pay
 * Khởi tạo thanh toán — gọi Payment Gateway để sinh mã QR hoặc xử lý thẻ.
 * Yêu cầu xác thực (authMiddleware) — chỉ customer của booking mới được gọi.
 */
export const initPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { amount, currency, method } = req.body;

  const payloadData = {
    orderId: bookingId,
    amount,
    currency: currency || 'VND',
    method: method || 'QR',
  };

  const payloadString = JSON.stringify(payloadData);
  const signature = generateSignature(payloadString);

  const response = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadString, {
    headers: {
      'Content-Type': 'application/json',
      'x-hmac-signature': signature,
    },
  });

  res.status(200).json(ApiResponse.success(ResponseCode.PAYMENT_INIT_SUCCESS, response.data.data));
});

/**
 * POST /api/payments/webhook
 * Nhận kết quả thanh toán từ Payment Gateway qua HMAC-signed callback.
 * Không yêu cầu JWT (endpoint công khai nhưng bảo vệ bằng HMAC).
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

  // TODO (TV4 - Buổi 5): Xử lý kết quả thanh toán
  // - SUCCESS: cập nhật Booking → CONFIRMED, ghế → BOOKED, cộng điểm, gửi email/push
  // - FAILED/EXPIRED: release Redis seat lock, ghế → AVAILABLE

  res.status(200).json(ApiResponse.success(ResponseCode.WEBHOOK_PROCESSED_SUCCESS));
});

