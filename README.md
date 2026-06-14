# Dashboard phân tích thị trường tuyển dụng IT

Repo này gồm pipeline end-to-end để thu thập tin tuyển dụng IT từ TopCV, lưu vào SQL Server, chạy ELT sang Data Warehouse `JobDW`, cung cấp REST API Express và hiển thị dashboard React/Vite.

## Cấu trúc tổng quan

```text
.
├── crawl/             # Python crawler: TopCV -> JobCrawlDB
├── DataWareHouse/     # SQL + Python runner: JobCrawlDB -> JobDW
├── backend/           # Express API, chatbot, job scheduler
├── frontend/          # React/Vite dashboard
├── env/               # Env dùng chung cho build Data Warehouse
└── requirements.txt   # Python dependencies cho crawler/ELT runner
```

Luồng dữ liệu chính:

```text
TopCV -> crawl/main.py -> SQL Server JobCrawlDB -> DataWareHouse/build_dw.py -> SQL Server JobDW -> backend API -> frontend
```

## Yêu cầu môi trường

- Node.js và npm.
- Python 3.8+.
- SQL Server đang chạy local hoặc server riêng.
- ODBC Driver 18 for SQL Server cho Python `pyodbc`.
- `sqlcmd` trong PATH để chạy các file `.sql` có lệnh `GO`.
- Google Chrome. Crawler đang khởi tạo `undetected_chromedriver` với `version_main=148`; nếu Chrome khác version, cần sửa `crawl/main.py`.

## Cài đặt nhanh

### 1. Tạo env dùng chung cho Data Warehouse

```bash
cp env/.env.example env/.env
```

Sửa `env/.env`:

```env
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=JobDW
DB_USER=sa
DB_PASSWORD=your_password_here
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

`DataWareHouse/build_dw.py` dùng `env/.env`. Nếu bỏ trống `DB_USER` hoặc `DB_PASSWORD`, script fallback sang Windows Authentication.

### 2. Cài Python dependencies

Nên tạo virtualenv ở root repo:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Trên Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Cài backend

```bash
cd backend
cp .env.example .env
npm install
```

Sửa `backend/.env` để backend đọc Data Warehouse `JobDW`:

```env
PORT=3001
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite

DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=JobDW
DB_USER=jobdw_chatbot_reader
DB_PASSWORD=
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

Nếu không dùng user `jobdw_chatbot_reader`, thay bằng user SQL Server có quyền đọc `JobDW`.

### 4. Cài frontend

```bash
cd frontend
cp .env.example .env
npm install
```

`frontend/.env` mặc định:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Tạo database crawl

Crawler lưu vào database nguồn `JobCrawlDB` bằng Windows Authentication trong `crawl/database.py`.

Tạo database trước:

```sql
CREATE DATABASE JobCrawlDB;
```

Khi chạy lần đầu, `TopCVDatabase` tự tạo các bảng:

- `CongTy`
- `CapBacCongViec`
- `ViTriCongViec`
- `DiaDiem`
- `KyNang`
- `TinTuyenDung`
- `TinTuyenDung_KyNang`
- `TinTuyenDung_DiaDiem`

## Cào dữ liệu

Chạy crawler từ root repo:

```bash
python crawl/main.py
```

Mặc định crawler:

- Cào từ TopCV danh mục công nghệ thông tin.
- Chạy 5 luồng, mỗi luồng đọc các page xen kẽ.
- Lấy tiêu đề, lương, kinh nghiệm, hạn nộp, cấp bậc, công ty, vị trí, kỹ năng, địa điểm.
- Chuyển lương về đơn vị triệu VND, có hỗ trợ USD.
- Bỏ qua tin đã có theo `linkBaiDang`.
- Ghi log vào `crawler.log`.

Dọn dẹp dữ liệu crawl:

```bash
python crawl/main.py --cleanup
```

Chế độ cleanup xóa tin hết hạn, kiểm tra URL TopCV đã bị gỡ, và xóa bản ghi dim mồ côi.

## Chạy ELT/Data Warehouse

Script ELT ở `DataWareHouse/build_dw.py` đọc `env/.env`, kiểm tra `sqlcmd`, rồi chạy lần lượt:

1. `00_rebuild_jobdw.sql`: drop và tạo mới `JobDW`.
2. `01_create_datawarehouse.sql`: tạo dimensions, fact và bridge tables.
3. `02_create_etl_procedures.sql`: tạo stored procedures load dim/fact từ `JobCrawlDB`.
4. `03_create_agg_tables.sql`: tạo bảng aggregate.
5. `04_create_agg_procedures.sql`: tạo stored procedures aggregate.
6. `05_run_all_etl.sql`: chạy load dim/fact/aggregate.
7. `06_check_output.sql`: in mẫu kết quả kiểm tra.
8. `07_create_indexes.sql`: tạo indexes tối ưu truy vấn.

Chạy:

```bash
python DataWareHouse/build_dw.py
```

Lưu ý: script này rebuild `JobDW`, nên dữ liệu warehouse cũ sẽ được tạo lại từ `JobCrawlDB`.

