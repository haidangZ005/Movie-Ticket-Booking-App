# TV4 — Test Cases: Payment & Payment Gateway & Voucher

> **Người viết:** Cry-0 (Nguyễn Hồng Lịch) — TV4
> **Phạm vi:** Module M4 (Thanh toán) + M6 (Khuyến mãi) + Payment Gateway Service
> **Tổng:** 71 test cases (10 PAY + 10 WH + 6 Retry/Refund + 10 GW + 7 VOU-Admin + 14 VOU-Customer + 14 UI)

---

## A. PAYMENT — Khởi tạo Thanh toán (10 TC)

### PAY-FUNC-001: Khởi tạo thanh toán QR thành công


| Thuộc tính   | Chi tiết                                       |
| ------------ | ---------------------------------------------- |
| **Module**   | M4 — Thanh toán                                |
| **Loại**     | FUNC                                           |
| **Priority** | P0                                             |
| **API**      | `POST /api/payments/:bookingId/pay`            |
| **File**     | `payment.controller.ts` → `payment.service.ts` |


**Preconditions:**

- Server backend đang chạy (port 3000)
- Customer đã đăng nhập, có JWT token hợp lệ
- Có booking PENDING_PAYMENT hợp lệ với customerId tương ứng

**Test Data:**

```json
{
  "amount": 150000,
  "currency": "VND",
  "method": "QR"
}
```

**Steps:**

1. Gửi request POST `/api/payments/{bookingId}/pay` với JWT header + body trên
2. Kiểm tra HTTP status = 200
3. Kiểm tra `success = true`
4. Kiểm tra response data chứa `qrImage`, `orderId`

**Expected Result:**

- Status 200, body `{ success: true, data: { qrImage: "...", orderId: ... } }`
- Payment record tự động tạo với status = PENDING_PAYMENT

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-FUNC-002: Khởi tạo thanh toán Credit Card


| Thuộc tính   | Chi tiết                                       |
| ------------ | ---------------------------------------------- |
| **Module**   | M4 — Thanh toán                                |
| **Loại**     | FUNC                                           |
| **Priority** | P0                                             |
| **API**      | `POST /api/payments/:bookingId/pay`            |
| **File**     | `payment.controller.ts` → `payment.service.ts` |


**Preconditions:**

- Customer đã đăng nhập, có JWT token hợp lệ
- Có booking PENDING_PAYMENT hợp lệ

**Test Data:**

```json
{
  "amount": 150000,
  "currency": "VND",
  "method": "CREDIT_CARD"
}
```

**Steps:**

1. Gửi request POST với `method: "CREDIT_CARD"`
2. Kiểm tra HTTP status = 200
3. Kiểm tra response chứa message yêu cầu nhập thông tin thẻ

**Expected Result:**

- Status 200, response chứa message hướng dẫn nhập thẻ
- Payment record tạo với `PaymentMethod = "CREDIT_CARD"`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-FUNC-003: Payment record tạo với status CREATED → PENDING_PAYMENT


| Thuộc tính   | Chi tiết                                  |
| ------------ | ----------------------------------------- |
| **Module**   | M4 — Thanh toán                           |
| **Loại**     | FUNC                                      |
| **Priority** | P0                                        |
| **API**      | `POST /api/payments/:bookingId/pay`       |
| **File**     | `payment.service.ts` → `payment.model.ts` |


**Preconditions:**

- Customer đã đăng nhập

**Test Data:**

```json
{
  "amount": 150000,
  "currency": "VND",
  "method": "QR"
}
```

**Steps:**

1. Gửi POST `/api/payments/{bookingId}/pay`
2. Query DB bảng Payment — kiểm tra bản ghi mới

**Expected Result:**

- Payment record tồn tại với `Status = "PENDING_PAYMENT"` hoặc `"CREATED"`
- Booking tương ứng giữ nguyên status

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-FUNC-004: Thanh toán kèm voucherId — giảm giá + lưu discountAmount


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Thanh toán                     |
| **Loại**     | FUNC                                |
| **Priority** | P0                                  |
| **API**      | `POST /api/payments/:bookingId/pay` |
| **File**     | `payment.service.ts`                |


**Preconditions:**

- Customer có voucher hợp lệ
- Booking hợp lệ

**Test Data:**

```json
{
  "amount": 150000,
  "currency": "VND",
  "method": "QR",
  "voucherId": 1,
  "discountAmount": 10000
}
```

**Steps:**

1. Gửi POST với `voucherId` và `discountAmount`
2. Kiểm tra response data

**Expected Result:**

- Response data chứa `discountAmount` đúng giá trị gửi lên
- `finalAmount = amount - discountAmount`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-NEG-005: Thanh toán booking không tồn tại → 404


| Thuộc tính   | Chi tiết                       |
| ------------ | ------------------------------ |
| **Module**   | M4 — Thanh toán                |
| **Loại**     | NEG                            |
| **Priority** | P1                             |
| **API**      | `POST /api/payments/99999/pay` |


**Test Data:**

