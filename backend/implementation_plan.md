# Sửa lỗi Typescript & Dọn dẹp Code Backend

Mục tiêu: Dọn dẹp các thư mục bị trùng lặp, sửa các lỗi Typescript cơ bản, và vá các hàm Model còn thiếu để Backend có thể compile thành công.

## User Review Required

> [!WARNING]
> Kế hoạch này sẽ tiến hành **xóa** các file và thư mục bị trùng lặp. Vui lòng xem kỹ mục **Proposed Changes** bên dưới để đảm bảo những file bị xóa là file cũ/thừa và không ảnh hưởng đến dữ liệu mong muốn của bạn.
> Cụ thể: Các file Controller nằm trong thư mục con (ví dụ: `src/controllers/movie/movie.controller.ts`) có dung lượng lớn hơn và chứa nhiều code hơn so với file ở thư mục gốc (`src/controllers/movie.controller.ts`). Tôi sẽ ưu tiên **giữ code ở file có dung lượng lớn hơn** và di chuyển ra thư mục gốc để chuẩn hóa cấu trúc, sau đó xóa thư mục con.

## Open Questions

- Bạn có muốn sử dụng cơ chế Soft Delete (ẩn record thay vì xóa cứng) cho các bảng (ví dụ: `Cinema`, `Show`) không? Các hàm như `softDelete` đang được gọi ở Service nhưng Model chưa có. Tôi sẽ implement nó bằng cách cập nhật cột `IsActive = 0` (hoặc `DeletedAt = GETDATE()`).

## Proposed Changes

### 1. Dọn dẹp Cấu trúc Thư mục (Deduplicate)

Xóa các thư mục con bị trùng lặp và đồng nhất cấu trúc ở thư mục gốc (`src/controllers` và `src/routes`). Code từ thư mục con (mới/đầy đủ hơn) sẽ được ghi đè ra file gốc.

#### [DELETE] Thư mục con bị thừa
- `src/controllers/cinema/`
- `src/controllers/movie/`
- `src/controllers/show/`
- `src/routes/auth/`
- `src/routes/cinema/`
- `src/routes/customer/`
- `src/routes/movie/`
- `src/routes/show/`

#### [MODIFY] File Controller gốc (Ghi đè bằng code đầy đủ nhất)
- [cinema.controller.ts](file:///c:/Users/Admin/Documents/Do%20an%20da%20nen%20tang/Movie-Ticket-Booking-App/backend/src/controllers/cinema.controller.ts)
- [movie.controller.ts](file:///c:/Users/Admin/Documents/Do%20an%20da%20nen%20tang/Movie-Ticket-Booking-App/backend/src/controllers/movie.controller.ts)
- [show.controller.ts](file:///c:/Users/Admin/Documents/Do%20an%20da%20nen%20tang/Movie-Ticket-Booking-App/backend/src/controllers/show.controller.ts)

#### [MODIFY] File Route gốc (Ghi đè bằng code đầy đủ nhất)
- Cập nhật lại đường dẫn `import` trong các Route gốc (`src/routes/*.routes.ts`) để trỏ về đúng các Controller gốc vừa được làm sạch.

---

### 2. Sửa Lỗi Cú pháp & Typescript

Sửa toàn bộ lỗi biên dịch `tsc` đang gặp phải.

#### [MODIFY] Các file Controller & Route
- Khai báo đầy đủ type cho tham số: `(req: Request, res: Response)`.
- Sửa lỗi cú pháp import: `import { ... } from('../../utils')` -> `import { ... } from '../../utils'`.
- Sửa lỗi export: Đảm bảo các controller có export hợp lệ (ví dụ export object hoặc function).

#### [MODIFY] src/validators/*.validator.ts
- Sửa lỗi cú pháp `import { ... } from('../../utils')`.
- Bổ sung type cho tham số: `(req: Request, res: Response, next: NextFunction)` trong các middleware validator.

---

### 3. Vá Lỗi Model (Missing Methods)

Implement các phương thức mà Service đang gọi nhưng Model chưa khai báo.

#### [MODIFY] [cinema.model.ts](file:///c:/Users/Admin/Documents/Do%20an%20da%20nen%20tang/Movie-Ticket-Booking-App/backend/src/models/cinema.model.ts)
- `softDelete(id)`
- `getHallsByCinemaId(cinemaId)`
- `getHallById(hallId)`
- `createHall(hallData)`
- `updateSeats(hallId, seatsData)`

#### [MODIFY] [show.model.ts](file:///c:/Users/Admin/Documents/Do%20an%20da%20nen%20tang/Movie-Ticket-Booking-App/backend/src/models/show.model.ts)
- `getSeatsByShowId(showId)`
- `getByCinemaId(cinemaId)`

## Verification Plan

### Automated Tests
- Chạy lệnh `npm run build` ở thư mục backend và đảm bảo **không còn bất kỳ lỗi TypeScript nào**.
- Chạy lệnh `npm run dev` và kiểm tra server có khởi động thành công không.

### Manual Verification
- Dùng trình duyệt truy cập vào các đường dẫn `GET` công khai (ví dụ: `/api/movies`) để đảm bảo route vẫn hoạt động ổn định và trả về đúng dữ liệu.
