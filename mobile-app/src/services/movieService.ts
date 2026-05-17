import apiClient from '../api/apiClient';

export interface Movie {
  id: string;
  title: string;
  rating: string;
  duration: string;
  genre: string;
  image: string;
  language?: string;
  releaseDate?: string;
  director?: string;
  actor?: string;
  description?: string;
  trailerUrl?: string;
  raw?: any;
}

const FALLBACK_POSTER =
  'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg';

const getItems = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.movies)) return payload.data.movies;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const formatDuration = (runtime?: number | string | null) => {
  const minutes = Number(runtime);
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Updating';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} minutes`;
  if (!mins) return `${hours} hour`;
  return `${hours} hour ${mins} minutes`;
};

const normalizeMovie = (movie: any): Movie => {
  const rating = movie?.Rating ?? movie?.rating ?? 0;

  return {
    id: String(movie?.MovieID ?? movie?.id ?? ''),
    title: movie?.MovieTitle ?? movie?.title ?? 'Untitled movie',
    rating: `${Number(rating || 0).toFixed(1)} rating`,
    duration: formatDuration(movie?.MovieRuntime ?? movie?.runtime),
    genre: movie?.MovieGenre ?? movie?.genre ?? 'Updating',
    image: movie?.MovieImage || movie?.image || FALLBACK_POSTER,
    language: movie?.MovieLanguage ?? movie?.language,
    releaseDate: movie?.MovieReleaseDate ?? movie?.releaseDate,
    director: movie?.MovieDirector ?? movie?.director,
    actor: movie?.MovieActor ?? movie?.actor,
    description: movie?.MovieDescription ?? movie?.description,
    trailerUrl: movie?.TrailerUrl ?? movie?.trailerUrl,
    raw: movie,
  };
};

export const movieService = {
  getMovies: async (params?: { page?: number; limit?: number; isFeatured?: boolean }) => {
    const response = await apiClient.get('/movies', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        isActive: true,
        ...(params?.isFeatured !== undefined ? { isFeatured: params.isFeatured } : {}),
      },
    });

    return {
      ...response.data,
      data: getItems(response.data).map(normalizeMovie),
      pagination: response.data?.data?.pagination,
    };
  },

  getFeaturedMovies: async () => {
    const response = await apiClient.get('/movies/featured');
    return {
      ...response.data,
      data: getItems(response.data).map(normalizeMovie),
    };
  },

  searchMovies: async (query: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/movies/search', {
      params: {
        q: query,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      },
    });

    return {
      ...response.data,
      data: getItems(response.data).map(normalizeMovie),
      pagination: response.data?.data?.pagination,
    };
  },

  getMovieById: async (id: string | number) => {
    const response = await apiClient.get(`/movies/${id}`);
    return {
      ...response.data,
      data: normalizeMovie(response.data?.data),
    };
  },
};
