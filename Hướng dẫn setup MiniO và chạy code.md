
ĐỌC CÁI NÀY :

LƯU Ý : NẾU CHƯA CÓ CSDL TRƯỚC ĐÓ HOẶC KHÔNG CHẠY ĐƯỢC ,CHẠY BỊ LỖI PHÔNG CHỮ THÌ NÊN CHẠY FILE : script.fixed.unicode.sql trong mục database/script

-----Nếu quyết định chọn script.fixed.unicode.sql  thì chạy thêm các script theo hướng dẫn bên dưới để có đầy đủ các bảng cần thiết --------------

Nếu có csdl rồi thì bỏ qua file script.fixed.unicode.sql và chạy các lệnh tạo bảng trong mục database/script  ( nếu chưa chạy )







# Hướng dẫn setup MinIO và seed media



Tài liệu này giúp người khác clone project và chạy được đầy đủ ảnh phim,
trailer, ảnh sản phẩm và các thông tin phim/sản phẩm đã chỉnh sửa mà không cần
nhận file backup database từ máy của bạn.

## 1. Các file được cung cấp trong repo

- `database/assets/`
  - Chứa poster phim, trailer phim và ảnh sản phẩm đã export từ MinIO.
- `database/seeds/media-manifest.json`
  - Chứa thông tin phim/sản phẩm và đường dẫn object sẽ upload lên MinIO.
- `backend/scripts/seed-minio-assets.js`
  - Upload file trong `database/assets` lên MinIO của máy người chạy.
  - Cập nhật lại URL trong SQL Server theo `MINIO_PUBLIC_URL` của máy đó.
- `SETUP_MEDIA_AND_SEED.md`
  - Tài liệu hướng dẫn hiện tại.

## 2. Điều kiện cần có

Người chạy cần cài:

- Node.js
- npm
- Docker Desktop
- SQL Server
- SQL Server Management Studio hoặc công cụ tương đương

Database cần được tạo từ script gốc trước, sau đó chạy các migration cần thiết:

```text
database/scripts/2026-05-18-add-poster-url-column.sql
database/scripts/2026-05-19-add-product-category.sql
database/scripts/2026-05-25-create-movie-review-table.sql
```

## 3. Chạy MinIO bằng Docker

Mở terminal và chạy:

```bash
docker run -d ^
  --name movie-minio ^
  -p 9000:9000 ^
  -p 9001:9001 ^
  -e MINIO_ROOT_USER=minioadmin ^
  -e MINIO_ROOT_PASSWORD=minioadmin123 ^
  -v movie-minio-data:/data ^
  minio/minio server /data --console-address ":9001"
```

Nếu dùng Git Bash/macOS/Linux thì dùng lệnh này:

```bash
docker run -d \
  --name movie-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v movie-minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

Kiểm tra container:

```bash
docker ps
```

Nếu đã từng tạo container `movie-minio` trước đó, có thể start lại:

```bash
docker start movie-minio
```

## 4. Đăng nhập MinIO Console

Mở trình duyệt:

```text
http://localhost:9001
```

Đăng nhập:

```text
Username: minioadmin
Password: minioadmin123
```

Script seed có thể tự tạo bucket `movie-assets` nếu bucket chưa tồn tại.

## 5. Cấu hình bucket public để mobile xem được ảnh/trailer

Mobile sẽ tải ảnh/trailer trực tiếp từ MinIO, vì vậy bucket `movie-assets` cần
cho phép public read. Cấu hình bằng dòng lệnh như sau.

Trước tiên chạy script seed để tạo bucket và upload file:

```bash
cd backend
npm run seed:media
```

Sau đó cấu hình public read bằng MinIO Client (`mc`):

```bash
docker run --rm --network host minio/mc alias set local http://127.0.0.1:9000 minioadmin minioadmin123
docker run --rm --network host minio/mc anonymous set download local/movie-assets
```

Trên Windows Docker Desktop, nếu `--network host` không hoạt động, dùng cách:

```bash
docker run --rm minio/mc alias set local http://host.docker.internal:9000 minioadmin minioadmin123
docker run --rm minio/mc anonymous set download local/movie-assets
```

Sau khi chạy xong, các file trong bucket `movie-assets` có thể được tải trực
tiếp qua URL public dạng:

```text
http://YOUR_LAN_IP:9000/movie-assets/...
```

## 6. Tìm IP LAN của máy đang chạy MinIO

Mobile không dùng được `localhost` của máy tính. Cần lấy IP LAN của máy đang
chạy backend/MinIO.

Trên Windows:

```bash
ipconfig
```

Tìm dòng IPv4, ví dụ:

```text
192.168.1.20
```

Khi đó public URL của MinIO sẽ là:

```text
http://192.168.1.20:9000/movie-assets
```

## 7. Cấu hình `backend/.env`

Trong file `backend/.env`, cấu hình tối thiểu như sau.

Các giá trị có dạng `CHANGE_ME_*`, `YOUR_*` hoặc `EXAMPLE_*` là thông tin riêng
của từng máy/người chạy, cần tự thay cho đúng môi trường của họ. Không dùng lại
mật khẩu, email, IP hoặc secret của người khác.

```env
# Server
PORT=3000
NODE_ENV=development

