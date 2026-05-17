import apiClient from '../api/apiClient';

// ============================================
// Interfaces (Định nghĩa kiểu dữ liệu)
// ============================================

export interface Cinema {
  CinemaID: number;
  CinemaName: string;
  CinemaAddress: string;
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
}

// ============================================
// Cinema Service — Gọi API Backend
// ============================================

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
   * Lấy lịch chiếu theo cụm rạp (có thể lọc theo ngày)
   */
  getShows: async (cinemaId: number, date?: string) => {
    const params = date ? { date } : {};
    const response = await apiClient.get(`/cinemas/${cinemaId}/shows`, { params });
    return response.data;
  },
};

export default cinemaService;
