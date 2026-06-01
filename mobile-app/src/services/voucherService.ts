import apiClient from '../api/apiClient';

export interface Voucher {
  VoucherID: number;
  Code: string;
  DiscountType: 'PERCENT' | 'FIXED';
  DiscountValue: number;
  MaxDiscount?: number;
  StartDate: string;
  EndDate: string;
  IsActive: boolean;
  UsageLimit?: number | null;
  UsageCount?: number | null;
  MinTicketQty?: number | null;
  MinOrderValue?: number | null;
  ApplicableFormat?: string | null;
  AssignedAt?: string;
  discountAmount?: number;
  finalAmount?: number;
}

export interface ApplyVoucherResult {
  voucherId: number;
  voucherCode: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}

export interface SuggestVoucherResult {
  voucher: Voucher;
  discountAmount: number;
  finalAmount: number;
}

export interface CheckoutVoucher extends Voucher {
  HasUsed: boolean;
  isApplicable: boolean;
  reasonCode: string | null;
  reasonText: string | null;
  discountAmount: number;
  finalAmount: number;
}

export const voucherService = {
  getAvailableVouchers: async (params: {
    totalAmount: number;
    totalSeats: number;
    showFormat: string;
  }): Promise<Voucher[]> => {
    const response = await apiClient.get('/vouchers', { params });
    return response.data.data ?? [];
  },

  getPublicVouchers: async (): Promise<Voucher[]> => {
    const response = await apiClient.get('/vouchers/public');
    return response.data.data ?? [];
  },

  applyVoucher: async (params: {
    voucherId: number;
    totalAmount: number;
    totalSeats: number;
    showFormat: string;
    bookingId?: number;
  }): Promise<ApplyVoucherResult> => {
    const response = await apiClient.post('/vouchers/apply', {
      voucherId: params.voucherId,
      totalAmount: params.totalAmount,
      totalSeats: params.totalSeats,
      showFormat: params.showFormat,
      bookingId: params.bookingId,
    });
    return response.data.data;
  },

  suggestBestVoucher: async (params: {
    totalAmount: number;
    totalSeats: number;
    showFormat: string;
  }): Promise<SuggestVoucherResult | null> => {
    const response = await apiClient.get('/vouchers/suggest', { params });
    return response.data.data;
  },

  getMyVouchers: async (): Promise<Voucher[]> => {
    const response = await apiClient.get('/customer/vouchers');
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(response.data)) return response.data;
    return [];
  },

  getCheckoutVouchers: async (params: {
    totalAmount: number;
    totalSeats: number;
    showFormat: string;
  }): Promise<CheckoutVoucher[]> => {
    const response = await apiClient.get('/vouchers/checkout', { params });
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },
};
