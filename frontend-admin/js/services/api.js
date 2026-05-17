// =====================================
// GLOBAL ROUTE GUARD (TV5)
// Kiểm tra nếu chưa đăng nhập thì đẩy ra ngoài
// Ngoại trừ trang login.html
// =====================================
const currentPage = window.location.pathname;
if (!currentPage.endsWith('login.html')) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

/**
 * API Service class handling all HTTP requests
 */
class ApiService {
  constructor() {
    // Trỏ về Backend thật (Port 3000)
    this.baseUrl = 'http://localhost:3000/api'; 
  }

  // Lấy token từ localStorage (sẽ implement lúc làm tính năng Auth)
  getHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async fetch(url, options = {}) {
    try {
      const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi kết nối đến máy chủ');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      // Có thể thả lỗi lên trên để component tự bắt, 
      // hoặc trigger một toast notification ở đây
      throw error;
    }
  }

  // Các hàm wrapper tiện ích
  async get(url) {
    return this.fetch(url);
  }

  async post(url, body) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async put(url, body) {
    return this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete(url) {
    return this.fetch(url, {
      method: 'DELETE'
    });
  }
}

// Khởi tạo instance duy nhất để các trang khác dùng chung
const api = new ApiService();
