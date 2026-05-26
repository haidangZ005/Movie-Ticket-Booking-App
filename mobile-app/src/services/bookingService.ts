import apiClient from '../api/apiClient';

export const bookingService = {
  createBooking: async (payload: {
    showId: number;
    seatIds: number[];
    totalAmount: number;
    products?: Array<{ productId: number; quantity: number; price: number }>;
  }) => {
    const response = await apiClient.post('/bookings', payload);
    return response.data.data;
  },

  holdSeats: async (showId: number, seatIds: number[]) => {
    const response = await apiClient.post('/bookings/hold-seats', {
      showId,
      seatIds,
    });
    return response.data;
  },

  releaseSeats: async (showId: number, seatIds: number[]) => {
    const response = await apiClient.post('/bookings/release-seats', {
      showId,
      seatIds,
    });
    return response.data;
  },
};

export default bookingService;
