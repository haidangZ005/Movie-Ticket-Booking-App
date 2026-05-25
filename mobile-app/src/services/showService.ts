import apiClient from '../api/apiClient';

export interface Seat {
  SeatID: number;
  HallID?: number;
  SeatNumber: string;
  SeatType: 'STANDARD' | 'VIP' | 'COUPLE' | 'AISLE' | 'DISABLED' | 'EMPTY';
  SeatPrice: number;
  PairID: number | null;
  RowIndex: number;
  ColIndex: number;
  IsAisle: boolean;
  RowVersion?: any;
  Status: 'AVAILABLE' | 'HOLDING' | 'BOOKED' | 'CANCELLED';
  HoldBy?: number | null;
  HoldUntil?: string | null;
  BookingID?: number | null;
}

export interface ShowInfo {
  ShowID: number;
  MovieID?: number;
  MovieTitle: string;
  CinemaID?: number;
  CinemaName: string;
  HallID?: number;
  HallName: string;
  ShowDate: string;
  ShowTime: string;
  EndTime: string;
  BasePrice: number;
  Format?: string;
  PosterUrl?: string;
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
