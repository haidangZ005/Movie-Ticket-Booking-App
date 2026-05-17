# 🔄 Quy ước TypeScript — Bổ sung cho AGENTS.md

> **Áp dụng cho:** Toàn bộ Backend (`backend/`) và Payment Gateway (`payment-gateway/`)
> **Ngày cập nhật:** 05/05/2026
> **Lý do:** Nhóm thống nhất chuyển Backend từ JavaScript sang TypeScript

---

## 1. Quy tắc chung (thay thế mục "Quy tắc chung" trong AGENTS.md)

- 🔄 **Backend sử dụng TypeScript** — Tất cả file backend có đuôi `.ts` (KHÔNG dùng `.js`).
- Sử dụng **ESM** (`import/export`) — **KHÔNG dùng** CommonJS (`require/module.exports`).
- Sử dụng **ES6+ syntax** (arrow functions, destructuring, template literals, async/await).
- **LUÔN** dùng `async/await` thay vì callbacks hoặc `.then()` chains.
- **KHÔNG BAO GIỜ** dùng `var`. Dùng `const` mặc định, chỉ dùng `let` khi cần reassign.
- **KHÔNG** commit file `.env`. Luôn dùng `.env.example` làm template.
- Khai báo **interface/type** cho tất cả payload, request body, response data.

> ⚠️ Một số code mẫu trong `AGENTS.md` vẫn viết dưới dạng JavaScript (`.js`) để tham khảo logic.
> Khi triển khai thực tế, **BẮT BUỘC** chuyển sang TypeScript (`.ts`) với `import/export` và khai báo type.

---

## 2. Mapping tên file JS → TS

### Backend — Entry Point
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `backend/server.js` | `backend/server.ts` |
| `payment-gateway/server.js` | `payment-gateway/server.ts` |

### Backend — Config
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `config/db.js` | `config/database.ts` |
| `config/redis.js` | `config/redis.ts` |
| `config/jwt.js` | `config/jwt.ts` |
| `config/cloudinary.js` | `config/cloudinary.ts` |
| `config/email.js` | `config/email.ts` |
| `config/firebase.js` | `config/firebase.ts` |

### Backend — Utils
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `utils/index.js` | *(Không dùng barrel, import trực tiếp)* |
| `utils/apiResponse.js` | *(Không dùng, thay bằng cách trả response trực tiếp)* |
| `utils/appError.js` | `utils/exceptions/app.exception.ts` |
| `utils/asyncHandler.js` | `utils/helpers/async.handler.ts` |

### Backend — Middlewares
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `middlewares/auth.middleware.js` | `middlewares/auth.middleware.ts` |
| `middlewares/role.middleware.js` | `middlewares/role.middleware.ts` |
| `middlewares/errorHandler.js` | `utils/exceptions/global.exception.handler.ts` |
| `middlewares/notFound.js` | *(tích hợp vào global handler)* |

### Backend — Models
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `models/movie.model.js` | `models/movie.model.ts` |
| `models/cinema.model.js` | `models/cinema.model.ts` |
| `models/city.model.js` | `models/city.model.ts` |
| `models/hall.model.js` | `models/hall.model.ts` |
| `models/seat.model.js` | `models/seat.model.ts` |
| `models/show.model.js` | `models/show.model.ts` |
| `models/likeMovie.model.js` | `models/likeMovie.model.ts` |
| `models/account.model.js` | `models/account.model.ts` |
| `models/customer.model.js` | `models/customer.model.ts` |
| `models/booking.model.js` | `models/booking.model.ts` |
| `models/product.model.js` | `models/product.model.ts` |
| `models/payment.model.js` | `models/payment.model.ts` |
| `models/voucher.model.js` | `models/voucher.model.ts` |
| `models/notification.model.js` | `models/notification.model.ts` |

