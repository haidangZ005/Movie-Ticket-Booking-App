# Hướng dẫn Viết Test Case — Hệ thống Đặt Vé Xem Phim

> **Đồ án: Phát triển Ứng dụng Đa nền tảng — Nhóm 5 Thành viên**
> Cập nhật: Tháng 6/2026

---

## Mục lục

- [I. Quy ước chung](#i-quy-ước-chung)
- [II. Cấu trúc mỗi Test Case](#ii-cấu-trúc-mỗi-test-case)
- [III. Template Test Case](#iii-template-test-case)
- [IV. Phân loại Test Case](#iv-phân-loại-test-case)
- [V. Phân công chi tiết theo Thành viên](#v-phân-công-chi-tiết-theo-thành-viên)
  - [TV1 — Auth & Customer & Notification](#tv1--auth--customer--notification)
  - [TV2 — Movie & Cinema & Show & Seat Layout](#tv2--movie--cinema--show--seat-layout)
  - [TV3 — Booking & Seat Hold & Ticket](#tv3--booking--seat-hold--ticket)
  - [TV4 — Payment & Payment Gateway & Voucher](#tv4--payment--payment-gateway--voucher)
  - [TV5 — Admin Panel (Frontend) & Review & Product & Jobs](#tv5--admin-panel-frontend--review--product--jobs)
- [VI. Quy tắc đặt mã Test Case](#vi-quy-tắc-đặt-mã-test-case)
- [VII. Hướng dẫn test bằng Postman](#vii-hướng-dẫn-test-bằng-postman)
- [VIII. Checklist hoàn thành](#viii-checklist-hoàn-thành)

---

## I. Quy ước chung

### 1. Nguyên tắc viết test case

- **Mỗi test case là 1 hành vi cụ thể** — Không gộp nhiều hành vi vào 1 test case.
- **Độc lập** — Test case A không phụ thuộc kết quả test case B.
- **Rõ ràng** — Người đọc có thể thực thi mà không cần hỏi thêm.
- **Bao phủ đầy đủ** — Viết cho cả trường hợp **thành công (Happy Path)** và **thất bại (Negative/Edge Case)**.
- **Tham chiếu mã nguồn** — Mỗi test case nên ghi rõ file/API liên quan.

### 2. Mức độ ưu tiên (Priority)

| Priority | Ý nghĩa | Ví dụ |
|----------|---------|-------|
| **P0** — Critical | Chức năng cốt lõi, ảnh hưởng toàn bộ hệ thống | Đăng nhập, đặt vé, thanh toán |
| **P1** — High | Chức năng quan trọng nhưng có workaround | Quên mật khẩu, hủy vé, áp dụng voucher |
| **P2** — Medium | Chức năng phụ trợ, UX | Tìm kiếm phim, xem thông báo, sắp xếp |
| **P3** — Low | Cosmetic, edge case ít xảy ra | Hiển thị tooltip, format số tiền |

### 3. Loại test (Test Type)

| Loại | Viết tắt | Mô tả |
|------|----------|-------|
| **Functional** | `FUNC` | Kiểm tra chức năng đúng yêu cầu |
| **Negative** | `NEG` | Kiểm tra xử lý dữ liệu sai / trường hợp lỗi |
| **Boundary** | `BOUND` | Kiểm tra giá trị biên (min, max, empty) |
| **Security** | `SEC` | Kiểm tra bảo mật (JWT, HMAC, RBAC, injection) |
| **Integration** | `INT` | Kiểm tra tích hợp giữa các module / service |
| **Performance** | `PERF` | Kiểm tra hiệu năng, tải, response time |
| **UI** | `UI` | Kiểm tra giao diện Mobile / Admin Panel |

---

## II. Cấu trúc mỗi Test Case

Mỗi test case phải bao gồm các trường sau:

| Trường | Bắt buộc | Mô tả |
|--------|----------|-------|
| **Mã TC** | ✅ | ID duy nhất theo quy tắc đặt tên (mục VI) |
| **Tên TC** | ✅ | Mô tả ngắn gọn hành vi đang test |
| **Module** | ✅ | Module chức năng (M1–M8) |
| **Loại** | ✅ | FUNC / NEG / BOUND / SEC / INT / UI |
| **Priority** | ✅ | P0 / P1 / P2 / P3 |
| **Preconditions** | ✅ | Điều kiện tiên quyết trước khi thực hiện |
| **Test Steps** | ✅ | Các bước thực hiện chi tiết (đánh số 1, 2, 3…) |
| **Test Data** | ✅ | Dữ liệu đầu vào cụ thể |
| **Expected Result** | ✅ | Kết quả mong đợi chi tiết |
| **API Endpoint** | Nếu có | Method + Path (vd: `POST /api/auth/register`) |
| **File tham chiếu** | Nếu có | File controller / service / screen liên quan |
| **Actual Result** | Khi test | Kết quả thực tế sau khi thực hiện |
| **Status** | Khi test | PASS / FAIL / BLOCKED / SKIP |
| **Ghi chú** | Tuỳ chọn | Bug ID, screenshot, lưu ý đặc biệt |

---

## III. Template Test Case

### Template dạng bảng (dùng cho báo cáo)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mã TC:        AUTH-FUNC-001                                     │
│ Tên TC:       Đăng ký thành công với email & password hợp lệ    │
│ Module:       M8 — Quản lý Người dùng                           │
│ Loại:         FUNC                                              │
│ Priority:     P0                                                │
│ Người viết:   TV1                                               │
├─────────────────────────────────────────────────────────────────┤
│ Preconditions:                                                  │
│ - Server backend đang chạy (port 3000)                         │
│ - Redis đang chạy                                              │
│ - Email "test_new@gmail.com" chưa tồn tại trong DB             │
├─────────────────────────────────────────────────────────────────┤
│ Test Data:                                                      │
│ {                                                               │
│   "email": "test_new@gmail.com",                                │
│   "password": "Test@123456"                                     │
│ }                                                               │
├─────────────────────────────────────────────────────────────────┤
│ Test Steps:                                                     │
│ 1. Gửi POST /api/auth/register với Test Data                   │
│ 2. Kiểm tra response status = 200                              │
│ 3. Kiểm tra response body có success = true                    │
│ 4. Kiểm tra email nhận được OTP 6 chữ số                       │
├─────────────────────────────────────────────────────────────────┤
│ Expected Result:                                                │
│ - HTTP Status: 200                                              │
│ - Response:                                                     │
│   { "code": 1008, "message": "OTP sent", "data": {...} }       │
│ - Redis key "otp:register:test_new@gmail.com" tồn tại          │
│ - Email OTP được gửi qua hàng đợi BullMQ                       │
├─────────────────────────────────────────────────────────────────┤
│ API Endpoint:  POST /api/auth/register                          │
│ File tham chiếu:                                                │
│ - backend/src/controllers/auth/auth.controller.ts               │
│ - backend/src/services/auth.service.ts                          │
├─────────────────────────────────────────────────────────────────┤
│ Actual Result:  (điền khi test)                                 │
│ Status:         □ PASS  □ FAIL  □ BLOCKED  □ SKIP              │
│ Ghi chú:                                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Template dạng Markdown (dùng cho từng file)

```markdown
### AUTH-FUNC-001: Đăng ký thành công với email & password hợp lệ

| Thuộc tính | Chi tiết |
|-----------|----------|
| Module | M8 — Quản lý Người dùng |
| Loại | FUNC |
| Priority | P0 |
| API | `POST /api/auth/register` |
| File | `auth.controller.ts` → `auth.service.ts` |

**Preconditions:**
- Server backend đang chạy
- Email `test_new@gmail.com` chưa tồn tại

**Test Data:**
```json
{
  "email": "test_new@gmail.com",
  "password": "Test@123456"
}
```

**Steps:**
1. Gửi request POST `/api/auth/register` với body trên
2. Kiểm tra HTTP status = 200
3. Kiểm tra `code` = 1008 (OTP_SENT)
4. Kiểm tra Redis key `otp:register:test_new@gmail.com` tồn tại

**Expected Result:**
- Status 200, body `{ code: 1008, message: "OTP sent", data: { email: "test_new@gmail.com" } }`
- OTP 6 chữ số được lưu hash trong Redis, TTL = 300s
- Email OTP được đưa vào hàng đợi BullMQ

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED
```

---

## IV. Phân loại Test Case

### Tổng quan phân bố test case theo Module

| Module | Tên | API Endpoints chính | Số TC dự kiến | Người phụ trách |
|--------|-----|---------------------|---------------|-----------------|
| M8 | Quản lý Người dùng (Auth) | 8 endpoints | ~35 TC | **TV1** |
| M8 | Quản lý Hồ sơ (Customer) | 8 endpoints | ~25 TC | **TV1** |
| M7 | Thông báo | 4 endpoints | ~12 TC | **TV1** |
| M1 | Quản lý Phim | 8 endpoints | ~28 TC | **TV2** |
| M1 | Rạp & Phòng chiếu | 8 endpoints | ~24 TC | **TV2** |
| M1 | Lịch chiếu & Ghế | 7 endpoints | ~20 TC | **TV2** |
| M3 | Đặt vé & Giữ ghế | 5 endpoints | ~30 TC | **TV3** |
| M5 | Vé & Lịch sử | 2 endpoints | ~10 TC | **TV3** |
| M3 | WebSocket Realtime | Socket events | ~12 TC | **TV3** |
| M4 | Thanh toán | 4 endpoints | ~25 TC | **TV4** |
| M4 | Payment Gateway | 4 endpoints | ~16 TC | **TV4** |
| M6 | Voucher | 9 endpoints | ~30 TC | **TV4** |
| M1 | Admin CRUD + Reports | 8 endpoints | ~22 TC | **TV5** |
| M2 | Product (Combo) | 6 endpoints | ~14 TC | **TV5** |
| M2 | Review | 3 endpoints | ~12 TC | **TV5** |
| — | Cron Jobs | 4 jobs | ~12 TC | **TV5** |
| — | Admin Panel UI | 14 pages | ~24 TC | **TV5** |

**Tổng dự kiến: ~300+ test cases, mỗi thành viên ~60–72 test cases.**

---

## V. Phân công chi tiết theo Thành viên

---

### TV1 — Auth & Customer & Notification

**Phạm vi:** Module M8 (Quản lý Người dùng) + M7 (Thông báo)

**File backend liên quan:**
- `controllers/auth/auth.controller.ts`
- `services/auth.service.ts`
- `controllers/customer/customer.controller.ts`
- `services/customer.service.ts`
- `controllers/notification/notification.controller.ts`
- `middlewares/auth.middleware.ts`
- `middlewares/role.middleware.ts`
- `validators/auth.validator.ts`
- `utils/token.util.ts`

**File mobile liên quan:**
- `screens/auth/*` (Login, Register, OTP, ForgotPassword)
- `screens/profile/*` (Profile, EditProfile)
- `screens/notification/*`
- `services/authService.ts`
- `services/customerService.ts`
- `services/notificationService.ts`

#### Danh sách Test Case cần viết (~72 TC):

##### A. Đăng ký (Register + OTP) — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| AUTH-FUNC-001 | Đăng ký thành công — gửi OTP qua email | FUNC | P0 | `POST /api/auth/register` |
| AUTH-FUNC-002 | Xác thực OTP đúng — tạo Account + Customer | FUNC | P0 | `POST /api/auth/verify-otp` |
| AUTH-NEG-003 | Đăng ký email đã tồn tại — trả lỗi 400 (USER_EXISTED, code 1001) | NEG | P0 | `POST /api/auth/register` |
| AUTH-NEG-004 | Xác thực OTP sai — trả lỗi 400 (INVALID_OTP, code 1002) | NEG | P0 | `POST /api/auth/verify-otp` |
| AUTH-NEG-005 | OTP hết hạn (>5 phút) — trả lỗi 400 | NEG | P1 | `POST /api/auth/verify-otp` |
| AUTH-NEG-006 | Gửi OTP quá 3 lần trong 15 phút — trả 429 (TOO_MANY_REQUESTS) | NEG | P1 | `POST /api/auth/register` |
| AUTH-BOUND-007 | Email rỗng hoặc không hợp lệ — trả lỗi validation | BOUND | P1 | `POST /api/auth/register` |
| AUTH-BOUND-008 | Password rỗng hoặc quá ngắn — trả lỗi validation | BOUND | P1 | `POST /api/auth/register` |
| AUTH-SEC-009 | OTP được lưu dạng hash (bcrypt) trong Redis, không phải plaintext | SEC | P1 | — |
| AUTH-INT-010 | Sau verify OTP: Account (IsVerified=1) + Customer được tạo trong 1 transaction | INT | P0 | `POST /api/auth/verify-otp` |

##### B. Đăng nhập (Login) — 8 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| AUTH-FUNC-011 | Đăng nhập thành công — trả accessToken + refreshToken | FUNC | P0 | `POST /api/auth/login` |
| AUTH-NEG-012 | Đăng nhập email không tồn tại — trả 404 (USER_NOT_EXISTED) | NEG | P0 | `POST /api/auth/login` |
| AUTH-NEG-013 | Đăng nhập sai password — trả 401 (UNAUTHENTICATED) | NEG | P0 | `POST /api/auth/login` |
| AUTH-NEG-014 | Đăng nhập tài khoản chưa verify (IsVerified=false) — trả 403 | NEG | P1 | `POST /api/auth/login` |
| AUTH-NEG-015 | Đăng nhập tài khoản bị vô hiệu hóa (IsActive=false) — trả 401 | NEG | P1 | `POST /api/auth/login` |
| AUTH-SEC-016 | AccessToken chứa payload: accountId, accountType, customerId, jti | SEC | P1 | `POST /api/auth/login` |
| AUTH-BOUND-017 | Email có khoảng trắng đầu/cuối — tự trim + lowercase | BOUND | P2 | `POST /api/auth/login` |
| AUTH-SEC-018 | Response không chứa PasswordHash | SEC | P0 | `POST /api/auth/login` |

##### C. Refresh Token & Logout — 6 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| AUTH-FUNC-019 | Refresh token thành công — trả cặp token mới | FUNC | P0 | `POST /api/auth/refresh-token` |
| AUTH-NEG-020 | Refresh token đã bị blacklist — trả 401 | NEG | P1 | `POST /api/auth/refresh-token` |
| AUTH-NEG-021 | Refresh token hết hạn — trả 401 | NEG | P1 | `POST /api/auth/refresh-token` |
| AUTH-FUNC-022 | Logout thành công — blacklist cả access + refresh token | FUNC | P0 | `POST /api/auth/logout` |
| AUTH-SEC-023 | Sau logout, dùng lại access token cũ — trả 401 | SEC | P0 | bất kỳ API cần auth |
| AUTH-SEC-024 | Sau refresh, dùng lại refresh token cũ — trả 401 | SEC | P1 | `POST /api/auth/refresh-token` |

##### D. Quên mật khẩu & Đặt lại — 8 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| AUTH-FUNC-025 | Gửi yêu cầu quên MK — trả success (luôn trả 200 dù email ko tồn tại) | FUNC | P1 | `POST /api/auth/forgot-password` |
| AUTH-FUNC-026 | Xác thực OTP reset đúng — lưu phiên verified 5 phút | FUNC | P1 | `POST /api/auth/verify-reset-otp` |
| AUTH-FUNC-027 | Đặt lại MK thành công sau khi đã verify OTP | FUNC | P1 | `POST /api/auth/reset-password` |
| AUTH-NEG-028 | Đặt lại MK khi chưa verify OTP — trả lỗi (RESET_OTP_NOT_VERIFIED) | NEG | P1 | `POST /api/auth/reset-password` |
| AUTH-NEG-029 | OTP reset sai — trả 400 | NEG | P1 | `POST /api/auth/verify-reset-otp` |
| AUTH-NEG-030 | Throttle quên MK: >3 lần/15 phút — trả 429 | NEG | P2 | `POST /api/auth/forgot-password` |
| AUTH-SEC-031 | Quên MK email không tồn tại — vẫn trả 200 (chống dò email) | SEC | P1 | `POST /api/auth/forgot-password` |
| AUTH-FUNC-032 | Sau reset MK, đăng nhập bằng MK mới thành công | INT | P1 | `POST /api/auth/login` |

##### E. Đổi mật khẩu — 4 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| AUTH-FUNC-033 | Đổi MK thành công — trả success + blacklist token cũ | FUNC | P1 | `POST /api/auth/change-password` |
| AUTH-NEG-034 | Đổi MK sai mật khẩu cũ — trả 400 (INVALID_OLD_PASSWORD) | NEG | P1 | `POST /api/auth/change-password` |
| AUTH-SEC-035 | Sau đổi MK, token cũ bị blacklist | SEC | P1 | — |
| AUTH-NEG-036 | Đổi MK khi chưa đăng nhập (ko có Bearer) — trả 401 | NEG | P1 | `POST /api/auth/change-password` |

##### F. Middleware Auth & RBAC — 6 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| MW-SEC-001 | Request thiếu header Authorization — trả 401 | SEC | P0 | any protected route |
| MW-SEC-002 | Token không bắt đầu bằng "Bearer " — trả 401 | SEC | P1 | any protected route |
| MW-SEC-003 | Token invalid (sai secret) — trả 401 | SEC | P0 | any protected route |
| MW-SEC-004 | Token đã blacklist — trả 401 | SEC | P0 | any protected route |
| MW-SEC-005 | CUSTOMER truy cập route ADMIN — trả 403 | SEC | P0 | `GET /api/admin/*` |
| MW-SEC-006 | ADMIN truy cập route SUPER_ADMIN — trả 403 | SEC | P1 | `GET /api/admin/audit-logs` |

##### G. Customer Profile — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| CUST-FUNC-001 | Xem hồ sơ cá nhân thành công | FUNC | P1 | `GET /api/customer/profile` |
| CUST-FUNC-002 | Cập nhật hồ sơ (FullName, Phone, Gender, DOB) thành công | FUNC | P1 | `PUT /api/customer/profile` |
| CUST-FUNC-003 | Xem điểm tích lũy + lịch sử điểm (phân trang) | FUNC | P2 | `GET /api/customer/loyalty` |
| CUST-FUNC-004 | Xem danh sách voucher của tôi | FUNC | P2 | `GET /api/customer/vouchers` |
| CUST-FUNC-005 | Xem lịch sử thanh toán (phân trang) | FUNC | P2 | `GET /api/customer/payment-history` |
| CUST-FUNC-006 | Xem chi tiết thanh toán theo bookingId | FUNC | P2 | `GET /api/customer/payment-history/:bookingId` |
| CUST-FUNC-007 | Đổi điểm tích lũy lấy voucher (50/75/100 points) | FUNC | P2 | `POST /api/customer/redeem` |
| CUST-NEG-008 | Đổi điểm với pointCost không hợp lệ (vd: 30) — trả 400 | NEG | P2 | `POST /api/customer/redeem` |
| CUST-NEG-009 | Xem profile khi chưa đăng nhập — trả 401 | NEG | P1 | `GET /api/customer/profile` |
| CUST-NEG-010 | Xem chi tiết thanh toán bookingId không thuộc user — trả lỗi | NEG | P2 | `GET /api/customer/payment-history/:bookingId` |

##### H. Notification — 8 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| NOTI-FUNC-001 | Lấy danh sách thông báo phân trang (mới nhất trước) | FUNC | P2 | `GET /api/notifications` |
| NOTI-FUNC-002 | Đánh dấu 1 thông báo đã đọc | FUNC | P2 | `PUT /api/notifications/:id/read` |
| NOTI-FUNC-003 | Đánh dấu tất cả thông báo đã đọc | FUNC | P2 | `PUT /api/notifications/read-all` |
| NOTI-FUNC-004 | Lấy số thông báo chưa đọc (badge count) | FUNC | P2 | `GET /api/notifications/unread-count` |
| NOTI-NEG-005 | Đánh dấu đọc notification không tồn tại — trả 404 | NEG | P3 | `PUT /api/notifications/:id/read` |
| NOTI-NEG-006 | Đánh dấu đọc notification của người khác — trả lỗi | NEG | P2 | `PUT /api/notifications/:id/read` |
| NOTI-INT-007 | Tạo booking thành công → notification được tạo tự động | INT | P2 | — |
| NOTI-INT-008 | Tạo phim mới → notification được gửi đến tất cả customer | INT | P2 | — |

##### I. Mobile UI — Auth & Profile Screens — 12 TC

| Mã TC | Tên | Loại | Priority |
|-------|-----|------|----------|
| UI-AUTH-001 | Màn hình Login hiển thị đầy đủ: email, password, nút đăng nhập | UI | P0 |
| UI-AUTH-002 | Nhập email/password hợp lệ → chuyển đến HomeScreen | UI | P0 |
| UI-AUTH-003 | Nhập sai → hiển thị thông báo lỗi | UI | P1 |
| UI-AUTH-004 | Màn hình Register → nhập → hiện OTP screen | UI | P0 |
| UI-AUTH-005 | OTP Screen: nhập 6 chữ số → verify thành công → chuyển Login | UI | P0 |
| UI-AUTH-006 | Forgot Password flow: nhập email → nhập OTP → nhập MK mới | UI | P1 |
| UI-PROF-007 | Profile Screen hiển thị: avatar, tên, email, điểm loyalty | UI | P1 |
| UI-PROF-008 | Edit Profile: chỉnh tên, SĐT, giới tính, ngày sinh → lưu thành công | UI | P2 |
| UI-PROF-009 | Notification Screen: hiển thị danh sách, badge count chưa đọc | UI | P2 |
| UI-PROF-010 | Pull-to-refresh trên danh sách thông báo | UI | P3 |
| UI-AUTH-011 | Token hết hạn → tự refresh hoặc điều hướng về Login | UI | P1 |
| UI-AUTH-012 | Logout → xóa token + quay về Login screen | UI | P1 |

---

### TV2 — Movie & Cinema & Show & Seat Layout

**Phạm vi:** Module M1 (Quản lý Phim & Lịch Chiếu) + M2 (Tìm kiếm & Xem Phim)

**File backend liên quan:**
- `controllers/movie/movie.controller.ts`
- `services/movie.service.ts`
- `models/movie.model.ts`
- `controllers/cinema/cinema.controller.ts`
- `services/cinema.service.ts`
- `models/cinema.model.ts`
- `controllers/show/show.controller.ts`
- `services/show.service.ts`
- `models/show.model.ts`
- `controllers/admin/seat-layout.controller.ts`
- `services/seat-layout.service.ts`
- `validators/movie.validator.ts`
- `validators/cinema.validator.ts`

**File mobile liên quan:**
- `screens/home/*` (HomeScreen)
- `screens/movie/*` (MovieDetail, Search)
- `screens/cinema/*` (CinemaList, Showtime)
- `services/movieService.ts`
- `services/cinemaService.ts`
- `services/showService.ts`

#### Danh sách Test Case cần viết (~72 TC):

##### A. Movie — CRUD (Admin) — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| MOV-FUNC-001 | Thêm phim mới thành công (Admin) — trả 201 | FUNC | P0 | `POST /api/admin/movies` |
| MOV-FUNC-002 | Sửa phim thành công (Admin) — trả 200 | FUNC | P1 | `PUT /api/admin/movies/:id` |
| MOV-FUNC-003 | Xóa phim (soft delete) thành công — trả 200 | FUNC | P1 | `DELETE /api/admin/movies/:id` |
| MOV-FUNC-004 | Bật/tắt phim nổi bật — trả 200 | FUNC | P2 | `PUT /api/admin/movies/:id/featured` |
| MOV-FUNC-005 | Upload poster phim thành công — trả URL | FUNC | P1 | `POST /api/admin/uploads/movie-poster` |
| MOV-FUNC-006 | Upload trailer phim thành công — trả URL | FUNC | P2 | `POST /api/admin/uploads/movie-trailer` |
| MOV-NEG-007 | Thêm phim thiếu trường bắt buộc — trả 400 | NEG | P1 | `POST /api/admin/movies` |
| MOV-NEG-008 | Sửa phim không tồn tại — trả 404 | NEG | P2 | `PUT /api/admin/movies/:id` |
| MOV-NEG-009 | Upload poster không có file — trả 400 | NEG | P2 | `POST /api/admin/uploads/movie-poster` |
| MOV-SEC-010 | CUSTOMER gọi API thêm phim — trả 403 | SEC | P0 | `POST /api/admin/movies` |

##### B. Movie — Xem & Tìm kiếm (Public/Customer) — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| MOV-FUNC-011 | Lấy danh sách phim phân trang — trả 200 + pagination | FUNC | P0 | `GET /api/movies` |
| MOV-FUNC-012 | Lọc phim theo genre — trả danh sách đúng | FUNC | P1 | `GET /api/movies?genre=Action` |
| MOV-FUNC-013 | Lọc phim theo language, isActive, isFeatured | FUNC | P2 | `GET /api/movies?language=...` |
| MOV-FUNC-014 | Xem chi tiết phim theo ID — trả đầy đủ thông tin | FUNC | P0 | `GET /api/movies/:id` |
| MOV-FUNC-015 | Lấy danh sách phim nổi bật (featured) | FUNC | P1 | `GET /api/movies/featured` |
| MOV-FUNC-016 | Tìm kiếm phim theo keyword — trả kết quả match | FUNC | P0 | `GET /api/movies/search?q=` |
| MOV-FUNC-017 | Like/Unlike phim (toggle) — trả isLiked | FUNC | P2 | `POST /api/movies/:id/like` |
| MOV-NEG-018 | Xem chi tiết phim ID không tồn tại — trả 404 | NEG | P1 | `GET /api/movies/:id` |
| MOV-NEG-019 | Tìm kiếm thiếu query `q` — trả 400 | NEG | P2 | `GET /api/movies/search` |
| MOV-BOUND-020 | Phân trang page=0, page=-1, limit=0 — xử lý default | BOUND | P3 | `GET /api/movies` |

##### C. Cinema — Rạp & Phòng chiếu — 12 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| CIN-FUNC-001 | Lấy danh sách cụm rạp phân trang | FUNC | P0 | `GET /api/cinemas` |
| CIN-FUNC-002 | Lọc cụm rạp theo cityId | FUNC | P1 | `GET /api/cinemas?cityId=` |
| CIN-FUNC-003 | Lọc cụm rạp theo movieId (rạp đang chiếu phim X) | FUNC | P1 | `GET /api/cinemas?movieId=` |
| CIN-FUNC-004 | Xem chi tiết cụm rạp (kèm phòng chiếu) | FUNC | P1 | `GET /api/cinemas/:id` |
| CIN-FUNC-005 | Lấy danh sách thành phố | FUNC | P1 | `GET /api/cinemas/cities` |
| CIN-FUNC-006 | Thêm cụm rạp mới (Admin) — trả 201 | FUNC | P1 | `POST /api/admin/cinemas` |
| CIN-FUNC-007 | Thêm phòng chiếu cho rạp (Admin) — trả 201 | FUNC | P1 | `POST /api/admin/cinemas/:id/halls` |
| CIN-FUNC-008 | Sửa thông tin phòng chiếu (Admin) | FUNC | P2 | `PUT /api/admin/halls/:id` |
| CIN-FUNC-009 | Xóa phòng chiếu (Admin) | FUNC | P2 | `DELETE /api/admin/halls/:id` |
| CIN-FUNC-010 | Sửa cụm rạp (Admin) | FUNC | P2 | `PUT /api/admin/cinemas/:id` |
| CIN-FUNC-011 | Xóa cụm rạp soft delete (Admin) | FUNC | P2 | `DELETE /api/admin/cinemas/:id` |
| CIN-NEG-012 | Xem chi tiết rạp ID không tồn tại — trả 404 | NEG | P2 | `GET /api/cinemas/:id` |

##### D. Show (Lịch chiếu) — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| SHOW-FUNC-001 | Xem chi tiết suất chiếu theo ID | FUNC | P0 | `GET /api/shows/:id` |
| SHOW-FUNC-002 | Xem sơ đồ ghế suất chiếu (kèm trạng thái) | FUNC | P0 | `GET /api/shows/:id/seats` |
| SHOW-FUNC-003 | Lấy lịch chiếu theo cụm rạp | FUNC | P0 | `GET /api/cinemas/:id/shows` |
| SHOW-FUNC-004 | Lọc lịch chiếu theo movieId + showDate + format | FUNC | P1 | `GET /api/cinemas/:id/shows?movieId=&date=` |
| SHOW-FUNC-005 | Lấy danh sách ngày có suất chiếu theo cụm rạp | FUNC | P1 | `GET /api/cinemas/:id/show-dates` |
| SHOW-FUNC-006 | Tạo suất chiếu mới (Admin) — trả 201 | FUNC | P1 | `POST /api/admin/shows` |
| SHOW-FUNC-007 | Cập nhật suất chiếu (Admin) | FUNC | P2 | `PUT /api/admin/shows/:id` |
| SHOW-FUNC-008 | Xóa suất chiếu (Admin, kiểm tra không có vé) | FUNC | P2 | `DELETE /api/admin/shows/:id` |
| SHOW-NEG-009 | Tạo suất chiếu trùng thời gian trong cùng phòng — trả 409 | NEG | P1 | `POST /api/admin/shows` |
| SHOW-NEG-010 | Tạo suất chiếu cho phòng chiếu không tồn tại — trả 404 | NEG | P2 | `POST /api/admin/shows` |

##### E. Seat Layout — 4 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| SEAT-FUNC-001 | Xem sơ đồ ghế phòng chiếu (Admin) | FUNC | P1 | `GET /api/admin/halls/:hallId/seat-layout` |
| SEAT-FUNC-002 | Cập nhật toàn bộ sơ đồ ghế phòng chiếu (Admin) | FUNC | P1 | `PUT /api/admin/halls/:hallId/seat-layout` |
| SEAT-NEG-003 | Xem sơ đồ ghế phòng không tồn tại — trả 404 | NEG | P2 | `GET /api/admin/halls/:hallId/seat-layout` |
| SEAT-FUNC-004 | Sơ đồ ghế có loại: STANDARD, VIP, COUPLE, AISLE, EMPTY | FUNC | P2 | — |

##### F. Pricing Service — 6 TC

| Mã TC | Tên | Loại | Priority | API / Service |
|-------|-----|------|----------|---------------|
| PRICE-FUNC-001 | Tính giá 1 ghế STANDARD ngày thường format 2D — đúng = BasePrice | FUNC | P0 | `PricingService.calculateSeatPrice` |
| PRICE-FUNC-002 | Tính giá ghế VIP cuối tuần format 3D — có WeekendSurcharge + FormatSurcharge + SeatSurcharge | FUNC | P0 | `PricingService.calculateSeatPrice` |
| PRICE-FUNC-003 | Tính giá batch nhiều ghế — grandTotal = tổng totalPrice | FUNC | P0 | `PricingService.calculateBatchPrice` |
| PRICE-FUNC-004 | Phụ thu đọc từ bảng SystemSettings, không hardcode | FUNC | P1 | — |
| PRICE-NEG-005 | Tính giá ghế AISLE — trả lỗi INVALID_DATA | NEG | P2 | `PricingService.calculateSeatPrice` |
| PRICE-NEG-006 | Tính giá suất chiếu không tồn tại — trả SHOW_NOT_FOUND | NEG | P2 | `PricingService.calculateSeatPrice` |

##### G. Mobile UI — Home & Movie & Cinema Screens — 20 TC

| Mã TC | Tên | Loại | Priority |
|-------|-----|------|----------|
| UI-HOME-001 | HomeScreen hiển thị carousel phim nổi bật | UI | P0 |
| UI-HOME-002 | HomeScreen hiển thị danh sách phim đang chiếu | UI | P0 |
| UI-MOV-003 | MovieDetailScreen: poster, title, genre, rating, mô tả | UI | P0 |
| UI-MOV-004 | MovieDetailScreen: hiển thị lịch chiếu theo rạp + ngày | UI | P0 |
| UI-MOV-005 | SearchScreen: nhập keyword → kết quả real-time | UI | P1 |
| UI-MOV-006 | SearchScreen: không có kết quả → hiển thị "Không tìm thấy" | UI | P2 |
| UI-CIN-007 | CinemaListScreen: hiển thị danh sách rạp theo thành phố | UI | P1 |
| UI-CIN-008 | CinemaListScreen: chọn rạp → xem lịch chiếu | UI | P1 |
| UI-SHOW-009 | ShowtimeScreen: hiển thị lịch chiếu theo ngày | UI | P1 |
| UI-SHOW-010 | ShowtimeScreen: chọn suất chiếu → chuyển SeatSelection | UI | P0 |
| UI-MOV-011 | Like/Unlike phim — icon tim đổi trạng thái | UI | P3 |
| UI-HOME-012 | Pull-to-refresh trên HomeScreen | UI | P3 |
| UI-MOV-013 | Xem trailer phim (nếu có) | UI | P2 |
| UI-CIN-014 | Lọc rạp theo thành phố bằng dropdown | UI | P2 |
| UI-SHOW-015 | Hiển thị format (2D/3D/IMAX) trên suất chiếu | UI | P2 |
| UI-SHOW-016 | Hiển thị sơ đồ ghế với màu sắc theo loại ghế | UI | P0 |
| UI-SHOW-017 | Ghế AISLE hiển thị là khoảng trống, không chọn được | UI | P1 |
| UI-SHOW-018 | Ghế BOOKED hiển thị xám, không chọn được | UI | P1 |
| UI-SHOW-019 | Ghế HOLDING hiển thị khác màu (đang giữ bởi người khác) | UI | P1 |
| UI-SHOW-020 | Chú thích (legend) màu ghế hiển thị đúng | UI | P2 |

---

### TV3 — Booking & Seat Hold & Ticket

**Phạm vi:** Module M3 (Đặt Vé) + M5 (Hủy & Quản lý Vé) + WebSocket Realtime

**File backend liên quan:**
- `controllers/booking/booking.controller.ts`
- `controllers/booking/seat-hold.controller.ts`
- `controllers/booking/ticket.controller.ts`
- `services/seat-hold.service.ts`
- `services/pricing.service.ts`
- `socket/index.ts`
- `config/redis.ts`

**File mobile liên quan:**
- `screens/booking/*` (SeatSelection, Combo)
- `screens/ticket/*` (TicketHistory, TicketDetail)
- `services/bookingService.ts`
- `services/ticketService.ts`
- `services/socketService.ts`
- `components/seat/*`

#### Danh sách Test Case cần viết (~62 TC):

##### A. Seat Hold (Giữ ghế Redis) — 14 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| HOLD-FUNC-001 | Giữ ghế thành công — Redis SET NX + TTL 10 phút | FUNC | P0 | `POST /api/bookings/seats/hold` |
| HOLD-FUNC-002 | Giữ nhiều ghế cùng lúc — tất cả thành công | FUNC | P0 | `POST /api/bookings/seats/hold` |
| HOLD-NEG-003 | Giữ ghế đang được người khác giữ (Redis) — trả 409 | NEG | P0 | `POST /api/bookings/seats/hold` |
| HOLD-NEG-004 | Giữ ghế đã BOOKED trong DB — trả lỗi | NEG | P0 | `POST /api/bookings/seats/hold` |
| HOLD-NEG-005 | Giữ ghế AISLE/EMPTY/DISABLED — trả lỗi "Ghế không khả dụng" | NEG | P1 | `POST /api/bookings/seats/hold` |
| HOLD-NEG-006 | Giữ ghế không thuộc suất chiếu — trả lỗi | NEG | P1 | `POST /api/bookings/seats/hold` |
| HOLD-FUNC-007 | Giải phóng ghế thành công (chỉ ghế của mình) | FUNC | P0 | `POST /api/bookings/seats/release` |
| HOLD-NEG-008 | Giải phóng ghế của người khác — không có gì xảy ra | NEG | P1 | `POST /api/bookings/seats/release` |
| HOLD-SEC-009 | Giữ ghế bằng Redis SET NX (atomic) — đảm bảo không race condition | SEC | P0 | — |
| HOLD-INT-010 | Giữ ghế thất bại ở ghế thứ N → rollback tất cả N-1 ghế đã hold | INT | P0 | `POST /api/bookings/seats/hold` |
| HOLD-BOUND-011 | seatIds rỗng — trả success=false | BOUND | P2 | `POST /api/bookings/seats/hold` |
| HOLD-BOUND-012 | seatIds trùng lặp — deduplicate trước khi xử lý | BOUND | P2 | `POST /api/bookings/seats/hold` |
| HOLD-FUNC-013 | Ghế hết TTL 10 phút → Redis tự xóa key → ghế lại available | FUNC | P1 | — |
| HOLD-PERF-014 | Giữ 8 ghế cùng lúc — response < 2s | PERF | P3 | `POST /api/bookings/seats/hold` |

##### B. WebSocket Realtime — 10 TC

| Mã TC | Tên | Loại | Priority |
|-------|-----|------|----------|
| WS-FUNC-001 | Client join room `show:{showId}` thành công | FUNC | P0 |
| WS-FUNC-002 | Khi customer A hold ghế → B nhận broadcast HOLDING | FUNC | P0 |
| WS-FUNC-003 | Khi customer A release ghế → B nhận broadcast AVAILABLE | FUNC | P0 |
| WS-FUNC-004 | Khi ghế được BOOKED (thanh toán xong) → broadcast BOOKED | FUNC | P0 |
| WS-FUNC-005 | Client leave room khi rời màn hình seat selection | FUNC | P2 |
| WS-NEG-006 | Client disconnect bất ngờ — không ảnh hưởng ghế đang hold | NEG | P1 |
| WS-INT-007 | Nhiều client cùng room → tất cả nhận broadcast đồng bộ | INT | P1 |
| WS-FUNC-008 | Broadcast data chứa: seatId, seatNumber, status, customerId, holdUntil | FUNC | P1 |
| WS-PERF-009 | Broadcast delay < 500ms | PERF | P2 |
| WS-SEC-010 | WebSocket yêu cầu token hợp lệ khi kết nối | SEC | P2 |

##### C. Create Booking — 12 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| BOOK-FUNC-001 | Tạo booking thành công — trả 201 + bookingId | FUNC | P0 | `POST /api/bookings` |
| BOOK-FUNC-002 | Booking tạo với status = PENDING_PAYMENT | FUNC | P0 | `POST /api/bookings` |
| BOOK-FUNC-003 | BookingSeat tạo với status = HOLDING + HoldUntil = +10 phút | FUNC | P0 | `POST /api/bookings` |
| BOOK-FUNC-004 | Booking kèm products (combo bắp nước) — BookingProduct được tạo | FUNC | P1 | `POST /api/bookings` |
| BOOK-FUNC-005 | TicketPrice cho mỗi ghế = giá tính từ PricingService | FUNC | P0 | `POST /api/bookings` |
| BOOK-NEG-006 | Tạo booking ghế đã BOOKED — trả 409 (SEAT_ALREADY_BOOKED) | NEG | P0 | `POST /api/bookings` |
| BOOK-NEG-007 | Tạo booking ghế do người khác hold (Redis) — trả 409 (SEAT_ALREADY_HELD) | NEG | P0 | `POST /api/bookings` |
| BOOK-NEG-008 | Thiếu showId hoặc seatIds — trả 400 | NEG | P1 | `POST /api/bookings` |
| BOOK-NEG-009 | totalAmount ≤ 0 — trả 400 | NEG | P2 | `POST /api/bookings` |
| BOOK-SEC-010 | Booking chỉ tạo được khi đã đăng nhập (có JWT) | SEC | P0 | `POST /api/bookings` |
| BOOK-INT-011 | Booking + BookingSeat + BookingProduct trong 1 SQL Transaction — nếu lỗi thì rollback toàn bộ | INT | P0 | — |
| BOOK-INT-012 | Product có quantity ≤ 0 hoặc unitPrice < 0 — bị skip (continue) | INT | P2 | `POST /api/bookings` |

##### D. Ticket (Vé) — 8 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| TKT-FUNC-001 | Lấy danh sách vé của tôi (CONFIRMED + PENDING_PAYMENT) | FUNC | P0 | `GET /api/bookings/tickets` |
| TKT-FUNC-002 | Mỗi vé có: MovieTitle, CinemaName, HallName, ShowDate, ShowTime, Seats | FUNC | P0 | `GET /api/bookings/tickets` |
| TKT-FUNC-003 | TicketCode = "CINEBOOK-{BookingID}" | FUNC | P1 | — |
| TKT-FUNC-004 | QrData = "CINEBOOK-{BookingID}" | FUNC | P1 | — |
| TKT-FUNC-005 | Sắp xếp: ShowDate DESC → ShowTime DESC → BookingID DESC | FUNC | P2 | — |
| TKT-NEG-006 | Customer không có vé — trả mảng rỗng | NEG | P2 | `GET /api/bookings/tickets` |
| TKT-SEC-007 | Customer A không xem được vé của Customer B | SEC | P1 | `GET /api/bookings/tickets` |
| TKT-FUNC-008 | Vé hiển thị PaymentStatus (SUCCESS / null) | FUNC | P2 | — |

##### E. Mobile UI — Booking & Ticket Screens — 18 TC

| Mã TC | Tên | Loại | Priority |
|-------|-----|------|----------|
| UI-SEAT-001 | SeatSelectionScreen: hiển thị sơ đồ ghế realtime | UI | P0 |
| UI-SEAT-002 | Chọn ghế → ghế đổi màu (selected) + hiển thị giá | UI | P0 |
| UI-SEAT-003 | Bỏ chọn ghế → ghế trở về AVAILABLE | UI | P0 |
| UI-SEAT-004 | Ghế HOLDING bởi người khác → đổi màu real-time qua WebSocket | UI | P0 |
| UI-SEAT-005 | Hiển thị tổng tiền vé khi chọn nhiều ghế | UI | P0 |
| UI-SEAT-006 | Nút "Tiếp tục" → chuyển ComboScreen | UI | P1 |
| UI-COMBO-007 | ComboScreen: hiển thị danh sách combo bắp nước | UI | P1 |
| UI-COMBO-008 | Tăng/giảm số lượng combo → cập nhật tổng tiền | UI | P1 |
| UI-COMBO-009 | Nút "Thanh toán" → gọi createBooking → chuyển PaymentScreen | UI | P0 |
| UI-TKT-010 | TicketHistoryScreen: hiển thị danh sách vé | UI | P1 |
| UI-TKT-011 | Nhấn vào vé → xem TicketDetailScreen | UI | P1 |
| UI-TKT-012 | TicketDetailScreen: hiển thị QR code + thông tin vé | UI | P1 |
| UI-SEAT-013 | Timer countdown 10 phút hiển thị khi đã hold ghế | UI | P1 |
| UI-SEAT-014 | Timer hết → thông báo + quay về ShowtimeScreen | UI | P1 |
| UI-SEAT-015 | Rời màn SeatSelection → release ghế đã hold | UI | P1 |
| UI-SEAT-016 | Ghế COUPLE hiển thị ghế đôi (rộng hơn) | UI | P2 |
| UI-SEAT-017 | Loading indicator khi đang load sơ đồ ghế | UI | P2 |
| UI-TKT-018 | Vé PENDING_PAYMENT hiển thị badge khác CONFIRMED | UI | P2 |

---

### TV4 — Payment & Payment Gateway & Voucher

**Phạm vi:** Module M4 (Thanh toán) + M6 (Khuyến mãi) + Payment Gateway Service

**File backend liên quan:**
- `controllers/payment/payment.controller.ts`
- `services/payment.service.ts`
- `models/payment.model.ts`
- `controllers/voucher/voucher.controller.ts`
- `services/voucher.service.ts`
- `models/voucher.model.ts`
- `services/loyalty.service.ts`
- `services/email.service.ts`
- `utils/hmac.ts`

**File Payment Gateway liên quan:**
- `payment-gateway/src/controllers/payment.controller.js`
- `payment-gateway/src/services/webhook.service.js`
- `payment-gateway/src/middlewares/` (HMAC verify)

**File mobile liên quan:**
- `screens/payment/*` (PaymentScreen, PaymentResult)
- `screens/voucher/*`
- `services/paymentService.ts`
- `services/voucherService.ts`

#### Danh sách Test Case cần viết (~71 TC):

##### A. Init Payment — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| PAY-FUNC-001 | Khởi tạo thanh toán QR thành công — trả qrImage + orderId | FUNC | P0 | `POST /api/payments/:bookingId/pay` |
| PAY-FUNC-002 | Khởi tạo thanh toán Credit Card — trả message nhập thẻ | FUNC | P0 | `POST /api/payments/:bookingId/pay` |
| PAY-FUNC-003 | Payment record tạo với status = CREATED → PENDING_PAYMENT | FUNC | P0 | — |
| PAY-FUNC-004 | Thanh toán kèm voucherId — giảm giá đúng + lưu discountAmount | FUNC | P0 | `POST /api/payments/:bookingId/pay` |
| PAY-NEG-005 | Thanh toán booking không tồn tại — trả 404 | NEG | P1 | `POST /api/payments/:bookingId/pay` |
| PAY-NEG-006 | amount gửi lên ≠ amount tính từ server — trả 400 (chống gian lận) | NEG | P0 | `POST /api/payments/:bookingId/pay` |
| PAY-NEG-007 | discountAmount gửi lên ≠ discountAmount server tính — trả 400 | NEG | P0 | `POST /api/payments/:bookingId/pay` |
| PAY-SEC-008 | Main API → Payment GW: kèm header x-hmac-signature | SEC | P0 | — |
| PAY-SEC-009 | Thanh toán booking của người khác — trả 403 (FORBIDDEN) | SEC | P0 | `POST /api/payments/:bookingId/pay` |
| PAY-INT-010 | Booking.TotalAmount được cập nhật = finalAmount sau voucher | INT | P1 | — |

##### B. Webhook — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| WH-FUNC-001 | Webhook status=SUCCESS → Payment=SUCCESS, Booking=CONFIRMED, Seat=BOOKED | FUNC | P0 | `POST /api/payments/webhook` |
| WH-FUNC-002 | Webhook status=FAILED → Payment=FAILED, Booking=CANCELLED, Seat=CANCELLED | FUNC | P0 | `POST /api/payments/webhook` |
| WH-FUNC-003 | Webhook SUCCESS → cộng loyalty points cho customer | INT | P1 | — |
| WH-FUNC-004 | Webhook SUCCESS + có voucherId → ghi VoucherUsage + tăng UsageCount | INT | P1 | — |
| WH-FUNC-005 | Webhook SUCCESS → gửi email vé điện tử | INT | P1 | — |
| WH-FUNC-006 | Webhook SUCCESS → tạo notification cho customer | INT | P2 | — |
| WH-SEC-007 | Webhook thiếu header x-hmac-signature — trả 401 | SEC | P0 | `POST /api/payments/webhook` |
| WH-SEC-008 | Webhook chữ ký HMAC không hợp lệ — trả 401 | SEC | P0 | `POST /api/payments/webhook` |
| WH-INT-009 | Side-effects lỗi (email/loyalty fail) → webhook vẫn trả 200 | INT | P1 | — |
| WH-FUNC-010 | Kiểm tra trạng thái thanh toán | FUNC | P1 | `GET /api/payments/:bookingId/status` |

##### C. Retry & Refund — 6 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| PAY-FUNC-011 | Retry payment thành công khi status = FAILED | FUNC | P1 | `POST /api/payments/:bookingId/retry` |
| PAY-FUNC-012 | Retry payment thành công khi status = EXPIRED | FUNC | P1 | `POST /api/payments/:bookingId/retry` |
| PAY-NEG-013 | Retry payment khi status = SUCCESS — trả lỗi | NEG | P1 | `POST /api/payments/:bookingId/retry` |
| PAY-FUNC-014 | Refund: Payment → REFUNDED + gọi GW refund | FUNC | P1 | `PaymentService.processRefund` |
| PAY-INT-015 | Refund: thu hồi loyalty points + khôi phục voucher + gửi email | INT | P1 | — |
| PAY-NEG-016 | Refund booking chưa SUCCESS — trả lỗi | NEG | P2 | `PaymentService.processRefund` |

##### D. Payment Gateway Service — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| GW-FUNC-001 | Create QR thành công — trả qrImage (base64) + orderId + TTL | FUNC | P0 | `POST /api/payment/create-qr` |
| GW-FUNC-002 | Mock: QR tự động gửi webhook SUCCESS sau 5s (dev mode) | FUNC | P1 | — |
| GW-FUNC-003 | Credit Card thành công → webhook SUCCESS sau 2s | FUNC | P0 | `POST /api/payment/credit-card` |
| GW-FUNC-004 | Credit Card đuôi "0000" → webhook FAILED (mock) | FUNC | P1 | `POST /api/payment/credit-card` |
| GW-FUNC-005 | Refund thành công — trả status REFUNDED + refundedAt | FUNC | P1 | `POST /api/payment/refund` |
| GW-FUNC-006 | Simulate result gửi webhook manual (dev only) | FUNC | P2 | `POST /api/payment/simulate` |
| GW-NEG-007 | Create QR thiếu orderId — trả 400 | NEG | P1 | `POST /api/payment/create-qr` |
| GW-NEG-008 | Credit Card thiếu cardNumber/cvv/expiryDate — trả 400 | NEG | P1 | `POST /api/payment/credit-card` |
| GW-SEC-009 | Request không có HMAC signature — trả 401 | SEC | P0 | `POST /api/payment/create-qr` |
| GW-NEG-010 | Simulate bị chặn trong production | NEG | P2 | `POST /api/payment/simulate` |

##### E. Voucher — CRUD Admin — 7 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| VOU-FUNC-001 | Lấy danh sách voucher (Admin) | FUNC | P1 | `GET /api/admin/vouchers` |
| VOU-FUNC-002 | Xem chi tiết voucher (Admin) | FUNC | P2 | `GET /api/admin/vouchers/:id` |
| VOU-FUNC-003 | Tạo voucher mới (Admin) — trả 201 + gửi notification | FUNC | P1 | `POST /api/admin/vouchers` |
| VOU-FUNC-004 | Sửa voucher (Admin) | FUNC | P2 | `PUT /api/admin/vouchers/:id` |
| VOU-FUNC-005 | Xóa voucher (Admin) | FUNC | P2 | `DELETE /api/admin/vouchers/:id` |
| VOU-NEG-006 | Sửa/Xóa voucher không tồn tại — trả 404 | NEG | P2 | — |
| VOU-INT-007 | Tạo voucher → notification gửi đến tất cả customer verified | INT | P2 | — |

##### F. Voucher — Customer & Checkout — 14 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| VOU-FUNC-008 | Lấy voucher hợp lệ FEFO (customer) — kèm discountAmount | FUNC | P1 | `GET /api/vouchers` |
| VOU-FUNC-009 | Áp dụng voucher PERCENT — giảm % (không vượt MaxDiscount) | FUNC | P0 | `POST /api/vouchers/apply` |
| VOU-FUNC-010 | Áp dụng voucher FIXED — giảm cố định (không vượt totalAmount) | FUNC | P0 | `POST /api/vouchers/apply` |
| VOU-FUNC-011 | Lấy checkout vouchers — kèm isApplicable, reasonCode | FUNC | P1 | `GET /api/vouchers/checkout` |
| VOU-FUNC-012 | Auto-suggest voucher tốt nhất (giảm nhiều tiền nhất) | FUNC | P1 | `GET /api/vouchers/suggest` |
| VOU-FUNC-013 | Lấy voucher public (không cần token) | FUNC | P2 | `GET /api/vouchers/public` |
| VOU-NEG-014 | Áp dụng voucher đã hết hạn — reasonCode = EXPIRED | NEG | P1 | `POST /api/vouchers/apply` |
| VOU-NEG-015 | Áp dụng voucher chưa đến thời gian — reasonCode = NOT_STARTED | NEG | P2 | `POST /api/vouchers/apply` |
| VOU-NEG-016 | Áp dụng voucher đã hết lượt — reasonCode = USAGE_LIMIT_REACHED | NEG | P1 | `POST /api/vouchers/apply` |
| VOU-NEG-017 | Áp dụng voucher đơn hàng < MinOrderValue — reasonCode = MIN_ORDER_NOT_MET | NEG | P1 | `POST /api/vouchers/apply` |
| VOU-NEG-018 | Áp dụng voucher số vé < MinTicketQty — reasonCode = MIN_TICKET_NOT_MET | NEG | P2 | `POST /api/vouchers/apply` |
| VOU-NEG-019 | Áp dụng voucher format không match — reasonCode = FORMAT_NOT_MATCH | NEG | P2 | `POST /api/vouchers/apply` |
| VOU-NEG-020 | Áp dụng voucher đã dùng rồi — reasonCode = ALREADY_USED | NEG | P1 | `POST /api/vouchers/apply` |
| VOU-NEG-021 | Áp dụng voucher không thuộc quyền sở hữu — trả 403 | NEG | P1 | `POST /api/vouchers/apply` |

##### G. Mobile UI — Payment & Voucher Screens — 14 TC

| Mã TC | Tên | Loại | Priority |
|-------|-----|------|----------|
| UI-PAY-001 | PaymentScreen: hiển thị tổng tiền + phương thức thanh toán | UI | P0 |
| UI-PAY-002 | Chọn QR → hiển thị mã QR + countdown | UI | P0 |
| UI-PAY-003 | Chọn Credit Card → form nhập thẻ | UI | P0 |
| UI-PAY-004 | Thanh toán thành công → PaymentResultScreen (checkmark xanh) | UI | P0 |
| UI-PAY-005 | Thanh toán thất bại → hiển thị lỗi + nút Retry | UI | P1 |
| UI-PAY-006 | Loading spinner khi đang xử lý thanh toán | UI | P1 |
| UI-VOU-007 | Voucher list: hiển thị danh sách voucher applicable | UI | P1 |
| UI-VOU-008 | Voucher không đủ điều kiện: hiển thị xám + reason text | UI | P1 |
| UI-VOU-009 | Chọn voucher → cập nhật tổng tiền (trừ discountAmount) | UI | P0 |
| UI-VOU-010 | Badge "Giảm X%" hoặc "Giảm Xđ" trên mỗi voucher card | UI | P2 |
| UI-VOU-011 | Auto-suggest: highlight voucher tốt nhất | UI | P2 |
| UI-PAY-012 | Hiển thị chi tiết breakdown giá: vé + combo - voucher = tổng | UI | P1 |
| UI-VOU-013 | Voucher public hiển thị trên trang chủ | UI | P2 |
| UI-PAY-014 | Timeout 10 phút → redirect về màn hình chính | UI | P1 |

---

### TV5 — Admin Panel (Frontend) & Review & Product & Jobs

**Phạm vi:** Module M1 (Admin CRUD) + M2 (Product) + Review + Cron Jobs + Admin Panel UI

**File backend liên quan:**
- `controllers/admin/admin.controller.ts`
- `controllers/product/product.controller.ts`
- `controllers/review/review.controller.ts`
- `models/admin.model.ts`
- `models/product.model.ts`
- `models/review.model.ts`
- `jobs/releaseExpiredSeats.job.ts`
- `jobs/reminderNotification.job.ts`
- `jobs/autoIssueVouchers.job.ts`
- `jobs/refreshFeaturedCache.job.ts`

**File frontend-admin liên quan:**
- `pages/Dashboard.jsx`
- `pages/Movies.jsx`
- `pages/Cinemas.jsx`
- `pages/Halls.jsx`
- `pages/Showtimes.jsx`
- `pages/Customers.jsx`
- `pages/Products.jsx`
- `pages/Vouchers.jsx`
- `pages/Bookings.jsx`
- `pages/Transactions.jsx`
- `pages/Analytics.jsx`
- `pages/Settings.jsx`
- `pages/SeatLayoutBuilder.jsx`
- `pages/Login.jsx`
- `components/AdminLayout.jsx`
- `components/ProtectedRoute.jsx`

#### Danh sách Test Case cần viết (~72 TC):

##### A. Admin — Stats & Reports — 6 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| ADM-FUNC-001 | Xem thống kê doanh thu tổng hợp | FUNC | P1 | `GET /api/admin/stats/revenue` |
| ADM-FUNC-002 | Xem thị phần (marketShare) | FUNC | P2 | `GET /api/admin/stats/revenue` |
| ADM-FUNC-003 | Xem nhật ký thao tác (audit logs) | FUNC | P2 | `GET /api/admin/audit-logs` |
| ADM-FUNC-004 | Xem cài đặt hệ thống (SystemSettings) | FUNC | P1 | `GET /api/admin/settings` |
| ADM-FUNC-005 | Xem danh sách thanh toán (Admin) | FUNC | P1 | `GET /api/admin/payments` |
| ADM-FUNC-006 | Bật/tắt trạng thái tài khoản (Admin) | FUNC | P1 | `PUT /api/admin/accounts/:id/status` |

##### B. Admin — Customer Management — 8 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| ADM-CUST-001 | Lấy danh sách customer (phân trang + tìm kiếm + lọc active) | FUNC | P1 | `GET /api/admin/customers` |
| ADM-CUST-002 | Xem chi tiết customer | FUNC | P2 | `GET /api/admin/customers/:id` |
| ADM-CUST-003 | Tạo customer mới (Admin) — email chưa tồn tại | FUNC | P1 | `POST /api/admin/customers` |
| ADM-CUST-004 | Sửa thông tin customer (Admin) | FUNC | P2 | `PUT /api/admin/customers/:id` |
| ADM-CUST-005 | Vô hiệu hóa customer (soft delete) | FUNC | P1 | `DELETE /api/admin/customers/:id` |
| ADM-CUST-006 | Bật/tắt trạng thái customer | FUNC | P2 | `PUT /api/admin/customers/:id/status` |
| ADM-CUST-007 | Tạo customer email đã tồn tại — trả 400 (USER_EXISTED) | NEG | P1 | `POST /api/admin/customers` |
| ADM-CUST-008 | Xem customer không tồn tại — trả 404 | NEG | P2 | `GET /api/admin/customers/:id` |

##### C. Product (Combo bắp nước) — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| PROD-FUNC-001 | Lấy danh sách product (Admin) | FUNC | P1 | `GET /api/admin/products` |
| PROD-FUNC-002 | Lấy danh sách product active (Public/Customer) | FUNC | P1 | `GET /api/products` |
| PROD-FUNC-003 | Xem chi tiết product | FUNC | P2 | `GET /api/admin/products/:id` |
| PROD-FUNC-004 | Tạo product mới — trả 201 | FUNC | P1 | `POST /api/admin/products` |
| PROD-FUNC-005 | Sửa product — trả 200 | FUNC | P2 | `PUT /api/admin/products/:id` |
| PROD-FUNC-006 | Xóa product — trả 200 | FUNC | P2 | `DELETE /api/admin/products/:id` |
| PROD-FUNC-007 | Upload ảnh product — trả imageUrl | FUNC | P2 | `POST /api/admin/uploads/product-image` |
| PROD-NEG-008 | Sửa/Xóa product không tồn tại — trả 404 | NEG | P2 | — |
| PROD-NEG-009 | Upload không có file — trả 400 | NEG | P3 | `POST /api/admin/uploads/product-image` |
| PROD-FUNC-010 | Public API chỉ trả product có IsActive=true | FUNC | P1 | `GET /api/products` |

##### D. Review (Đánh giá) — 10 TC

| Mã TC | Tên | Loại | Priority | API |
|-------|-----|------|----------|-----|
| REV-FUNC-001 | Đăng review thành công (movieId + rating + comment) | FUNC | P1 | `POST /api/reviews` |
| REV-FUNC-002 | Xem danh sách review theo movieId (phân trang) | FUNC | P1 | `GET /api/reviews/:movieId` |
| REV-FUNC-003 | Xóa review của chính mình — trả 200 | FUNC | P2 | `DELETE /api/reviews/:reviewId` |
| REV-NEG-004 | Đăng review thiếu movieId/rating/comment — trả 400 | NEG | P1 | `POST /api/reviews` |
| REV-NEG-005 | Rating ngoài khoảng 1.0–5.0 — trả 400 | NEG | P1 | `POST /api/reviews` |
| REV-NEG-006 | Comment rỗng (chỉ space) — trả 400 | NEG | P2 | `POST /api/reviews` |
| REV-NEG-007 | Xóa review không tồn tại — trả 404 | NEG | P2 | `DELETE /api/reviews/:reviewId` |
| REV-NEG-008 | Xóa review của người khác — trả 404 | NEG | P1 | `DELETE /api/reviews/:reviewId` |
| REV-SEC-009 | Đăng review cần đăng nhập (có JWT) | SEC | P1 | `POST /api/reviews` |
| REV-NEG-010 | Account không có Customer profile — trả 400 | NEG | P2 | `POST /api/reviews` |

##### E. Cron Jobs — 14 TC

| Mã TC | Tên | Loại | Priority | Job |
|-------|-----|------|----------|-----|
| JOB-FUNC-001 | releaseExpiredSeats: Ghế hết hạn hold (HoldUntil < NOW) → status=CANCELLED | FUNC | P0 | `releaseExpiredSeats.job.ts` |
| JOB-FUNC-002 | releaseExpiredSeats: Booking liên quan → status=EXPIRED | FUNC | P0 | — |
| JOB-FUNC-003 | releaseExpiredSeats: Xóa Redis key `seat:hold:*` tương ứng | FUNC | P0 | — |
| JOB-FUNC-004 | releaseExpiredSeats: Broadcast WebSocket ghế → AVAILABLE | FUNC | P1 | — |
| JOB-FUNC-005 | releaseExpiredSeats: Payment liên quan → status=EXPIRED | FUNC | P1 | — |
| JOB-FUNC-006 | reminderNotification: 30 phút trước chiếu → gửi notification | FUNC | P1 | `reminderNotification.job.ts` |
| JOB-FUNC-007 | reminderNotification: Chỉ gửi cho booking CONFIRMED | FUNC | P1 | — |
| JOB-FUNC-008 | autoIssueVouchers: Tự động phát hành voucher theo cấu hình | FUNC | P2 | `autoIssueVouchers.job.ts` |
| JOB-FUNC-009 | autoIssueVouchers: Gán voucher vào VoucherCustomer | FUNC | P2 | — |
| JOB-FUNC-010 | autoIssueVouchers: Gửi notification cho customer nhận voucher | FUNC | P2 | — |
| JOB-FUNC-011 | refreshFeaturedCache: Cập nhật cache phim nổi bật vào Redis | FUNC | P2 | `refreshFeaturedCache.job.ts` |
| JOB-INT-012 | Job chạy đúng schedule (cron expression) | INT | P1 | `jobs/index.ts` |
| JOB-NEG-013 | Job lỗi → log error, không crash server | NEG | P1 | — |
| JOB-PERF-014 | releaseExpiredSeats hoàn thành < 5s cho 100 booking expired | PERF | P3 | — |

##### F. Admin Panel UI (Frontend) — 24 TC

| Mã TC | Tên | Loại | Priority |
|-------|-----|------|----------|
| UI-ADM-001 | Login page: đăng nhập Admin → chuyển Dashboard | UI | P0 |
| UI-ADM-002 | ProtectedRoute: chưa đăng nhập → redirect Login | UI | P0 |
| UI-ADM-003 | Dashboard: hiển thị thống kê tổng hợp (cards + charts) | UI | P0 |
| UI-ADM-004 | Dashboard: biểu đồ doanh thu Chart.js | UI | P1 |
| UI-ADM-005 | Movies page: CRUD phim (bảng + modal form) | UI | P0 |
| UI-ADM-006 | Movies page: upload poster, toggle featured | UI | P1 |
| UI-ADM-007 | Cinemas page: CRUD cụm rạp | UI | P1 |
| UI-ADM-008 | Halls page: CRUD phòng chiếu | UI | P1 |
| UI-ADM-009 | SeatLayoutBuilder: kéo thả/click tạo sơ đồ ghế | UI | P1 |
| UI-ADM-010 | SeatLayoutBuilder: đặt loại ghế (STANDARD/VIP/COUPLE/AISLE) | UI | P1 |
| UI-ADM-011 | Showtimes page: CRUD lịch chiếu + lọc theo rạp/phim/ngày | UI | P1 |
| UI-ADM-012 | Showtimes page: cảnh báo trùng suất chiếu | UI | P2 |
| UI-ADM-013 | Customers page: danh sách + tìm kiếm + lọc active | UI | P1 |
| UI-ADM-014 | Customers page: tạo/sửa/khóa tài khoản customer | UI | P1 |
| UI-ADM-015 | Products page: CRUD combo bắp nước + upload ảnh | UI | P1 |
| UI-ADM-016 | Vouchers page: CRUD voucher + cấu hình điều kiện | UI | P1 |
| UI-ADM-017 | Bookings page: danh sách đặt vé + filter | UI | P1 |
| UI-ADM-018 | Transactions page: lịch sử giao dịch thanh toán | UI | P2 |
| UI-ADM-019 | Analytics page: biểu đồ + bộ lọc thời gian | UI | P2 |
| UI-ADM-020 | Settings page: cấu hình SystemSettings (phụ thu, TTL…) | UI | P1 |
| UI-ADM-021 | Sidebar navigation: highlight trang hiện tại | UI | P2 |
| UI-ADM-022 | Responsive layout trên tablet/desktop | UI | P3 |
| UI-ADM-023 | Logout Admin → quay về Login | UI | P1 |
| UI-ADM-024 | Error handling: hiển thị toast/alert khi API lỗi | UI | P2 |

---

## VI. Quy tắc đặt mã Test Case

### Cấu trúc mã: `{PREFIX}-{TYPE}-{SEQ}`

| Phần | Mô tả | Ví dụ |
|------|-------|-------|
| `PREFIX` | Viết tắt module/chức năng (3–5 ký tự) | AUTH, MOV, CIN, SHOW, BOOK, HOLD, PAY, GW, VOU, TKT, WS, NOTI, CUST, ADM, PROD, REV, JOB, MW, PRICE, SEAT, UI-xxx |
| `TYPE` | Loại test case | FUNC, NEG, BOUND, SEC, INT, PERF, UI |
| `SEQ` | Số thứ tự 3 chữ số | 001, 002, …, 999 |

### Bảng PREFIX đầy đủ

| PREFIX | Phạm vi | Thành viên |
|--------|---------|------------|
| `AUTH` | Authentication (register, login, OTP, password) | TV1 |
| `MW` | Middleware (auth, RBAC) | TV1 |
| `CUST` | Customer Profile | TV1 |
| `NOTI` | Notification | TV1 |
| `MOV` | Movie (CRUD + tìm kiếm) | TV2 |
| `CIN` | Cinema & Hall | TV2 |
| `SHOW` | Show (lịch chiếu) | TV2 |
| `SEAT` | Seat Layout | TV2 |
| `PRICE` | Pricing Service | TV2 |
| `HOLD` | Seat Hold (Redis) | TV3 |
| `BOOK` | Booking (tạo đặt vé) | TV3 |
| `TKT` | Ticket (vé) | TV3 |
| `WS` | WebSocket Realtime | TV3 |
| `PAY` | Payment (Main API) | TV4 |
| `GW` | Payment Gateway Service | TV4 |
| `WH` | Webhook | TV4 |
| `VOU` | Voucher | TV4 |
| `ADM` | Admin (stats, audit, settings, customer mgmt) | TV5 |
| `PROD` | Product (combo bắp nước) | TV5 |
| `REV` | Review (đánh giá) | TV5 |
| `JOB` | Cron Jobs | TV5 |
| `UI-xxx` | UI test (thêm prefix screen) | Mỗi TV tự viết cho phần mình |

---

## VII. Hướng dẫn test bằng Postman

### 1. Chuẩn bị

```
1. Import collection từ: postman/collections/
2. Import environment từ: postman/environments/
3. Đảm bảo biến môi trường:
   - {{BASE_URL}} = http://localhost:3000/api
   - {{PAYMENT_GW_URL}} = http://localhost:4000/api/payment
   - {{ACCESS_TOKEN}} = (tự động set sau khi login)
   - {{REFRESH_TOKEN}} = (tự động set sau khi login)
```

### 2. Workflow test chuẩn

```
Bước 1: POST /api/auth/register → lấy OTP
Bước 2: POST /api/auth/verify-otp → tạo Account
Bước 3: POST /api/auth/login → lấy accessToken + refreshToken
Bước 4: Set accessToken vào header Authorization: Bearer {{ACCESS_TOKEN}}
Bước 5: Thực hiện các API cần auth
```

### 3. Script tự động set token (Postman Tests tab)

```javascript
// Đặt trong tab "Tests" của request Login
if (pm.response.code === 200) {
    const data = pm.response.json().data;
    pm.environment.set("ACCESS_TOKEN", data.accessToken);
    pm.environment.set("REFRESH_TOKEN", data.refreshToken);
    pm.environment.set("CUSTOMER_ID", data.customerId);
    pm.environment.set("ACCOUNT_ID", data.accountId);
}
```

### 4. Kiểm tra response chuẩn (Postman Tests tab)

```javascript
// Kiểm tra status code
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

// Kiểm tra cấu trúc response
pm.test("Response has success structure", () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property("code");
    pm.expect(json).to.have.property("message");
});

// Kiểm tra dữ liệu cụ thể
pm.test("Data contains expected fields", () => {
    const data = pm.response.json().data;
    pm.expect(data).to.have.property("accessToken");
    pm.expect(data.accessToken).to.be.a("string");
});
```

---

## VIII. Checklist hoàn thành

### Mỗi thành viên cần đảm bảo:

- [ ] **Viết đủ số lượng test case** (~60–72 TC theo phân công)
- [ ] **Đầy đủ các loại test**: FUNC + NEG + BOUND + SEC (ít nhất)
- [ ] **Priority P0 phải được test đầu tiên** và bắt buộc PASS
- [ ] **Mỗi test case có Test Data cụ thể** (JSON body, query params…)
- [ ] **Expected Result rõ ràng** (HTTP status + response body + side effects)
- [ ] **Ghi rõ file tham chiếu** (controller, service liên quan)
- [ ] **Chạy test thực tế** và ghi Actual Result + Status
- [ ] **Screenshot cho UI test** (đính kèm trong báo cáo)
- [ ] **Tổng hợp file Excel/Markdown** và push lên repo

### Bảng tổng kết phân công

| Thành viên | Scope | Số TC | Modules |
|------------|-------|-------|---------|
| **TV1** | Auth + Customer + Notification + Mobile UI (Auth/Profile/Noti) | ~72 | M8, M7 |
| **TV2** | Movie + Cinema + Show + Seat Layout + Pricing + Mobile UI (Home/Movie/Cinema) | ~72 | M1, M2 |
| **TV3** | Booking + Seat Hold + Ticket + WebSocket + Mobile UI (Booking/Ticket) | ~62 | M3, M5 |
| **TV4** | Payment + Payment GW + Webhook + Voucher + Mobile UI (Payment/Voucher) | ~71 | M4, M6 |
| **TV5** | Admin CRUD + Product + Review + Jobs + Admin Panel UI | ~72 | M1, M2, Cron |
| | | **~349 TC** | |

---

> **Lưu ý quan trọng:**
> - File test case chính thức được lưu tại: `docs/testcases/` — mỗi thành viên tạo 1 file riêng (vd: `TV1_testcases.md`).
> - Kết quả test được tổng hợp tại: `docs/testcases/test_results_summary.md`.
> - Deadline nộp test case: theo lịch trình buổi học (xem AGENTS.md mục XII).