# Database - thay theo SQL Server của máy người chạy
DB_HOST=127.0.0.1
DB_PORT=1433
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=appDatvexemPhim
DB_INSTANCE=SQLEXPRESS

# JWT - thay bằng chuỗi bí mật riêng, không public secret thật
JWT_SECRET=CHANGE_ME_ACCESS_TOKEN_SECRET
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=CHANGE_ME_REFRESH_TOKEN_SECRET
JWT_REFRESH_EXPIRES_IN=7d

# Redis - giữ mặc định nếu chạy Redis local không mật khẩu
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Email SMTP - chỉ cần cấu hình nếu muốn gửi email thật
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_EMAIL@example.com
SMTP_PASSWORD=YOUR_EMAIL_APP_PASSWORD

# Payment gateway local
PAYMENT_GW_URL=http://localhost:4000/api/payment
PAYMENT_GW_HMAC_SECRET=CHANGE_ME_LOCAL_HMAC_SECRET

# MinIO - thông tin dùng chung nếu chạy theo Docker command trong tài liệu này
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=movie-assets

# MinIO public URL - thay YOUR_LAN_IP bằng IPv4 LAN của máy người chạy
MINIO_PUBLIC_URL=http://YOUR_LAN_IP:9000/movie-assets
```

Các phần thường phải thay:

- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `PAYMENT_GW_HMAC_SECRET`
- `MINIO_PUBLIC_URL`

Các phần có thể giữ nguyên nếu chạy đúng theo hướng dẫn Docker ở trên:

- `MINIO_ENDPOINT=127.0.0.1`
- `MINIO_PORT=9000`
- `MINIO_ACCESS_KEY=minioadmin`
- `MINIO_SECRET_KEY=minioadmin123`
- `MINIO_BUCKET=movie-assets`

Thay `YOUR_LAN_IP` bằng IP thật của máy người chạy.

Ví dụ:

```env
MINIO_PUBLIC_URL=http://192.168.1.20:9000/movie-assets
```

Giải thích nhanh:

- `MINIO_ENDPOINT=127.0.0.1`: backend upload lên MinIO trên chính máy đang chạy.
- `MINIO_PUBLIC_URL=http://YOUR_LAN_IP:9000/movie-assets`: mobile dùng URL này
  để tải ảnh/trailer.

## 8. Cài dependencies backend

Từ thư mục project:

```bash
cd backend
npm install
```

## 9. Chạy script upload media và cập nhật DB

Từ thư mục `backend`:

```bash
npm run seed:media
```

Script này sẽ:

1. Đọc `database/seeds/media-manifest.json`.
2. Upload toàn bộ file trong `database/assets` lên MinIO.
3. Cập nhật:
   - `Movie.PosterUrl`
   - `Movie.TrailerUrl`
   - `Product.ImageProduct`
4. Cập nhật thông tin phim/sản phẩm theo manifest.

Sau khi chạy xong, DB của người đó sẽ trỏ về MinIO local của chính họ, không
trỏ về IP của máy bạn.

## 10. Kiểm tra kết quả

Kiểm tra MinIO Console:

```text
http://localhost:9001
```

Bucket mong đợi:

```text
movie-assets
```

Các folder mong đợi:

```text
movies/
trailers/
products/
```

Kiểm tra trong SQL Server:

```sql
SELECT MovieID, MovieTitle, PosterUrl, TrailerUrl
FROM Movie
ORDER BY MovieID;

SELECT ProductID, ProductName, ImageProduct
FROM Product
ORDER BY ProductID;
```

URL cần bắt đầu bằng IP của máy người chạy, ví dụ:

```text
http://192.168.1.20:9000/movie-assets/...
```

## 11. Chạy backend và mobile

Backend:

```bash
cd backend
npm run dev
```

Mobile:

```bash
cd mobile-app
npm install
npx expo start -c
```

## 12. Khi đổi mạng Wi-Fi/LAN

Nếu IP LAN thay đổi:

1. Cập nhật `MINIO_PUBLIC_URL` trong `backend/.env`.
2. Chạy lại:

```bash
cd backend
npm run seed:media
```

3. Restart backend:

```bash
npm run dev
```

## 13. Lưu ý quan trọng

- Không cần gửi file backup database để chia sẻ poster/trailer.
- Không nên để DB lưu IP của máy người khác, vì mobile sẽ không tải được media.
- Các file media trong `database/assets` là nguồn seed chung cho cả nhóm.
- Script hiện tại giả định DB gốc có cùng `MovieID` và `ProductID` với script
  database được chia sẻ. Nếu script gốc thay đổi ID, cần export lại
  `database/seeds/media-manifest.json`.
- Trailer trong app mobile phát trực tiếp tốt nhất với file video trực tiếp
  như `.mp4` được upload lên MinIO.
