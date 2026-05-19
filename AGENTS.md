# AGENTS.md — Hệ thống Đặt vé Xem phim Đa nền tảng

> Đồ án môn Phát triển Ứng dụng Đa nền tảng · Nhóm 5 thành viên
> Phiên bản v3 — React Native · Node.js/Express · SQL Server · Redis · WebSocket · Payment Gateway Service
> Cập nhật: Tháng 5/2026 — Bổ sung Secure Store, Image Cache WebP, SQLite, Location/Camera

---

## Mục lục

- [I. Tổng quan Dự án](#i-tổng-quan-dự-án)
- [II. Cấu trúc Thư mục](#ii-cấu-trúc-thư-mục)
- [III. Công nghệ & Phiên bản](#iii-công-nghệ--phiên-bản)
- [IV. Backend — Node.js + Express](#iv-backend--nodejs--express)
- [V. Mobile App — React Native](#v-mobile-app--react-native)
- [VI. Frontend Admin — HTML/CSS/JS](#vi-frontend-admin--htmlcssjs)
- [VII. Database — SQL Server](#vii-database--sql-server)
- [VIII. Quy tắc Nghiệp vụ](#viii-quy-tắc-nghiệp-vụ)
- [IX. Testing & Verification](#ix-testing--verification)
- [X. Git & Workflow](#x-git--workflow)
- [XI. Phân công Nhiệm vụ — 5 Thành viên](#xi-phân-công-nhiệm-vụ--5-thành-viên)
- [XII. Lịch trình Chi tiết 10 Buổi — Phân công theo Buổi](#xii-lịch-trình-chi-tiết-10-buổi--phân-công-theo-buổi)

---

## I. Tổng quan Dự án

Hệ thống đặt vé xem phim đa nền tảng bao gồm:

- **Mobile App** (React Native): Giao diện khách hàng — đặt vé, chọn ghế realtime, thanh toán QR/thẻ tín dụng, OTP xác thực.
- **Admin Panel** (React/Vite): Giao diện quản trị — quản lý phim, rạp, khuyến mãi, báo cáo doanh thu, nhật ký thao tác, cài đặt hệ thống.
- **Backend API** (Node.js/Express): REST API xử lý business logic, WebSocket realtime, Job Scheduler.
- **Payment Gateway Service** (Node.js/Express): Web API Service **riêng biệt** — sinh mã QR động, xử lý thanh toán thẻ, webhook callback, bảo mật HMAC.
- **Database** (SQL Server): Dữ liệu có cấu trúc, hỗ trợ ACID.
- **Cache/Lock** (Redis): Redis Distributed Lock khóa ghế tạm thời TTL 10 phút (SET NX atomic), cache phim nổi bật, OTP.

### 8 Module chức năng chính

| Module | Tên | Mô tả tóm tắt |
|--------|-----|----------------|
| **M1** | Quản Lý Phim & Lịch Chiếu | CRUD phim, phim nổi bật, mạng lưới rạp 3 tầng, sơ đồ phòng, lịch chiếu, cấu hình giá |
| **M2** | Tìm Kiếm & Xem Phim | Tìm theo tên/thể loại/khu vực/định dạng, xem chi tiết, lịch chiếu, sơ đồ ghế realtime |
| **M3** | Đặt Vé Xem Phim | 6 bước: chọn phim → chọn ghế + ràng buộc → tính giá → combo → voucher → khóa ghế Redis |
| **M4** | Thanh Toán & Quản Lý Vé | QR (MoMo/VNPay), thẻ tín dụng, điểm tích lũy, vé điện tử email, QR check-in |
| **M5** | Hủy & Xử Lý Quá Trình Đặt Vé | Hủy vé (chính sách % hoàn), background job quá hạn, hoàn tiền & rollback sự cố |
| **M6** | Quản Lý Khuyến Mãi | Voucher Engine FEFO, cấu hình linh hoạt lưu DB, kiểm tra điều kiện hợp lệ |
| **M7** | Hệ Thống Thông Báo | Email (Nodemailer), Push (Firebase FCM), WebSocket realtime ghế |
| **M8** | Quản Lý Người Dùng | Đăng ký OTP, đăng nhập JWT, quên mật khẩu, RBAC, audit log, cài đặt hệ thống |

### Actors

| Actor | Mô tả |
|-------|-------|
| **Khách hàng** (CUSTOMER) | Đăng ký (OTP), đặt vé, thanh toán QR/thẻ, quản lý vé, xem thông báo, tích lũy điểm |
| **Quản trị viên** (ADMIN) | Quản lý phim, rạp, sơ đồ ghế, khuyến mãi, cài đặt hệ thống, xem báo cáo |
| **Quản trị cấp cao** (SUPER_ADMIN) | Toàn quyền ADMIN + quản lý tài khoản admin, xem nhật ký thao tác (Audit Log) |
| **Hệ thống tự động** | Cronjob hủy ghế hết hạn, nhắc lịch 30p, cộng/thu hồi điểm, broadcast ghế, phát hành voucher tự động |

### Sơ đồ Luồng Dữ liệu tổng thể

```
┌──────────────┐     REST API     ┌──────────────────┐     Queries      ┌───────────┐
│  📱 Mobile   │ ──── (JWT) ────▶ │  ⚙️ Main API     │ ───────────────▶ │ 🗄️ SQL    │
│  React Native│                  │  Node.js+Express │ ◀─────────────── │  Server   │
└──────┬───────┘                  └────────┬─────────┘                  └───────────┘
       │                                   │
       │ WebSocket (realtime)              │ Distributed Lock + Cache
       │◀──────────────────────────────────│──────────────────▶ ⚡ Redis
       │                                   │
┌──────────────┐     REST API              │ HMAC signed      ┌───────────────┐
│  🖥️ Admin    │ ──── (JWT) ────▶          │◀────────────────▶│ 💰 Payment GW │
│  React/Vite  │                           │                  │  Service      │
└──────────────┘                           │                  └───────────────┘
                                           │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                         📧 Email      🔔 Firebase    🔌 Socket.IO
                         Nodemailer      FCM          WebSocket
```

---

## II. Cấu trúc Thư mục

```
da_nen_tang/
├── AGENTS.md                           # File cấu hình này
├── backend/                            # Node.js + Express — Main API Server
│   ├── package.json
│   ├── .env.example
│   ├── server.js                       # Entry point
│   └── src/
│       ├── config/                     # Cấu hình DB, Redis, JWT, Cloudinary, Firebase, env
│       ├── controllers/                # Xử lý request/response
│       │   ├── admin/                  # Phim, rạp, khuyến mãi, báo cáo, audit log, settings
│       │   ├── auth/                   # Đăng ký OTP, đăng nhập, quên MK, refresh token
│       │   ├── booking/                # Đặt vé, lịch sử, hủy vé
│       │   ├── cinema/                 # Rạp, phòng chiếu, sơ đồ ghế
│       │   ├── customer/               # Thông tin tài khoản, loyalty, avatar
│       │   ├── movie/                  # Tìm kiếm phim, lịch chiếu, phim nổi bật
│       │   ├── notification/           # Thông báo, nhắc lịch
│       │   ├── payment/               # Thanh toán, rollback, retry
│       │   ├── product/               # Combo bắp nước
│       │   └── voucher/               # FEFO engine, voucher
│       ├── middlewares/                # Auth JWT, phân quyền RBAC, error handler, rate limit
│       ├── models/                     # Query models — theo ERD
│       ├── routes/                     # Express Router (mirror controllers)
│       │   ├── admin/                  # /admin/* routes
│       │   ├── auth/                   # /auth/* routes
│       │   ├── booking/               # /booking/* routes
│       │   ├── cinema/                # /cinema/* routes
│       │   ├── customer/              # /customer/* routes
│       │   ├── movie/                 # /movie/* routes
│       │   ├── notification/          # /notification/* routes
│       │   ├── payment/              # /payment/* routes
│       │   ├── product/              # /product/* routes
│       │   └── voucher/              # /voucher/* routes
│       ├── services/                   # Business logic layer
│       ├── utils/                      # Helper functions, formatters
│       ├── jobs/                       # node-cron / bull: scheduled tasks
│       ├── socket/                     # Socket.IO: realtime seat updates
│       └── validators/                 # Input validation (joi / express-validator)
│
├── payment-gateway/                    # 🆕 Payment Gateway — Web API Service riêng biệt
│   ├── package.json
│   ├── .env.example
│   ├── server.js                       # Entry point (port 4000)
│   └── src/
│       ├── config/                     # Cấu hình HMAC secret, provider keys
│       ├── controllers/                # QR generation, payment processing
│       ├── middlewares/                # HMAC verification, error handler
│       ├── routes/                     # Payment routes
│       ├── services/                   # Payment logic (MoMo, VNPay, Credit Card)
│       └── utils/                      # HMAC signing, QR code generation
│
├── frontend-admin/                     # React/Vite Admin Panel
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html                      # Entry point (Vite)
│   ├── src/
│   │   ├── main.jsx                    # React bootstrap
│   │   ├── App.jsx                     # Layout chính
│   │   ├── index.css                   # Global styles
│   │   ├── pages/                      # Các trang (Dashboard, Movies, etc.)
│   │   ├── components/                 # Reusable UI components (Sidebar, Topbar, SeatMap...)
│   │   ├── services/                   # API calls (axios)
│   │   └── utils/                      # Helpers, formatters
│   └── public/                         # Ảnh, icons tĩnh
│
├── mobile-app/                         # React Native (iOS + Android)
│   ├── package.json
│   ├── App.js                          # Entry point
│   ├── app.json
│   └── src/
│       ├── api/                        # Axios instance, API endpoints config
│       ├── assets/                     # Fonts, images
│       ├── components/                 # Reusable UI components
│       │   ├── common/                 # Button, Input, Modal, Loading, Header, OTPInput
│       │   ├── auth/                   # Login/Register/ForgotPassword forms
│       │   ├── booking/                # Booking flow components
│       │   ├── cinema/                 # Cinema list, hall info
│       │   ├── movie/                  # Movie card, movie detail, featured carousel
│       │   ├── notification/           # Notification item
│       │   ├── payment/               # QR code, credit card form, payment status
│       │   ├── profile/               # Avatar, loyalty points, point history
│       │   ├── seat/                  # Seat map grid (WebSocket realtime)
│       │   └── voucher/               # Voucher card, FEFO list
│       ├── navigation/                 # React Navigation (Stack, Tab, Drawer)
│       ├── screens/                    # Màn hình chính
│       │   ├── auth/                   # LoginScreen, RegisterScreen, OTPScreen, ForgotPasswordScreen
│       │   ├── home/                   # HomeScreen (phim đang chiếu + featured carousel)
│       │   ├── movie/                  # MovieDetailScreen, SearchScreen
│       │   ├── cinema/                 # CinemaListScreen, ShowtimeScreen
│       │   ├── booking/               # SeatSelectionScreen, ComboScreen
│       │   ├── payment/              # PaymentScreen, PaymentResultScreen
│       │   ├── profile/              # ProfileScreen, EditProfileScreen, LoyaltyScreen
│       │   ├── notification/          # NotificationListScreen
│       │   └── ticket/               # TicketHistoryScreen, TicketDetailScreen
│       ├── services/                   # API service layer (authService, bookingService...)
│       ├── store/slices/               # Redux Toolkit state slices
│       ├── hooks/                      # Custom hooks (useSocket, useAuth, useLocation)
│       ├── utils/                      # Helpers, date formatters, price formatters
│       ├── constants/                  # Enums, color palette, API URLs, seat types
│       └── context/                    # React Context (AuthContext, ThemeContext)
│
├── database/                           # SQL Server
│   ├── migrations/                     # Schema creation & alterations (theo thứ tự)
│   ├── seeds/                          # Dữ liệu mẫu (cities, cinemas, movies, shows...)
│   └── scripts/                        # Utility SQL scripts (reset, backup, indexes)
│
└── docs/                               # Tài liệu
    ├── diagrams/                       # ERD, Use Case, Sequence diagram images
    └── api/                            # API documentation (endpoint specs)
```

---

## III. Công nghệ & Phiên bản

| Tầng | Công nghệ | Vai trò |
|------|-----------|---------|
| Frontend Mobile | **React Native** (Expo hoặc CLI) | Giao diện khách hàng: đặt vé, chọn ghế, thanh toán |
| Frontend Admin | **React / Vite** | Giao diện quản trị: phim, rạp, báo cáo (Chart.js) |
| Backend | **Node.js + Express** | REST API, business logic, middleware |
| Payment Gateway | **Node.js + Express** (port 4000) | 🆕 Web API Service riêng biệt — sinh QR, xử lý thanh toán, HMAC |
| Realtime | **Socket.IO** (WebSocket) | Cập nhật trạng thái ghế theo thời gian thực |
| Database | **SQL Server** (mssql) | Lưu trữ dữ liệu có cấu trúc (ACID) |
| Cache / Lock | **Redis** (ioredis) | 🔄 Redis Distributed Lock (SET NX) TTL 10 phút — **KHÔNG dùng SQL UPDLOCK** |
| Xác thực | **JWT + HMAC** (jsonwebtoken) | Token-based auth, HMAC bảo mật service-to-service |
| 🔄 Token Storage | **expo-secure-store** | Lưu Access Token / Refresh Token mã hóa trên thiết bị (thay AsyncStorage) |
| 🆕 Image Cache | **react-native-fast-image** | Cache ảnh + decode WebP, hiển thị poster/avatar hiệu năng cao |
| 🆕 Local DB | **expo-sqlite** | SQLite cho dữ liệu offline phức tạp (lịch sử vé, danh sách phim cache, thông báo) |
| 🆕 Location | **expo-location** | Lấy tọa độ GPS → tìm rạp gần nhất, sắp xếp theo khoảng cách |
| 🆕 Camera/Gallery | **expo-image-picker** | Chọn ảnh / chụp ảnh đại diện từ camera hoặc thư viện |
| Email | **Nodemailer** | Gửi email xác nhận vé, OTP, đặt lại mật khẩu, nhắc lịch |
| Push Notification | **Firebase FCM** | 🆕 Thông báo đẩy: đặt vé thành công, nhắc chiếu 30p, phim mới |
| Job Scheduler | **node-cron** hoặc **bull** | Cronjob hủy ghế hết hạn, nhắc lịch 30p trước chiếu |
| File Storage | **S3** hoặc **Cloudinary** | Lưu ảnh poster phim, AvatarUrl (KHÔNG lưu trong DB) |
| Charts | **Chart.js** | Biểu đồ trực quan trên Admin Panel |

### Dependencies chính (Backend — Main API)

```json
{
  "dependencies": {
    "express": "^4.x",
    "mssql": "^10.x",
    "ioredis": "^5.x",
    "socket.io": "^4.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "nodemailer": "^6.x",
    "firebase-admin": "^12.x",
    "node-cron": "^3.x",
    "joi": "^17.x",
    "cors": "^2.x",
    "helmet": "^7.x",
    "morgan": "^1.x",
    "dotenv": "^16.x",
    "multer": "^1.x",
    "cloudinary": "^1.x",
    "crypto": "built-in"
  }
}
```

### Dependencies chính (Payment Gateway Service)

```json
{
  "dependencies": {
    "express": "^4.x",
    "dotenv": "^16.x",
    "cors": "^2.x",
    "helmet": "^7.x",
    "qrcode": "^1.x",
    "crypto": "built-in",
    "axios": "^1.x"
  }
}
```

### Dependencies chính (Mobile App)

```json
{
  "dependencies": {
    "react-native": "latest",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@reduxjs/toolkit": "^2.x",
    "react-redux": "^9.x",
    "axios": "^1.x",
    "socket.io-client": "^4.x",
    "react-native-vector-icons": "^10.x",
    "react-native-qrcode-svg": "^6.x",
    "expo-secure-store": "^14.x",
    "expo-sqlite": "^15.x",
    "expo-location": "^18.x",
    "expo-image-picker": "^16.x",
    "react-native-fast-image": "^8.x",
    "@react-native-firebase/messaging": "^18.x",
    "react-native-push-notification": "^8.x"
  }
}
```

> ⚠️ **Lưu ý thay đổi so với phiên bản trước:**
> - 🔄 **`expo-secure-store`** thay `@react-native-async-storage/async-storage` — lưu Access Token / Refresh Token mã hóa (AES-256 trên iOS Keychain / Android Keystore).
> - 🆕 **`react-native-fast-image`** — cache ảnh tự động, hỗ trợ decode WebP, hiệu năng cao hơn `<Image>` mặc định.
> - 🆕 **`expo-sqlite`** — lưu dữ liệu offline phức tạp (lịch sử vé, phim cache, thông báo) thay cho AsyncStorage.
> - 🆕 **`expo-location`** — lấy tọa độ GPS để tìm rạp gần nhất.
> - 🆕 **`expo-image-picker`** — chọn/chụp ảnh đại diện từ camera hoặc thư viện.

---

## IV. Backend — Node.js + Express

### Quy tắc chung

- Sử dụng **ES6+ syntax** (arrow functions, destructuring, template literals, async/await).
- **LUÔN** dùng `async/await` thay vì callbacks hoặc `.then()` chains.
- **KHÔNG BAO GIỜ** dùng `var`. Dùng `const` mặc định, chỉ dùng `let` khi cần reassign.
- Tất cả files sử dụng **CommonJS** (`require/module.exports`) hoặc thống nhất **ESM** (`import/export`) — chọn 1 và giữ nhất quán trong toàn bộ backend.
- **KHÔNG** commit file `.env`. Luôn dùng `.env.example` làm template.

### Kiến trúc MVC + Service Layer

```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓
                              Validator (input)
```

- **Routes**: Chỉ define HTTP method + path + middleware chain. Không chứa logic.
- **Controllers**: Nhận request, gọi service, trả response. Không chứa business logic trực tiếp.
- **Services**: Chứa TOÀN BỘ business logic. Đây là nơi duy nhất xử lý nghiệp vụ.
- **Models**: Chỉ chứa query database (SQL queries hoặc ORM methods).
- **Validators**: Validate input bằng Joi hoặc express-validator. Luôn validate TRƯỚC khi vào controller.

### Cấu trúc Response API

Tất cả API phải trả về format thống nhất:

```javascript
// Success
{
  "success": true,
  "message": "Thông báo thành công",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": {
    "code": "ERROR_CODE",
    "details": "Chi tiết lỗi (chỉ hiện ở development)"
  }
}

// Paginated List
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### HTTP Status Codes

| Code | Khi nào dùng |
|------|-------------|
| `200` | GET thành công, UPDATE thành công |
| `201` | POST tạo mới thành công |
| `400` | Validation error, bad request |
| `401` | Chưa xác thực (missing/invalid token) |
| `403` | Không có quyền (AccountType không đủ) |
| `404` | Resource không tồn tại |
| `409` | Conflict (ghế đã được đặt, voucher đã dùng) |
| `422` | Unprocessable entity (vi phạm ràng buộc nghiệp vụ) |
| `429` | Too Many Requests (rate limit / OTP throttle) |
| `500` | Internal server error |

### ApiResponse — Utility chuẩn hóa Response

Toàn bộ controller **BẮT BUỘC** sử dụng `ApiResponse` + `asyncHandler` để đảm bảo format thống nhất và xử lý lỗi tự động.

**Cấu trúc files:**
```
backend/src/
├── utils/
│   ├── index.js              ← Barrel file (gom exports)
│   ├── apiResponse.js        ← Class trả response chuẩn
│   ├── appError.js           ← Custom error class
│   └── asyncHandler.js       ← Wrapper try/catch tự động
└── middlewares/
    └── errorHandler.js       ← Global error handler (đặt sau routes)
```

**Import nhanh (1 dòng):**
```javascript
const { ApiResponse, AppError, asyncHandler } = require('../utils');
```

**Ví dụ Controller hoàn chỉnh:**
```javascript
// controllers/movie/movie.controller.js
const { ApiResponse, AppError, asyncHandler } = require('../../utils');
const movieService = require('../../services/movie.service');

// GET /api/movies — Danh sách phim (phân trang)
const getMovies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { movies, total } = await movieService.getAll({ page, limit });
  return ApiResponse.paginate(res, movies, { page, limit, total });
});

// GET /api/movies/:id — Chi tiết phim
const getMovieById = asyncHandler(async (req, res) => {
  const movie = await movieService.getById(req.params.id);
  if (!movie) throw AppError.notFound('Phim không tồn tại', 'MOVIE_NOT_FOUND');
  return ApiResponse.ok(res, movie);
});

// POST /api/admin/movies — Thêm phim (Admin)
const createMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.create(req.body);
  return ApiResponse.created(res, movie, 'Thêm phim thành công');
});

// POST /api/bookings — Đặt vé (kiểm tra ràng buộc ghế)
const createBooking = asyncHandler(async (req, res) => {
  const { showId, seatIds } = req.body;

  // Kiểm tra ràng buộc ghế trống
  const violation = await bookingService.checkSeatConstraints(showId, seatIds);
  if (violation) {
    throw new AppError(violation.message, 422, 'SEAT_CONSTRAINT_VIOLATION');
  }

  // Khóa ghế Redis
  const lockResult = await bookingService.holdSeats(showId, seatIds, req.user.customerId);
  if (!lockResult.success) {
    throw AppError.conflict('Ghế đã được giữ bởi người khác', 'SEAT_ALREADY_HELD');
  }

  const booking = await bookingService.create(req.body, req.user.customerId);
  return ApiResponse.created(res, booking, 'Đặt vé thành công, vui lòng thanh toán trong 10 phút');
});

module.exports = { getMovies, getMovieById, createMovie, createBooking };
```

**Toàn bộ methods của `ApiResponse`:**

| Method | Status | Khi nào dùng |
|--------|--------|-------------|
| `ApiResponse.ok(res, data, message)` | 200 | GET / UPDATE thành công |
| `ApiResponse.created(res, data, message)` | 201 | POST tạo mới thành công |
| `ApiResponse.paginate(res, data, { page, limit, total })` | 200 | Danh sách có phân trang |
| `ApiResponse.badRequest(res, message, errorCode)` | 400 | Validation error |
| `ApiResponse.unauthorized(res, message, errorCode)` | 401 | Chưa xác thực |
| `ApiResponse.forbidden(res, message, errorCode)` | 403 | Không có quyền |
| `ApiResponse.notFound(res, message, errorCode)` | 404 | Không tìm thấy |
| `ApiResponse.conflict(res, message, errorCode)` | 409 | Xung đột dữ liệu |
| `ApiResponse.unprocessable(res, message, errorCode)` | 422 | Vi phạm nghiệp vụ |
| `ApiResponse.tooManyRequests(res, message, errorCode)` | 429 | Rate limit / OTP throttle |
| `ApiResponse.internal(res, message, errorCode)` | 500 | Lỗi hệ thống |

**Toàn bộ factory methods của `AppError`** (dùng khi `throw` trong service/controller):

| Factory | Status | Ví dụ |
|---------|--------|-------|
| `AppError.badRequest(msg, code)` | 400 | `throw AppError.badRequest('Email đã tồn tại', 'EMAIL_EXISTS')` |
| `AppError.unauthorized(msg, code)` | 401 | `throw AppError.unauthorized('Token không hợp lệ', 'INVALID_TOKEN')` |
| `AppError.forbidden(msg, code)` | 403 | `throw AppError.forbidden('Chỉ ADMIN mới được truy cập')` |
| `AppError.notFound(msg, code)` | 404 | `throw AppError.notFound('Phim không tồn tại', 'MOVIE_NOT_FOUND')` |
| `AppError.conflict(msg, code)` | 409 | `throw AppError.conflict('Ghế đã được đặt', 'SEAT_ALREADY_BOOKED')` |
| `AppError.unprocessable(msg, code)` | 422 | `throw AppError.unprocessable('Vi phạm ràng buộc ghế', 'SEAT_CONSTRAINT')` |
| `AppError.tooManyRequests(msg, code)` | 429 | `throw AppError.tooManyRequests('Vượt giới hạn OTP', 'OTP_THROTTLE')` |

**Setup trong `server.js`:**
```javascript
const express = require('express');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// ... routes ...

// ⚠️ Error handler PHẢI đặt SAU tất cả routes
app.use(errorHandler);
```

### Naming Conventions

```javascript
// Files: kebab-case
auth.controller.js
booking.service.js
cinema-hall.model.js
auth.middleware.js
booking.validator.js
seat.routes.js

// Variables & Functions: camelCase
const bookingService = require('./booking.service');
async function getAvailableSeats(showId) { ... }

// Constants & Enums: UPPER_SNAKE_CASE
const SEAT_TYPES = { STANDARD: 'STANDARD', VIP: 'VIP', COUPLE: 'COUPLE', AISLE: 'AISLE', EMPTY: 'EMPTY' };
const PAYMENT_STATUS = { CREATED: 'CREATED', PENDING_PAYMENT: 'PENDING_PAYMENT', PROCESSING: 'PROCESSING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', EXPIRED: 'EXPIRED', REFUNDED: 'REFUNDED' };
const BOOKING_STATUS = { PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED' };
const ACCOUNT_TYPES = { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN', SUPER_ADMIN: 'SUPER_ADMIN' };
const SHOW_FORMATS = { '2D': '2D', '3D': '3D', 'IMAX': 'IMAX' };

// Database table/column references: PascalCase (theo ERD)
// SQL queries reference: Account.AccountType, Customer.LoyaltyPoints, CinemaHallSeat.RowVersion
```

### Middleware Stack

Thứ tự middleware trên mỗi route:

```javascript
router.post('/bookings',
  authMiddleware,           // 1. Xác thực JWT token (kiểm tra blacklist)
  roleMiddleware('CUSTOMER'), // 2. Phân quyền theo AccountType
  rateLimitMiddleware,       // 3. Rate limiting (100 req/15 phút/IP)
  validateBooking,           // 4. Validate input
  bookingController.create   // 5. Controller handler
);
```

### Authentication & Authorization

- JWT token payload **BẮT BUỘC** chứa: `{ accountId, accountType, customerId }`.
- 🔄 Token expire: **Access Token = 15 phút**, **Refresh Token = 7 ngày**.
- Kiểm tra `Account.IsActive` mỗi lần đăng nhập — tài khoản bị vô hiệu hóa không thể login.
- 🆕 Kiểm tra `Account.IsVerified` — tài khoản chưa xác minh OTP không thể login.
- Phân quyền RBAC dựa trên `AccountType`: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`.
- Admin routes prefix: `/admin/*` — chỉ `ADMIN` và `SUPER_ADMIN` được truy cập.
- 🆕 Super Admin routes: quản lý tài khoản admin, xem audit log — chỉ `SUPER_ADMIN`.
- Hash password bằng **bcryptjs** với salt rounds = 10.
- 🆕 **Blacklist JWT**: Khi thay đổi mật khẩu, vô hiệu hóa toàn bộ token hiện hành (lưu blacklist vào Redis).

### 🆕 OTP (One-Time Password)

```javascript
// Đăng ký tài khoản mới
// 1. Khách hàng gửi email, hệ thống sinh OTP 6 chữ số
// 2. OTP được lưu vào Redis với TTL = 5 phút
// 3. Gửi OTP qua Email (Nodemailer)
// 4. Khách hàng nhập OTP → xác minh → is_verified = 1
// 5. Throttle: Tối đa 3 lần gửi lại OTP / 15 phút

// Redis key cho OTP
// otp:register:{email}  → TTL 300s (5 phút), value = OTP hash
// otp:reset:{email}     → TTL 300s (5 phút), value = OTP hash
// otp:throttle:{email}  → TTL 900s (15 phút), value = send count
```

### 🆕 Quên Mật Khẩu & Đặt Lại Mật Khẩu

```
Luồng 7 bước:
1. Nhập email/SĐT đã đăng ký
2. Hệ thống trả phản hồi chung (KHÔNG tiết lộ email tồn tại hay không → bảo mật)
3. Sinh OTP 6 chữ số + gửi qua Email/SMS
4. Xác minh OTP (TTL 5 phút)
5. Nhập mật khẩu mới (≥ 8 ký tự, chữ hoa, ký tự đặc biệt)
6. Hash bcrypt → Lưu vào DB
7. Vô hiệu hóa toàn bộ JWT hiện hành (blacklist) + Gửi email xác nhận mật khẩu đã thay đổi
```

### WebSocket (Socket.IO)

```javascript
// Room naming convention: show_{showId}
socket.join(`show_${showId}`);

// Events phát ra:
'seat:hold'        // Ghế vừa được khóa tạm (10 phút)
'seat:release'     // Ghế vừa được giải phóng (hết hạn / hủy vé)
'seat:booked'      // Ghế đã được đặt thành công (thanh toán xong)
'booking:expired'  // Đơn đặt hết hạn 10 phút

// Payload structure:
{
  showId: Number,
  seatId: Number,
  seatNumber: String,
  status: 'HOLDING' | 'AVAILABLE' | 'BOOKED',
  holdBy: Number | null,     // customerId
  holdUntil: Date | null
}
```

### Job Scheduler

Các tác vụ định kỳ chạy bằng `node-cron` hoặc `bull`:

| Job | Schedule | Mô tả |
|-----|----------|-------|
| `releaseExpiredSeats` | Mỗi 1 phút | 🔄 Quét đơn `PENDING_PAYMENT > 10 phút`. Tuần tự: (1) Chuyển EXPIRED → (2) Xóa key Redis → (3) Cập nhật ghế AVAILABLE trong DB → (4) Broadcast WebSocket. Retry tối đa 3 lần nếu lỗi. |
| `reminderNotification` | Mỗi 5 phút | Gửi thông báo nhắc lịch 30 phút trước giờ chiếu (Push FCM + Email). |
| `cleanupExpiredBookings` | Mỗi 10 phút | Xóa booking tạm quá hạn, cập nhật trạng thái. |
| `autoIssueVouchers` | Mỗi ngày 0:00 | 🆕 Phát hành voucher tự động vào dịp lễ/sinh nhật thành viên. |
| `refreshFeaturedCache` | Mỗi 5 phút | 🆕 Cập nhật cache Redis danh sách phim nổi bật. |

### Redis Key Conventions

```
# Khóa ghế
seat:hold:{showId}:{seatId}    → TTL 600s (10 phút), value = customerId

# Booking tạm
booking:temp:{bookingId}       → TTL 600s, value = JSON booking data

# Rate limiting
rate:limit:{ip}                → TTL 900s (15 phút), value = request count

# 🆕 OTP
otp:register:{email}           → TTL 300s (5 phút), value = hashed OTP
otp:reset:{email}              → TTL 300s (5 phút), value = hashed OTP
otp:throttle:{email}           → TTL 900s (15 phút), value = send count (max 3)

# 🆕 JWT Blacklist
jwt:blacklist:{accountId}      → TTL = refresh token TTL, value = invalidatedAt timestamp

# 🆕 Featured Movies Cache
cache:featured:movies          → TTL 300s (5 phút), value = JSON array phim nổi bật
```

### Error Handling

- Tất cả async controller **BẮT BUỘC** wrap trong `try/catch` hoặc dùng `asyncHandler` wrapper.
- KHÔNG BAO GIỜ để unhandled promise rejection.
- Log errors bằng `console.error` hoặc logging library (winston/pino).
- Sử dụng custom error classes:

```javascript
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

// Ví dụ:
throw new AppError('Ghế đã được đặt bởi người khác', 409, 'SEAT_ALREADY_BOOKED');
throw new AppError('Đã quá thời hạn hủy vé', 422, 'CANCELLATION_DEADLINE_PASSED');
throw new AppError('Voucher không hợp lệ hoặc đã hết hạn', 400, 'INVALID_VOUCHER');
throw new AppError('OTP không đúng hoặc đã hết hạn', 400, 'INVALID_OTP');
throw new AppError('Vượt quá giới hạn gửi OTP', 429, 'OTP_THROTTLE_EXCEEDED');
throw new AppError('Vi phạm ràng buộc ghế trống', 422, 'SEAT_CONSTRAINT_VIOLATION');
throw new AppError('Chữ ký HMAC không hợp lệ', 401, 'INVALID_HMAC_SIGNATURE');
```

### 🆕 Payment Gateway Service (Riêng biệt)

Payment Gateway được tách thành **Web API Service độc lập** (port 4000), đảm bảo tính độc lập, dễ mở rộng và bảo trì.

```javascript
// Giao tiếp bảo mật bằng HMAC-SHA256
// API Server → Payment GW: Request + HMAC signature
// Payment GW → API Server: Webhook callback + HMAC signature

// HMAC signing example:
const crypto = require('crypto');
const payload = JSON.stringify({ orderId, amount, currency: 'VND' });
const signature = crypto.createHmac('sha256', PAYMENT_SECRET).update(payload).digest('hex');

// Verify HMAC:
const expectedSignature = crypto.createHmac('sha256', PAYMENT_SECRET).update(rawBody).digest('hex');
if (signature !== expectedSignature) {
  throw new AppError('Chữ ký HMAC không hợp lệ', 401, 'INVALID_HMAC_SIGNATURE');
}
```

**Luồng thanh toán QR:**
1. Main API gửi request tạo thanh toán → Payment GW (kèm HMAC)
2. Payment GW sinh mã QR động (chứa `order_id`, `amount`, TTL đồng bộ Redis lock = 10 phút)
3. Trả QR về Main API → hiển thị cho khách hàng
4. Khách quét QR bằng MoMo/VNPay
5. Payment GW nhận kết quả từ nhà cung cấp
6. Payment GW gửi Webhook callback → Main API (kèm HMAC)
7. Main API verify HMAC → cập nhật đơn hàng + ghế

**Luồng thanh toán thẻ tín dụng:** 🆕
1. Khách nhập thông tin thẻ (Visa/Mastercard/JCB) trên app
2. **KHÔNG lưu trữ thông tin thẻ** (tuân thủ PCI-DSS)
3. Dữ liệu thẻ được mã hóa, gửi trực tiếp đến Payment GW
4. Payment GW xử lý qua cổng thanh toán → Webhook callback tương tự QR

### API Routes Reference

```
# ================================
# AUTH — Xác thực & Đăng ký
# ================================
POST   /api/auth/register              → Đăng ký tài khoản (gửi OTP)
POST   /api/auth/verify-otp            → 🆕 Xác minh OTP đăng ký
POST   /api/auth/resend-otp            → 🆕 Gửi lại OTP (throttle 3/15 phút)
POST   /api/auth/login                 → Đăng nhập (trả JWT Access + Refresh)
POST   /api/auth/refresh-token         → Làm mới Access Token
POST   /api/auth/forgot-password       → 🆕 Gửi OTP đặt lại mật khẩu
POST   /api/auth/reset-password        → 🆕 Xác minh OTP + đặt mật khẩu mới
POST   /api/auth/change-password       → 🆕 Đổi mật khẩu (khi đã đăng nhập)
POST   /api/auth/logout                → 🆕 Đăng xuất (blacklist token)

# ================================
# CUSTOMER — Tài khoản khách hàng
# ================================
GET    /api/customer/profile           → Xem thông tin tài khoản
PUT    /api/customer/profile           → Sửa thông tin (họ tên, SĐT, giới tính, DOB)
PUT    /api/customer/avatar            → Upload ảnh đại diện (Cloudinary)
GET    /api/customer/loyalty-points    → 🆕 Xem điểm tích lũy & lịch sử điểm
GET    /api/customer/vouchers          → 🆕 Xem kho voucher cá nhân

# ================================
# MOVIES — Phim
# ================================
GET    /api/movies                     → Danh sách phim đang chiếu
GET    /api/movies/featured            → 🆕 Danh sách phim nổi bật (từ Redis cache)
GET    /api/movies/search?q=           → Tìm kiếm phim (theo tên, thể loại, định dạng)
GET    /api/movies/:id                 → Chi tiết phim
POST   /api/movies/:id/like            → Yêu thích phim
DELETE /api/movies/:id/like            → Bỏ yêu thích

# ================================
# CINEMAS — Rạp & Phòng chiếu
# ================================
GET    /api/cinemas                    → Danh sách cụm rạp
GET    /api/cinemas?cityId=            → Lọc cụm rạp theo thành phố
GET    /api/cinemas/:id                → Chi tiết cụm rạp (kèm phòng chiếu)
GET    /api/cinemas/:id/shows          → Lịch chiếu theo cụm rạp

# ================================
# SHOWS — Suất chiếu
# ================================
GET    /api/shows/:id                  → Chi tiết suất chiếu
GET    /api/shows/:id/seats            → Sơ đồ ghế (kèm trạng thái realtime từ Redis)

# ================================
# BOOKINGS — Đặt vé
# ================================
POST   /api/bookings                   → Tạo đơn đặt vé (khóa ghế Redis 10p)
GET    /api/bookings                   → Lịch sử đặt vé (phân trang)
GET    /api/bookings/:id               → Chi tiết booking
POST   /api/bookings/:id/cancel        → Hủy vé (kiểm tra chính sách % hoàn)

# ================================
# PAYMENT — Thanh toán
# ================================
POST   /api/payments/:bookingId/pay    → Khởi tạo thanh toán (QR hoặc thẻ)
POST   /api/payments/webhook           → Webhook callback từ Payment Gateway (HMAC)
POST   /api/payments/:bookingId/retry  → Retry thanh toán thất bại

# ================================
# PRODUCTS — Sản phẩm đi kèm
# ================================
GET    /api/products                   → Danh sách combo bắp nước

# ================================
# VOUCHERS — Khuyến mãi
# ================================
GET    /api/vouchers                   → Danh sách voucher khả dụng (FEFO sort)
POST   /api/vouchers/apply             → Áp dụng voucher (kiểm tra điều kiện)
GET    /api/vouchers/suggest           → 🆕 Auto-suggest voucher tốt nhất cho đơn hàng

# ================================
# NOTIFICATIONS — Thông báo
# ================================
GET    /api/notifications              → Danh sách thông báo (phân trang)
PUT    /api/notifications/:id/read     → Đánh dấu đã đọc
PUT    /api/notifications/read-all     → 🆕 Đánh dấu tất cả đã đọc
GET    /api/notifications/unread-count → 🆕 Số lượng thông báo chưa đọc

# ================================
# ADMIN — Quản trị
# ================================
# Phim & Lịch chiếu (M1)
POST   /api/admin/movies               → Thêm phim
PUT    /api/admin/movies/:id           → Sửa phim (tên, mô tả, thể loại, poster, trailer, định dạng)
DELETE /api/admin/movies/:id           → Xóa phim (soft delete: is_active = 0)
PUT    /api/admin/movies/:id/featured  → 🆕 Đánh dấu/bỏ phim nổi bật (is_featured, featured_order)
POST   /api/admin/shows                → Tạo suất chiếu (kiểm tra xung đột thời gian)
PUT    /api/admin/shows/:id            → 🆕 Cập nhật suất chiếu (chỉ nếu chưa có vé)
DELETE /api/admin/shows/:id            → 🆕 Xóa suất chiếu (kiểm tra không có vé)

# Rạp & Sơ đồ ghế (M1)
POST   /api/admin/cinemas              → Thêm cụm rạp (tên, địa chỉ, thành phố, GPS)
PUT    /api/admin/cinemas/:id          → 🆕 Sửa thông tin cụm rạp
PUT    /api/admin/cinemas/:id/halls    → Cấu hình phòng chiếu
PUT    /api/admin/halls/:id/seats      → Thiết lập sơ đồ ghế (ma trận, loại ghế, lối đi, phụ thu)

# Khuyến mãi (M6)
POST   /api/admin/vouchers             → Tạo voucher (%, VNĐ, ràng buộc, thời hạn)
PUT    /api/admin/vouchers/:id         → Cập nhật voucher
DELETE /api/admin/vouchers/:id         → 🆕 Xóa/vô hiệu hóa voucher

# Tài khoản
PUT    /api/admin/accounts/:id/status  → Kích hoạt / vô hiệu hóa tài khoản

# 🆕 Thống kê & Báo cáo (M8)
GET    /api/admin/stats/revenue        → Báo cáo doanh thu (theo phim/suất chiếu/khoảng thời gian)
GET    /api/admin/stats/tickets        → Thống kê vé bán ra
GET    /api/admin/stats/accounts       → Thống kê tài khoản mới

# 🆕 Nhật ký & Cài đặt (M8)
GET    /api/admin/audit-logs           → Xem nhật ký thao tác (chỉ SUPER_ADMIN)
GET    /api/admin/settings             → Xem cài đặt hệ thống
PUT    /api/admin/settings             → Cập nhật cài đặt (giá, điểm, chính sách hoàn vé)
```

---

## V. Mobile App — React Native

### Quy tắc chung

- Sử dụng **Functional Components** + **Hooks**. KHÔNG dùng Class Components.
- State management: **Redux Toolkit** — nhất quán xuyên suốt ứng dụng.
- Navigation: **React Navigation v6+** (Stack Navigator + Bottom Tab Navigator).
- HTTP client: **Axios** với interceptors cho JWT token (auto refresh khi hết hạn 15 phút).
- KHÔNG inline styles phức tạp. Dùng `StyleSheet.create()` ở cuối file.
- Mỗi screen component đặt trong 1 file riêng, đặt tên PascalCase: `LoginScreen.js`, `SeatSelectionScreen.js`.

### 🔄 Chiến lược Lưu trữ Local (Local Storage Strategy)

Project sử dụng **3 cơ chế lưu trữ khác nhau** trên thiết bị, tùy theo loại dữ liệu:

| Cơ chế | Thư viện | Dùng cho | Lý do |
|--------|---------|----------|-------|
| **Secure Store** | `expo-secure-store` | Access Token, Refresh Token | 🔒 Mã hóa AES-256 (iOS Keychain / Android Keystore). Token là dữ liệu nhạy cảm, **KHÔNG được lưu bằng AsyncStorage** (plaintext). |
| **SQLite** | `expo-sqlite` | Lịch sử vé (BookingHistory), danh sách phim cache, thông báo, profile | 📊 Dữ liệu có schema nhiều cột, cần query/filter/sort, cập nhật thường xuyên từng trường. SQLite hiệu năng tốt hơn AsyncStorage cho object phức tạp. |
| **Redux Persist** | `@reduxjs/toolkit` | UI state tạm (ghế đang chọn, bước booking hiện tại, filter tìm kiếm) | ⚡ State chỉ cần trong session, mất khi kill app là chấp nhận được. |

> ⚠️ **KHÔNG dùng AsyncStorage** cho bất kỳ mục đích nào trong project này. AsyncStorage đã bị thay thế hoàn toàn bởi Secure Store (cho token) và SQLite (cho dữ liệu phức tạp).

**Ví dụ sử dụng Secure Store (Token):**
```javascript
import * as SecureStore from 'expo-secure-store';

// Lưu token
await SecureStore.setItemAsync('accessToken', token);
await SecureStore.setItemAsync('refreshToken', refreshToken);

// Đọc token
const accessToken = await SecureStore.getItemAsync('accessToken');

// Xóa token (khi logout)
await SecureStore.deleteItemAsync('accessToken');
await SecureStore.deleteItemAsync('refreshToken');
```

**Ví dụ sử dụng SQLite (Dữ liệu phức tạp):**
```javascript
import * as SQLite from 'expo-sqlite';

// Mở database
const db = await SQLite.openDatabaseAsync('movieapp.db');

// Tạo bảng cache phim
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS CachedMovies (
    movieId INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT,
    runtime INTEGER,
    rating REAL,
    posterUrl TEXT,
    isFeatured INTEGER DEFAULT 0,
    cachedAt INTEGER NOT NULL
  )
`);

// Lưu / cập nhật phim cache
await db.runAsync(
  'INSERT OR REPLACE INTO CachedMovies (movieId, title, genre, runtime, rating, posterUrl, isFeatured, cachedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [movie.id, movie.title, movie.genre, movie.runtime, movie.rating, movie.posterUrl, movie.isFeatured ? 1 : 0, Date.now()]
);

// Query phim nổi bật từ cache
const featuredMovies = await db.getAllAsync(
  'SELECT * FROM CachedMovies WHERE isFeatured = 1 ORDER BY title'
);

// Xóa cache cũ (> 1 giờ)
await db.runAsync(
  'DELETE FROM CachedMovies WHERE cachedAt < ?',
  [Date.now() - 3600000]
);
```

**Các bảng SQLite nên tạo trên thiết bị:**

| Bảng SQLite | Mô tả | Cập nhật khi |
|-------------|-------|-------------|
| `CachedMovies` | Cache danh sách phim (offline browsing) | Mở app, pull-to-refresh |
| `BookingHistory` | Lịch sử vé đặt (offline viewing) | Sau mỗi đặt/hủy vé |
| `CachedNotifications` | Thông báo đã tải (offline reading) | Nhận push / mở tab thông báo |
| `UserProfile` | Thông tin profile + loyalty points | Sau mỗi cập nhật profile |

### 🆕 Hiển thị Ảnh — Cache + WebP

**KHÔNG** dùng component `<Image>` mặc định của React Native cho ảnh từ server (poster phim, avatar, combo). Sử dụng **`react-native-fast-image`** để:

- ✅ **Cache ảnh tự động** trên disk (tránh tải lại mỗi lần mở app)
- ✅ **Decode WebP** — nhẹ hơn 25-34% so với JPEG/PNG
- ✅ **Priority loading** — ưu tiên ảnh đang hiển thị trên màn hình
- ✅ **Placeholder** — hiển thị ảnh mờ/skeleton trong lúc tải

```javascript
import FastImage from 'react-native-fast-image';

// Hiển thị poster phim (cache + WebP)
<FastImage
  style={styles.poster}
  source={{
    uri: movie.posterUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,  // Cache vĩnh viễn (URL có version)
  }}
  resizeMode={FastImage.resizeMode.cover}
  defaultSource={require('../../assets/images/placeholder-movie.png')}
/>

// Hiển thị avatar (cache + cập nhật khi URL thay đổi)
<FastImage
  style={styles.avatar}
  source={{
    uri: user.avatarUrl,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.web,  // Theo HTTP cache headers (etag/max-age)
  }}
  resizeMode={FastImage.resizeMode.cover}
/>

// Preload ảnh (VD: preload poster khi scroll danh sách)
FastImage.preload([
  { uri: 'https://cdn.example.com/poster1.webp' },
  { uri: 'https://cdn.example.com/poster2.webp' },
]);
```

> ⚠️ **Backend (Cloudinary) nên cấu hình trả ảnh format WebP** khi client hỗ trợ: thêm `f_webp,q_auto` vào Cloudinary URL transformation. Ví dụ: `https://res.cloudinary.com/xxx/image/upload/f_webp,q_auto/v1/posters/movie1.jpg`

**Quy tắc dùng FastImage:**
- Mọi `<Image>` hiển thị ảnh từ **URL server** → đổi sang `<FastImage>`
- Ảnh local (assets, icons) → vẫn dùng `<Image>` bình thường
- Dùng `cache: FastImage.cacheControl.immutable` cho ảnh ít thay đổi (poster phim)
- Dùng `cache: FastImage.cacheControl.web` cho ảnh có thể thay đổi (avatar)

### 🆕 Location — Tìm rạp gần nhất

```javascript
import * as Location from 'expo-location';

// Xin quyền + lấy tọa độ hiện tại
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Hiển thị thông báo cần quyền vị trí để tìm rạp gần nhất
  return;
}
const location = await Location.getCurrentPositionAsync({});
const { latitude, longitude } = location.coords;

// Gửi tọa độ lên API để sắp xếp rạp theo khoảng cách
const cinemas = await cinemaService.getAll({ lat: latitude, lng: longitude });
```

### 🆕 Camera / Gallery — Upload Avatar

```javascript
import * as ImagePicker from 'expo-image-picker';

// Chọn ảnh từ thư viện
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],           // Crop vuông cho avatar
    quality: 0.8,             // Nén 80% chất lượng
  });
  if (!result.canceled) {
    await uploadAvatar(result.assets[0].uri);
  }
};

// Chụp ảnh từ camera
const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (!result.canceled) {
    await uploadAvatar(result.assets[0].uri);
  }
};
```

### Naming Conventions

```javascript
// Files — PascalCase cho components/screens, camelCase cho utilities
LoginScreen.js
OTPVerificationScreen.js
ForgotPasswordScreen.js
MovieCard.js
SeatGrid.js
FeaturedCarousel.js
authService.js
useSocket.js
formatCurrency.js

// Components — PascalCase
export default function MovieCard({ movie, onPress }) { ... }
export default function OTPInput({ length, onComplete }) { ... }

// Hooks — 'use' prefix + camelCase
export function useAuth() { ... }
export function useSocket(showId) { ... }

// Redux Slices — camelCase
authSlice.js → state.auth
bookingSlice.js → state.booking
movieSlice.js → state.movie

// Constants — UPPER_SNAKE_CASE
export const SEAT_COLORS = {
  STANDARD: '#4CAF50',
  VIP: '#FF9800',
  COUPLE: '#E91E63',
  HOLDING: '#FFEB3B',
  BOOKED: '#9E9E9E',
  AISLE: 'transparent',
  EMPTY: 'transparent',
  SELECTED: '#2196F3',
};
```

### Cấu trúc Screen

Mỗi screen tuân theo pattern:

```javascript
// screens/booking/SeatSelectionScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import SeatGrid from '../../components/seat/SeatGrid';
import { showService } from '../../services/showService';

export default function SeatSelectionScreen({ route, navigation }) {
  const { showId } = route.params;
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // 1. Fetch initial data
  useEffect(() => { /* ... */ }, [showId]);

  // 2. WebSocket realtime
  useSocket(showId, {
    onSeatHold: (data) => { /* cập nhật ghế bị giữ */ },
    onSeatRelease: (data) => { /* cập nhật ghế được nhả */ },
  });

  // 3. Event handlers
  const handleSeatPress = (seat) => { /* logic chọn ghế + check ràng buộc */ };
  const handleConfirm = () => { /* navigate to ComboScreen */ };

  // 4. Render
  return (
    <View style={styles.container}>
      <SeatGrid seats={seats} selected={selectedSeats} onSeatPress={handleSeatPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
});
```

### Navigation Structure

```
App
├── AuthStack (khi chưa login)
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── OTPVerificationScreen          → 🆕 Nhập OTP xác minh
│   ├── ForgotPasswordScreen           → 🆕 Nhập email
│   └── ResetPasswordScreen            → 🆕 Nhập OTP + mật khẩu mới
│
└── MainTab (khi đã login)
    ├── HomeStack
    │   ├── HomeScreen                  → Phim nổi bật (carousel) + Phim đang chiếu
    │   ├── MovieDetailScreen           → Chi tiết phim + suất chiếu
    │   ├── SearchScreen                → Tìm kiếm phim
    │   ├── CinemaListScreen            → Chọn cụm rạp
    │   ├── ShowtimeScreen              → Chọn suất chiếu
    │   ├── SeatSelectionScreen         → Chọn ghế (realtime) + Bảng giá chi tiết
    │   ├── ComboScreen                 → Chọn bắp nước
    │   ├── VoucherScreen               → 🆕 Chọn/nhập voucher (FEFO gợi ý)
    │   ├── BookingSummaryScreen        → 🆕 Xác nhận thông tin tổng hợp
    │   ├── PaymentScreen               → Thanh toán QR / Thẻ tín dụng
    │   └── PaymentResultScreen         → Kết quả
    │
    ├── TicketStack
    │   ├── TicketHistoryScreen         → Lịch sử vé (phân trang)
    │   └── TicketDetailScreen          → Chi tiết vé + QR code check-in
    │
    ├── NotificationScreen              → Danh sách thông báo
    │
    └── ProfileStack
        ├── ProfileScreen               → Thông tin tài khoản + Loyalty Points
        ├── EditProfileScreen           → Sửa thông tin
        ├── LoyaltyScreen               → 🆕 Lịch sử điểm tích lũy
        ├── MyVouchersScreen            → 🆕 Kho voucher cá nhân
        └── ChangePasswordScreen        → 🆕 Đổi mật khẩu
```

### API Service Pattern

```javascript
// api/axiosInstance.js — Config Axios với interceptors
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'http://YOUR_API_URL/api',
  timeout: 10000,
});

// 🔄 Request interceptor — Đọc JWT token từ Secure Store (mã hóa)
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔄 Response interceptor — Auto refresh token khi hết hạn 15 phút
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          await SecureStore.setItemAsync('accessToken', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config); // Retry original request
        } catch {
          // Refresh thất bại → logout, xóa token khỏi Secure Store
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          // Navigate to LoginScreen
        }
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

```javascript
// services/bookingService.js — Ví dụ service layer
import api from '../api/axiosInstance';

export const bookingService = {
  getSeats: (showId) => api.get(`/shows/${showId}/seats`),
  createBooking: (data) => api.post('/bookings', data),
  getHistory: (page = 1) => api.get(`/bookings?page=${page}`),
  cancelBooking: (bookingId) => api.post(`/bookings/${bookingId}/cancel`),
};
```

---

## VI. Frontend Admin — HTML/CSS/JS

### Quy tắc chung

- Sử dụng **Vanilla JavaScript** (ES6+). KHÔNG dùng framework (React, Vue, Angular).
- Styling bằng **CSS thuần** — có thể dùng CSS Variables cho theme.
- Charts bằng **Chart.js** cho biểu đồ doanh thu, vé bán ra.
- Gọi API bằng `fetch()` hoặc `axios` CDN.
- Layout responsive dùng CSS Grid / Flexbox.
- Đặt tên file HTML theo trang: `movies.html`, `cinemas.html`, `reports.html`.

### Cấu trúc trang Admin

```
index.html              → Dashboard tổng quan (doanh thu, vé hôm nay, biểu đồ)
pages/
├── movies.html         → CRUD phim + Quản lý phim nổi bật (is_featured, featured_order)
├── shows.html          → Quản lý suất chiếu (tạo, sửa, xóa, kiểm tra xung đột)
├── cinemas.html        → Quản lý cụm rạp + phòng chiếu (cấu trúc 3 tầng)
├── seat-layout.html    → Thiết lập sơ đồ ghế (ma trận, loại ghế, lối đi, phụ thu)
├── vouchers.html       → Cấu hình khuyến mãi (%, VNĐ, ràng buộc, phát hành tự động)
├── reports.html        → Báo cáo thống kê + Chart.js (doanh thu theo phim/suất chiếu/thời gian)
├── accounts.html       → Quản lý tài khoản (kích hoạt/vô hiệu)
├── audit-logs.html     → 🆕 Nhật ký thao tác (ai/gì/khi nào/IP) — chỉ SUPER_ADMIN
└── settings.html       → 🆕 Cài đặt hệ thống (giá, điểm tích lũy, chính sách hoàn vé)
```

### Naming Conventions

```javascript
// JS files: camelCase
js/pages/movieManager.js
js/pages/auditLogViewer.js
js/pages/settingsManager.js
js/services/apiService.js
js/components/dataTable.js
js/utils/formatDate.js

// CSS classes: kebab-case, prefix theo module
.admin-sidebar { }
.movie-card { }
.report-chart { }
.seat-grid { }
.btn-primary { }
.modal-overlay { }
.audit-log-entry { }
.settings-form { }

// IDs: camelCase, mô tả rõ element
#movieFormModal
#revenueChart
#seatLayoutGrid
#accountStatusToggle
#auditLogTable
#settingsForm
```

---

## VII. Database — SQL Server

### ERD — Cấu trúc bảng dữ liệu

#### Nhóm Cinema & Hall

```sql
-- City
CREATE TABLE City (
    CityID INT PRIMARY KEY IDENTITY(1,1),
    CityName NVARCHAR(100) NOT NULL
);

-- Cinema (Cụm rạp)
CREATE TABLE Cinema (
    CinemaID INT PRIMARY KEY IDENTITY(1,1),
    CinemaName NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),                       -- 🆕 Địa chỉ cụ thể
    District NVARCHAR(100),                      -- 🆕 Quận/Huyện
    CityID INT NOT NULL FOREIGN KEY REFERENCES City(CityID),
    Latitude DECIMAL(9,6),                       -- GPS
    Longitude DECIMAL(9,6),                      -- GPS
    IsActive BIT DEFAULT 1
);

-- CinemaHall (Phòng chiếu)
CREATE TABLE CinemaHall (
    HallID INT PRIMARY KEY IDENTITY(1,1),
    CinemaID INT NOT NULL FOREIGN KEY REFERENCES Cinema(CinemaID),
    HallName NVARCHAR(100) NOT NULL,
    TotalRows INT NOT NULL,                      -- 🆕 Số hàng ma trận
    TotalCols INT NOT NULL,                      -- 🆕 Số cột ma trận
    TotalSeats INT NOT NULL                      -- Số ghế thực tế (không tính aisle/empty)
);

-- CinemaHallSeat (Ma trận ghế)
CREATE TABLE CinemaHallSeat (
    SeatID INT PRIMARY KEY IDENTITY(1,1),
    HallID INT NOT NULL FOREIGN KEY REFERENCES CinemaHall(HallID),
    SeatNumber NVARCHAR(10) NOT NULL,           -- VD: 'A1', 'B5', 'C10'
    SeatType NVARCHAR(20) NOT NULL,             -- STANDARD | VIP | COUPLE | AISLE | EMPTY
    SeatPrice DECIMAL(10,2) DEFAULT 0,          -- Phụ thu theo loại ghế
    PairID INT NULL,                            -- Liên kết cặp ghế đôi (Couple)
    RowIndex INT NOT NULL,                      -- Tọa độ hàng trong lưới sơ đồ
    ColIndex INT NOT NULL,                      -- Tọa độ cột trong lưới sơ đồ
    IsAisle BIT DEFAULT 0,                      -- Đánh dấu lối đi
    RowVersion INT DEFAULT 0                    -- Optimistic Locking (fallback)
);
```

#### Nhóm Movie & Show

```sql
-- Movie
CREATE TABLE Movie (
    MovieID INT PRIMARY KEY IDENTITY(1,1),
    MovieTitle NVARCHAR(200) NOT NULL,
    MovieGenre NVARCHAR(100),
    MovieLanguage NVARCHAR(50),
    MovieRuntime INT,                           -- Phút
    MovieReleaseDate DATE,
    MovieActor NVARCHAR(500),
    MovieDirector NVARCHAR(200),
    MovieDescription NVARCHAR(2000),            -- 🆕 Mô tả phim
    TrailerUrl NVARCHAR(500),                   -- 🆕 Link trailer YouTube
    Rating DECIMAL(3,1),                        -- 🆕 Rating IMDB
    IsFeatured BIT DEFAULT 0,                   -- 🆕 Phim nổi bật
    FeaturedOrder INT DEFAULT 0,                -- 🆕 Thứ tự hiển thị nổi bật
    IsActive BIT DEFAULT 1                      -- 🆕 Soft delete
    -- Poster lưu trên S3/Cloudinary, không lưu trong DB
);

-- Show (suất chiếu)
CREATE TABLE Show (
    ShowID INT PRIMARY KEY IDENTITY(1,1),
    MovieID INT NOT NULL FOREIGN KEY REFERENCES Movie(MovieID),
    HallID INT NOT NULL FOREIGN KEY REFERENCES CinemaHall(HallID),
    ShowDate DATE NOT NULL,
    ShowTime TIME NOT NULL,
    EndTime TIME NOT NULL,                      -- 🆕 Tự tính = ShowTime + Runtime + 15 phút
    Format NVARCHAR(10) NOT NULL,               -- 2D | 3D | IMAX
    BasePrice DECIMAL(10,2) NOT NULL            -- Giá cơ bản (theo ngày/định dạng)
);
```

#### Nhóm Booking & Seat

```sql
-- Booking
CREATE TABLE Booking (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID),
    ShowID INT NOT NULL FOREIGN KEY REFERENCES Show(ShowID),
    TotalSeats INT NOT NULL,                    -- Số ghế trong đơn
    TotalAmount DECIMAL(10,2) NOT NULL,         -- 🆕 Tổng tiền (sau voucher)
    Status NVARCHAR(20) NOT NULL,               -- PENDING | CONFIRMED | CANCELLED | EXPIRED
    CreatedAt DATETIME DEFAULT GETDATE(),       -- 🆕 Thời điểm tạo đơn
    UpdatedAt DATETIME DEFAULT GETDATE()        -- 🆕 Thời điểm cập nhật
);

-- BookingSeat
CREATE TABLE BookingSeat (
    BookingSeatID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT NOT NULL FOREIGN KEY REFERENCES Booking(BookingID),
    ShowID INT NOT NULL FOREIGN KEY REFERENCES Show(ShowID),
    SeatID INT NOT NULL FOREIGN KEY REFERENCES CinemaHallSeat(SeatID),
    Status NVARCHAR(20) NOT NULL,               -- HOLDING | BOOKED | CANCELLED
    TicketPrice DECIMAL(10,2) NOT NULL,         -- = BasePrice + SeatPrice (+ phụ thu ngày/định dạng)
    HoldUntil DATETIME NULL                     -- Failover khi Redis down
);
```

#### Nhóm Customer & Account

```sql
-- Account
CREATE TABLE Account (
    AccountID INT PRIMARY KEY IDENTITY(1,1),
    AccountName NVARCHAR(100) NOT NULL UNIQUE,  -- Email đăng nhập
    AccountPassword NVARCHAR(255) NOT NULL,     -- Bcrypt hash
    AccountType NVARCHAR(20) NOT NULL,          -- CUSTOMER | ADMIN | SUPER_ADMIN
    IsActive BIT DEFAULT 1,                     -- Trạng thái hoạt động
    IsVerified BIT DEFAULT 0,                   -- 🆕 Đã xác minh OTP chưa
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Customer
CREATE TABLE Customer (
    CustomerID INT PRIMARY KEY IDENTITY(1,1),
    AccountID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Account(AccountID),
    CustomerName NVARCHAR(100) NOT NULL,
    CustomerEmail NVARCHAR(200) NOT NULL,
    CustomerPhone NVARCHAR(20),
    CustomerGender NVARCHAR(10),
    CustomerDOB DATE,
    LoyaltyPoints INT DEFAULT 0,               -- Điểm tích lũy hiện có
    AvatarUrl NVARCHAR(500) NULL                -- Link ảnh S3/Cloudinary
);

-- 🆕 LoyaltyPointHistory (lịch sử cộng/trừ điểm)
CREATE TABLE LoyaltyPointHistory (
    HistoryID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID),
    BookingID INT NULL FOREIGN KEY REFERENCES Booking(BookingID),
    Points INT NOT NULL,                        -- Dương = cộng, Âm = thu hồi
    Type NVARCHAR(20) NOT NULL,                 -- EARNED | REVOKED
    Description NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- LikeMovie (N:N Customer–Movie)
CREATE TABLE LikeMovie (
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID),
    MovieID INT NOT NULL FOREIGN KEY REFERENCES Movie(MovieID),
    IsLiked BIT DEFAULT 1,
    PRIMARY KEY (CustomerID, MovieID)
);
```

#### Nhóm Payment & Voucher

```sql
-- Payment (1:1 với Booking, retry = update Status)
CREATE TABLE Payment (
    PaymentID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Booking(BookingID),
    VoucherID INT NULL FOREIGN KEY REFERENCES Voucher(VoucherID),
    Amount DECIMAL(10,2) NOT NULL,              -- Tổng tiền thanh toán
    DiscountAmount DECIMAL(10,2) DEFAULT 0,     -- 🆕 Số tiền giảm từ voucher
    PaymentMethod NVARCHAR(20),                 -- 🆕 QR_MOMO | QR_VNPAY | CREDIT_CARD
    PaymentDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL,               -- CREATED → PENDING_PAYMENT → PROCESSING → SUCCESS / FAILED / EXPIRED / REFUNDED
    RefundAmount DECIMAL(10,2) DEFAULT 0,       -- 🆕 Số tiền hoàn (khi hủy)
    RefundAt DATETIME NULL                      -- 🆕 Thời điểm hoàn tiền
);

-- Voucher
CREATE TABLE Voucher (
    VoucherID INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    DiscountType NVARCHAR(10) NOT NULL,         -- 🆕 PERCENT | FIXED
    DiscountValue DECIMAL(10,2) NOT NULL,       -- Giá trị giảm (% hoặc VNĐ)
    MaxDiscount DECIMAL(10,2) NULL,             -- 🆕 Giảm tối đa (khi type = PERCENT)
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsActive BIT DEFAULT 1,
    UsageLimit INT NOT NULL,                    -- Giới hạn tổng số lần dùng
    UsageCount INT DEFAULT 0,
    MinTicketQty INT DEFAULT 1,                 -- Số vé tối thiểu
    MinOrderValue DECIMAL(10,2) DEFAULT 0,      -- Giá trị đơn tối thiểu
    ApplicableFormat NVARCHAR(10) DEFAULT 'ALL',-- 🔄 2D | 3D | IMAX | ALL
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- VoucherCustomer (kho voucher của khách)
CREATE TABLE VoucherCustomer (
    VoucherID INT NOT NULL FOREIGN KEY REFERENCES Voucher(VoucherID),
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID),
    AssignedAt DATETIME DEFAULT GETDATE(),       -- 🆕 Thời điểm phát
    PRIMARY KEY (VoucherID, CustomerID)
);

-- VoucherUsage (lịch sử dùng voucher — FEFO tracking)
CREATE TABLE VoucherUsage (
    VUsageID INT PRIMARY KEY IDENTITY(1,1),
    VoucherID INT NOT NULL FOREIGN KEY REFERENCES Voucher(VoucherID),
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID),
    BookingID INT NULL FOREIGN KEY REFERENCES Booking(BookingID), -- 🆕 Liên kết booking
    UsedAt DATETIME DEFAULT GETDATE()
);
```

#### Nhóm Product & Notification

```sql
-- Product (combo bắp nước)
CREATE TABLE Product (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(200) NOT NULL,
    ProductDescription NVARCHAR(500),           -- Mô tả sản phẩm
    ProductPrice DECIMAL(10,2) NOT NULL,
    ImageProduct NVARCHAR(500),                 -- Link ảnh S3/Cloudinary
    IsActive BIT DEFAULT 1                      -- 🆕 Soft delete
);

-- BookingProduct (N:N Booking–Product)
CREATE TABLE BookingProduct (
    BookingProductID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT NOT NULL FOREIGN KEY REFERENCES Booking(BookingID),
    ProductID INT NOT NULL FOREIGN KEY REFERENCES Product(ProductID),
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NOT NULL            -- 🆕 Giá tại thời điểm đặt
);

-- Notification
CREATE TABLE Notification (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customer(CustomerID),
    Title NVARCHAR(200),                        -- 🆕 Tiêu đề
    Message NVARCHAR(500) NOT NULL,
    Type NVARCHAR(30),                          -- 🆕 BOOKING | PAYMENT | REMINDER | PROMO | SYSTEM
    DateSend DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0
);
```

#### 🆕 Nhóm Audit Log & System Settings

```sql
-- AuditLog (Nhật ký thao tác)
CREATE TABLE AuditLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    AccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    Action NVARCHAR(100) NOT NULL,              -- VD: 'CREATE_MOVIE', 'UPDATE_SHOW', 'DELETE_VOUCHER'
    TableName NVARCHAR(50),                     -- Bảng bị ảnh hưởng
    RecordID INT,                               -- ID record bị ảnh hưởng
    OldValue NVARCHAR(MAX),                     -- Snapshot JSON trước thay đổi
    NewValue NVARCHAR(MAX),                     -- Snapshot JSON sau thay đổi
    IPAddress NVARCHAR(45),                     -- IP người thực hiện
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- SystemSettings (Cài đặt hệ thống — cấu hình linh hoạt)
CREATE TABLE SystemSettings (
    SettingID INT PRIMARY KEY IDENTITY(1,1),
    SettingKey NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(500) NOT NULL,
    Description NVARCHAR(500),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    UpdatedBy INT NULL FOREIGN KEY REFERENCES Account(AccountID)
);

-- Dữ liệu mẫu SystemSettings
INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES
('LOYALTY_POINTS_RATE', '1000', 'Tỷ lệ: mỗi X đồng = 1 điểm'),
('CANCEL_FULL_REFUND_HOURS', '24', 'Hoàn 100% nếu hủy trước X giờ'),
('CANCEL_PARTIAL_REFUND_HOURS', '2', 'Hoàn 70% nếu hủy trước X giờ (và sau mốc FULL)'),
('CANCEL_FULL_REFUND_PERCENT', '100', 'Phần trăm hoàn khi hủy sớm'),
('CANCEL_PARTIAL_REFUND_PERCENT', '70', 'Phần trăm hoàn khi hủy muộn'),
('WEEKEND_SURCHARGE', '30000', 'Phụ thu cuối tuần (VNĐ)'),
('FORMAT_3D_SURCHARGE', '25000', 'Phụ thu định dạng 3D (VNĐ)'),
('FORMAT_IMAX_SURCHARGE', '50000', 'Phụ thu định dạng IMAX (VNĐ)'),
('SEAT_VIP_SURCHARGE', '30000', 'Phụ thu ghế VIP (VNĐ)'),
('SEAT_COUPLE_SURCHARGE', '50000', 'Phụ thu ghế Couple (VNĐ)'),
('SEAT_HOLD_TTL_SECONDS', '600', 'Thời gian khóa ghế tạm (giây)'),
('OTP_TTL_SECONDS', '300', 'Thời gian hiệu lực OTP (giây)'),
('OTP_MAX_RESEND', '3', 'Số lần gửi lại OTP tối đa'),
('OTP_THROTTLE_SECONDS', '900', 'Thời gian throttle gửi OTP (giây)');
```

### Quy tắc Database

- **KHÔNG** lưu file ảnh trực tiếp vào DB. Chỉ lưu URL (S3/Cloudinary).
- **KHÔNG** lưu password dạng plaintext. Luôn hash bằng bcryptjs.
- **KHÔNG** lưu thông tin thẻ tín dụng (tuân thủ PCI-DSS).
- Booking–Payment là **1:1**. Khi retry thanh toán, **CẬP NHẬT** `Payment.Status` thay vì tạo bản ghi mới.
- FK Voucher–Payment: `Payment.VoucherID → Voucher` (N:1, nullable). KHÔNG phải ngược lại.
- 🔄 **Redis Distributed Lock** (SET NX) là cơ chế khóa ghế **chính**. **KHÔNG dùng SQL UPDLOCK** để tránh deadlock.
- `CinemaHallSeat.RowVersion` dùng cho **Optimistic Locking** chỉ ở bước cuối confirm (fallback).
- Dùng `BookingSeat.HoldUntil` làm **failover** khi Redis down — Job Scheduler query `WHERE HoldUntil < NOW()`.
- 🆕 **SystemSettings**: Toàn bộ chính sách (giá, hoàn vé, tích lũy) lưu DB — **KHÔNG hardcode** trong code.
- 🆕 **AuditLog**: Ghi log cho mọi thao tác admin (trước/sau thay đổi dạng JSON).
- Tên bảng và cột theo **PascalCase** nhất quán với ERD.
- Migrations đặt tên theo thứ tự: `001_create_city_cinema.sql`, `002_create_movie_show.sql`, ...

---

## VIII. Quy tắc Nghiệp vụ

### 1. Công thức tính giá vé (Chi tiết)

```
TicketPrice = BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge
```

| Thành phần | Mô tả | Ví dụ |
|-----------|-------|-------|
| `BasePrice` | Giá cơ bản suất chiếu (ngày thường, 2D) | 75.000đ |
| `WeekendSurcharge` | Phụ thu Thứ 7 / Chủ nhật | +30.000đ (cấu hình trong SystemSettings) |
| `FormatSurcharge` | Phụ thu theo định dạng | 2D: +0đ · 3D: +25.000đ · IMAX: +50.000đ |
| `SeatSurcharge` | Phụ thu theo loại ghế | Standard: +0đ · VIP: +30.000đ · Couple: +50.000đ |

**Ví dụ:** Ghế VIP, suất chiếu 3D, Chủ nhật = 75.000 + 30.000 + 25.000 + 30.000 = **160.000đ**

> ⚠️ **Tất cả mức phụ thu được lưu trong bảng `SystemSettings`**, admin có thể thay đổi qua giao diện mà không cần deploy lại code.

| Loại ghế | SeatType | Phụ thu mặc định |
|----------|----------|-----------------|
| Ghế thường | `STANDARD` | 0đ |
| Ghế VIP | `VIP` | +30.000đ |
| Ghế đôi | `COUPLE` | +50.000đ |
| Lối đi | `AISLE` | N/A (không thể đặt, `IsAisle=1`) |
| Khu trống | `EMPTY` | N/A (dành cho thiết bị chiếu) |

### 2. Ràng buộc chọn ghế (Lonely Seat Rule — Mở rộng)

🔄 Hệ thống **KHÔNG** cho phép chọn ghế nếu:

**Luật 1 — Cấm 1 ghế trống đơn lẻ:**
Không được tạo ra đúng **1 khoảng trống đơn lẻ** giữa các ghế đã đặt hoặc sát mép tường/lối đi.

```
✗ [Đặt] [Trống] [Đặt]        → KHÔNG hợp lệ (1 ghế đơn lẻ giữa)
✗ [Tường] [Trống] [Đặt]      → KHÔNG hợp lệ (1 ghế đơn lẻ sát mép)
✓ [Đặt] [Đặt] [Trống]        → Hợp lệ
✓ [Đặt] [Đặt] [Đặt]          → Hợp lệ
```

🆕 **Luật 2 — Cấm 2 ghế trống liên tiếp bị kẹp:**
Không được tạo ra **2 ghế trống liên tiếp** bị kẹp giữa các ghế đã đặt hoặc sát mép tường/lối đi ở cả hai bên.

```
✗ [Đặt] [Trống] [Trống] [Đặt]     → KHÔNG hợp lệ (2 ghế trống bị kẹp giữa)
✗ [Tường] [Trống] [Trống] [Đặt]   → KHÔNG hợp lệ (2 ghế trống bị kẹp sát mép)
✓ [Đặt] [Trống] [Trống] [Trống]   → Hợp lệ (≥3 ghế trống liên tiếp, không bị kẹp)
```

> **Mục tiêu:** Đảm bảo không có ghế trống lẻ hoặc cặp ghế trống bị cô lập, gây bất tiện cho khách hàng khác.

**Khi phát hiện vi phạm:**
- ⚠️ Hiển thị cảnh báo rõ ràng trên giao diện
- Yêu cầu khách hàng điều chỉnh lựa chọn trước khi tiếp tục
- Validation phải chạy ở **cả frontend (UX)** và **backend (bảo mật)**

### 3. Quy trình đặt vé 6 bước (Booking Flow)

```
Bước 1: Chọn Phim & Lịch Chiếu
  → Chọn phim → cụm rạp → ngày & giờ chiếu → định dạng (2D/3D/IMAX)

Bước 2: Chọn Ghế + Ràng buộc
  → Hiển thị sơ đồ ghế realtime (WebSocket)
  → Kiểm tra ràng buộc Lonely Seat Rule (Luật 1 + Luật 2)

Bước 3: Tính Giá Vé (🆕)
  → Tính giá từng ghế = BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge
  → Hiển thị bảng chi tiết giá từng ghế + tổng cộng

Bước 4: Chọn Sản phẩm đi kèm
  → Bắp / Nước / Combo
  → Chọn số lượng → Cập nhật tổng tiền tạm tính

Bước 5: Áp dụng Khuyến mãi
  → Auto-suggest voucher FEFO (sắp hết hạn nhất)
  → Hoặc nhập mã thủ công
  → Kiểm tra điều kiện → Cập nhật giá sau giảm

Bước 6: Xác nhận & Khóa ghế
  → Hiển thị thông tin tổng hợp
  → Xác nhận → Khóa ghế Redis (SET NX, TTL 10p)
  → Ghi PENDING_PAYMENT vào DB
  → Broadcast WebSocket: ghế → HOLDING
  → Chuyển sang thanh toán
```

### 4. Cơ chế Khóa ghế — Redis Distributed Lock

🔄 **KHÔNG dùng SQL UPDLOCK** (tránh deadlock, giảm hiệu năng dưới tải cao).

```javascript
// 1. Khóa ghế bằng Redis SET NX (atomic)
const lockKey = `seat:hold:${showId}:${seatId}`;
const result = await redis.set(lockKey, customerId, 'EX', 600, 'NX');
// NX = chỉ SET nếu key chưa tồn tại → ngăn race condition

if (!result) {
  throw new AppError('Ghế đã được giữ bởi người khác', 409, 'SEAT_ALREADY_HELD');
}

// 2. Sau khi lock Redis thành công, MỚI ghi xuống Database
await db.query(`
  INSERT INTO BookingSeat (BookingID, ShowID, SeatID, Status, TicketPrice, HoldUntil)
  VALUES (@bookingId, @showId, @seatId, 'HOLDING', @ticketPrice, DATEADD(MINUTE, 10, GETDATE()))
`);

// 3. Broadcast WebSocket
io.to(`show_${showId}`).emit('seat:hold', { showId, seatId, status: 'HOLDING', holdBy: customerId });
```

### 5. State Machine thanh toán (Payment.Status)

```
CREATED → PENDING_PAYMENT → PROCESSING → SUCCESS
                                       ↘ FAILED → (retry) → PENDING_PAYMENT
         (hết 10 phút) → EXPIRED
         SUCCESS → (hủy vé) → REFUNDED
```

| Trạng thái | Mô tả | Hành động tiếp theo |
|------------|--------|---------------------|
| `CREATED` | Đơn vừa khởi tạo | Chờ khách xác nhận → `PENDING_PAYMENT` |
| `PENDING_PAYMENT` | Đang chờ quét QR / thanh toán thẻ | Thanh toán → `PROCESSING` · Hết 10p → `EXPIRED` |
| `PROCESSING` | Gateway đang xử lý | OK → `SUCCESS` · Lỗi → `FAILED` |
| `SUCCESS` | Hoàn tất | Cộng LoyaltyPoints + Email + Push FCM + Xóa Redis lock |
| `FAILED` | Thất bại | Rollback (nhả ghế). Cho phép retry → `PENDING_PAYMENT` |
| `EXPIRED` | Quá hạn 10 phút | Background Job: xóa Redis + nhả ghế + broadcast |
| `REFUNDED` | Đã hoàn tiền | Khi hủy vé hoặc sự cố: hoàn tiền + thu hồi điểm |

### 6. Voucher Engine FEFO (First Expired, First Out)

Khi mở giỏ hàng, hệ thống tự động gợi ý voucher sắp hết hạn nhất. Điều kiện check:

```sql
SELECT v.*, vc.AssignedAt FROM Voucher v
JOIN VoucherCustomer vc ON v.VoucherID = vc.VoucherID
WHERE vc.CustomerID = @CustomerID
  AND v.IsActive = 1
  AND v.MinOrderValue <= @TotalAmount              -- Giá trị đơn tối thiểu
  AND v.MinTicketQty <= @TotalSeats                -- Số vé tối thiểu
  AND v.ApplicableFormat IN (@ShowFormat, 'ALL')   -- Định dạng phim
  AND GETDATE() BETWEEN v.StartDate AND v.EndDate  -- Còn hiệu lực
  AND v.UsageCount < v.UsageLimit                  -- Còn lượt dùng
  AND NOT EXISTS (                                  -- Chưa dùng voucher này
    SELECT 1 FROM VoucherUsage vu
    WHERE vu.VoucherID = v.VoucherID AND vu.CustomerID = @CustomerID
  )
ORDER BY v.EndDate ASC;                             -- FEFO: ưu tiên sắp hết hạn
```

🆕 **Cấu hình voucher lưu linh hoạt trong DB** — Admin tự cấu hình qua giao diện, **KHÔNG hardcode** trong code:
- Loại giảm: Phần trăm (%) hoặc Số tiền cố định (VNĐ)
- Giảm tối đa (khi type = PERCENT)
- Ràng buộc: giá trị đơn tối thiểu, số lượng vé, định dạng phim, thời hạn hiệu lực
- Phát hành tự động: khi mua ≥ N vé, dịp lễ tết, sinh nhật thành viên

### 7. Hủy vé (Cancellation Rules) — Chính sách hoàn tiền

🆕 Chính sách hoàn tiền được **cấu hình bởi Admin** trong bảng `SystemSettings`:

| Điều kiện | Mức hoàn | Mặc định |
|-----------|---------|----------|
| Hủy **> 24 giờ** trước chiếu | ✅ Hoàn 100% | `CANCEL_FULL_REFUND_HOURS = 24` |
| Hủy **2–24 giờ** trước chiếu | ⚠️ Hoàn 70% | `CANCEL_PARTIAL_REFUND_HOURS = 2` |
| Hủy **< 2 giờ** hoặc sau khi chiếu | ❌ Không được hủy | — |

**Khi hủy vé thành công, hệ thống thực hiện:**
1. `Booking.Status` → `CANCELLED`
2. `BookingSeat.Status` → `CANCELLED`
3. Broadcast WebSocket: ghế → `AVAILABLE`
4. Khởi tạo hoàn tiền qua Payment Gateway (nếu `Payment.Status = SUCCESS`)
5. 🆕 Thu hồi điểm tích lũy tương ứng (LoyaltyPointHistory type = `REVOKED`)
6. 🆕 Khôi phục voucher (nếu đủ điều kiện: `VoucherUsage` → delete, `Voucher.UsageCount` -= 1)

### 8. 🆕 Điểm Tích Lũy (Loyalty Points)

```
Tỷ lệ: 1.000đ = 1 điểm (cấu hình trong SystemSettings: LOYALTY_POINTS_RATE)
```

| Sự kiện | Hành động | Bảng ảnh hưởng |
|---------|----------|---------------|
| Thanh toán thành công | Cộng điểm = TotalAmount / LOYALTY_POINTS_RATE | `Customer.LoyaltyPoints += X`, `LoyaltyPointHistory (EARNED)` |
| Hủy vé / Hoàn tiền | Thu hồi điểm đã cộng | `Customer.LoyaltyPoints -= X`, `LoyaltyPointHistory (REVOKED)` |

### 9. Optimistic Locking (Fallback — Chống đặt trùng ghế offline)

```javascript
// Khi xác nhận thanh toán, kiểm tra RowVersion (fallback khi có quầy offline)
const seat = await db.query(
  'SELECT RowVersion FROM CinemaHallSeat WHERE SeatID = @seatId'
);

const result = await db.query(`
  UPDATE CinemaHallSeat
  SET RowVersion = RowVersion + 1
  WHERE SeatID = @seatId AND RowVersion = @currentVersion
`);

if (result.rowsAffected === 0) {
  // RowVersion đã thay đổi → ghế đã bị đặt offline bởi người khác
  // Trigger luồng Rollback: hoàn tiền + giải phóng ghế + email thông báo
  throw new AppError('Ghế đã được bán offline', 409, 'SEAT_VERSION_CONFLICT');
}
```

### 10. 🆕 Luồng Rollback (Hoàn tiền sự cố)

Khi đã trừ tiền nhưng ghế bị bán ở quầy offline:

```
1. Phát hiện conflict (RowVersion mismatch)
2. Tự động kích hoạt luồng Refund:
   ├── Payment Gateway gửi lệnh hoàn tiền
   ├── Payment.Status → REFUNDED
   ├── Booking.Status → CANCELLED
   ├── Giải phóng ghế Redis + DB
   ├── Thu hồi điểm tích lũy
   └── Gửi email thông báo hoàn tiền cho khách
```

---

## IX. Testing & Verification

### Backend Testing

```bash
# Cài dependencies
cd backend && npm install

# Chạy server development
npm run dev                     # nodemon, port 3000

# Chạy tests
npm test                        # Jest / Mocha
npm run test:unit               # Unit tests (services, utils)
npm run test:integration        # Integration tests (API endpoints)
```

### Payment Gateway Testing

```bash
# Cài dependencies
cd payment-gateway && npm install

# Chạy server development
npm run dev                     # nodemon, port 4000
```

### Test Checklist

- [ ] Auth: Đăng ký + OTP, đăng nhập, JWT Access/Refresh, phân quyền CUSTOMER/ADMIN/SUPER_ADMIN
- [ ] Auth: Quên mật khẩu (7 bước), đổi mật khẩu + blacklist JWT cũ
- [ ] Auth: OTP throttle (tối đa 3/15 phút), OTP TTL 5 phút
- [ ] Movies: CRUD phim, tìm kiếm, yêu thích, phim nổi bật (cache Redis)
- [ ] Cinemas: Danh sách cụm rạp 3 tầng, lọc theo thành phố, sơ đồ ghế ma trận
- [ ] Booking: Tạo đơn, khóa ghế Redis 10p (SET NX), check Lonely Seat Rule (Luật 1+2)
- [ ] Booking: Tính giá chi tiết (base + ngày + định dạng + loại ghế)
- [ ] Payment: Thanh toán QR flow + thẻ tín dụng, HMAC verify, state machine, retry, rollback
- [ ] Payment Gateway: Sinh QR động, webhook callback, HMAC signing/verify
- [ ] Voucher: FEFO engine, auto-suggest, apply voucher, check điều kiện, khôi phục khi hủy
- [ ] Loyalty: Cộng/thu hồi điểm, lịch sử điểm
- [ ] WebSocket: Realtime seat updates (hold/release/booked), broadcast đúng room
- [ ] Jobs: Giải phóng ghế hết hạn (atomicity, retry 3 lần), nhắc lịch 30p (Push FCM)
- [ ] Notification: Email (vé, OTP, hoàn tiền), Push FCM (đặt vé, nhắc chiếu, phim mới)
- [ ] Admin: CRUD phim/rạp/suất chiếu, báo cáo doanh thu (Chart.js), quản lý voucher
- [ ] Admin: Audit Log (ghi/xem), SystemSettings (cấu hình giá/hoàn vé/điểm)
- [ ] Hủy vé: Chính sách % hoàn (>24h=100%, 2-24h=70%, <2h=từ chối), thu hồi điểm, khôi phục voucher

### Mobile Testing

```bash
# Cài dependencies
cd mobile-app && npm install

# Chạy Metro bundler
npx react-native start

# Chạy trên thiết bị/simulator
npx react-native run-android
npx react-native run-ios
```

### Database Testing

```bash
# Chạy migrations
cd database
sqlcmd -S localhost -d MovieTicketDB -i migrations/001_create_city_cinema.sql

# Chạy seed data
sqlcmd -S localhost -d MovieTicketDB -i seeds/sample_data.sql
```

### Verification Commands

```bash
# Kiểm tra backend chạy OK
curl http://localhost:3000/api/health

# Kiểm tra Payment Gateway chạy OK
curl http://localhost:4000/api/health

# Kiểm tra Redis connection
redis-cli ping    # → PONG

# Kiểm tra SQL Server connection
sqlcmd -S localhost -Q "SELECT 1"
```

---

## X. Git & Workflow

### Branch Naming

```
main                          # Production-ready
develop                       # Integration branch
feature/auth-otp              # Tính năng mới
feature/booking-flow
feature/seat-realtime
feature/voucher-fefo
feature/payment-gateway
feature/admin-reports
feature/admin-audit-log
feature/loyalty-points
feature/push-notification
bugfix/payment-retry
hotfix/seat-lock-race
```

### Commit Convention

```
feat: thêm API đặt vé và khóa ghế tạm 10 phút
feat: thêm OTP đăng ký và quên mật khẩu
feat: thêm Payment Gateway Service với HMAC
fix: sửa lỗi race condition khi 2 người đặt cùng ghế
fix: sửa ràng buộc 2 ghế trống liên tiếp
refactor: tách business logic booking sang service layer
docs: cập nhật API documentation endpoint thanh toán
style: format code theo ESLint rules
test: thêm unit test cho voucher FEFO engine
chore: cập nhật dependencies, cấu hình Docker
```

### PR Checklist

- [ ] Code follows naming conventions trong AGENTS.md
- [ ] API response format thống nhất (success/error)
- [ ] Input validation có ở cả frontend và backend
- [ ] Xử lý error đầy đủ (try/catch, AppError)
- [ ] WebSocket events broadcast đúng room
- [ ] Database queries có parameterized (chống SQL injection)
- [ ] Không commit `.env`, `node_modules`, files tạm
- [ ] HMAC signing/verify đúng cho Payment Gateway
- [ ] Audit Log ghi đầy đủ cho thao tác admin
- [ ] Đã test trên local trước khi push

### Environment Variables (.env.example) — Main API

```env
# Server
PORT=3000
NODE_ENV=development

# Database — SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_password
DB_NAME=MovieTicketDB

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Firebase FCM (Push Notification)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Payment Gateway Service
PAYMENT_GW_URL=http://localhost:4000
PAYMENT_GW_HMAC_SECRET=your_hmac_secret_key

# WebSocket
WS_CORS_ORIGIN=http://localhost:3001
```

### Environment Variables (.env.example) — Payment Gateway

```env
# Server
PORT=4000
NODE_ENV=development

# HMAC Secret (phải giống Main API)
HMAC_SECRET=your_hmac_secret_key

# Payment Providers
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret

# Main API Webhook URL
MAIN_API_WEBHOOK_URL=http://localhost:3000/api/payments/webhook

# QR TTL (đồng bộ với Redis seat hold)
QR_TTL_SECONDS=600
```

---

## XI. Phân công Nhiệm vụ — 5 Thành viên

### Tổng quan phân công

```
┌──────────────────────────────────────────────────────────────────┐
│                    HỆ THỐNG ĐẶT VÉ XEM PHIM                    │
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│   TV1    │   TV2    │   TV3    │   TV4    │        TV5           │
│Auth+User │Movie+Rạp│Booking+  │Payment+  │  Admin Panel +       │
│+Bảo mật │+Lịch chiếu│Ghế RT  │Voucher+  │  Reports + DB        │
│          │          │          │Thông báo │                      │
└──────────┴──────────┴──────────┴──────────┴──────────────────────┘
```

---

### TV1 — Auth, Người dùng & Bảo mật

**Module phụ trách:** M8 (Quản Lý Người Dùng)

**Backend:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Đăng ký + OTP | `POST /auth/register`, `POST /auth/verify-otp`, `POST /auth/resend-otp` | Tạo tài khoản, sinh OTP 6 số, gửi email, xác minh, throttle 3/15p |
| Đăng nhập | `POST /auth/login`, `POST /auth/refresh-token`, `POST /auth/logout` | JWT Access (15p) + Refresh (7d), check IsActive + IsVerified |
| Quên mật khẩu | `POST /auth/forgot-password`, `POST /auth/reset-password` | 7 bước, OTP TTL 5p, blacklist JWT cũ |
| Đổi mật khẩu | `POST /auth/change-password` | Xác minh MK cũ, hash MK mới, blacklist JWT |
| Hồ sơ khách hàng | `GET/PUT /customer/profile`, `PUT /customer/avatar` | Sửa thông tin, upload ảnh Cloudinary |
| Điểm tích lũy | `GET /customer/loyalty-points` | Xem điểm + lịch sử |
| Kho voucher | `GET /customer/vouchers` | Danh sách voucher cá nhân |

**Middleware:**
- `authMiddleware` — Xác thực JWT, kiểm tra blacklist
- `roleMiddleware` — Phân quyền RBAC (CUSTOMER / ADMIN / SUPER_ADMIN)
- `rateLimitMiddleware` — Rate limiting (100 req/15 phút/IP)
- `errorHandler` — Global error handler (AppError)
- `asyncHandler` — Wrapper try/catch cho async controllers

**Cấu hình:**
- `config/db.js` — Kết nối SQL Server (mssql)
- `config/redis.js` — Kết nối Redis (ioredis)
- `config/jwt.js` — JWT secret, TTL
- `config/cloudinary.js` — Cloudinary upload
- `config/email.js` — Nodemailer SMTP

**Mobile:**
- `LoginScreen`, `RegisterScreen`, `OTPVerificationScreen`
- `ForgotPasswordScreen`, `ResetPasswordScreen`
- `ProfileScreen`, `EditProfileScreen`, `ChangePasswordScreen`
- `LoyaltyScreen`, `MyVouchersScreen`
- `authSlice.js` (Redux), `useAuth` hook
- Axios interceptors (auto refresh token)

**Database:**
- Bảng: `Account`, `Customer`, `LoyaltyPointHistory`

---

### TV2 — Phim, Rạp & Lịch Chiếu

**Module phụ trách:** M1 (Quản Lý Phim & Lịch Chiếu), M2 (Tìm Kiếm & Xem Phim)

**Backend:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Danh sách phim | `GET /movies`, `GET /movies/featured` | Phim đang chiếu, phim nổi bật (Redis cache TTL 5p) |
| Tìm kiếm phim | `GET /movies/search?q=` | Full-text search theo tên, thể loại, định dạng |
| Chi tiết phim | `GET /movies/:id` | Poster, trailer, mô tả, rating |
| Yêu thích phim | `POST/DELETE /movies/:id/like` | Like/Unlike |
| Danh sách rạp | `GET /cinemas`, `GET /cinemas?cityId=` | Cụm rạp, lọc theo thành phố/quận |
| Chi tiết rạp | `GET /cinemas/:id`, `GET /cinemas/:id/shows` | Phòng chiếu, lịch chiếu theo rạp |
| Suất chiếu | `GET /shows/:id`, `GET /shows/:id/seats` | Chi tiết suất chiếu, sơ đồ ghế |
| Admin CRUD phim | `POST/PUT/DELETE /admin/movies`, `PUT /admin/movies/:id/featured` | Thêm/sửa/xóa phim, phim nổi bật |
| Admin suất chiếu | `POST/PUT/DELETE /admin/shows` | Tạo/sửa/xóa suất chiếu, kiểm tra xung đột thời gian |
| Admin rạp | `POST/PUT /admin/cinemas`, `PUT /admin/cinemas/:id/halls` | Quản lý cụm rạp, phòng chiếu |
| Admin sơ đồ ghế | `PUT /admin/halls/:id/seats` | Ma trận ghế, loại ghế, lối đi, phụ thu |

**Nghiệp vụ đặc biệt:**
- Kiểm tra xung đột thời gian khi tạo suất chiếu (cùng phòng chiếu)
- Tự tính `EndTime = ShowTime + MovieRuntime + 15 phút`
- Chỉ cho phép sửa/xóa suất chiếu nếu chưa có vé đặt
- Cache danh sách phim nổi bật vào Redis (TTL 5 phút)
- Job `refreshFeaturedCache` — cập nhật cache phim nổi bật

**Mobile:**
- `HomeScreen` (phim nổi bật carousel + danh sách phim)
- `MovieDetailScreen`, `SearchScreen`
- `CinemaListScreen`, `ShowtimeScreen`
- `movieSlice.js` (Redux), các components: `MovieCard`, `FeaturedCarousel`

**Database:**
- Bảng: `City`, `Cinema`, `CinemaHall`, `CinemaHallSeat`, `Movie`, `Show`, `LikeMovie`

---

### TV3 — Đặt Vé, Ghế Realtime & Background Jobs

**Module phụ trách:** M3 (Đặt Vé), M5 (Hủy & Xử Lý Quá Hạn)

**Backend:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Tạo đơn đặt vé | `POST /bookings` | Validate ghế + ràng buộc Lonely Seat (Luật 1+2) + khóa Redis (SET NX) |
| Lịch sử vé | `GET /bookings`, `GET /bookings/:id` | Danh sách đặt vé (phân trang), chi tiết |
| Hủy vé | `POST /bookings/:id/cancel` | Kiểm tra chính sách % hoàn, giải phóng ghế, thu hồi điểm, khôi phục voucher |
| Sản phẩm combo | `GET /products` | Danh sách bắp nước |

**WebSocket (Socket.IO):**
- Setup Socket.IO server
- Room management: `show_{showId}`
- Events: `seat:hold`, `seat:release`, `seat:booked`, `booking:expired`
- Broadcast trạng thái ghế realtime

**Redis Distributed Lock:**
- Khóa ghế: `SET seat:hold:{showId}:{seatId} {customerId} EX 600 NX`
- Giải phóng ghế: `DEL seat:hold:{showId}:{seatId}`
- Booking tạm: `SET booking:temp:{bookingId} {JSON} EX 600`

**Job Scheduler:**
- `releaseExpiredSeats` — Mỗi 1 phút: quét PENDING > 10p → EXPIRED → xóa Redis → nhả ghế DB → broadcast WS. Đảm bảo atomicity, retry tối đa 3 lần.
- `cleanupExpiredBookings` — Mỗi 10 phút: dọn dẹp booking tạm quá hạn

**Tính giá vé:**
- Đọc phụ thu từ `SystemSettings` (không hardcode)
- Công thức: `BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge`

**Mobile:**
- `SeatSelectionScreen` (sơ đồ ghế realtime + ràng buộc + bảng giá chi tiết)
- `ComboScreen` (chọn bắp nước)
- `BookingSummaryScreen` (xác nhận tổng hợp)
- `TicketHistoryScreen`, `TicketDetailScreen`
- `SeatGrid` component, `useSocket` hook
- `bookingSlice.js` (Redux)

**Database:**
- Bảng: `Booking`, `BookingSeat`, `Product`, `BookingProduct`

---

### TV4 — Thanh Toán, Voucher & Thông Báo

**Module phụ trách:** M4 (Thanh Toán & Quản Lý Vé), M6 (Khuyến Mãi), M7 (Thông Báo)

**Backend — Payment:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Khởi tạo thanh toán | `POST /payments/:bookingId/pay` | Gọi Payment GW (HMAC) → sinh QR / xử lý thẻ |
| Webhook callback | `POST /payments/webhook` | Nhận kết quả từ Payment GW, verify HMAC, cập nhật đơn |
| Retry thanh toán | `POST /payments/:bookingId/retry` | Retry khi FAILED |
| Xử lý kết quả | — | SUCCESS: cộng điểm + email + push. FAILED: nhả ghế |
| Rollback sự cố | — | Conflict offline → hoàn tiền tự động + email |

**Payment Gateway Service (Riêng biệt — port 4000):**
- Setup Express server riêng
- HMAC signing/verify middleware
- Sinh mã QR động (MoMo/VNPay) — TTL đồng bộ Redis lock
- Xử lý thanh toán thẻ tín dụng (Visa/MC/JCB) — không lưu thông tin thẻ
- Gọi webhook callback về Main API

**Backend — Voucher:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Danh sách voucher | `GET /vouchers` | FEFO sort (sắp hết hạn trước) |
| Auto-suggest | `GET /vouchers/suggest` | Gợi ý voucher tốt nhất cho đơn hàng |
| Áp dụng voucher | `POST /vouchers/apply` | Kiểm tra điều kiện + tính giá mới |

**Backend — Notification:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Danh sách thông báo | `GET /notifications` | Phân trang |
| Đánh dấu đã đọc | `PUT /notifications/:id/read`, `PUT /notifications/read-all` | Đọc 1 / đọc tất cả |
| Số chưa đọc | `GET /notifications/unread-count` | Badge count |
| Gửi email | — | Xác nhận vé (QR check-in), OTP, hoàn tiền |
| Push FCM | — | Đặt vé thành công, nhắc chiếu 30p, phim mới |
| Job nhắc lịch | `reminderNotification` | Mỗi 5 phút: gửi push + email 30p trước chiếu |

**Mobile:**
- `VoucherScreen` (chọn/nhập voucher FEFO)
- `PaymentScreen` (QR + thẻ tín dụng), `PaymentResultScreen`
- `NotificationListScreen`
- Payment components: QR display, countdown timer, credit card form
- Notification components: badge, notification item

**Database:**
- Bảng: `Payment`, `Voucher`, `VoucherCustomer`, `VoucherUsage`, `Notification`

---

### TV5 — Admin Panel, Báo Cáo & Database

**Module phụ trách:** M8-Admin (Thống kê, Audit Log, Cài đặt), Database Design

**Frontend Admin Panel (HTML/CSS/JS):**
| Trang | Mô tả |
|-------|-------|
| `index.html` | Dashboard: doanh thu hôm nay, số vé bán, biểu đồ tổng quan (Chart.js) |
| `movies.html` | CRUD phim + quản lý phim nổi bật (is_featured, featured_order) |
| `shows.html` | Quản lý suất chiếu (tạo, sửa, xóa, kiểm tra xung đột) |
| `cinemas.html` | Quản lý cụm rạp 3 tầng + phòng chiếu |
| `seat-layout.html` | Thiết lập sơ đồ ghế ma trận (drag-drop loại ghế, lối đi) |
| `vouchers.html` | Cấu hình khuyến mãi (%, VNĐ, ràng buộc, phát hành tự động) |
| `reports.html` | Báo cáo thống kê: doanh thu theo phim/suất chiếu/thời gian (Chart.js) |
| `accounts.html` | Quản lý tài khoản (kích hoạt/vô hiệu) |
| `audit-logs.html` | 🆕 Nhật ký thao tác: ai/gì/khi nào/IP, snapshot JSON (SUPER_ADMIN) |
| `settings.html` | 🆕 Cài đặt hệ thống: giá, điểm tích lũy, chính sách hoàn vé, OTP |

**Backend — Admin APIs:**
| Tính năng | API Endpoints | Mô tả |
|-----------|--------------|-------|
| Thống kê doanh thu | `GET /admin/stats/revenue` | Theo phim, suất chiếu, khoảng thời gian |
| Thống kê vé | `GET /admin/stats/tickets` | Lượt vé bán ra |
| Thống kê tài khoản | `GET /admin/stats/accounts` | Tài khoản mới |
| Quản lý tài khoản | `PUT /admin/accounts/:id/status` | Kích hoạt / vô hiệu hóa |
| Nhật ký thao tác | `GET /admin/audit-logs` | Xem log (chỉ SUPER_ADMIN) |
| Cài đặt hệ thống | `GET/PUT /admin/settings` | CRUD cài đặt (giá, điểm, hoàn vé) |
| Admin voucher | `POST/PUT/DELETE /admin/vouchers` | Quản lý voucher |

**Database:**
- **Thiết kế toàn bộ ERD** — đảm bảo nhất quán, FK đúng chiều
- **Migrations** — tạo file theo thứ tự: `001_create_city_cinema.sql`, `002_create_movie_show.sql`, ...
- **Seeds** — dữ liệu mẫu: thành phố, cụm rạp, phim, suất chiếu, voucher, tài khoản test
- **Scripts** — Reset DB, backup, tạo indexes cho performance
- **Bảng đặc trách:** `AuditLog`, `SystemSettings` + review/hỗ trợ tất cả bảng khác

**DevOps & Documentation:**
- Setup Git workflow (branching, commit convention)
- Viết `README.md` hướng dẫn chạy dự án
- Viết API documentation (`docs/api/`)
- Quản lý `.env.example` cho từng service
- Quản lý deployment (nếu có)

---

### Bảng tổng hợp phân công

| Thành viên | Module | Backend | Mobile | Admin | Database |
|-----------|--------|---------|--------|-------|----------|
| **TV1** | M8 (User) | Auth, Customer, Middleware, Config | Auth screens, Profile screens | — | Account, Customer, LoyaltyPointHistory |
| **TV2** | M1, M2 | Movie, Cinema, Show, Admin CRUD | Home, MovieDetail, Search, Cinema | Movies, Shows, Cinemas, Seat Layout | City, Cinema, Hall, Seat, Movie, Show, LikeMovie |
| **TV3** | M3, M5 | Booking, WebSocket, Redis Lock, Jobs | SeatSelection, Combo, Summary, Tickets | — | Booking, BookingSeat, Product, BookingProduct |
| **TV4** | M4, M6, M7 | Payment, Payment GW, Voucher, Notification | Payment, Voucher, Notification | — | Payment, Voucher, VoucherCustomer, VoucherUsage, Notification |
| **TV5** | M8 (Admin) | Admin Stats, Audit, Settings | — | **Toàn bộ Admin Panel** (9 trang) | AuditLog, SystemSettings + ERD design + Migrations + Seeds |

---

## Phụ lục: Use Cases Reference

| Mã | Tên Use Case | Actor | Module | Phụ trách |
|----|-------------|-------|--------|-----------|
| UC01 | Đăng ký tài khoản (OTP) | Khách hàng | M8 | TV1 |
| UC02 | Đăng nhập / Phân quyền RBAC | Khách hàng, Admin | M8 | TV1 |
| UC03 | Tìm kiếm & Xem lịch chiếu | Khách hàng | M2 | TV2 |
| UC04 | Quy trình Đặt vé (6 bước) | Khách hàng | M3 | TV3 |
| UC05 | Chọn ghế & Sản phẩm (ràng buộc Luật 1+2) | Khách hàng | M3 | TV3 |
| UC06 | Xác nhận & Thanh toán (QR/Thẻ) | Khách hàng | M4 | TV4 |
| UC07 | Khóa ghế tạm thời 10p (Redis SET NX) | Hệ thống | M3 | TV3 |
| UC08 | Tự động gợi ý FEFO | Hệ thống | M6 | TV4 |
| UC09 | Nhập mã voucher thủ công | Khách hàng | M6 | TV4 |
| UC10 | Tự động hoàn tiền (Rollback sự cố) | Hệ thống | M5 | TV4 |
| UC11 | Gửi thông báo giao dịch (Email + Push FCM) | Hệ thống | M7 | TV4 |
| UC12 | Tra cứu lịch sử đặt vé | Khách hàng | M3 | TV3 |
| UC13 | Hủy vé (chính sách % hoàn theo thời điểm) | Khách hàng | M5 | TV3 |
| UC14 | Tự động giải phóng ghế (Background Job) | Hệ thống | M5 | TV3 |
| UC15 | Cronjob nhắc lịch 30p (Push FCM) | Hệ thống | M7 | TV4 |
| UC16 | Quản lý phim & lịch chiếu (Admin) | Quản trị viên | M1 | TV2 |
| UC17 | Quản lý rạp & sơ đồ ghế (Admin) | Quản trị viên | M1 | TV2 |
| UC18 | Cấu hình khuyến mãi (Admin) | Quản trị viên | M6 | TV5 |
| UC19 | Xem báo cáo thống kê (Admin) | Quản trị viên | M8 | TV5 |
| UC20 | Cộng điểm tích lũy | Hệ thống | M4 | TV4 |
| UC21 | Retry thanh toán thất bại | Khách hàng | M4 | TV4 |
| UC22 | Xem / sửa thông tin tài khoản | Khách hàng | M8 | TV1 |
| UC23 | 🆕 Quên mật khẩu & Đặt lại | Khách hàng | M8 | TV1 |
| UC24 | 🆕 Thanh toán thẻ tín dụng | Khách hàng | M4 | TV4 |
| UC25 | 🆕 Xem nhật ký thao tác (Audit Log) | Super Admin | M8 | TV5 |
| UC26 | 🆕 Cài đặt hệ thống (giá, điểm, hoàn vé) | Quản trị viên | M8 | TV5 |
| UC27 | 🆕 Quản lý phim nổi bật (Featured) | Quản trị viên | M1 | TV2 |
| UC28 | 🆕 Thu hồi điểm khi hủy vé | Hệ thống | M5 | TV3 |
| UC29 | 🆕 Khôi phục voucher khi hủy vé | Hệ thống | M5 | TV3 |

---

## XII. Lịch trình Chi tiết 10 Buổi — Phân công theo Buổi

> **Quy tắc:** Mỗi buổi tất cả 5 thành viên đều phải làm việc đồng thời.  
> Công việc mỗi người trong buổi có **sự liên kết chặt chẽ** với người khác → dễ báo cáo tiến độ với giảng viên.  
> Kết quả đầu ra (output) của buổi trước là đầu vào (input) cho buổi sau.

### Tổng quan 10 buổi

| Buổi | Giai đoạn | Chủ đề chính | Mục tiêu báo cáo |
|------|-----------|-------------|-------------------|
| **1** | Nền tảng | Database + Project Setup | ERD hoàn chỉnh, project chạy được, kết nối DB thành công |
| **2** | Nền tảng | Auth + Hạ tầng cốt lõi | Đăng ký/Đăng nhập hoạt động E2E (Mobile → API → DB) |
| **3** | Core M1-M2 | Phim + Rạp + Lịch chiếu | Xem phim, tìm kiếm, lịch chiếu hoạt động E2E |
| **4** | Core M3 | Chọn ghế Realtime + Đặt vé | Chọn ghế realtime WebSocket, tạo đơn đặt vé thành công |
| **5** | Core M4 | Thanh toán + Payment Gateway | Thanh toán QR/Thẻ hoạt động E2E qua Payment GW |
| **6** | Core M5-M6 | Hủy vé + Voucher | Hủy vé hoàn tiền, voucher FEFO hoạt động |
| **7** | Core M7-M8 | Thông báo + Admin Panel | Push/Email hoạt động, Admin CRUD phim/rạp hoạt động |
| **8** | Nâng cao | Background Jobs + Báo cáo + Nâng cao | Cronjob, báo cáo Chart.js, audit log hoạt động |
| **9** | Hoàn thiện | Tích hợp + UI/UX Polish | Toàn bộ luồng E2E liền mạch, UI hoàn thiện |
| **10** | Nghiệm thu | Testing + Demo + Tài liệu | Demo đầy đủ, tài liệu hoàn chỉnh, sẵn sàng nộp |

---

### 📅 Buổi 1 — Database + Project Setup

> **Mục tiêu:** Toàn bộ nhóm có cùng môi trường dev, DB schema hoàn chỉnh, project skeleton chạy được.  
> **Liên kết:** TV5 tạo DB → TV1 tạo backend kết nối DB → TV2 seed dữ liệu mẫu → TV3 setup Redis → TV4 setup Payment GW.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Setup project backend (`package.json`, `server.js`, Express boilerplate) ② Tạo `config/db.js` kết nối SQL Server ③ Tạo `config/redis.js` kết nối Redis ④ Tạo cấu trúc thư mục backend theo chuẩn ⑤ Tạo `.env.example` | Backend server chạy được, kết nối DB + Redis thành công | TV5 (cần DB schema), TV3 (cần Redis config) |
| **TV2** | ① Tạo file seed dữ liệu mẫu: `cities.sql`, `cinemas.sql`, `movies.sql` ② Tạo model mẫu `movie.model.js` — query cơ bản (getAll, getById) ③ Tạo route + controller mẫu `GET /api/movies` để test kết nối ④ Tạo cấu trúc thư mục `controllers/`, `routes/`, `models/` | Seed data sẵn sàng, API test `/api/movies` trả dữ liệu | TV5 (cần migration xong), TV1 (cần DB config) |
| **TV3** | ① Setup Socket.IO trên backend (`socket/index.js`) ② Tạo cấu trúc thư mục `jobs/`, `socket/`, `validators/` ③ Test kết nối Redis: SET/GET/DEL key ④ Viết utility `redisLock.js` (SET NX cơ bản) ⑤ Tạo file `booking.model.js` skeleton | Socket.IO chạy, Redis lock utility sẵn sàng | TV1 (cần Redis config), TV5 (cần bảng Booking) |
| **TV4** | ① Setup project `payment-gateway/` riêng biệt (Express, port 4000) ② Tạo HMAC utility (`utils/hmac.js`) ③ Tạo middleware verify HMAC ④ Tạo route mẫu `POST /api/payment/test` ⑤ Tạo `.env.example` cho Payment GW | Payment GW server chạy port 4000, HMAC verify hoạt động | TV1 (cần chung HMAC secret), TV5 (cần bảng Payment) |
| **TV5** | ① **Thiết kế ERD hoàn chỉnh** (vẽ diagram) ② Viết migration files theo thứ tự: `001_create_accounts.sql` → `002_create_city_cinema.sql` → `003_create_movie_show.sql` → `004_create_booking_payment.sql` → `005_create_voucher_notification.sql` → `006_create_system.sql` ③ Chạy migration tạo toàn bộ bảng ④ Tạo `README.md` hướng dẫn setup | DB schema hoàn chỉnh, tất cả bảng được tạo | Tất cả TV (mọi người cần DB schema) |

**📋 Checklist báo cáo Buổi 1:**
- [ ] ERD diagram hoàn chỉnh (TV5)
- [ ] Backend server chạy port 3000 (TV1)
- [ ] Payment GW chạy port 4000 (TV4)
- [ ] Kết nối SQL Server + Redis thành công (TV1 + TV3)
- [ ] API test `GET /api/movies` trả dữ liệu seed (TV2)
- [ ] Socket.IO kết nối thành công (TV3)

---

### 📅 Buổi 2 — Auth + Hạ tầng cốt lõi

> **Mục tiêu:** Hệ thống Auth hoàn chỉnh (Đăng ký OTP → Đăng nhập JWT → Phân quyền RBAC).  
> **Liên kết:** TV1 tạo Auth API → TV2 tạo model Account/Customer → TV3 tạo validator → TV4 tạo email service → TV5 tạo Admin login.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Tạo `auth.controller.js`: register, login, verify-otp, resend-otp, logout ② Tạo `authMiddleware.js` (verify JWT, check blacklist Redis) ③ Tạo `roleMiddleware.js` (RBAC: CUSTOMER/ADMIN/SUPER_ADMIN) ④ Tạo `config/jwt.js` (Access 15p, Refresh 7d) ⑤ Tạo `asyncHandler.js`, `appError.js`, `apiResponse.js` (utils chuẩn hóa) | Auth API hoạt động, middleware JWT + RBAC sẵn sàng | TV2 (cần model Account), TV4 (cần email OTP) |
| **TV2** | ① Tạo `account.model.js` — CRUD Account (register, findByEmail, updatePassword) ② Tạo `customer.model.js` — CRUD Customer (create, getByAccountId) ③ Tạo route files: `auth.routes.js`, `customer.routes.js` ④ Tạo `auth.validator.js` (Joi: validate email, password, OTP) ⑤ Tạo `auth.service.js` — business logic đăng ký, login | Model + Service + Route cho Auth hoàn chỉnh | TV1 (cần controller gọi service), TV5 (cần bảng Account) |
| **TV3** | ① Tạo `booking.validator.js` skeleton ② Tạo `errorHandler.js` (global error middleware) ③ Tạo `rateLimitMiddleware.js` (100 req/15p/IP dùng Redis) ④ Viết test thủ công cho Redis lock (SET NX + TTL) ⑤ Tạo `constants/` — SEAT_TYPES, BOOKING_STATUS, PAYMENT_STATUS | Error handler + Rate limit hoạt động, constants dùng chung | TV1 (cần error handler), TV2 (cần constants) |
| **TV4** | ① Tạo `email.service.js` (Nodemailer) — gửi OTP, xác nhận đăng ký ② Tạo `config/email.js` (SMTP config) ③ Tạo email templates: OTP verification, welcome ④ Tạo `otp.service.js` — sinh OTP 6 số, lưu Redis, verify ⑤ Tạo `notification.model.js` skeleton | Email OTP gửi thành công, OTP service hoạt động | TV1 (Auth cần gửi OTP), TV2 (cần service gửi email) |
| **TV5** | ① Tạo seed dữ liệu: tài khoản admin test, tài khoản customer test ② Tạo `frontend-admin/` project skeleton (HTML/CSS/JS) ③ Tạo trang `login.html` cho Admin Panel ④ Tạo `js/services/api.js` (fetch wrapper, JWT header) ⑤ Tạo Admin CSS base: sidebar, layout, typography | Admin Panel skeleton + trang login, seed tài khoản test | TV1 (cần Auth API cho admin login), TV2 (cần tài khoản test) |

**📋 Checklist báo cáo Buổi 2:**
- [ ] Đăng ký → Nhận OTP email → Xác minh → Đăng nhập → Nhận JWT (TV1 + TV2 + TV4)
- [ ] Middleware JWT chặn request không có token (TV1)
- [ ] RBAC chặn Customer truy cập route Admin (TV1 + TV3)
- [ ] Rate limit hoạt động (TV3)
- [ ] Admin login page hoạt động (TV5)

---

### 📅 Buổi 3 — Phim + Rạp + Lịch chiếu (M1 + M2)

> **Mục tiêu:** Module Phim & Rạp hoạt động E2E: xem danh sách, tìm kiếm, chi tiết, lịch chiếu.  
> **Liên kết:** TV2 tạo API Phim/Rạp → TV1 tạo màn hình Mobile Home/Search → TV3 tạo API Shows + Seats → TV4 tạo featured cache → TV5 tạo Admin CRUD phim.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Tạo màn hình Mobile: `HomeScreen` (danh sách phim đang chiếu) ② Tạo `MovieCard` component (poster, tên, thể loại, rating) ③ Tạo `SearchScreen` (ô tìm kiếm + kết quả) ④ Tạo `movieSlice.js` (Redux Toolkit) ⑤ Setup Axios instance + interceptors (auto refresh token) ⑥ Tạo `ProfileScreen`, `EditProfileScreen` | Mobile: Home hiển thị phim, tìm kiếm hoạt động | TV2 (cần API movies), TV4 (cần API featured) |
| **TV2** | ① Hoàn thiện `movie.controller.js` — getAll, getById, search, like/unlike ② Tạo `cinema.controller.js` — getAll, getById, getByCity ③ Tạo `movie.service.js`, `cinema.service.js` (business logic) ④ Tạo `movie.validator.js`, `cinema.validator.js` ⑤ Tạo `show.model.js`, `show.controller.js` — getShowById, getShowSeats ⑥ Tạo Admin APIs: `POST/PUT/DELETE /admin/movies` | API Phim + Rạp + Lịch chiếu hoàn chỉnh | TV1 (Mobile gọi API), TV5 (Admin gọi API) |
| **TV3** | ① Tạo `seat.model.js` — getSeatsByHallId, getSeatsByShowId (kèm trạng thái Redis) ② Tạo `show.service.js` — getShowSeats kết hợp DB + Redis trạng thái ghế ③ Hoàn thiện Socket.IO: join room `show_{showId}`, emit seat events ④ Tạo `booking.model.js` — createBooking, getBookingsByCustomer ⑤ Tạo `product.model.js`, `product.controller.js` — danh sách combo | API Seats + trạng thái ghế realtime từ Redis | TV2 (cần show/seat data), TV1 (Mobile cần seat API) |
| **TV4** | ① Tạo `cache.service.js` — cache featured movies vào Redis (TTL 5p) ② Tạo API `GET /movies/featured` (đọc từ cache, fallback DB) ③ Tạo `notification.controller.js` skeleton ④ Tạo `voucher.model.js` skeleton ⑤ Tạo `FeaturedCarousel` component cho Mobile (gợi ý cho TV1) | API Featured Movies (cache Redis), carousel data | TV1 (Mobile hiển thị featured), TV2 (cần movie data) |
| **TV5** | ① Tạo trang `movies.html` — Admin CRUD phim (bảng danh sách, form thêm/sửa, xóa) ② Tạo trang `cinemas.html` — Admin quản lý cụm rạp ③ Tạo trang `shows.html` skeleton ④ Tạo `js/pages/movies.js` — gọi Admin API CRUD phim ⑤ Tạo CSS components: table, form, modal, pagination | Admin Panel: quản lý phim + rạp hoạt động | TV2 (cần Admin API movies/cinemas) |

**📋 Checklist báo cáo Buổi 3:**
- [ ] Mobile: HomeScreen hiển thị danh sách phim + featured carousel (TV1 + TV4)
- [ ] Mobile: Tìm kiếm phim theo tên/thể loại (TV1 + TV2)
- [ ] API: Danh sách rạp, lọc theo thành phố (TV2)
- [ ] API: Sơ đồ ghế theo suất chiếu + trạng thái Redis (TV3)
- [ ] Admin: CRUD phim hoạt động (TV5 + TV2)

---

### 📅 Buổi 4 — Chọn ghế Realtime + Đặt vé (M3)

> **Mục tiêu:** Luồng đặt vé hoạt động: chọn ghế realtime → ràng buộc ghế → combo → tạo đơn → khóa ghế Redis.  
> **Liên kết:** TV3 tạo booking API + Redis lock → TV1 tạo SeatSelection Mobile → TV2 cung cấp show/seat data → TV4 chuẩn bị payment API → TV5 tạo seat-layout admin.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Tạo `SeatSelectionScreen` — sơ đồ ghế grid, chọn/bỏ chọn ghế ② Tạo `SeatGrid` component (hiển thị trạng thái: trống/đang giữ/đã đặt) ③ Tạo `useSocket` hook — kết nối WebSocket, lắng nghe seat events ④ Tạo `ComboScreen` — chọn bắp nước ⑤ Tạo `BookingSummaryScreen` — xác nhận đơn trước thanh toán ⑥ Tạo `bookingSlice.js` (Redux) | Mobile: Luồng chọn ghế → combo → xác nhận hoạt động | TV3 (cần booking API + WebSocket), TV2 (cần seat data) |
| **TV2** | ① Hoàn thiện `show.controller.js` — getShowSeats (merge DB + Redis status) ② Tạo Admin API `PUT /admin/halls/:id/seats` — thiết lập sơ đồ ghế ma trận ③ Tạo `show.validator.js` — validate tạo suất chiếu (không xung đột thời gian) ④ Tạo Admin API `POST/PUT/DELETE /admin/shows` hoàn chỉnh ⑤ Tạo `MovieDetailScreen` Mobile (poster, trailer, mô tả, lịch chiếu) | API Suất chiếu + Sơ đồ ghế admin hoàn chỉnh | TV3 (cần seats cho booking), TV5 (admin seat layout) |
| **TV3** | ① **Hoàn thiện `booking.service.js`** — luồng đặt vé 6 bước đầy đủ ② Implement ràng buộc Lonely Seat (Luật 1 + Luật 2) ③ Implement Redis Distributed Lock (`SET NX EX 600`) cho khóa ghế ④ Tạo `booking.controller.js` — createBooking, getBookings, getBookingById ⑤ Broadcast WebSocket khi ghế bị hold/release ⑥ Tạo `booking.routes.js` hoàn chỉnh | API Đặt vé hoạt động, ghế lock Redis 10p, realtime WS | TV1 (Mobile gọi API), TV4 (chuẩn bị payment) |
| **TV4** | ① Tạo `payment.model.js` — createPayment, updatePaymentStatus ② Tạo `payment.controller.js` skeleton — initPayment, webhook ③ Tạo `voucher.model.js` — getAvailableVouchers (FEFO sort) ④ Tạo `voucher.controller.js` — getVouchers, applyVoucher skeleton ⑤ Hoàn thiện Payment GW: `POST /api/payment/create-qr` (sinh QR test) | Payment + Voucher model sẵn sàng, QR sinh thử | TV3 (booking xong → chuyển payment), TV1 (Mobile UI) |
| **TV5** | ① Tạo trang `seat-layout.html` — thiết lập sơ đồ ghế ma trận (UI grid) ② Tạo `js/pages/seat-layout.js` — drag-drop loại ghế, lối đi, phụ thu ③ Hoàn thiện trang `shows.html` — tạo/sửa/xóa suất chiếu ④ Tạo `js/pages/shows.js` — gọi Admin API shows ⑤ Tạo thêm seed: suất chiếu mẫu, ghế mẫu | Admin: quản lý sơ đồ ghế + suất chiếu | TV2 (cần Admin API seats/shows) |

**📋 Checklist báo cáo Buổi 4:**
- [ ] Mobile: Chọn ghế realtime, ghế cập nhật tức thì qua WebSocket (TV1 + TV3)
- [ ] Ràng buộc Lonely Seat hoạt động — không cho phép bỏ trống 1 ghế giữa (TV3)
- [ ] Redis lock ghế 10 phút thành công (TV3)
- [ ] Mobile: Luồng chọn ghế → combo → xác nhận đơn (TV1)
- [ ] Admin: Thiết lập sơ đồ ghế + quản lý suất chiếu (TV5 + TV2)

---

### 📅 Buổi 5 — Thanh toán + Payment Gateway (M4)

> **Mục tiêu:** Luồng thanh toán QR + Thẻ hoạt động E2E qua Payment Gateway Service.  
> **Liên kết:** TV4 hoàn thiện Payment GW → TV3 booking chuyển sang payment → TV1 tạo Payment Mobile → TV2 tạo tính giá vé → TV5 chuẩn bị voucher admin.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Tạo `PaymentScreen` — hiển thị QR code + countdown timer (10p) ② Tạo `PaymentResultScreen` — kết quả thanh toán (thành công/thất bại) ③ Tạo `CreditCardForm` component (nhập thông tin thẻ) ④ Tạo `TicketHistoryScreen` — danh sách vé đã đặt ⑤ Tạo `TicketDetailScreen` — chi tiết vé + QR check-in ⑥ Tạo `ticketSlice.js` (Redux) | Mobile: Thanh toán QR + Thẻ + Xem vé | TV4 (cần payment API), TV3 (cần booking data) |
| **TV2** | ① Tạo `pricing.service.js` — tính giá vé: `BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge` ② Đọc phụ thu từ `SystemSettings` (không hardcode) ③ Tạo `CinemaListScreen`, `ShowtimeScreen` Mobile ④ Hoàn thiện Admin API featured: `PUT /admin/movies/:id/featured` ⑤ Tạo `like.model.js` — Like/Unlike phim | Service tính giá vé chính xác, màn hình rạp/lịch chiếu | TV3 (booking cần giá), TV4 (payment cần tổng tiền) |
| **TV3** | ① Kết nối Booking → Payment: sau createBooking gọi initPayment ② Xử lý payment callback: SUCCESS → confirm booking + cập nhật ghế BOOKED ③ Xử lý payment FAILED → release ghế Redis + cập nhật ghế AVAILABLE ④ Tạo `cancel.service.js` skeleton — logic hủy vé ⑤ Broadcast WebSocket `seat:booked` khi thanh toán thành công | Luồng Booking → Payment → Confirm/Fail hoàn chỉnh | TV4 (cần payment callback), TV1 (Mobile cập nhật) |
| **TV4** | ① **Hoàn thiện Payment Gateway Service**: sinh QR động (MoMo/VNPay mock) ② Implement thanh toán thẻ tín dụng (mock) ③ Tạo webhook callback: Payment GW → Main API (kèm HMAC) ④ Tạo `payment.service.js` Main API — initPayment, handleWebhook, retryPayment ⑤ Tạo `loyalty.service.js` — cộng điểm tích lũy khi thanh toán thành công ⑥ Gửi email xác nhận vé (kèm QR check-in) | Payment GW hoạt động E2E, QR/Thẻ → webhook → confirm | TV3 (cần callback update booking), TV1 (Mobile QR) |
| **TV5** | ① Tạo trang `vouchers.html` — Admin CRUD voucher (%, VNĐ, ràng buộc) ② Tạo `js/pages/vouchers.js` — gọi Admin API vouchers ③ Tạo Admin API `POST/PUT/DELETE /admin/vouchers` ④ Tạo seed: voucher mẫu (giảm %, giảm VNĐ, free ship) ⑤ Tạo `settings.html` skeleton — cài đặt giá phụ thu | Admin: quản lý voucher + cài đặt giá | TV4 (cần voucher API), TV2 (cần settings giá) |

**📋 Checklist báo cáo Buổi 5:**
- [ ] Thanh toán QR: Main API → Payment GW → sinh QR → webhook callback → confirm (TV4 + TV3)
- [ ] Mobile: Hiển thị QR + countdown, kết quả thanh toán (TV1)
- [ ] Cộng điểm tích lũy khi thanh toán thành công (TV4)
- [ ] Tính giá vé chính xác (BasePrice + phụ thu) (TV2)
- [ ] Admin: CRUD voucher hoạt động (TV5)

---

### 📅 Buổi 6 — Hủy vé + Voucher Engine (M5 + M6)

> **Mục tiêu:** Hủy vé với chính sách hoàn tiền + Voucher Engine FEFO hoạt động.  
> **Liên kết:** TV3 xử lý hủy vé → TV4 hoàn tiền + khôi phục voucher → TV1 Mobile hủy vé/voucher → TV2 khôi phục ghế → TV5 admin voucher config.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Thêm nút "Hủy vé" trên `TicketDetailScreen` ② Tạo `CancelBookingModal` — xác nhận hủy, hiển thị % hoàn tiền ③ Tạo `VoucherScreen` — danh sách voucher FEFO ④ Tạo `VoucherCard` component (mã, giá trị, HSD, điều kiện) ⑤ Tạo `ApplyVoucherModal` — nhập mã / chọn từ danh sách ⑥ Cập nhật `BookingSummaryScreen` — hiển thị voucher discount | Mobile: Hủy vé + Chọn voucher hoạt động | TV3 (cần cancel API), TV4 (cần voucher API) |
| **TV2** | ① Xử lý khôi phục ghế DB khi hủy vé: `UPDATE CinemaHallSeat SET Status = 'AVAILABLE'` ② Cập nhật `show.service.js` — refresh sơ đồ ghế sau hủy ③ Tạo `LikeMovie` feature hoàn chỉnh (Mobile + API) ④ Tạo `FeaturedCarousel` component Mobile ⑤ Hoàn thiện Admin `PUT /admin/cinemas/:id` — sửa thông tin rạp | Ghế được khôi phục đúng sau hủy, featured carousel | TV3 (cần khôi phục ghế), TV1 (Mobile carousel) |
| **TV3** | ① **Hoàn thiện `cancel.service.js`** — hủy vé đầy đủ: check chính sách → tính % hoàn → giải phóng ghế Redis → xóa BookingSeat → cập nhật DB ② Thu hồi điểm tích lũy khi hủy vé ③ Gọi TV4 khôi phục voucher ④ Broadcast WebSocket `seat:release` ⑤ Tạo `POST /bookings/:id/cancel` hoàn chỉnh | API Hủy vé + hoàn tiền + thu hồi điểm + nhả ghế | TV4 (cần hoàn tiền + khôi phục voucher), TV2 (cần nhả ghế DB) |
| **TV4** | ① **Hoàn thiện Voucher Engine** FEFO: sắp xếp theo HSD, kiểm tra điều kiện (min amount, category, first use) ② Tạo `POST /vouchers/apply` — validate + tính giá sau giảm ③ Tạo `GET /vouchers/suggest` — auto-suggest voucher tốt nhất ④ Khôi phục voucher khi hủy vé (`VoucherUsage` rollback) ⑤ Xử lý hoàn tiền: gọi Payment GW refund + gửi email thông báo | Voucher FEFO hoạt động, hoàn tiền + khôi phục voucher | TV3 (cần gọi khi hủy vé), TV1 (Mobile áp dụng voucher) |
| **TV5** | ① Hoàn thiện `vouchers.html` — thêm cấu hình điều kiện voucher (minAmount, maxDiscount, category) ② Tạo trang `settings.html` — cài đặt chính sách hoàn vé (% theo thời điểm) ③ Tạo Admin API `GET/PUT /admin/settings` ④ Tạo `SystemSettings` model + seed dữ liệu mặc định ⑤ Tạo `js/pages/settings.js` | Admin: Cấu hình voucher chi tiết + cài đặt chính sách hoàn vé | TV4 (cần settings hoàn vé), TV3 (cần % hoàn từ settings) |

**📋 Checklist báo cáo Buổi 6:**
- [ ] Hủy vé: kiểm tra chính sách → tính % hoàn → nhả ghế → thu hồi điểm (TV3)
- [ ] Voucher FEFO: danh sách sắp theo HSD, auto-suggest tốt nhất (TV4)
- [ ] Mobile: Hủy vé + chọn/nhập voucher (TV1)
- [ ] Khôi phục ghế + voucher sau hủy (TV2 + TV4)
- [ ] Admin: Cài đặt chính sách hoàn vé (TV5)

---

### 📅 Buổi 7 — Thông báo + Admin Panel chính (M7 + M8)

> **Mục tiêu:** Hệ thống thông báo (Email + Push + WebSocket) + Admin Panel CRUD chính hoạt động.  
> **Liên kết:** TV4 tạo notification system → TV1 Mobile thông báo → TV3 trigger notification → TV2 trigger notification phim → TV5 Admin Panel hoàn thiện.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Tạo `NotificationListScreen` — danh sách thông báo (phân trang) ② Tạo `NotificationItem` component (icon, tiêu đề, nội dung, thời gian, badge unread) ③ Implement Push Notification listener (Firebase FCM) ④ Tạo `LoyaltyScreen` — xem điểm + lịch sử điểm ⑤ Tạo `ChangePasswordScreen` ⑥ Cập nhật Bottom Tab: badge số thông báo chưa đọc | Mobile: Thông báo + Loyalty + Đổi MK | TV4 (cần notification API), TV3 (cần loyalty data) |
| **TV2** | ① Tạo trigger: gửi notification khi có phim mới (gọi TV4 notification service) ② Hoàn thiện Admin API suất chiếu: kiểm tra xung đột thời gian chặt chẽ ③ Tạo `config/firebase.js` (Firebase Admin SDK) ④ Tạo `push.service.js` — gửi push notification qua FCM ⑤ Cập nhật `movie.service.js` — khi thêm phim → trigger push "Phim mới" | Trigger notification phim mới, FCM service | TV4 (cần notification service), TV5 (admin thêm phim) |
| **TV3** | ① Trigger notification khi đặt vé thành công (gọi TV4 notification service) ② Trigger notification khi hủy vé (gọi TV4) ③ Tạo `cancel.controller.js` — xử lý cancel request ④ Hoàn thiện luồng booking → payment → notification E2E ⑤ Chuẩn bị logic cho job `releaseExpiredSeats` skeleton | Trigger notification từ booking events | TV4 (cần notification service), TV1 (Mobile nhận push) |
| **TV4** | ① **Hoàn thiện notification system**: `notification.service.js` — tạo notification DB + push FCM + email ② Tạo `GET /notifications` (phân trang), `PUT /notifications/:id/read`, `PUT /notifications/read-all` ③ Tạo `GET /notifications/unread-count` ④ Tạo email templates: booking confirmation (QR), cancellation, refund ⑤ Helper: format email HTML đẹp | Notification API + Email + Push FCM hoàn chỉnh | TV1 (Mobile hiển thị), TV2+TV3 (trigger gửi) |
| **TV5** | ① Hoàn thiện `movies.html` — thêm quản lý phim nổi bật (is_featured, featured_order) ② Tạo trang `accounts.html` — quản lý tài khoản (kích hoạt/vô hiệu) ③ Tạo `js/pages/accounts.js` — gọi API `PUT /admin/accounts/:id/status` ④ Tạo Admin API `PUT /admin/accounts/:id/status` ⑤ Hoàn thiện CSS Admin: responsive sidebar, dark/light toggle | Admin: quản lý tài khoản + phim nổi bật | TV1 (cần API accounts), TV2 (cần API featured) |

**📋 Checklist báo cáo Buổi 7:**
- [ ] Push notification FCM hoạt động (đặt vé, hủy vé, phim mới) (TV4 + TV2 + TV3)
- [ ] Email xác nhận vé kèm QR check-in (TV4)
- [ ] Mobile: Danh sách thông báo + badge unread (TV1)
- [ ] Admin: Quản lý tài khoản kích hoạt/vô hiệu (TV5)
- [ ] Luồng E2E: Đặt vé → Thanh toán → Notification (TV3 + TV4 + TV1)

---

### 📅 Buổi 8 — Background Jobs + Báo cáo + Nâng cao

> **Mục tiêu:** Cronjob tự động chạy đúng, báo cáo thống kê Chart.js, Audit Log.  
> **Liên kết:** TV3 tạo cronjobs → TV4 job nhắc lịch + voucher tự động → TV5 báo cáo + audit log → TV2 API thống kê → TV1 điểm tích lũy nâng cao.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Tạo `MyVouchersScreen` — kho voucher cá nhân ② Hoàn thiện `LoyaltyScreen` — lịch sử cộng/trừ điểm chi tiết ③ Tạo `ForgotPasswordScreen`, `ResetPasswordScreen` ④ Implement quên mật khẩu 7 bước E2E ⑤ Tạo `config/cloudinary.js` + upload avatar ⑥ Polish UI toàn bộ screens đã tạo | Mobile: Quên MK + Avatar + Voucher cá nhân + Loyalty chi tiết | TV4 (cần voucher cá nhân API), TV2 (cần cloudinary) |
| **TV2** | ① Tạo Admin API thống kê: `GET /admin/stats/revenue` (theo phim/suất/thời gian) ② Tạo `GET /admin/stats/tickets` (vé bán ra) ③ Tạo `GET /admin/stats/accounts` (tài khoản mới) ④ Tạo `stats.model.js`, `stats.service.js` — query aggregate ⑤ Tạo job `refreshFeaturedCache` — cập nhật cache phim nổi bật mỗi 5p | API Thống kê + Job refresh cache | TV5 (Admin cần dữ liệu thống kê), TV4 (cần cache) |
| **TV3** | ① **Implement job `releaseExpiredSeats`** — mỗi 1p: quét PENDING > 10p → EXPIRED → xóa Redis → nhả ghế DB → broadcast WS ② Implement `cleanupExpiredBookings` — mỗi 10p ③ Retry logic: tối đa 3 lần nếu lỗi ④ Tạo job scheduler setup (`jobs/index.js`) ⑤ Test kỹ: tạo booking → chờ > 10p → verify ghế được nhả tự động | Cronjob tự động nhả ghế + dọn dẹp booking hết hạn | TV4 (cần trigger notification expired), TV2 (cần broadcast) |
| **TV4** | ① Implement job `reminderNotification` — mỗi 5p: tìm suất chiếu trong 30p tới → push FCM + email nhắc ② Implement job `autoIssueVouchers` — phát hành voucher sinh nhật/lễ ③ Tạo `POST /payments/:bookingId/retry` — retry thanh toán thất bại ④ Xử lý rollback sự cố: conflict offline → hoàn tiền tự động + email ⑤ Tạo `GET /customer/vouchers` — kho voucher cá nhân | Jobs nhắc lịch + voucher tự động + retry payment | TV3 (cần expired trigger), TV1 (Mobile voucher cá nhân) |
| **TV5** | ① Tạo trang `reports.html` — báo cáo doanh thu Chart.js (line, bar, pie chart) ② Tạo `js/pages/reports.js` — gọi API stats, render biểu đồ ③ Tạo trang `audit-logs.html` — nhật ký thao tác (bảng: ai/gì/khi nào/IP) ④ Tạo `auditLog.model.js`, `audit.service.js` — ghi log thao tác admin ⑤ Tạo API `GET /admin/audit-logs` (chỉ SUPER_ADMIN) | Admin: Báo cáo Chart.js + Audit Log | TV2 (cần API stats), TV1 (cần audit middleware) |

**📋 Checklist báo cáo Buổi 8:**
- [ ] Cronjob nhả ghế hết hạn hoạt động tự động (TV3)
- [ ] Job nhắc lịch 30p trước chiếu gửi push + email (TV4)
- [ ] Admin: Báo cáo doanh thu với Chart.js (TV5 + TV2)
- [ ] Admin: Nhật ký thao tác (Audit Log) (TV5)
- [ ] Quên mật khẩu + đặt lại E2E hoạt động (TV1)

---

### 📅 Buổi 9 — Tích hợp E2E + UI/UX Polish

> **Mục tiêu:** Tất cả luồng hoạt động liền mạch E2E, UI hoàn thiện, fix bugs.  
> **Liên kết:** Cả 5 TV cùng test chéo, fix bugs tích hợp, polish UI/UX.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① **Test E2E luồng Auth**: Đăng ký → OTP → Login → Profile → Đổi MK → Quên MK ② Fix bugs tích hợp Auth ↔ Mobile ③ Polish toàn bộ UI Mobile: animation, loading states, error handling ④ Implement pull-to-refresh, infinite scroll ⑤ Cải thiện UX: empty states, skeleton loading ⑥ Final review middleware stack | Auth E2E hoạt động mượt, UI polish | Tất cả TV (test chéo) |
| **TV2** | ① **Test E2E luồng Phim**: Tìm kiếm → Chi tiết → Lịch chiếu → Chọn rạp ② Fix bugs tích hợp Movie/Cinema API ↔ Mobile ③ Polish Admin CRUD phim/rạp/suất chiếu — UX cải thiện ④ Kiểm tra xung đột suất chiếu edge cases ⑤ Optimize SQL queries (thêm indexes) ⑥ Chuẩn bị data demo (phim thật, poster, trailer) | Phim/Rạp E2E mượt, data demo sẵn sàng | TV1 (Mobile fix), TV5 (Admin fix) |
| **TV3** | ① **Test E2E luồng Đặt vé**: Chọn ghế → Ràng buộc → Combo → Booking → Lock Redis ② Test concurrent booking (2 user cùng chọn ghế) ③ Test hủy vé: hoàn tiền + thu hồi điểm + khôi phục voucher + nhả ghế ④ Test cronjob: booking quá hạn → tự nhả ghế ⑤ Fix race conditions, edge cases ⑥ Stress test Redis lock | Booking E2E ổn định, concurrent safe | TV4 (payment follow-up), TV1 (Mobile fix) |
| **TV4** | ① **Test E2E luồng Thanh toán**: Booking → Payment QR → Webhook → Confirm → Email ② Test thanh toán thẻ tín dụng E2E ③ Test retry thanh toán thất bại ④ Test rollback sự cố (conflict → hoàn tiền) ⑤ Test notification đầy đủ: đặt vé, hủy vé, nhắc lịch, phim mới ⑥ Fix bugs Payment GW ↔ Main API | Payment + Notification E2E ổn định | TV3 (cần booking data), TV1 (Mobile kết quả) |
| **TV5** | ① **Test E2E Admin Panel**: Login → CRUD phim → Suất chiếu → Ghế → Voucher → Báo cáo ② Fix bugs Admin Panel, responsive layout ③ Polish CSS: hover effects, transitions, loading indicators ④ Test Audit Log — ghi nhận đúng thao tác ⑤ Test Settings — thay đổi giá/điểm ảnh hưởng đúng ⑥ Final review database: FK consistency, indexes | Admin Panel E2E hoạt động, DB optimized | Tất cả TV (settings ảnh hưởng toàn hệ thống) |

**📋 Checklist báo cáo Buổi 9:**
- [ ] Luồng hoàn chỉnh: Đăng ký → Tìm phim → Chọn ghế → Đặt vé → Thanh toán → Nhận vé (Full E2E)
- [ ] Concurrent booking an toàn — không conflict ghế (TV3)
- [ ] Cronjob nhả ghế tự động đúng giờ (TV3)
- [ ] Admin Panel hoạt động đầy đủ 9 trang (TV5)
- [ ] UI Mobile polish, không lỗi hiển thị (TV1)

---

### 📅 Buổi 10 — Testing + Demo + Tài liệu (Nghiệm thu)

> **Mục tiêu:** Hoàn chỉnh tài liệu, demo sẵn sàng, fix bugs cuối cùng.  
> **Liên kết:** Cả 5 TV cùng chuẩn bị demo, viết tài liệu, quay video.

| Thành viên | Công việc chi tiết | Output | Liên kết với |
|------------|-------------------|--------|-------------|
| **TV1** | ① Viết tài liệu API: Auth endpoints (`docs/api/auth.md`) ② Viết tài liệu API: Customer endpoints ③ Quay video demo luồng Auth Mobile (Đăng ký → Login → Profile) ④ Fix bugs cuối cùng Auth + Middleware ⑤ Review code toàn bộ middleware + utils ⑥ Chuẩn bị slide phần Auth cho báo cáo | Tài liệu API Auth + Video demo Auth | Tất cả TV (tài liệu thống nhất) |
| **TV2** | ① Viết tài liệu API: Movie, Cinema, Show endpoints (`docs/api/movie.md`, `cinema.md`) ② Quay video demo luồng Tìm phim → Chi tiết → Lịch chiếu (Mobile + Admin) ③ Fix bugs cuối cùng Movie/Cinema ④ Vẽ hoàn chỉnh Use Case Diagram, Sequence Diagram (M1, M2) ⑤ Chuẩn bị slide phần Phim/Rạp cho báo cáo ⑥ Chuẩn bị data demo final | Tài liệu API Movie/Cinema + Diagrams + Video demo | TV5 (admin demo), TV1 (mobile demo) |
| **TV3** | ① Viết tài liệu API: Booking, Product endpoints (`docs/api/booking.md`) ② Quay video demo luồng Đặt vé realtime (chọn ghế → combo → booking) ③ Quay video demo concurrent booking (2 thiết bị cùng chọn ghế) ④ Quay video demo hủy vé + cronjob nhả ghế ⑤ Fix bugs cuối cùng Booking + WebSocket ⑥ Chuẩn bị slide phần Đặt vé/Ghế RT cho báo cáo | Tài liệu API Booking + Video demo Đặt vé RT | TV4 (demo payment tiếp theo), TV1 (mobile demo) |
| **TV4** | ① Viết tài liệu API: Payment, Voucher, Notification (`docs/api/payment.md`, `voucher.md`, `notification.md`) ② Viết tài liệu Payment Gateway Service (`docs/api/payment-gateway.md`) ③ Quay video demo thanh toán QR + thẻ ④ Quay video demo notification (push + email) ⑤ Fix bugs cuối cùng Payment + Notification ⑥ Chuẩn bị slide phần Thanh toán/Voucher/Thông báo | Tài liệu API Payment/Voucher/Notification + Video demo | TV3 (demo booking trước), TV1 (mobile demo) |
| **TV5** | ① Viết tài liệu Database: ERD mô tả, từ điển dữ liệu (`docs/database.md`) ② Quay video demo Admin Panel (toàn bộ 9 trang) ③ Hoàn thiện `README.md` — hướng dẫn cài đặt + chạy dự án ④ Tổng hợp toàn bộ video demo thành 1 clip ⑤ Fix bugs cuối cùng Admin + DB ⑥ Chuẩn bị slide phần Admin/DB/Tổng kết cho báo cáo | Tài liệu DB + README + Video demo Admin + Slide tổng | Tất cả TV (tổng hợp tài liệu) |

**📋 Checklist báo cáo Buổi 10 (NGHIỆM THU):**
- [ ] Tài liệu API đầy đủ tất cả endpoints (`docs/api/`)
- [ ] ERD + Từ điển dữ liệu (`docs/database.md`)
- [ ] README.md hướng dẫn cài đặt + chạy
- [ ] Video demo đầy đủ các luồng chính
- [ ] Slide PowerPoint báo cáo sẵn sàng
- [ ] Code clean, không console.log thừa, comment đầy đủ
- [ ] Git history sạch, commit message rõ ràng

---

### Bảng tổng hợp Công việc theo Buổi

| Buổi | TV1 (Auth+User) | TV2 (Movie+Rạp) | TV3 (Booking+RT) | TV4 (Payment+Noti) | TV5 (Admin+DB) |
|------|-----------------|-----------------|-------------------|---------------------|----------------|
| **1** | Setup backend, DB+Redis config | Seed data, model mẫu | Setup Socket.IO, Redis lock util | Setup Payment GW, HMAC | ERD, migrations, README |
| **2** | Auth controller, JWT middleware | Account/Customer model, routes | Error handler, rate limit | Email OTP service, Nodemailer | Admin skeleton, login page |
| **3** | Mobile Home, Search, Profile | Movie/Cinema/Show API | Seat model, Socket.IO rooms | Featured cache, carousel | Admin CRUD phim/rạp |
| **4** | Mobile SeatSelection, Combo | Admin API seats/shows | Booking service, Redis lock, WS | Payment/Voucher model | Admin seat-layout, shows |
| **5** | Mobile Payment, Tickets | Pricing service, Cinema screens | Booking→Payment flow | Payment GW E2E, loyalty | Admin vouchers, settings |
| **6** | Mobile cancel, voucher UI | Khôi phục ghế DB | Cancel service, thu hồi điểm | Voucher FEFO, hoàn tiền | Admin voucher config, settings |
| **7** | Mobile notifications, loyalty | FCM service, trigger phim mới | Trigger noti booking | Notification system E2E | Admin accounts, featured |
| **8** | Forgot password, avatar, polish | Stats API, refresh cache job | Cronjob release seats | Reminder job, auto voucher | Reports Chart.js, audit log |
| **9** | E2E test Auth, UI polish | E2E test Movie, data demo | E2E test Booking, stress test | E2E test Payment, noti | E2E test Admin, DB optimize |
| **10** | Docs API Auth, video demo | Docs API Movie, diagrams | Docs API Booking, video RT | Docs Payment/Voucher/Noti | Docs DB, README, slide tổng |