```json
{ "amount": 100000, "currency": "VND", "method": "QR" }
```

**Steps:**

1. Gửi POST `/api/payments/99999/pay`
2. Kiểm tra HTTP status

**Expected Result:**

- Status 404, body `{ success: false, message: "Booking không tồn tại" }`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-NEG-006: amount gửi ≠ server tính → trả 400 (chống gian lận)


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Thanh toán                     |
| **Loại**     | NEG                                 |
| **Priority** | P0                                  |
| **API**      | `POST /api/payments/:bookingId/pay` |


**Test Data:**

```json
{
  "amount": 99999,
  "currency": "VND",
  "method": "QR"
}
```

*(Số thực của booking là 150000)*

**Steps:**

1. Gửi POST với amount sai
2. Kiểm tra HTTP status

**Expected Result:**

- Status 400 hoặc 422
- Response chứa message lỗi chống gian lận

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-NEG-007: discountAmount gửi ≠ server tính → trả 400


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Thanh toán                     |
| **Loại**     | NEG                                 |
| **Priority** | P0                                  |
| **API**      | `POST /api/payments/:bookingId/pay` |


**Test Data:**

```json
{
  "amount": 150000,
  "currency": "VND",
  "method": "QR",
  "voucherId": 1,
  "discountAmount": 999999
}
```

**Steps:**

1. Gửi POST với discountAmount giả mạo
2. Kiểm tra HTTP status

**Expected Result:**

- Status 400 hoặc 422

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-SEC-008: Main API → Payment GW kèm header x-hmac-signature


| Thuộc tính   | Chi tiết                               |
| ------------ | -------------------------------------- |
| **Module**   | M4 — Thanh toán                        |
| **Loại**     | SEC                                    |
| **Priority** | P0                                     |
| **API**      | `POST /api/payments/:bookingId/pay`    |
| **File**     | `payment.service.ts` → `utils/hmac.ts` |


**Test Data:**

```json
{ "orderId": 1, "amount": 100000, "currency": "VND" }
```

**Steps:**

1. Gửi request tạo thanh toán từ Main API
2. Kiểm tra log Payment Gateway nhận request kèm `x-hmac-signature`

**Expected Result:**

- Request gửi từ Main API chứa header `x-hmac-signature` với HMAC-SHA256(payload, secret)
- Payment GW verify HMAC → chấp nhận request

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-SEC-009: Thanh toán booking của người khác → 403


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Thanh toán                     |
| **Loại**     | SEC                                 |
| **Priority** | P0                                  |
| **API**      | `POST /api/payments/:bookingId/pay` |


**Steps:**

1. Customer A đăng nhập, tạo booking
2. Customer B đăng nhập, gửi POST thanh toán booking của A
3. Kiểm tra HTTP status

**Expected Result:**

- Status 403, body `{ success: false, message: "Không có quyền" }`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-INT-010: Booking.TotalAmount = finalAmount sau voucher


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Thanh toán                     |
| **Loại**     | INT                                 |
| **Priority** | P1                                  |
| **API**      | `POST /api/payments/:bookingId/pay` |


**Test Data:**

```json
{
  "amount": 150000,
  "currency": "VND",
  "method": "QR",
  "voucherId": 1,
  "discountAmount": 10000
}
```

**Steps:**

1. Gửi POST thanh toán kèm voucher
2. Query DB bảng Booking — kiểm tra `TotalAmount`

**Expected Result:**

- `Booking.TotalAmount = finalAmount = amount - discountAmount = 140000`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## B. WEBHOOK — Nhận kết quả thanh toán (10 TC)

### WH-FUNC-001: Webhook SUCCESS → Payment=SUCCESS, Booking=CONFIRMED, Seat=BOOKED


| Thuộc tính   | Chi tiết                                       |
| ------------ | ---------------------------------------------- |
| **Module**   | M4 — Thanh toán                                |
| **Loại**     | FUNC                                           |
| **Priority** | P0                                             |
| **API**      | `POST /api/payments/webhook`                   |
| **File**     | `payment.controller.ts` → `payment.service.ts` |


**Preconditions:**

- Payment Gateway đang chạy
- Main API nhận webhook

**Test Data:**

```json
{
  "orderId": "1",
  "status": "SUCCESS",
  "transactionId": "TXN-001"
}
```

**Steps:**

1. Gửi POST `/api/payments/webhook` với HMAC signature đúng
2. Query DB: Payment, Booking, CinemaHallSeat

**Expected Result:**

- Payment.Status = "SUCCESS"
- Booking.Status = "CONFIRMED"
- CinemaHallSeat.Status = "BOOKED"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-FUNC-002: Webhook FAILED → Payment=FAILED, Booking=CANCELLED, Seat=CANCELLED


| Thuộc tính   | Chi tiết                     |
| ------------ | ---------------------------- |
| **Module**   | M4 — Thanh toán              |
| **Loại**     | FUNC                         |
| **Priority** | P0                           |
| **API**      | `POST /api/payments/webhook` |


**Test Data:**

