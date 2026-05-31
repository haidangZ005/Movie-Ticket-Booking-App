import apiClient from '../api/apiClient';

export interface LoyaltyHistoryItem {
  HistoryID: number;
  Points: number;
  Type: 'EARNED' | 'REVOKED';
  Description: string;
  CreatedAt: string;
  BookingID?: number;
}

export interface LoyaltyPointsResponse {
  currentPoints: number;
  history: LoyaltyHistoryItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const loyaltyService = {
  getPoints: async (): Promise<{ currentPoints: number }> => {
    const response = await apiClient.get('/customer/loyalty-points');
    return response.data?.data ?? { currentPoints: 0 };
  },

  getPointsHistory: async (page: number = 1, limit: number = 20): Promise<LoyaltyPointsResponse> => {
    const response = await apiClient.get(`/customer/loyalty-points?page=${page}&limit=${limit}`);
    const data = response.data?.data ?? {};
    return {
      currentPoints: Number(data.currentPoints) || 0,
      history: Array.isArray(data.history) ? data.history : [],
      pagination: data.pagination,
    };
  },

  redeemPointsForVoucher: async (pointCost: number): Promise<{
    voucherCode: string;
    discountPercent: number;
    expiresAt: string;
  }> => {
    const response = await apiClient.post('/customer/redeem-voucher', { pointCost });
    return response.data?.data;
  },
};
