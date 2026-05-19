import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/database';
import { globalExceptionHandler } from './utils/exceptions/global.exception.handler';
import authRoutes from './routes/auth/auth.routes';
import customerRoutes from './routes/customer/customer.routes';
import adminRoutes from './routes/admin/admin.routes';
import movieRoutes from './routes/movie/movie.routes';
import cinemaRoutes from './routes/cinema/cinema.routes';
import showRoutes from './routes/show/show.routes';

// Load biến môi trường từ file .env
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. SYSTEM MIDDLEWARES
// ==========================================
app.use(helmet());                              // Bảo mật HTTP headers
app.use(cors());                                // Cho phép Cross-Origin
app.use(morgan('dev'));                          // Log request ra console
app.use(express.json());                        // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// ==========================================
// 2. API ROUTES (Các thành viên chèn routes ở đây)
// ==========================================

// Health Check — Kiểm tra server còn sống không
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    message: 'Movie Ticket Booking API is running!',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth',         authRoutes);
app.use('/api/customer',     customerRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/movies',       movieRoutes);
app.use('/api/cinemas',     cinemaRoutes);
app.use('/api/shows',       showRoutes);

// ==========================================
// 3. XỬ LÝ ROUTE KHÔNG TỒN TẠI (404)
// ==========================================
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: `Route ${req.originalUrl} không tồn tại`,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 4. GLOBAL EXCEPTION HANDLER (BẮT BUỘC ĐẶT CUỐI CÙNG)
// ==========================================
app.use(globalExceptionHandler);

// ==========================================
// 5. KHỞI ĐỘNG SERVER + KẾT NỐI DATABASE
// ==========================================
const startServer = async () => {
  try {
    // Kết nối SQL Server trước khi mở cổng lắng nghe
    await connectDB();
    
    // Seed tài khoản admin mặc định
    const { seedAdmin } = require('./utils/seed');
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`[🚀 Server]  Đang chạy tại http://localhost:${PORT}`);
      console.log(`[📋 Health]  http://localhost:${PORT}/api/health`);
      console.log(`[🌍 Env]     ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[❌ Startup] Không thể khởi động server:', error);
    process.exit(1);
  }
};

startServer();