```json
{
  "orderId": "1",
  "status": "FAILED",
  "transactionId": "TXN-002"
}
```

**Steps:**

1. Gửi webhook FAILED
2. Kiểm tra DB

**Expected Result:**

- Payment.Status = "FAILED"
- Booking.Status = "CANCELLED"
- Ghế trả về AVAILABLE

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-FUNC-003: Webhook SUCCESS → cộng loyalty points


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M4 — Thanh toán |
| **Loại**     | INT             |
| **Priority** | P1              |


**Steps:**

1. Gửi webhook SUCCESS
2. GET `/api/customer/loyalty` — kiểm tra LoyaltyPoints tăng

**Expected Result:**

- Customer.LoyaltyPoints tăng đúng tỷ lệ (amount / LOYALTY_POINTS_RATE)
- Có bản ghi trong LoyaltyPointHistory với Type = "EARNED"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-FUNC-004: Webhook SUCCESS + voucherId → ghi VoucherUsage + tăng UsageCount


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M6 — Khuyến mãi |
| **Loại**     | INT             |
| **Priority** | P1              |


**Steps:**

1. Gửi webhook SUCCESS với `voucherId` trong payload
2. Query DB: VoucherUsage, Voucher

**Expected Result:**

- Có bản ghi trong VoucherUsage (CustomerID, VoucherID, BookingID)
- Voucher.UsageCount tăng 1

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-FUNC-005: Webhook SUCCESS → gửi email vé điện tử


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M4 — Thanh toán |
| **Loại**     | INT             |
| **Priority** | P1              |


**Steps:**

1. Gửi webhook SUCCESS
2. Kiểm tra email queue (BullMQ) hoặc log — có email được gửi

**Expected Result:**

- Email queue chứa job gửi vé điện tử với QR code check-in
- Hoặc log ghi nhận email đã gửi

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-FUNC-006: Webhook SUCCESS → tạo notification


| Thuộc tính   | Chi tiết                 |
| ------------ | ------------------------ |
| **Module**   | M4 — Thanh toán          |
| **Loại**     | INT                      |
| **Priority** | P2                       |
| **API**      | `GET /api/notifications` |


**Steps:**

1. Gửi webhook SUCCESS
2. GET `/api/notifications` — kiểm tra có notification mới

**Expected Result:**

- Có notification mới với Type = "BOOKING" hoặc "PAYMENT"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-SEC-007: Webhook thiếu HMAC signature → 401


| Thuộc tính   | Chi tiết                     |
| ------------ | ---------------------------- |
| **Module**   | M4 — Thanh toán              |
| **Loại**     | SEC                          |
| **Priority** | P0                           |
| **API**      | `POST /api/payments/webhook` |


**Test Data:**

```json
{
  "orderId": "1",
  "status": "SUCCESS"
}
```

*(Không có header `x-hmac-signature`)*

**Steps:**

1. Gửi POST webhook không kèm HMAC signature
2. Kiểm tra HTTP status

**Expected Result:**

- Status 401, body `{ success: false, message: "Thiếu chữ ký HMAC" }`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-SEC-008: Webhook HMAC sai → 401


| Thuộc tính   | Chi tiết                     |
| ------------ | ---------------------------- |
| **Module**   | M4 — Thanh toán              |
| **Loại**     | SEC                          |
| **Priority** | P0                           |
| **API**      | `POST /api/payments/webhook` |


**Test Data:**

```json
{
  "orderId": "1",
  "status": "SUCCESS"
}
```

Header: `x-hmac-signature: fake_signature`

**Steps:**

1. Gửi webhook với HMAC signature giả
2. Kiểm tra HTTP status

**Expected Result:**

- Status 401, body `{ success: false, message: "Chữ ký HMAC không hợp lệ" }`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-INT-009: Side-effects lỗi (email fail) → webhook vẫn trả 200


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M4 — Thanh toán |
| **Loại**     | INT             |
| **Priority** | P1              |


**Steps:**

1. Tắt/brick email service
2. Gửi webhook SUCCESS
3. Kiểm tra HTTP status

**Expected Result:**

- Status 200 (webhook xử lý core logic thành công)
- Email lỗi không ảnh hưởng đến response
- Lỗi email được log

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### WH-FUNC-010: Kiểm tra trạng thái thanh toán


| Thuộc tính   | Chi tiết                              |
| ------------ | ------------------------------------- |
| **Module**   | M4 — Thanh toán                       |
| **Loại**     | FUNC                                  |
| **Priority** | P1                                    |
| **API**      | `GET /api/payments/:bookingId/status` |


**Steps:**

1. Gửi GET `/api/payments/{bookingId}/status` với JWT
2. Kiểm tra response

**Expected Result:**

- Status 200, body chứa thông tin trạng thái: `status`, `amount`, `method`, `paymentDate`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## C. RETRY & REFUND — Thử lại & Hoàn tiền (6 TC)

### PAY-FUNC-011: Retry payment khi status = FAILED