## Chạy backend

```bash
cd backend
npm run dev
```

Production:

```bash
npm start
```

Backend chạy tại `http://localhost:3001` và mount tất cả route dưới `/api`.

Kiểm tra:

```bash
curl http://localhost:3001/api/health
```

## Chạy frontend

```bash
cd frontend
npm run dev
```

Vite sẽ in URL local, thường là `http://localhost:5173`.

Build frontend:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Chạy job crawl/ELT từ backend

Backend có các API hệ thống để gọi Python task từ root repo. Python được chọn theo thứ tự:

1. `SYSTEM_TASK_PYTHON` trong `backend/.env` nếu có.
2. `.venv` ở root repo.
3. `python3` hoặc `python` trong PATH.

Timeout mặc định là 4 giờ, có thể đổi bằng `SYSTEM_TASK_TIMEOUT_MS`.

Endpoints:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/system/crawl` | Chạy `python crawl/main.py` nên sẽ cào dữ liệu. |
| `POST` | `/api/system/etl` | Chạy `python DataWareHouse/build_dw.py`. |
| `POST` | `/api/system/crawl-then-etl` | Cào dữ liệu xong chạy ELT. |
| `GET` | `/api/system/schedule` | Lấy cấu hình lịch, timezone và job đang chạy. |
| `PUT` | `/api/system/schedule` | Lưu lịch chạy tự động. |
| `DELETE` | `/api/system/schedule` | Tắt lịch chạy tự động. |

Body mẫu cho `PUT /api/system/schedule`:

```json
{
  "enabled": true,
  "jobType": "crawl_then_etl",
  "frequency": "daily",
  "time": "02:00",
  "dayOfWeek": "1",
  "intervalHours": "6",
  "dayOfMonth": "1",
  "quarterMonth": "first"
}
```

Giá trị hợp lệ:

- `jobType`: `crawl`, `etl`, `crawl_then_etl`.
- `frequency`: `daily`, `weekly`, `monthly`, `quarterly`, `interval`.
- `time`: `HH:mm`.
- `dayOfWeek`: `0` đến `6`.
- `intervalHours`: `1` đến `23`.
- `dayOfMonth`: `1` đến `28`.
- `quarterMonth`: `first`, `middle`, `last`.

Lịch được lưu ở `backend/data/system-schedule.json`. Timezone mặc định là `Asia/Ho_Chi_Minh`, có thể đổi bằng `SYSTEM_SCHEDULE_TIMEZONE`.

## Response API

Thành công:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {}
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
  "error": "Mô tả lỗi"
}
```

## Quy tắc filter chung

Tất cả query params đều được whitelist theo từng endpoint. Nếu truyền param không hỗ trợ, API trả `400`.

| Param | Kiểu | Validate/mặc định |
| --- | --- | --- |
| `year` | integer | Từ `2000` đến `2100`. |
| `quarter` | integer | `1`, `2`, `3`, `4`. |
| `month` | integer | `1` đến `12`. |
| `fromDate` | date string | Định dạng `YYYY-MM-DD`. |
| `toDate` | date string | Định dạng `YYYY-MM-DD`, phải >= `fromDate`. |
| `city` | string | Trim, tối đa 200 ký tự, match gần đúng bằng `LIKE` trong fact filters. |
| `ward` | string | Trim, tối đa 200 ký tự, match gần đúng. |
| `skill` | string | Trim, tối đa 200 ký tự, match gần đúng. |
| `position` | string | Trim, tối đa 400 ký tự, match gần đúng. |
| `company` | string | Trim, tối đa 400 ký tự. Trong fact filters là exact match. |
| `level` | string | Trim, tối đa 100 ký tự, match gần đúng. |
| `salaryMin` | number | >= 0. |
| `salaryMax` | number | >= 0 và >= `salaryMin`. |
| `experienceMin` | number | >= 0. |
| `experienceMax` | number | >= 0 và >= `experienceMin`. |
| `limit` | integer | Mặc định `10`, từ `1` đến `100`. |
| `sortBy` | string | Chỉ dùng ở endpoint có whitelist riêng. |
| `sortOrder` | string | `asc` hoặc `desc`, mặc định `desc`. |
| `groupBy` | string | Bắt buộc với `/api/analytics/jobs/breakdown`. |

Giá trị `groupBy` hợp lệ: `quarter`, `month`, `city`, `ward`, `skill`, `position`, `company`, `level`.

Giá trị `sortBy` hợp lệ theo nhóm:

- `jobCount` -> sắp xếp theo `soTin`.
- `averageSalary` -> sắp xếp theo `luongTrungBinh`.
- `averageExperience` -> sắp xếp theo `kinhNghiemTB`.
- `differentPositions` -> sắp xếp theo `soViTriKhacNhau`, chỉ dùng cho `/api/analytics/markets/cities`.

## Danh sách API và filter

Base URL local: `http://localhost:3001`.

### Health và chatbot

