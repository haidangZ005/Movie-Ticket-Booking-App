import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import Cinemas from './pages/Cinemas';
import Bookings from './pages/Bookings';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Vouchers from './pages/Vouchers';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import SeatLayoutBuilder from './pages/SeatLayoutBuilder';
import Halls from './pages/Halls';
import Showtimes from './pages/Showtimes';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="movies" element={<Movies />} />
          <Route path="cinemas" element={<Cinemas />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="products" element={<Products />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="halls" element={<Halls />} />
          <Route path="showtimes" element={<Showtimes />} />
          <Route path="seat-layout" element={<SeatLayoutBuilder />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
