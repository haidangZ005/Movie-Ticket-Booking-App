import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute — Chặn truy cập nếu chưa đăng nhập hoặc không đủ quyền.
 * Nếu chưa đăng nhập → redirect về /login
 * Nếu không phải ADMIN/SUPER_ADMIN → redirect về /login
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const accessToken = localStorage.getItem('accessToken');
  const accountType = localStorage.getItem('accountType');

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (accountType !== 'ADMIN' && accountType !== 'SUPER_ADMIN') {
    // Xóa token không hợp lệ
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accountType');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
