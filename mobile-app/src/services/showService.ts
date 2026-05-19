import apiClient from '../api/apiClient';

export interface Seat {
  SeatID: number;
  SeatNumber: string;
  SeatType: 'STANDARD' | 'VIP' | 'COUPLE' | 'AISLE' | 'EMPTY';
  SeatPrice: number;
  PairID: number | null;
  RowIndex: number;
  ColIndex: number;
  IsAisle: boolean;
  Status: 'AVAILABLE' | 'HOLDING' | 'BOOKED' | 'CANCELLED';
}

export interface ShowInfo {
  ShowID: number;
  MovieTitle: string;
  CinemaName: string;
  HallName: string;
  ShowDate: string;
  ShowTime: string;
  EndTime: string;
  BasePrice: number;
}

export interface ShowSeatsResponse {
  success: boolean;
  data: {
    showInfo: ShowInfo;
    seats: Seat[];
  };
}

const showService = {
  getSeats: async (showId: number): Promise<ShowSeatsResponse> => {
    const response = await apiClient.get(`/shows/${showId}/seats`);
    return response.data;
  },
};

export default showService;