| Thuộc tính   | Chi tiết                              |
| ------------ | ------------------------------------- |
| **Module**   | M4 — Thanh toán                       |
| **Loại**     | FUNC                                  |
| **Priority** | P1                                    |
| **API**      | `POST /api/payments/:bookingId/retry` |


**Preconditions:**

- Booking có Payment.Status = "FAILED"

**Test Data:**

```json
{ "amount": 150000, "method": "QR" }
```

**Steps:**

1. Gửi POST `/api/payments/{bookingId}/retry`
2. Kiểm tra response

**Expected Result:**

- Status 200, body `{ success: true }`
- Payment.Status → PENDING_PAYMENT

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-FUNC-012: Retry payment khi status = EXPIRED


| Thuộc tính   | Chi tiết                              |
| ------------ | ------------------------------------- |
| **Module**   | M4 — Thanh toán                       |
| **Loại**     | FUNC                                  |
| **Priority** | P1                                    |
| **API**      | `POST /api/payments/:bookingId/retry` |


**Steps:**

1. Chờ booking hết hạn (hoặc mock status = EXPIRED)
2. Gửi retry

**Expected Result:**

- Status 200, Payment.Status → PENDING_PAYMENT

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-NEG-013: Retry payment khi status = SUCCESS → trả lỗi


| Thuộc tính   | Chi tiết                              |
| ------------ | ------------------------------------- |
| **Module**   | M4 — Thanh toán                       |
| **Loại**     | NEG                                   |
| **Priority** | P1                                    |
| **API**      | `POST /api/payments/:bookingId/retry` |


**Steps:**

1. Booking đã SUCCESS
2. Gửi retry

**Expected Result:**

- Status 400 hoặc 409, message "Không thể retry thanh toán đã thành công"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-FUNC-014: Refund — Payment → REFUNDED + gọi GW refund


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M4 — Thanh toán |
| **Loại**     | FUNC            |
| **Priority** | P1              |


**Steps:**

1. Gọi refund qua Payment Gateway

**Expected Result:**

- GW trả `{ status: "REFUNDED", refundedAt: "..." }`
- Payment.Status = "REFUNDED"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-INT-015: Refund → thu hồi loyalty + khôi phục voucher + gửi email


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M4 — Thanh toán |
| **Loại**     | INT             |
| **Priority** | P1              |


**Steps:**

1. Thực hiện refund cho booking đã SUCCESS
2. Kiểm tra DB: LoyaltyPoints, VoucherUsage, email queue

**Expected Result:**

- Customer.LoyaltyPoints trừ điểm đã cộng
- VoucherUsage bị xóa, Voucher.UsageCount -= 1
- Email thông báo hoàn tiền được gửi

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PAY-NEG-016: Refund booking chưa SUCCESS → trả lỗi


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M4 — Thanh toán |
| **Loại**     | NEG             |
| **Priority** | P2              |


**Steps:**

1. Booking chưa SUCCESS (PENDING_PAYMENT hoặc FAILED)
2. Gửi refund

**Expected Result:**

- Status 400 hoặc 409

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## D. PAYMENT GATEWAY SERVICE — Cổng thanh toán (10 TC)

### GW-FUNC-001: Create QR — trả qrImage + orderId + TTL


| Thuộc tính   | Chi tiết                                                |
| ------------ | ------------------------------------------------------- |
| **Module**   | M4 — Payment Gateway                                    |
| **Loại**     | FUNC                                                    |
| **Priority** | P0                                                      |
| **API**      | `POST /api/payment/create-qr`                           |
| **File**     | `payment-gateway/src/controllers/payment.controller.js` |


**Preconditions:**

- Payment Gateway đang chạy port 4000
- HMAC secret đã đồng bộ với Main API

**Test Data:**

```json
{ "orderId": 100, "amount": 150000, "currency": "VND" }
```

**Steps:**

1. Gửi POST với HMAC signature đúng
2. Kiểm tra response

**Expected Result:**

- Status 201, body chứa `{ qrImage: "data:image/png;base64,...", orderId: 100, ttl: 600 }`
- QR chứa JSON payload với orderId, amount, ttl

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-FUNC-002: Mock QR tự động webhook SUCCESS sau 5s (dev mode)


| Thuộc tính   | Chi tiết             |
| ------------ | -------------------- |
| **Module**   | M4 — Payment Gateway |
| **Loại**     | FUNC                 |
| **Priority** | P1                   |


**Preconditions:**

- `NODE_ENV !== 'production'`

**Steps:**

1. Gửi POST `/api/payment/create-qr`
2. Chờ 6 giây
3. Kiểm tra Main API nhận webhook SUCCESS

**Expected Result:**

- Webhook SUCCESS được gửi về Main API sau ~5 giây
- Main API cập nhật Payment → SUCCESS

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED ☐ SKIP (production)

---

### GW-FUNC-003: Credit Card thành công → webhook SUCCESS sau 2s


