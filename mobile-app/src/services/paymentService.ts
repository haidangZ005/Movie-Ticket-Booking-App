import apiClient from '../api/apiClient';

export interface InitPaymentPayload {
  bookingId: number;
  amount: number;
  currency?: string;
  method: string;
  voucherId?: number;
  discountAmount?: number;
}

export interface InitPaymentResponse {
  qrUrl?: string;
  qrCodeUrl?: string;
  qrData?: string;
  paymentUrl?: string;
  orderId: number;
  message?: string;
  expiresAt?: string;
}

export interface PaymentResultParams {
  bookingId: number;
  amount: number;
  method: string;
  paymentData?: InitPaymentResponse;
}

export const paymentService = {
  initPayment: async (payload: InitPaymentPayload): Promise<InitPaymentResponse> => {
    const response = await apiClient.post(`/payments/${payload.bookingId}/pay`, {
      amount: payload.amount,
      currency: payload.currency ?? 'VND',
      method: payload.method,
      voucherId: payload.voucherId,
      discountAmount: payload.discountAmount,
    });
    return response.data.data;
  },

  retryPayment: async (bookingId: number, amount: number, method: string): Promise<InitPaymentResponse> => {
    const response = await apiClient.post(`/payments/${bookingId}/retry`, {
      amount,
      method,
    });
    return response.data.data;
  },

  checkPaymentStatus: async (bookingId: number): Promise<any> => {
    const response = await apiClient.get(`/payments/${bookingId}/status`);
    return response.data.data;
  },
};
