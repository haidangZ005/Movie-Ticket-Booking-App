import apiClient from '../api/apiClient';

export interface Movie {
  MovieID: number;
  MovieTitle: string;
  MovieGenre: string;
  MovieLanguage: string;
  MovieRuntime: number;
  MovieReleaseDate: string;
  MovieActor?: string;
  MovieDirector?: string;
  MovieDescription?: string;
  PosterUrl?: string;
  TrailerUrl?: string;
  Rating?: number;
  IsFeatured?: boolean;
  FeaturedOrder?: number;
  IsActive?: boolean;
  HasUpcomingShows?: boolean;
  NextShowDate?: string;
  NextShowTime?: string;
}

export interface MovieFilters {
  page?: number;
  limit?: number;
  genre?: string;
  language?: string;
}

const movieService = {
  /**
   * Lấy danh sách phim (phân trang + lọc)
   */
  getAll: async (params: MovieFilters = {}) => {
    const response = await apiClient.get('/movies', { params });
    return response.data;
  },

  /** Alias cho getAll (tương thích ngược) */
  getMovies: async (params = {}) => {
    const response = await apiClient.get('/movies', { params });
    return response.data;
  },

  /**
   * Lấy danh sách phim nổi bật
   */
  getFeatured: async () => {
    const response = await apiClient.get('/movies/featured');
    return response.data;
  },

  /** Alias cho getFeatured (tương thích ngược) */
  getFeaturedMovies: async () => {
    const response = await apiClient.get('/movies/featured');
    return response.data;
  },

  /**
   * Tìm kiếm phim theo từ khóa
   */
  searchMovies: async (query: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get('/movies/search', { params: { q: query, page, limit } });
    return response.data;
  },

  /**
   * Lấy chi tiết phim theo ID
   */
  getById: async (movieId: number) => {
    const response = await apiClient.get(`/movies/${movieId}`);
    return response.data;
  },

  /** Alias cho getById (tương thích ngược) */
  getMovieById: async (movieId: number) => {
    const response = await apiClient.get(`/movies/${movieId}`);
    return response.data;
  },

  /**
   * Lấy lịch chiếu theo phim
   */
  getShowsByMovie: async (movieId: number) => {
    const response = await apiClient.get(`/movies/${movieId}/shows`);
    return response.data;
  },

  /**
   * Like / Unlike phim
   */
  toggleLike: async (movieId: number) => {
    const response = await apiClient.post(`/movies/${movieId}/like`);
    return response.data;
  },
};

export default movieService;