| Thuộc tính   | Chi tiết                        |
| ------------ | ------------------------------- |
| **Module**   | M4 — Payment Gateway            |
| **Loại**     | FUNC                            |
| **Priority** | P0                              |
| **API**      | `POST /api/payment/credit-card` |


**Test Data:**

```json
{
  "orderId": 102,
  "amount": 75000,
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expiryDate": "12/28"
}
```

**Steps:**

1. Gửi POST credit card
2. Chờ 3 giây
3. Kiểm tra webhook SUCCESS về Main API

**Expected Result:**

- Response 200 ngay lập tức với message "Đang xử lý..."
- Webhook SUCCESS sau ~2 giây

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-FUNC-004: Credit Card đuôi "0000" → webhook FAILED (mock)


| Thuộc tính   | Chi tiết                        |
| ------------ | ------------------------------- |
| **Module**   | M4 — Payment Gateway            |
| **Loại**     | FUNC                            |
| **Priority** | P1                              |
| **API**      | `POST /api/payment/credit-card` |


**Test Data:**

```json
{
  "orderId": 103,
  "amount": 75000,
  "cardNumber": "4111111111110000",
  "cvv": "123",
  "expiryDate": "12/28"
}
```

**Steps:**

1. Gửi POST credit card với đuôi "0000"
2. Chờ 3 giây
3. Kiểm tra webhook FAILED về Main API

**Expected Result:**

- Webhook FAILED được gửi về Main API

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-FUNC-005: Refund — trả status REFUNDED + refundedAt


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M4 — Payment Gateway       |
| **Loại**     | FUNC                       |
| **Priority** | P1                         |
| **API**      | `POST /api/payment/refund` |


**Test Data:**

```json
{ "orderId": 104, "amount": 75000, "action": "REFUND_TEST" }
```

**Steps:**

1. Gửi POST `/api/payment/refund` với HMAC
2. Kiểm tra response

**Expected Result:**

- Status 200, body chứa `{ status: "REFUNDED", refundedAt: "2026-..." }`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-FUNC-006: Simulate result gửi webhook manual (dev only)


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Payment Gateway                |
| **Loại**     | FUNC                                |
| **Priority** | P2                                  |
| **API**      | `POST /api/payment/simulate-result` |


**Steps:**

1. Gửi POST `/api/payment/simulate-result` với status SUCCESS/FAILED

**Expected Result:**

- Status 200, webhook được gửi về Main API

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED ☐ SKIP (production)

---

### GW-NEG-007: Create QR thiếu orderId → 400


| Thuộc tính   | Chi tiết                      |
| ------------ | ----------------------------- |
| **Module**   | M4 — Payment Gateway          |
| **Loại**     | NEG                           |
| **Priority** | P1                            |
| **API**      | `POST /api/payment/create-qr` |


**Test Data:**

```json
{ "amount": 50000 }
```

**Steps:**

1. Gửi POST không có orderId
2. Kiểm tra HTTP status

**Expected Result:**

- Status 400, message "Thiếu thông tin orderId hoặc amount"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-NEG-008: Credit Card thiếu cvv/expiryDate → 400


| Thuộc tính   | Chi tiết                        |
| ------------ | ------------------------------- |
| **Module**   | M4 — Payment Gateway            |
| **Loại**     | NEG                             |
| **Priority** | P1                              |
| **API**      | `POST /api/payment/credit-card` |


**Test Data:**

```json
{
  "orderId": 106,
  "amount": 50000,
  "cardNumber": "4111111111111111"
}
```

**Steps:**

1. Gửi POST thiếu cvv và expiryDate
2. Kiểm tra HTTP status

**Expected Result:**

- Status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-SEC-009: Request không có HMAC → 401


| Thuộc tính   | Chi tiết                      |
| ------------ | ----------------------------- |
| **Module**   | M4 — Payment Gateway          |
| **Loại**     | SEC                           |
| **Priority** | P0                            |
| **API**      | `POST /api/payment/create-qr` |


**Steps:**

1. Gửi POST `/api/payment/create-qr` không kèm HMAC
2. Kiểm tra HTTP status

**Expected Result:**

- Status 401, body `{ success: false, message: "Missing HMAC signature" }`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### GW-NEG-010: Simulate bị chặn trong production


| Thuộc tính   | Chi tiết                            |
| ------------ | ----------------------------------- |
| **Module**   | M4 — Payment Gateway                |
| **Loại**     | NEG                                 |
| **Priority** | P2                                  |
| **API**      | `POST /api/payment/simulate-result` |


**Preconditions:**

- `NODE_ENV === 'production'`

**Steps:**

1. Gửi POST simulate trong production

**Expected Result:**

- Status 400, message "Khong cho phep simulate payment trong production"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED ☐ SKIP (dev)

---

## E. VOUCHER — CRUD Admin (7 TC)

### VOU-FUNC-001: Lấy danh sách voucher (Admin)


| Thuộc tính   | Chi tiết                  |
| ------------ | ------------------------- |
| **Module**   | M6 — Khuyến mãi           |
| **Loại**     | FUNC                      |
| **Priority** | P1                        |
| **API**      | `GET /api/admin/vouchers` |


