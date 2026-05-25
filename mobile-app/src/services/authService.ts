import apiClient from '../api/apiClient';

export const authService = {
  register: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, password });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async (refreshToken?: string) => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetOtp: async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', { email, newPassword });
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },
};
