# Backend phân tích thị trường tuyển dụng IT Việt Nam

Backend này cung cấp REST API public, chỉ đọc dữ liệu từ Microsoft SQL Server Data Warehouse `JobDW`. Mục tiêu là phục vụ dashboard phân tích thị trường tuyển dụng IT tại Việt Nam dựa trên dữ liệu tin tuyển dụng được thu thập từ TopCV.

Backend không triển khai đăng nhập, JWT, authentication, authorization và không tạo CRUD cho từng bảng.

## Công nghệ sử dụng

- Node.js
- Express
- Microsoft SQL Server
- `mssql`
- `dotenv`
- `cors`
- `nodemon`

## Cấu trúc thư mục

```text
backend/
  server.js
  .env
  .gitignore
  package.json
  README.md
  PROMPT.md
  docs/
    database-schema.md
    api-proposal.md
    api-spec.md
  config/
    db.js
  controllers/
    analyticsController.js
    healthController.js
  middleware/
    errorHandler.js
  repositories/
    analyticsRepository.js
  routes/
    analyticsRoutes.js
    index.js
  services/
    analyticsService.js
  utils/
    apiResponse.js
    queryValidation.js
```

## Cấu hình `.env`

Tạo file `.env` trong thư mục `backend`:

```env
PORT=3001

DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=JobDW
DB_USER=sa
DB_PASSWORD=your_password

DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

Không commit `.env` và không ghi mật khẩu thật vào README hoặc log.

## Cài dependencies

```bash
npm install
```

## Chạy development

```bash
npm run dev
```

Backend chạy tại:

```text
http://localhost:3001
```

## Chạy production

```bash
npm start
```

## Test health check

```bash
curl http://localhost:3001/api/health
```

Response mẫu:

```json
{
  "success": true,
  "message": "Backend đang hoạt động",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-05T00:00:00.000Z"
  }
}
```

## Danh sách API đã được phê duyệt

### Health

- `GET /api/health`

### Dashboard overview

- `GET /api/analytics/overview`
- `GET /api/analytics/filters`

### Xu hướng tuyển dụng

- `GET /api/analytics/trends/quarters`
- `GET /api/analytics/trends/months`

### Vị trí

- `GET /api/analytics/positions`
- `GET /api/analytics/positions/:position/skills`

### Kỹ năng và ngôn ngữ

- `GET /api/analytics/skills/top`
- `GET /api/analytics/languages/top`
- `GET /api/analytics/skills/co-occurrence`

### Lương

- `GET /api/analytics/salaries/by-position`
- `GET /api/analytics/salaries/by-experience`
- `GET /api/analytics/salaries/by-city`
- `GET /api/analytics/salaries/by-skill`
- `GET /api/analytics/salaries/predict`

### Địa điểm và thị trường

- `GET /api/analytics/locations`
- `GET /api/analytics/locations/wards`
- `GET /api/analytics/markets/cities`

### Công ty

- `GET /api/analytics/companies/top`
- `GET /api/analytics/companies/by-field`

### Cấp bậc và kinh nghiệm

- `GET /api/analytics/levels`
- `GET /api/analytics/experience/by-position`
- `GET /api/analytics/levels/:level/skills`

### Bộ lọc tổng hợp

- `GET /api/analytics/jobs/summary`
- `GET /api/analytics/jobs/breakdown`

## Query parameters

Tùy endpoint, API hỗ trợ các tham số:

- `year`
- `quarter`
- `month`
- `fromDate`
- `toDate`
- `city`
- `ward`
- `skill`
- `position`
- `company`
- `level`
- `salaryMin`
- `salaryMax`
- `experienceMin`
- `experienceMax`
- `limit`
- `sortBy`
- `sortOrder`
- `groupBy`

Chi tiết từng API nằm trong:

```text
docs/api-spec.md
```

## Định dạng response

Các field bao ngoài luôn dùng:

- `success`
- `message`
- `data`
- `error`

Các field bên trong `data` dùng tên cột/metric giống Data Warehouse, ví dụ `tenThanhPho`, `soTin`, `luongTrungBinh`, `xepHang`, `tenKyNang`, `tenViTriChuan`. Backend không alias dữ liệu phân tích sang tên tiếng Anh như `city`, `jobCount`, `averageSalary`.

Thành công:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": []
}
```

Không có dữ liệu:

```json
{
  "success": true,
  "message": "Không có dữ liệu phù hợp",
  "data": []
}
```

Lỗi validate:

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "error": "quarter chỉ được nhận giá trị từ 1 đến 4"
}
```

Không tìm thấy API:

```json
{
  "success": false,
  "message": "Không tìm thấy API yêu cầu"
}
```

Lỗi server:

```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi xử lý yêu cầu",
  "error": "Không thể truy vấn dữ liệu"
}
```

## Ghi chú vận hành

- SQL chỉ nằm trong `repositories/`.
- Business logic nằm trong `services/`.
- Request/response handling nằm trong `controllers/`.
- Routes chỉ khai báo endpoint và gọi controller.
- Kết nối SQL Server dùng connection pool trong `config/db.js`.
- Tất cả truy vấn có input từ người dùng đều dùng parameterized query.
- Dữ liệu hiện tại trong `JobDW` tập trung ở `Q2-2026`, nên biểu đồ xu hướng theo quý có thể chỉ có một điểm dữ liệu.

## Tài liệu liên quan

- `docs/database-schema.md`
- `docs/api-proposal.md`
- `docs/api-spec.md`