**Steps:**

1. Gửi GET với JWT admin
2. Kiểm tra response

**Expected Result:**

- Status 200, body là mảng voucher (không rỗng)

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-002: Xem chi tiết voucher (Admin)


| Thuộc tính   | Chi tiết                      |
| ------------ | ----------------------------- |
| **Module**   | M6 — Khuyến mãi               |
| **Loại**     | FUNC                          |
| **Priority** | P2                            |
| **API**      | `GET /api/admin/vouchers/:id` |


**Steps:**

1. Gửi GET `/api/admin/vouchers/1`
2. Kiểm tra response chứa đầy đủ thông tin voucher

**Expected Result:**

- Status 200, chứa: Code, DiscountType, DiscountValue, MaxDiscount, StartDate, EndDate, UsageLimit, UsageCount,...

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-003: Tạo voucher mới (Admin) → 201


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | FUNC                       |
| **Priority** | P1                         |
| **API**      | `POST /api/admin/vouchers` |


**Test Data:**

```json
{
  "code": "TEST-VOU-001",
  "discountType": "PERCENT",
  "discountValue": 10,
  "maxDiscount": 30000,
  "startDate": "2026-06-01",
  "endDate": "2026-12-31",
  "usageLimit": 100,
  "minOrderValue": 50000,
  "minTicketQty": 1,
  "applicableFormat": "ALL"
}
```

**Steps:**

1. Gửi POST với body trên
2. Kiểm tra HTTP status

**Expected Result:**

- Status 201, body chứa voucher vừa tạo

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-004: Sửa voucher (Admin) → 200


| Thuộc tính   | Chi tiết                      |
| ------------ | ----------------------------- |
| **Module**   | M6 — Khuyến mãi               |
| **Loại**     | FUNC                          |
| **Priority** | P2                            |
| **API**      | `PUT /api/admin/vouchers/:id` |


**Test Data:**

```json
{ "discountValue": 15 }
```

**Steps:**

1. Gửi PUT với body trên
2. Kiểm tra response

**Expected Result:**

- Status 200, voucher đã được cập nhật

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-005: Xóa voucher (Admin) → 200


| Thuộc tính   | Chi tiết                         |
| ------------ | -------------------------------- |
| **Module**   | M6 — Khuyến mãi                  |
| **Loại**     | FUNC                             |
| **Priority** | P2                               |
| **API**      | `DELETE /api/admin/vouchers/:id` |


**Steps:**

1. Tạo voucher mới trước
2. Gửi DELETE

**Expected Result:**

- Status 200

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-006: Sửa voucher không tồn tại → 404


| Thuộc tính   | Chi tiết                        |
| ------------ | ------------------------------- |
| **Module**   | M6 — Khuyến mãi                 |
| **Loại**     | NEG                             |
| **Priority** | P2                              |
| **API**      | `PUT /api/admin/vouchers/99999` |


**Expected Result:**

- Status 404

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-INT-007: Tạo voucher → notification gửi đến customer verified


| Thuộc tính   | Chi tiết        |
| ------------ | --------------- |
| **Module**   | M6 — Khuyến mãi |
| **Loại**     | INT             |
| **Priority** | P2              |


**Steps:**

1. Tạo voucher mới
2. Kiểm tra notification queue hoặc DB notification

**Expected Result:**

- Notification được tạo cho tất cả customer có IsVerified = 1

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## F. VOUCHER — Customer & Checkout (14 TC)

### VOU-FUNC-008: Lấy voucher hợp lệ FEFO — kèm discountAmount


| Thuộc tính   | Chi tiết                                                 |
| ------------ | -------------------------------------------------------- |
| **Module**   | M6 — Khuyến mãi                                          |
| **Loại**     | FUNC                                                     |
| **Priority** | P1                                                       |
| **API**      | `GET /api/vouchers?totalAmount=&totalSeats=&showFormat=` |


**Steps:**

1. Gửi GET với query params

**Expected Result:**

- Status 200, mảng voucher được sắp xếp theo EndDate ASC (FEFO)
- Mỗi voucher có `discountAmount` tính sẵn

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-009: Áp dụng voucher PERCENT — giảm % không vượt MaxDiscount


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | FUNC                       |
| **Priority** | P0                         |
| **API**      | `POST /api/vouchers/apply` |


**Test Data:**

```json
{
  "voucherId": 1,
  "bookingId": 1,
  "totalAmount": 150000,
  "totalSeats": 2,
  "showFormat": "ALL"
}
```

**Expected Result:**

- `discountAmount = totalAmount * (discountValue/100)`, không vượt `MaxDiscount`
- `finalAmount = totalAmount - discountAmount`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-010: Áp dụng voucher FIXED — giảm cố định


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | FUNC                       |
| **Priority** | P0                         |
| **API**      | `POST /api/vouchers/apply` |


**Expected Result:**

- `discountAmount = discountValue`, không vượt `totalAmount`
- `finalAmount = max(totalAmount - discountValue, 0)`

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-011: Lấy checkout vouchers — kèm isApplicable + reasonCode