| Method | Endpoint | Body/filter |
| --- | --- | --- |
| `GET` | `/api/health` | Không có. |
| `POST` | `/api/chat` | JSON body `{ "message": "string", "history": [{ "role": "user|assistant", "content": "string" }] }`. `message` bắt buộc, tối đa 1000 ký tự. `history` lấy tối đa 6 tin gần nhất, mỗi content cắt 500 ký tự. |

### Analytics

| Method | Endpoint | Filter được hỗ trợ |
| --- | --- | --- |
| `GET` | `/api/analytics/overview` | `year`, `quarter`, `fromDate`, `toDate` |
| `GET` | `/api/analytics/filters` | Không có |
| `GET` | `/api/analytics/trends/quarters` | `year`, `limit` |
| `GET` | `/api/analytics/trends/months` | `year`, `quarter` |
| `GET` | `/api/analytics/positions` | `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder`; `sortBy`: `jobCount`, `averageSalary`, `averageExperience` |
| `GET` | `/api/analytics/positions/:position/skills` | Path `position`; query `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/skills/top` | `year`, `quarter`, `skill`, `limit` |
| `GET` | `/api/analytics/languages/top` | `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/skills/co-occurrence` | `skill`, `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/salaries/by-position` | `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder`; `sortBy`: `jobCount`, `averageSalary`, `averageExperience` |
| `GET` | `/api/analytics/salaries/by-experience` | `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/salaries/by-city` | `year`, `quarter`, `city`, `limit` |
| `GET` | `/api/analytics/salaries/by-skill` | `year`, `quarter`, `skill`, `limit`, `sortBy`, `sortOrder`; `sortBy`: `jobCount`, `averageSalary` |
| `GET` | `/api/analytics/locations` | `year`, `quarter`, `city`, `limit` |
| `GET` | `/api/analytics/locations/wards` | `city`, `ward`, `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/markets/cities` | `year`, `quarter`, `city`, `limit`, `sortBy`, `sortOrder`; `sortBy`: `jobCount`, `averageSalary`, `averageExperience`, `differentPositions` |
| `GET` | `/api/analytics/markets/cities/:city/positions` | Path `city`; query `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/companies/top` | `year`, `quarter`, `company`, `limit` |
| `GET` | `/api/analytics/companies/by-field` | `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/levels` | `year`, `quarter`, `level` |
| `GET` | `/api/analytics/levels/:level/skills` | Path `level`; query `year`, `quarter`, `limit` |
| `GET` | `/api/analytics/experience/by-position` | `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder`; `sortBy`: `jobCount`, `averageExperience` |
| `GET` | `/api/analytics/jobs/summary` | `year`, `quarter`, `month`, `fromDate`, `toDate`, `city`, `ward`, `skill`, `position`, `company`, `level`, `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax` |
| `GET` | `/api/analytics/jobs/breakdown` | Tất cả filter của `/jobs/summary` và `groupBy`; `groupBy` bắt buộc |

Ví dụ:

```bash
curl "http://localhost:3001/api/analytics/positions?year=2026&quarter=2&limit=5&sortBy=averageSalary&sortOrder=desc"
curl "http://localhost:3001/api/analytics/jobs/breakdown?groupBy=city&skill=ReactJS&salaryMin=15"
curl "http://localhost:3001/api/analytics/positions/Backend%20Developer/skills?limit=10"
```

## Filter đang dùng trên frontend

Frontend tách bộ lọc theo route để chỉ gửi những field phù hợp:

| Route key | Filter UI |
| --- | --- |
| `overview` | `year`, `quarter` |
| `trends` | `year`, `quarter` |
| `positions` | `year`, `quarter`, `position` |
| `skills` | `year`, `quarter`, `skill` |
| `salary` | `year`, `quarter`, `city`, `position`, `skill` |
| `location` | `year`, `quarter`, `city` |
| `company` | `year`, `quarter`, `company` |
| `level` | `year`, `quarter`, `level`, `position` |
| `jobs` | `year`, `quarter`, `city`, `level`, `position`, `skill`, `company`, `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax` |

## Ghi chú về chatbot

`POST /api/chat` dùng Gemini để lập plan truy vấn và sinh câu trả lời từ dữ liệu hiện có. Cần cấu hình `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` trong `backend/.env`.

Chatbot hỗ trợ các task nội bộ:

- `salary_aggregate`
- `top_skills`
- `breakdown`

Group nội bộ hợp lệ: `city`, `position`, `skill`, `company`, `level`.

## Thứ tự chạy để có dashboard đầy đủ

1. Tạo `JobCrawlDB`.
2. Cài Python dependencies.
3. Chạy `python crawl/main.py` để cào dữ liệu.
4. Cấu hình `env/.env`.
5. Chạy `python DataWareHouse/build_dw.py` để tạo `JobDW`.
6. Cấu hình và chạy backend bằng `npm run dev` trong `backend`.
7. Cấu hình và chạy frontend bằng `npm run dev` trong `frontend`.
8. Mở URL Vite và kiểm tra dashboard.

## Lệnh kiểm tra hữu ích

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Kiểm tra API:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/analytics/filters
```
