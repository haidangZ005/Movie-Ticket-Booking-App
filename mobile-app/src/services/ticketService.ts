import apiClient from '../api/apiClient';

export interface Ticket {
  id: string;
  title: string;
  time: string;
  location: string;
  image: string;
  seats?: string;
  status?: string;
}

const FALLBACK_POSTER =
  'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg';

const formatShowTime = (date?: string, time?: string) => {
  const dateText = date ? date.slice(0, 10) : 'Date updating';
  const timeText = time ? time.slice(0, 5) : 'Time updating';
  return `${timeText} | ${dateText}`;
};

const normalizeTicket = (booking: any): Ticket => ({
  id: String(booking?.BookingID ?? ''),
  title: booking?.MovieTitle ?? 'Untitled movie',
  time: formatShowTime(booking?.ShowDate, booking?.ShowTime),
  location: booking?.CinemaName ?? 'Cinema updating',
  image: booking?.MovieImage || FALLBACK_POSTER,
  seats: booking?.SeatNumbers,
  status: booking?.Status,
});

export const ticketService = {
  getMyTickets: async () => {
    const response = await apiClient.get('/bookings/my');
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return {
      ...response.data,
      data: items.map(normalizeTicket),
    };
  },
};
