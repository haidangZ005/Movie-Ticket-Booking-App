import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { generateSignature, verifySignature } from '../../utils/hmac';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { AppException } from '../../utils/exceptions/app.exception';

const PAYMENT_GW_URL = process.env.PAYMENT_GW_URL || 'http://localhost:4000/api/payment';

export const initPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: [AUTH] Yêu cầu user đăng nhập. Cần middleware Auth để lấy req.user.customerId
    // TODO: [BOOKING] Kiểm tra orderId có hợp lệ và thuộc về user này không (Phối hợp TV3)
    const { orderId, amount, currency } = req.body;

    const payloadData = {
      orderId,
      amount,
      currency: currency || 'VND'
    };

    const payloadString = JSON.stringify(payloadData);
    const signature = generateSignature(payloadString);

    const response = await axios.post(`${PAYMENT_GW_URL}/create-qr`, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-signature': signature
      }
    });

    res.status(200).json(ApiResponse.success(ResponseCode.PAYMENT_INIT_SUCCESS, response.data.data));
  } catch (error: unknown) {
    const err = error as any;
    console.error('Lỗi gọi Payment Gateway:', err?.response?.data || err?.message);
    next(new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['x-hmac-signature'] as string;

    if (!signature) {
      throw new AppException(ErrorCode.MISSING_HMAC_SIGNATURE);
    }

    const payloadString = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = verifySignature(payloadString, signature);
    
    if (!isValid) {
      throw new AppException(ErrorCode.INVALID_HMAC_SIGNATURE);
    }

    const paymentResult = req.body;
    
    console.log('✅ [Main API] Đã nhận và xác thực Webhook thành công:', paymentResult);
    
    res.status(200).json(ApiResponse.success(ResponseCode.WEBHOOK_PROCESSED_SUCCESS));
  } catch (error) {
    next(error);
  }
};
