# 🕷️ TopCV IT Job Crawler

Hệ thống **crawl tự động** dữ liệu tin tuyển dụng ngành **Công nghệ Thông tin** từ [TopCV.vn](https://www.topcv.vn), lưu trữ vào cơ sở dữ liệu **SQL Server** theo mô hình quan hệ chuẩn hóa.

> **Bài tập lớn môn Hệ Quản Trị Cơ Sở Dữ Liệu**

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Chi tiết kỹ thuật](#-chi-tiết-kỹ-thuật)

---

## 🎯 Tổng quan

Hệ thống thực hiện:

1. **Crawl đa luồng** — Sử dụng 5 luồng song song để thu thập dữ liệu từ TopCV, mỗi luồng phụ trách các trang xen kẽ (luồng 1 → trang 1, 6, 11...; luồng 2 → trang 2, 7, 12...).
2. **Trích xuất thông tin** — Phân tích HTML để lấy: tiêu đề, mức lương, kinh nghiệm, kỹ năng yêu cầu, cấp bậc, vị trí công việc, công ty, địa điểm, hạn nộp.
3. **Chuẩn hóa dữ liệu** — Tự động chuẩn hóa cấp bậc (Intern, Fresher, Junior, ...), chuyển đổi lương về đơn vị triệu VND (hỗ trợ cả USD), phát hiện kỹ năng từ 70+ keyword.
4. **Lưu trữ quan hệ** — Dữ liệu được lưu vào SQL Server với schema chuẩn hóa gồm 7 bảng, quan hệ N-N qua bảng trung gian.
5. **Dọn dẹp tự động** — Xóa tin hết hạn, kiểm tra URL tin bị gỡ trên TopCV, dọn bản ghi mồ côi.

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                     main.py                         │
│  ┌───────────┐ ┌───────────┐     ┌───────────┐     │
│  │ Thread 1  │ │ Thread 2  │ ... │ Thread 5  │     │
│  │ Page 1,6..│ │ Page 2,7..│     │ Page 5,10.│     │
│  └─────┬─────┘ └─────┬─────┘     └─────┬─────┘     │
│        │              │                 │           │
│        ▼              ▼                 ▼           │
│  ┌─────────────────────────────────────────────┐    │
│  │         Selenium + BeautifulSoup            │    │
│  │  (Undetected ChromeDriver anti-bot bypass)  │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                               │
│                     ▼                               │
│  ┌─────────────────────────────────────────────┐    │
│  │          Data Parsing & Normalization        │    │
│  │  • Salary → triệu VND (USD/VND support)     │    │
│  │  • Level normalization (8 cấp bậc)           │    │
│  │  • Skill detection (70+ keywords)            │    │
│  └──────────────────┬──────────────────────────┘    │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  database.py                        │
│  ┌─────────────────────────────────────────────┐    │
│  │           TopCVDatabase (pyodbc)             │    │
│  │  • Thread-safe (threading.Lock)              │    │
│  │  • Auto-create schema                        │    │
│  │  • UPSERT pattern (IF NOT EXISTS)            │    │
│  └──────────────────┬──────────────────────────┘    │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              SQL Server (JobCrawlDB)                │
│                                                     │
│  CongTy ──┐                                        │
│  CapBac ──┤── TinTuyenDung ──┬── TinTuyenDung_KyNang ── KyNang  │
│  ViTri ───┘                  └── TinTuyenDung_DiaDiem ── DiaDiem │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Cơ sở dữ liệu

### Sơ đồ ERD

```
┌──────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│    CongTy        │     │     TinTuyenDung          │     │ CapBacCongViec   │
├──────────────────┤     ├──────────────────────────┤     ├──────────────────┤
│ congTyId (PK)    │◄───┐│ tinTuyenDungId (PK)      │┌───►│ capBacId (PK)    │
│ tenCongTy        │    ││ linkBaiDang (UNIQUE)      ││    │ tenCapBac        │
│ linkCongTy       │    ││ tieuDeCongViec            ││    └──────────────────┘
│ linhVuc          │    ││ luongMin, luongMax        ││
│ quyMo            │    ││ soNamKinhNghiem           ││    ┌──────────────────┐
└──────────────────┘    ││ hanNopHoSo                ││    │ ViTriCongViec    │
                        ││ thoiDiemThuThap           ││    ├──────────────────┤
                        │├─ congTyId (FK) ───────────┘├───►│ viTriId (PK)     │
                        │├─ capBacId (FK) ────────────┘    │ tenViTriChuan    │
                        │├─ viTriId (FK) ──────────────┘   └──────────────────┘
                        │└──────────────────────────┘
                        │        │               │
                        │        ▼               ▼
                        │  ┌───────────┐  ┌────────────┐
                        │  │ TTD_KyNang│  │ TTD_DiaDiem│
                        │  ├───────────┤  ├────────────┤
                        │  │ tinTD_Id  │  │ tinTD_Id   │
                        │  │ kyNangId  │  │ diaDiemId  │
                        │  └─────┬─────┘  └──────┬─────┘
                        │        │               │
                        │        ▼               ▼
                        │  ┌───────────┐  ┌────────────┐
                        │  │  KyNang   │  │  DiaDiem   │
                        │  ├───────────┤  ├────────────┤
                        │  │ kyNangId  │  │ diaDiemId  │
                        │  │ tenKyNang │  │ tenTP      │
                        │  └───────────┘  │ tenPX      │
                        │                 └────────────┘
```

### Danh sách bảng

| Bảng | Mô tả | Khóa chính |
|------|--------|------------|
| `CongTy` | Thông tin công ty (tên, link, lĩnh vực, quy mô) | `congTyId` |
| `CapBacCongViec` | Cấp bậc công việc (Intern → Manager) | `capBacId` |
| `ViTriCongViec` | Vị trí/chuyên môn công việc | `viTriId` |
| `KyNang` | Danh sách kỹ năng (Python, Java, Docker...) | `kyNangId` |
| `DiaDiem` | Địa điểm (thành phố + phường/xã) | `diaDiemId` |
| `TinTuyenDung` | Tin tuyển dụng (fact table chính) | `tinTuyenDungId` |
| `TinTuyenDung_KyNang` | Quan hệ N-N giữa tin và kỹ năng | `(tinTuyenDungId, kyNangId)` |
| `TinTuyenDung_DiaDiem` | Quan hệ N-N giữa tin và địa điểm | `(tinTuyenDungId, diaDiemId)` |

---

## ⚙️ Cài đặt

### Yêu cầu hệ thống

- **Python** 3.8+
- **Google Chrome** (phiên bản 148)
- **SQL Server** (LocalDB hoặc Express) với ODBC Driver 18
- **Windows** (khuyến nghị — do dùng Windows Authentication)

### Cài đặt dependencies

```bash
pip install undetected-chromedriver selenium beautifulsoup4 pyodbc
```

### Cấu hình Database

1. Đảm bảo SQL Server đang chạy trên `localhost`
2. Tạo database `JobCrawlDB`:

```sql
CREATE DATABASE JobCrawlDB;
```

3. Hệ thống sẽ **tự động tạo toàn bộ bảng** khi chạy lần đầu (sử dụng Windows Authentication / Trusted Connection).

---

## 🚀 Sử dụng

### Chế độ Crawl (Thu thập dữ liệu)

```bash
python main.py
```

- Khởi chạy **5 luồng** song song, mỗi luồng mở 1 cửa sổ Chrome
- Tự động crawl tất cả tin tuyển dụng IT trên TopCV
- Bỏ qua tin đã có trong database (kiểm tra `linkBaiDang`)
- Tự phát hiện trang cuối (redirect detection, duplicate link detection)
- Tự khởi động lại Chrome khi gặp lỗi (tối đa 10 lần restart/luồng)
- ⏱️ Thời gian chạy ước tính: **2–3 giờ** cho toàn bộ dữ liệu

### Chế độ Dọn dẹp (Cleanup)

```bash
python main.py --cleanup
```

Thực hiện 3 bước:

| Bước | Mô tả |
|------|--------|
| 1 | **Xóa tin hết hạn** — So sánh `hanNopHoSo` với ngày hiện tại |
| 2 | **Xóa tin bị gỡ** — Truy cập URL trên TopCV, kiểm tra 404/redirect (xác nhận 3 lần trước khi xóa) |
| 3 | **Dọn bản ghi mồ côi** — Xóa KyNang, DiaDiem, CongTy... không còn tin nào tham chiếu |

---

## 📁 Cấu trúc thư mục

```
.
├── main.py            # Crawler chính (đa luồng, Selenium + BS4)
├── database.py        # Module database (pyodbc, SQL Server)
├── crawler.log        # Log chi tiết quá trình crawl
├── .gitignore         # Ignore __pycache__
└── README.md          # Tài liệu hướng dẫn
```

---

## 🔧 Chi tiết kỹ thuật

### Anti-Bot Bypass

- Sử dụng **undetected-chromedriver** để bypass hệ thống chống bot của TopCV
- Random delay giữa các request (7–10s chi tiết, 3–5s cleanup)
- Retry thông minh khi gặp CAPTCHA/anti-bot (tối đa 3 lần, tăng dần thời gian chờ)

### Chuẩn hóa lương

Hỗ trợ tự động chuyển đổi về đơn vị **triệu VND**:

| Định dạng đầu vào | Kết quả (triệu VND) |
|-------------------|---------------------|
| `10 - 15 triệu` | 10, 15 |
| `1,000 - 2,000 USD` | 25, 50 |
| `500 - 1000 $` | 12.5, 25 |
| `10,000,000 - 15,000,000` | 10, 15 |
| `Thỏa thuận` | 0, 0 |

### Chuẩn hóa cấp bậc

```
Intern → Intern
Fresher / Entry Level → Fresher
Junior → Junior
Middle / Mid-level → Middle
Senior → Senior
Lead / Tech Lead / Team Lead → Lead
Manager / Director → Manager
(Mặc định) → Nhân viên
```

### Phát hiện kỹ năng

Hệ thống tự động phát hiện **70+ kỹ năng** từ phần yêu cầu công việc, bao gồm:

- **Ngôn ngữ**: Python, Java, JavaScript, C++, Go, Rust, ...
- **Frontend**: ReactJS, Vue.js, Angular, Next.js, ...
- **Backend**: Node.js, Django, Spring Boot, Laravel, ...
- **Database**: MySQL, PostgreSQL, MongoDB, Redis, ...
- **DevOps**: Docker, Kubernetes, CI/CD, AWS, Azure, ...
- **AI/ML**: TensorFlow, PyTorch, Machine Learning, ...

### Thread Safety

- `threading.Lock` bảo vệ toàn bộ thao tác ghi database
- `init_lock` đồng bộ hóa việc khởi tạo Chrome driver
- Pattern `try/finally` đảm bảo connection luôn được đóng

---

## 📊 Logging

Toàn bộ quá trình crawl được ghi vào file `crawler.log` và hiển thị trên console:

```
2026-06-05 10:30:15 [Thread-1] INFO: [LUỒNG 1] TRANG 1
2026-06-05 10:30:25 [Thread-1] INFO: [Luồng 1] ✓ Tuyển Java Developer - HCM
2026-06-05 10:30:30 [Thread-2] WARNING: [Luồng 2] ⚠ Trang 2 trống, thử lại lần 1/3...
```

---

## ⚠️ Lưu ý

- Hệ thống **chưa có cronjob** — cần chạy thủ công mỗi khi muốn cập nhật dữ liệu
- Phiên bản Chrome cần khớp với `version_main=148` trong code
- Cần chạy trên máy có cài đặt **SQL Server** và đã tạo database `JobCrawlDB`
- Quá trình crawl mở nhiều cửa sổ Chrome, cần đủ RAM (~4GB trở lên khuyến nghị)

---

## 👥 Tác giả

Bài tập lớn môn **Hệ Quản Trị Cơ Sở Dữ Liệu**

---
