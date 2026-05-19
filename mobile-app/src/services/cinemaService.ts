import apiClient from '../api/apiClient';

export interface Cinema {
  CinemaID: number;
  CinemaName: string;
  CinemaAddress?: string;
  Address?: string;
  District?: string;
  CityID: number;
  CityName?: string;
  Latitude?: number;
  Longitude?: number;
  IsActive?: boolean;
}

export interface CinemaFilters {
  page?: number;
  limit?: number;
  cityId?: number;
  movieId?: number;
}

const cinemaService = {
  /**
   * Lấy danh sách cụm rạp (phân trang + lọc theo thành phố)
   */
  getAll: async (params: CinemaFilters = {}) => {
    const response = await apiClient.get('/cinemas', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết cụm rạp kèm phòng chiếu
   */
  getById: async (cinemaId: number) => {
    const response = await apiClient.get(`/cinemas/${cinemaId}`);
    return response.data;
  },

  /**
   * Lấy lịch chiếu theo cụm rạp (có thể lọc theo ngày và phim)
   */
  getShows: async (cinemaId: number, date?: string, movieId?: number) => {
    const params: any = {};
    if (date) params.date = date;
    if (movieId) params.movieId = movieId;
    const response = await apiClient.get(`/cinemas/${cinemaId}/shows`, { params });
    return response.data;
  },

  /**
   * Lấy danh sách ngày thật sự có suất chiếu theo cụm rạp
   */
  getShowDates: async (cinemaId: number, movieId?: number) => {
    const params = movieId ? { movieId } : {};
    const response = await apiClient.get(`/cinemas/${cinemaId}/show-dates`, { params });
    return response.data;
  },
};

export default cinemaService;
