import apiClient from '../api/apiClient';

export interface Cinema {
  id: string;
  name: string;
  address: string;
  district?: string;
  city?: string;
  distance?: string;
}

const getItems = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeCinema = (cinema: any): Cinema => ({
  id: String(cinema?.CinemaID ?? cinema?.id ?? ''),
  name: cinema?.CinemaName ?? cinema?.name ?? 'Unnamed cinema',
  address: cinema?.Address ?? cinema?.address ?? 'Address is updating',
  district: cinema?.District ?? cinema?.district,
  city: cinema?.CityName ?? cinema?.city,
});

export const cinemaService = {
  getCinemas: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/cinemas', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    });

    return {
      ...response.data,
      data: getItems(response.data).map(normalizeCinema),
      pagination: response.data?.data?.pagination,
    };
  },
};
