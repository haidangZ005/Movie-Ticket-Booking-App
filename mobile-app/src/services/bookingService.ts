import apiClient from '../api/apiClient';

export const bookingService = {
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