| Thuộc tính   | Chi tiết                     |
| ------------ | ---------------------------- |
| **Module**   | M6 — Khuyến mãi              |
| **Loại**     | FUNC                         |
| **Priority** | P1                           |
| **API**      | `GET /api/vouchers/checkout` |


**Expected Result:**

- Mỗi voucher có `isApplicable: true/false` và `reasonCode` nếu không applicable

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-012: Auto-suggest voucher tốt nhất


| Thuộc tính   | Chi tiết                    |
| ------------ | --------------------------- |
| **Module**   | M6 — Khuyến mãi             |
| **Loại**     | FUNC                        |
| **Priority** | P1                          |
| **API**      | `GET /api/vouchers/suggest` |


**Expected Result:**

- Trả voucher giảm nhiều tiền nhất cho đơn hàng

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-FUNC-013: Lấy voucher public — không cần token


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | FUNC                       |
| **Priority** | P2                         |
| **API**      | `GET /api/vouchers/public` |


**Steps:**

1. Gửi GET không có JWT

**Expected Result:**

- Status 200, chỉ trả voucher public đang active

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-014: Áp dụng voucher hết hạn → reasonCode = EXPIRED


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P1                         |
| **API**      | `POST /api/vouchers/apply` |


**Expected Result:**

- `data.reasonCode = "EXPIRED"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-015: Áp dụng voucher chưa đến thời gian → NOT_STARTED


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P2                         |
| **API**      | `POST /api/vouchers/apply` |


**Expected Result:**

- `data.reasonCode = "NOT_STARTED"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-016: Áp dụng voucher hết lượt → USAGE_LIMIT_REACHED


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P1                         |
| **API**      | `POST /api/vouchers/apply` |


**Expected Result:**

- `data.reasonCode = "USAGE_LIMIT_REACHED"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-017: Áp dụng voucher đơn hàng < MinOrderValue → MIN_ORDER_NOT_MET


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P1                         |
| **API**      | `POST /api/vouchers/apply` |


**Steps:**

1. Gửi apply với `totalAmount: 10000` (nhỏ hơn MinOrderValue)

**Expected Result:**

- `data.reasonCode = "MIN_ORDER_NOT_MET"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-018: Áp dụng voucher số vé < MinTicketQty → MIN_TICKET_NOT_MET


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P2                         |
| **API**      | `POST /api/vouchers/apply` |


**Expected Result:**

- `data.reasonCode = "MIN_TICKET_NOT_MET"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-019: Áp dụng voucher format không match → FORMAT_NOT_MATCH


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P2                         |
| **API**      | `POST /api/vouchers/apply` |


**Steps:**

1. Gửi apply với `showFormat: "IMAX"` (không khớp với voucher)

**Expected Result:**

- `data.reasonCode = "FORMAT_NOT_MATCH"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-020: Áp dụng voucher đã dùng rồi → ALREADY_USED


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P1                         |
| **API**      | `POST /api/vouchers/apply` |


**Steps:**

1. Dùng voucher 1 lần
2. Gửi apply lại voucher đó

**Expected Result:**

- `data.reasonCode = "ALREADY_USED"` hoặc status 400

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### VOU-NEG-021: Áp dụng voucher không thuộc quyền sở hữu → 403


| Thuộc tính   | Chi tiết                   |
| ------------ | -------------------------- |
| **Module**   | M6 — Khuyến mãi            |
| **Loại**     | NEG                        |
| **Priority** | P1                         |
| **API**      | `POST /api/vouchers/apply` |


**Expected Result:**

- Status 403 hoặc 400 hoặc 404

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## G. MOBILE UI — Payment & Voucher Screens (14 TC)

> **Lưu ý:** UI test cần chạy thủ công trên thiết bị/simulator.

### UI-PAY-001: PaymentScreen — hiển thị tổng tiền + phương thức


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-PAY-001** | PaymentScreen | P0       |


**Steps:**

1. Mở PaymentScreen sau khi chọn ghế + combo
2. Kiểm tra hiển thị tổng tiền, 2 phương thức (QR, Credit Card)

**Expected Result:**

- Tổng tiền đúng (tính từ ghế + combo)
- 2 nút chọn phương thức thanh toán hiển thị

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-002: Chọn QR → hiển thị mã QR + countdown


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-PAY-002** | PaymentScreen | P0       |


**Steps:**

1. Chọn phương thức QR
2. Kiểm tra mã QR hiển thị + countdown timer 10 phút

**Expected Result:**

- Mã QR hiển thị rõ ràng
- Countdown đếm ngược từ 10:00

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-003: Chọn Credit Card → form nhập thẻ


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-PAY-003** | PaymentScreen | P0       |


**Steps:**

1. Chọn phương thức Credit Card
2. Kiểm tra form: cardNumber, cvv, expiryDate

**Expected Result:**

- Form hiển thị đầy đủ 3 trường
- Validation đúng format

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-004: Thanh toán thành công → PaymentResultScreen (checkmark xanh)


