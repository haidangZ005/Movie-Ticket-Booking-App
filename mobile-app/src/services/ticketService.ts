import apiClient from '../api/apiClient';

export interface ElectronicTicket {
  BookingID: number;
  CustomerID: number;
  ShowID: number;
  TotalSeats: number;
  TotalAmount: number;
  BookingStatus: string;
  CreatedAt: string;
  MovieID: number;
  MovieTitle: string;
  PosterUrl?: string;
  CinemaName: string;
  Address?: string;
  HallName: string;
  ShowDate: string;
  ShowTime: string;
  EndTime?: string;
  Format?: string;
  PaymentStatus?: string;
  Seats?: string;
  TicketCode: string;
  QrData: string;
}

export const ticketService = {
  getMyTickets: async (): Promise<ElectronicTicket[]> => {
    const response = await apiClient.get('/bookings/my-tickets');
    return response.data.data || [];
  },
};

export default ticketService;
