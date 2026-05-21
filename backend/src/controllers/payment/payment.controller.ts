import { Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { generateSignature, verifySignature } from '../../utils/hmac';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { AppException } from '../../utils/exceptions/app.exception';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { PaymentModel } from '../../models/payment.model';

const PAYMENT_GW_URL = process.env.PAYMENT_GW_URL || 'http://localhost:4000/api/payment';

/**
 * POST /api/payments/:bookingId/pay
 * Khởi tạo thanh toán:
 *  1. Tạo bản ghi Payment (CREATED) trong DB
 *  2. Gọi Payment Gateway sinh mã QR (kèm HMAC)
 *  3. Trả QR về cho client
 */
export const initPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = parseInt(req.params.bookingId);
  const { amount, currency, method, voucherId, discountAmount } = req.body;

  // 1. Tạo Payment record trong DB (trạng thái CREATED)
  await PaymentModel.create({
    bookingId,
    amount,
    method: method || 'QR_MOMO',
    voucherId: voucherId ?? undefined,
    discountAmount: discountAmount ?? 0,
  });

  // 2. Gọi Payment Gateway → sinh mã QR (kèm HMAC)
  const payloadData = {
    orderId: bookingId,
    amount,
    currency: currency || 'VND',
    method: method || 'QR',
  };
  const payloadString = JSON.stringify(payloadData);
  const signature = generateSignature(payloadString);

  const gwResponse = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadString, {
    headers: {
      'Content-Type': 'application/json',
      'x-hmac-signature': signature,
    },
  });

  // 3. Cập nhật Payment → PENDING_PAYMENT
  await PaymentModel.updateStatus(bookingId, 'PENDING_PAYMENT');

  res.status(200).json(ApiResponse.success(ResponseCode.PAYMENT_INIT_SUCCESS, gwResponse.data.data));
});

/**
 * POST /api/payments/webhook
 * Nhận kết quả thanh toán từ Payment Gateway qua HMAC-signed callback.
 * Không yêu cầu JWT — bảo vệ bằng HMAC.
 * State machine: PROCESSING → SUCCESS | FAILED
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

  if (status === 'SUCCESS') {
    await PaymentModel.updateStatus(bookingId, 'SUCCESS');
    // TODO (Buổi 5): cộng LoyaltyPoints + gửi email vé + Push FCM
  } else if (status === 'FAILED') {
    await PaymentModel.updateStatus(bookingId, 'FAILED');
    // TODO (Buổi 5): release Redis seat lock + broadcast WebSocket ghế → AVAILABLE
  }

  res.status(200).json(ApiResponse.success(ResponseCode.WEBHOOK_PROCESSED_SUCCESS));
});