| ID             | Screen              | Priority |
| -------------- | ------------------- | -------- |
| **UI-PAY-004** | PaymentResultScreen | P0       |


**Steps:**

1. Quét QR thành công
2. Kiểm tra PaymentResultScreen

**Expected Result:**

- Checkmark xanh / icon thành công
- Thông tin vé: phim, rạp, suất chiếu, ghế

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-005: Thanh toán thất bại → hiển thị lỗi + nút Retry


| ID             | Screen              | Priority |
| -------------- | ------------------- | -------- |
| **UI-PAY-005** | PaymentResultScreen | P1       |


**Steps:**

1. Thanh toán thất bại
2. Kiểm tra message lỗi + nút Retry

**Expected Result:**

- Message lỗi rõ ràng
- Nút "Thử lại" hoạt động

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-006: Loading spinner khi đang xử lý thanh toán


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-PAY-006** | PaymentScreen | P1       |


**Expected Result:**

- Spinner hiển thị khi đang gọi API thanh toán
- Nút bị disable trong lúc loading

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-VOU-007: Voucher list — hiển thị danh sách voucher applicable


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-VOU-007** | VoucherScreen | P1       |


**Steps:**

1. Mở VoucherScreen
2. Kiểm tra danh sách voucher

**Expected Result:**

- Danh sách hiển thị: mã, giá trị giảm, ngày hết hạn
- Phân biệt voucher applicable (chọn được) vs không

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-VOU-008: Voucher không đủ điều kiện — xám + reason text


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-VOU-008** | VoucherScreen | P1       |


**Steps:**

1. Mở VoucherScreen
2. Kiểm tra voucher không đủ điều kiện

**Expected Result:**

- Voucher xám, không chọn được
- Có text giải thích lý do: "Đơn tối thiểu 50.000đ" / "Hết lượt" / "Hết hạn"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-VOU-009: Chọn voucher → cập nhật tổng tiền (trừ discountAmount)


| ID             | Screen                        | Priority |
| -------------- | ----------------------------- | -------- |
| **UI-VOU-009** | VoucherScreen → PaymentScreen | P0       |


**Steps:**

1. Chọn voucher
2. Quay lại PaymentScreen

**Expected Result:**

- Tổng tiền giảm đúng = original - discountAmount

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-VOU-010: Badge "Giảm X%" hoặc "Giảm Xđ" trên voucher card


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-VOU-010** | VoucherScreen | P2       |


**Expected Result:**

- PERCENT: badge "Giảm 10%"
- FIXED: badge "Giảm 30.000đ"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-VOU-011: Auto-suggest — highlight voucher tốt nhất


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-VOU-011** | VoucherScreen | P2       |


**Expected Result:**

- Voucher suggest có viền/badge nổi bật
- Badge: "Gợi ý" / "Tốt nhất"

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-012: Hiển thị chi tiết breakdown giá


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-PAY-012** | PaymentScreen | P1       |


**Expected Result:**

- Breakdown: Tiền vé + Tiền combo - Voucher = Tổng cộng
- Mỗi dòng có số tiền cụ thể (VNĐ)

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-VOU-013: Voucher public hiển thị trên trang chủ


| ID             | Screen     | Priority |
| -------------- | ---------- | -------- |
| **UI-VOU-013** | HomeScreen | P2       |


**Expected Result:**

- Section/carousel voucher public trên HomeScreen

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### UI-PAY-014: Timeout 10 phút → redirect về màn hình chính


| ID             | Screen        | Priority |
| -------------- | ------------- | -------- |
| **UI-PAY-014** | PaymentScreen | P1       |


**Steps:**

1. Bắt đầu thanh toán QR
2. Chờ countdown hết
3. Kiểm tra navigation

**Expected Result:**

- Alert/Dialog thông báo hết hạn
- Tự động redirect về HomeScreen
- Ghế đã chọn được giải phóng

**Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Tổng kết


| Nhóm                | Số TC  | P0     | P1     | P2     |
| ------------------- | ------ | ------ | ------ | ------ |
| A. Payment Init     | 10     | 4      | 4      | 2      |
| B. Webhook          | 10     | 3      | 5      | 2      |
| C. Retry & Refund   | 6      | 0      | 4      | 2      |
| D. Payment Gateway  | 10     | 3      | 5      | 2      |
| E. Voucher Admin    | 7      | 0      | 4      | 3      |
| F. Voucher Customer | 14     | 2      | 7      | 5      |
| G. Mobile UI        | 14     | 5      | 5      | 4      |
| **Tổng**            | **71** | **17** | **34** | **20** |


---

## Chạy Test

```bash
# Chạy toàn bộ test suite TV4
cd backend
npm run test:tv4

# Hoặc chạy trực tiếp
node scripts/tv4-test-suite.js
```

**Yêu cầu:**

- Main API port 3000
- Payment Gateway port 4000
- Cập nhật `TEST_DATA` trong script cho phù hợp với dữ liệu seed