### Backend — Services
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `services/movie.service.js` | `services/movie.service.ts` |
| `services/cinema.service.js` | `services/cinema.service.ts` |
| `services/hall.service.js` | `services/hall.service.ts` |
| `services/show.service.js` | `services/show.service.ts` |
| `services/auth.service.js` | `services/auth.service.ts` |
| `services/booking.service.js` | `services/booking.service.ts` |
| `services/payment.service.js` | `services/payment.service.ts` |
| `services/voucher.service.js` | `services/voucher.service.ts` |
| `services/email.service.js` | `services/email.service.ts` |
| `services/otp.service.js` | `services/otp.service.ts` |
| `services/cache.service.js` | `services/cache.service.ts` |
| `services/notification.service.js` | `services/notification.service.ts` |
| `services/pricing.service.js` | `services/pricing.service.ts` |
| `services/cancel.service.js` | `services/cancel.service.ts` |
| `services/loyalty.service.js` | `services/loyalty.service.ts` |
| `services/push.service.js` | `services/push.service.ts` |

### Backend — Controllers
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `controllers/movie/movie.controller.js` | `controllers/movie/movie.controller.ts` |
| `controllers/cinema/cinema.controller.js` | `controllers/cinema/cinema.controller.ts` |
| `controllers/cinema/hall.controller.js` | `controllers/cinema/hall.controller.ts` |
| `controllers/show/show.controller.js` | `controllers/show/show.controller.ts` |
| `controllers/auth/auth.controller.js` | `controllers/auth/auth.controller.ts` |
| `controllers/booking/booking.controller.js` | `controllers/booking/booking.controller.ts` |
| `controllers/payment/payment.controller.js` | `controllers/payment/payment.controller.ts` |
| `controllers/voucher/voucher.controller.js` | `controllers/voucher/voucher.controller.ts` |
| `controllers/notification/notification.controller.js` | `controllers/notification/notification.controller.ts` |
| `controllers/customer/customer.controller.js` | `controllers/customer/customer.controller.ts` |
| `controllers/product/product.controller.js` | `controllers/product/product.controller.ts` |
| `controllers/admin/movie/movie.controller.js` | `controllers/admin/movie/movie.controller.ts` |
| `controllers/admin/cinema/cinema.controller.js` | `controllers/admin/cinema/cinema.controller.ts` |
| `controllers/admin/show/show.controller.js` | `controllers/admin/show/show.controller.ts` |

### Backend — Routes
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `routes/index.js` | `routes/index.ts` |
| `routes/movie/movie.routes.js` | `routes/movie/movie.routes.ts` |
| `routes/cinema/cinema.routes.js` | `routes/cinema/cinema.routes.ts` |
| `routes/cinema/hall.routes.js` | `routes/cinema/hall.routes.ts` |
| `routes/cinema/seat.routes.js` | `routes/cinema/seat.routes.ts` |
| `routes/cinema/index.js` | `routes/cinema/index.ts` |
| `routes/show/show.routes.js` | `routes/show/show.routes.ts` |
| `routes/auth/auth.routes.js` | `routes/auth/auth.routes.ts` |
| `routes/customer/customer.routes.js` | `routes/customer/customer.routes.ts` |
| `routes/booking/booking.routes.js` | `routes/booking/booking.routes.ts` |
| `routes/payment/payment.routes.js` | `routes/payment/payment.routes.ts` |
| `routes/voucher/voucher.routes.js` | `routes/voucher/voucher.routes.ts` |
| `routes/notification/notification.routes.js` | `routes/notification/notification.routes.ts` |
| `routes/product/product.routes.js` | `routes/product/product.routes.ts` |
| `routes/admin/admin.routes.js` | `routes/admin/admin.routes.ts` |
| `routes/hall/hall.routes.js` | `routes/hall/hall.routes.ts` |

### Backend — Validators
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `validators/auth.validator.js` | `validators/auth.validator.ts` |
| `validators/movie.validator.js` | `validators/movie.validator.ts` |
| `validators/cinema.validator.js` | `validators/cinema.validator.ts` |
| `validators/show.validator.js` | `validators/show.validator.ts` |
| `validators/booking.validator.js` | `validators/booking.validator.ts` |

### Backend — Jobs & Socket
| Cũ (JS) | Mới (TS) |
|----------|----------|
| `jobs/index.js` | `jobs/index.ts` |
| `socket/index.js` | `socket/index.ts` |
| `utils/redisLock.js` | `utils/redisLock.ts` |

---

## 3. Import chuẩn TypeScript (thay cho `require`)

