import apiClient from '../api/apiClient';

export interface NotificationItem {
  NotificationID: number;
  CustomerID: number;
  Title: string;
  Message: string;
  Type: string;
  DateSend: string;
  IsRead: boolean;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationService = {
  getNotifications: async (page: number = 1, limit: number = 20): Promise<PaginatedNotifications> => {
    const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<{ updated: number }> => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data.unreadCount;
  },
};
