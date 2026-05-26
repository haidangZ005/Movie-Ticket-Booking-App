import apiClient from '../api/apiClient';

export interface PaymentHistoryItem {
  PaymentID: number;
  BookingID: number;
  VoucherID?: number | null;
  Amount: number;
  DiscountAmount: number;
  PaymentMethod: string;
  PaymentDate: string;
  PaymentStatus: string;
  RefundAmount?: number;
  RefundAt?: string | null;
  BookingStatus: string;
  TotalSeats: number;
  MovieTitle: string;
  CinemaName: string;
  HallName: string;
  ShowDate: string;
  ShowTime: string;
}

export interface PaymentHistoryDetail {
  summary: PaymentHistoryItem & { TotalAmount?: number };
  seats: Array<{
    BookingSeatID: number;
    SeatID: number;
    SeatNumber: string;
    SeatType: string;
    TicketPrice: number;
    Status: string;
  }>;
  products: Array<{
    BookingProductID: number;
    ProductID: number;
    ProductName: string;
    ProductCategory: string;
    ImageProduct?: string;
    Quantity: number;
    UnitPrice: number;
    Subtotal: number;
  }>;
  totals: {
    ticketTotal: number;
    productTotal: number;
    discountAmount: number;
    paidAmount: number;
  };
}

export const paymentHistoryService = {
  getHistory: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/customer/payment-history?page=${page}&limit=${limit}`);
    const data = response.data?.data ?? {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
      pagination: data.pagination,
    };
  },

  getDetail: async (bookingId: number): Promise<PaymentHistoryDetail> => {
    const response = await apiClient.get(`/customer/payment-history/${bookingId}`);
    return response.data?.data;
  },
};

export default paymentHistoryService;