```typescript
// ❌ Cũ (JavaScript CommonJS)
const express = require('express');
const { ApiResponse, AppError, asyncHandler } = require('../utils');
const movieService = require('../../services/movie.service');
module.exports = router;

// ✅ Mới (TypeScript ESM)
import express, { Request, Response, NextFunction } from 'express';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';
import { asyncHandler } from '../utils/helpers/async.handler';
import * as movieService from '../../services/movie.service';
export default router;
```

---

## 4. Error Handling chuẩn TypeScript

```typescript
// ❌ Cũ
throw AppError.notFound('Phim không tồn tại', 'MOVIE_NOT_FOUND');
throw new AppError('Ghế đã đặt', 409, 'SEAT_ALREADY_BOOKED');

// ✅ Mới
throw new AppException(ErrorCode.MOVIE_NOT_FOUND);
throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
```

Tất cả error code định nghĩa trong `utils/exceptions/error.code.ts`:
```typescript
export const ErrorCode = {
  MOVIE_NOT_FOUND:    { code: 2000, message: 'Phim không tồn tại', statusCode: 404 },
  CINEMA_NOT_FOUND:   { code: 2001, message: 'Rạp không tồn tại', statusCode: 404 },
  SHOW_NOT_FOUND:     { code: 2002, message: 'Suất chiếu không tồn tại', statusCode: 404 },
  SEAT_ALREADY_BOOKED:{ code: 2003, message: 'Ghế đã được đặt', statusCode: 409 },
  // ... thêm error codes khác
} as const;
```

---

## 5. Cấu trúc thư mục Backend (cập nhật)

```
backend/
├── package.json
├── tsconfig.json                    ← 🆕 Cấu hình TypeScript
├── .env.example
├── server.ts                        ← 🔄 Entry point (.ts)
└── src/
    ├── config/
    │   ├── database.ts              ← 🔄 Kết nối SQL Server
    │   ├── redis.ts
    │   ├── jwt.ts
    │   ├── cloudinary.ts
    │   ├── email.ts
    │   └── firebase.ts
    ├── controllers/                  ← Tất cả .ts
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   └── role.middleware.ts
    ├── models/                       ← Tất cả .ts (có interface)
    ├── routes/                       ← Tất cả .ts
    ├── services/                     ← Tất cả .ts
    ├── utils/
    │   ├── exceptions/
    │   │   ├── app.exception.ts
    │   │   ├── error.code.ts
    │   │   └── global.exception.handler.ts
    │   ├── helpers/
    │   │   └── async.handler.ts
    │   ├── constants/
    │   ├── dto/
    │   └── token.util.ts
    ├── validators/                   ← Tất cả .ts
    ├── jobs/                         ← Tất cả .ts
    └── socket/                       ← Tất cả .ts
```

---

## 6. Phần KHÔNG đổi (vẫn giữ JS)

| Phần | Ngôn ngữ | Lý do |
|------|----------|-------|
| **Frontend Admin** (`frontend-admin/`) | HTML/CSS/**JS** | Vanilla JS, không có build step |
| **Mobile App** (`mobile-app/`) | React Native **JS** | Giữ `.js` để đơn giản (có thể nâng cấp sau) |
| **Database** (`database/`) | SQL | Không liên quan |

---

## 7. Dependencies cần bổ sung cho TypeScript

```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "ts-node": "^10.x",
    "@types/node": "^20.x",
    "@types/express": "^4.x",
    "@types/cors": "^2.x",
    "@types/bcryptjs": "^2.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/nodemailer": "^6.x",
    "@types/morgan": "^1.x"
  }
}
```

---

## 8. Phân công theo Buổi (mapping JS → TS)

Toàn bộ file trong bảng phân công tại mục XI và XII của AGENTS.md, khi đề cập đến file `.js` của backend, **đều hiểu ngầm là `.ts`**.

Ví dụ:
| AGENTS.md ghi | Thực tế tạo |
|--------------|-------------|
| `movie.model.js` | `movie.model.ts` |
| `auth.controller.js` | `auth.controller.ts` |
| `booking.service.js` | `booking.service.ts` |
| `authSlice.js` | `authSlice.js` *(Mobile vẫn giữ JS)* |
| `movieManager.js` | `movieManager.js` *(Admin vẫn giữ JS)* |
