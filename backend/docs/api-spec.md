# Đặc tả API chính thức cho frontend

Tài liệu này là đặc tả chính thức cho frontend team sau khi `docs/api-proposal.md` đã được duyệt. Backend chỉ triển khai các API có trong tài liệu này, không thêm CRUD, không authentication/JWT, không đổi endpoint so với proposal.

## Quy tắc response field

API trả `success`, `message`, `data`, `error` theo format chung. Riêng các field bên trong `data` phải ưu tiên dùng tên cột/metric giống Data Warehouse, không alias sang tiếng Anh.

Ví dụ:

```json
{
  "success": true,
  "message": "Lấy phân tích địa điểm thành công",
  "data": [
    {
      "xepHang": 1,
      "tenThanhPho": "Hà Nội",
      "soTin": 2242,
      "luongTrungBinh": 21.07
    }
  ]
}
```


> Ghi chú cập nhật: Các JSON response schema và JSON response ví dụ phía dưới đã được map lại theo bảng mapping trong phần này. Query parameters, endpoint, path parameter và sortBy giữ nguyên theo đặc tả đã duyệt.

Mapping từ tên cũ sang tên response hiện tại:

| Tên cũ | Tên dùng trong response |
| --- | --- |
| `rank` | `xepHang` |
| `city` | `tenThanhPho` |
| `ward` | `tenPhuongXa` |
| `skill` | `tenKyNang` |
| `relatedSkill` | `tenKyNangLienQuan` |
| `language` | `ngonNgu` |
| `position` | `tenViTriChuan` |
| `company` | `tenCongTy` |
| `field` | `linhVuc` |
| `size` | `quyMo` |
| `level` | `tenCapBac` |
| `jobCount` | `soTin` |
| `jobsWithSalary` | `soTinCoLuong` |
| `averageSalary` | `luongTrungBinh` |
| `averageExperience` | `kinhNghiemTB` |
| `percentage` | `tyLe` hoặc `tyLeTheoTongTin` tùy bảng nguồn |
| `experienceGroup` | `nhomKinhNghiem` |
| `differentPositions` | `soViTriKhacNhau` |
| `companyCount` | `soCongTy` |
| `positionCount` | `soViTri` |
| `skillCount` | `soKyNang` |
| `group` | `nhom` |
| `quarterLabel` | `nhanQuy` |
| `year` | `nam` |
| `quarter` | `quy` |
| `month` | `thang` |
| `totalJobs` | `tongSoTin` |
| `totalCompanies` | `soCongTy` |
| `totalPositions` | `soViTri` |
| `totalSkills` | `soKyNang` |
| `topCity` | `thanhPhoNoiBat` |
| `topSkill` | `kyNangNoiBat` |
| `previousQuarterJobs` | `soTinQuyTruoc` |
| `change` | `bienDong` |
| `changePercent` | `phanTramThayDoi` |
| `minSalary` | `luongMin` |
| `maxSalary` | `luongMax` |

Query parameters vẫn giữ tên đã duyệt như `city`, `skill`, `position`, `sortBy`, `groupBy` để frontend gọi API thuận tiện. Chỉ field trong response `data` đổi về tên DB.

Nếu các phần mô tả chi tiết phía dưới nhắc lại tên cũ trong ngữ cảnh query parameter hoặc `sortBy`, frontend vẫn gọi request như đã duyệt; còn JSON trả về trong `data` và field dùng cho biểu đồ phải đọc theo mapping response ở bảng trên.

Base URL khi chạy local:

```text
http://localhost:3001
```

Response chuẩn khi thành công:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {}
}
```

Response chuẩn khi không có dữ liệu:

```json
{
  "success": true,
  "message": "Không có dữ liệu phù hợp",
  "data": []
}
```

Response chuẩn khi lỗi validate:

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "error": "Mô tả lỗi"
}
```

Response chuẩn khi lỗi server:

```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi xử lý yêu cầu",
  "error": "Chi tiết lỗi"
}
```

## Quy tắc validate chung

| Parameter | Kiểu dữ liệu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `year` | integer | Không | Không có | Nếu truyền phải là số nguyên từ 2000 đến 2100 |
| `quarter` | integer | Không | Không có | Nếu truyền chỉ nhận `1`, `2`, `3`, `4` |
| `month` | integer | Không | Không có | Nếu truyền chỉ nhận `1` đến `12` |
| `fromDate` | string date | Không | Không có | Định dạng `YYYY-MM-DD` |
| `toDate` | string date | Không | Không có | Định dạng `YYYY-MM-DD`, phải >= `fromDate` nếu có cả hai |
| `city` | string | Không | Không có | Trim, tối đa 200 ký tự |
| `ward` | string | Không | Không có | Trim, tối đa 200 ký tự |
| `skill` | string | Không | Không có | Trim, tối đa 200 ký tự |
| `position` | string | Không | Không có | Trim, tối đa 400 ký tự |
| `company` | string | Không | Không có | Trim, tối đa 400 ký tự |
| `level` | string | Không | Không có | Trim, tối đa 100 ký tự |
| `salaryMin` | number | Không | Không có | Nếu truyền phải >= 0 |
| `salaryMax` | number | Không | Không có | Nếu truyền phải >= 0 và >= `salaryMin` |
| `experienceMin` | number | Không | Không có | Nếu truyền phải >= 0 |
| `experienceMax` | number | Không | Không có | Nếu truyền phải >= 0 và >= `experienceMin` |
| `limit` | integer | Không | `10` | Số nguyên từ 1 đến 100 |
| `sortOrder` | string | Không | `desc` | Chỉ nhận `asc` hoặc `desc` |

## 1. Health Check

### 1.1. Kiểm tra backend

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/health` |
| Mục đích nghiệp vụ | Kiểm tra backend đang hoạt động, không lộ thông tin nhạy cảm |

Query parameters: Không có.

Ví dụ request:

```text
GET /api/health
```

Response thành công:

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

Response không có dữ liệu: Không áp dụng.

Ghi chú FE: Có thể dùng để hiển thị trạng thái kết nối API.

## 2. Dashboard Overview

### 2.1. Tổng quan dashboard

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/overview` |
| Mục đích nghiệp vụ | Lấy KPI tổng quan của thị trường tuyển dụng IT |

Query parameters:

| Parameter | Kiểu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `year` | integer | Không | Không có | Theo quy tắc chung |
| `quarter` | integer | Không | Không có | Theo quy tắc chung |
| `fromDate` | string date | Không | Không có | Theo quy tắc chung |
| `toDate` | string date | Không | Không có | Theo quy tắc chung |

Ví dụ request:

```text
GET /api/analytics/overview?year=2026&quarter=2
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy dữ liệu tổng quan thành công",
  "data": {
    "tongSoTin": "number",
    "soTinCoLuong": "number",
    "soCongTy": "number",
    "soViTri": "number",
    "soKyNang": "number",
    "luongTrungBinh": "number|null",
    "thanhPhoNoiBat": {
      "tenThanhPho": "string|null",
      "soTin": "number"
    },
    "kyNangNoiBat": {
      "tenKyNang": "string|null",
      "soTin": "number"
    }
  }
}
```

Response không có dữ liệu:

```json
{
  "success": true,
  "message": "Không có dữ liệu phù hợp",
  "data": {
    "tongSoTin": 0,
    "soTinCoLuong": 0,
    "soCongTy": 0,
    "soViTri": 0,
    "soKyNang": 0,
    "luongTrungBinh": null,
    "thanhPhoNoiBat": null,
    "kyNangNoiBat": null
  }
}
```

Response lỗi validate/server dùng format chuẩn ở đầu tài liệu.

Ví dụ JSON response:

```json
{
  "success": true,
  "message": "Lấy dữ liệu tổng quan thành công",
  "data": {
    "tongSoTin": 3611,
    "soTinCoLuong": 2187,
    "soCongTy": 1966,
    "soViTri": 136,
    "soKyNang": 108,
    "luongTrungBinh": 18.75,
    "thanhPhoNoiBat": {
      "tenThanhPho": "Hà Nội",
      "soTin": 2242
    },
    "kyNangNoiBat": {
      "tenKyNang": "Photoshop",
      "soTin": 749
    }
  }
}
```

Ghi chú FE: Dùng cho KPI cards. Không phải API biểu đồ chính.

### 2.2. Danh sách bộ lọc

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/filters` |
| Mục đích nghiệp vụ | Lấy danh sách option cho bộ lọc frontend |

Query parameters: Không có.

Ví dụ request:

```text
GET /api/analytics/filters
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy danh sách bộ lọc thành công",
  "data": {
    "nhanQuy": ["string"],
    "nam": ["number"],
    "tenThanhPho": ["string"],
    "tenCapBac": ["string"],
    "tenViTriChuan": ["string"],
    "tenKyNang": ["string"],
    "tenCongTy": ["string"]
  }
}
```

Response không có dữ liệu: Các mảng trả về rỗng.

Ghi chú FE: `tenCongTy` có thể dài; nên dùng combobox/searchable select.

## 3. Xu Hướng Tuyển Dụng

### 3.1. Xu hướng theo quý

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/trends/quarters` |
| Mục đích nghiệp vụ | Hiển thị số tin và biến động tuyển dụng theo quý |

Query parameters:

| Parameter | Kiểu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `year` | integer | Không | Không có | Theo quy tắc chung |
| `limit` | integer | Không | `10` | 1 đến 100 |

Ví dụ request:

```text
GET /api/analytics/trends/quarters?year=2026&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy xu hướng tuyển dụng theo quý thành công",
  "data": [
    {
      "nhanQuy": "string",
      "nam": "number",
      "quy": "number",
      "soTin": "number",
      "soTinCoLuong": "number",
      "luongTrungBinh": "number|null",
      "soTinQuyTruoc": "number|null",
      "bienDong": "number|null",
      "phanTramThayDoi": "number|null"
    }
  ]
}
```

Response không có dữ liệu: `data: []`.

Thông tin biểu đồ:

| Mục | Giá trị |
| --- | --- |
| Label | `nhanQuy` |
| Value | `soTin` |
| Trục X | `nhanQuy` |
| Trục Y | `soTin`, có thể thêm `soTinCoLuong` |
| Loại biểu đồ gợi ý | Line chart hoặc bar chart |
| Sort | Tăng dần theo `nam`, `quy` |
| Limit mặc định | 10 |

Ghi chú FE: Dữ liệu hiện chỉ có `Q2-2026`, nên chart có thể chỉ có một điểm.

### 3.2. Xu hướng theo tháng

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/trends/months` |
| Mục đích nghiệp vụ | Hiển thị số tin tuyển dụng theo tháng |

Query parameters:

| Parameter | Kiểu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `year` | integer | Không | Không có | Theo quy tắc chung |
| `quarter` | integer | Không | Không có | Theo quy tắc chung |

Ví dụ request:

```text
GET /api/analytics/trends/months?year=2026&quarter=2
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy xu hướng tuyển dụng theo tháng thành công",
  "data": [
    {
      "nam": "number",
      "thang": "number",
      "soTin": "number",
      "soTinCoLuong": "number",
      "luongTrungBinh": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `thang`, value `soTin`, trục X `thang`, trục Y `soTin`, gợi ý line/bar chart, sort tăng dần theo `nam`, `thang`.

## 4. Phân Tích Vị Trí

### 4.1. Danh sách vị trí

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/positions` |
| Mục đích nghiệp vụ | Xếp hạng vị trí hot, lương và kinh nghiệm trung bình |

Query parameters:

| Parameter | Kiểu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `year` | integer | Không | Không có | Theo quy tắc chung |
| `quarter` | integer | Không | Không có | Theo quy tắc chung |
| `position` | string | Không | Không có | Tối đa 400 ký tự |
| `limit` | integer | Không | `10` | 1 đến 100 |
| `sortBy` | string | Không | `jobCount` | `jobCount`, `averageSalary`, `averageExperience` |
| `sortOrder` | string | Không | `desc` | `asc`, `desc` |

Ví dụ request:

```text
GET /api/analytics/positions?year=2026&quarter=2&sortBy=jobCount&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy phân tích vị trí thành công",
  "data": [
    {
      "tenViTriChuan": "string",
      "soTin": "number",
      "soTinCoLuong": "number",
      "luongTrungBinh": "number|null",
      "luongMin": "number|null",
      "luongMax": "number|null",
      "kinhNghiemTB": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `tenViTriChuan`, value `soTin`, trục X `tenViTriChuan`, trục Y `soTin` hoặc `luongTrungBinh`, gợi ý horizontal bar chart, sort theo `sortBy`, limit mặc định 10.

### 4.2. Kỹ năng theo vị trí

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/positions/:position/skills` |
| Mục đích nghiệp vụ | Xem kỹ năng phổ biến trong một vị trí |

Path parameter:

| Parameter | Kiểu | Bắt buộc | Validate |
| --- | --- | --- | --- |
| `position` | string | Có | Tối đa 400 ký tự |

Query parameters:

| Parameter | Kiểu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `year` | integer | Không | Không có | Theo quy tắc chung |
| `quarter` | integer | Không | Không có | Theo quy tắc chung |
| `limit` | integer | Không | `10` | 1 đến 100 |

Ví dụ request:

```text
GET /api/analytics/positions/Backend%20Developer/skills?year=2026&quarter=2
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy kỹ năng theo vị trí thành công",
  "data": {
    "tenViTriChuan": "string",
    "kyNang": [
      {
        "tenKyNang": "string",
        "soTin": "number",
        "tyLe": "number"
      }
    ]
  }
}
```

Thông tin biểu đồ: label `tenKyNang`, value `soTin`, trục X `tenKyNang`, trục Y `soTin`, gợi ý bar chart, sort giảm dần theo `soTin`, limit mặc định 10.

## 5. Kỹ Năng Và Ngôn Ngữ

### 5.1. Top kỹ năng

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/skills/top` |
| Mục đích nghiệp vụ | Xem kỹ năng được yêu cầu nhiều nhất |

Query parameters: `year`, `quarter`, `skill`, `limit`.

Ví dụ request:

```text
GET /api/analytics/skills/top?year=2026&quarter=2&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy top kỹ năng thành công",
  "data": [
    {
      "xepHang": "number",
      "tenKyNang": "string",
      "soTin": "number",
      "tyLeTheoTongTin": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `tenKyNang`, value `soTin`, trục X `tenKyNang`, trục Y `soTin`, gợi ý horizontal bar chart, sort theo `xepHang` tăng dần hoặc `soTin` giảm dần, limit mặc định 10.

### 5.2. Top ngôn ngữ lập trình

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/languages/top` |
| Mục đích nghiệp vụ | Xem ngôn ngữ lập trình được yêu cầu nhiều nhất |

Query parameters: `year`, `quarter`, `limit`.

Ví dụ request:

```text
GET /api/analytics/languages/top?year=2026&quarter=2&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy top ngôn ngữ lập trình thành công",
  "data": [
    {
      "xepHang": "number",
      "ngonNgu": "string",
      "soTin": "number",
      "tyLeTheoTongTin": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `ngonNgu`, value `soTin`, trục X `ngonNgu`, trục Y `soTin`, gợi ý bar chart, sort theo `xepHang`, limit mặc định 10.

### 5.3. Kỹ năng thường đi kèm

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/skills/co-occurrence` |
| Mục đích nghiệp vụ | Xem các kỹ năng thường xuất hiện cùng nhau |

Query parameters: `skill`, `year`, `quarter`, `limit`.

Ví dụ request:

```text
GET /api/analytics/skills/co-occurrence?skill=Docker&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy kỹ năng thường đi kèm thành công",
  "data": [
    {
      "tenKyNang": "string",
      "tenKyNangLienQuan": "string",
      "soTin": "number"
    }
  ]
}
```

Thông tin biểu đồ: label `tenKyNangLienQuan`, value `soTin`, trục X `tenKyNangLienQuan`, trục Y `soTin`, gợi ý network chart hoặc bar chart, sort giảm dần theo `soTin`, limit mặc định 10.

## 6. Phân Tích Lương

### 6.1. Lương theo vị trí

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/salaries/by-position` |
| Mục đích nghiệp vụ | So sánh lương theo vị trí |

Query parameters: `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder`. `sortBy` nhận `jobCount`, `averageSalary`, `averageExperience`.

Ví dụ request:

```text
GET /api/analytics/salaries/by-position?sortBy=averageSalary&limit=10
```

Response schema thành công giống `/api/analytics/positions`.

Thông tin biểu đồ: label `tenViTriChuan`, value `luongTrungBinh`, trục X `tenViTriChuan`, trục Y `luongTrungBinh`, gợi ý bar chart, sort theo `sortBy`, limit mặc định 10.

### 6.2. Lương theo kinh nghiệm

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/salaries/by-experience` |
| Mục đích nghiệp vụ | So sánh lương theo nhóm kinh nghiệm |

Query parameters: `year`, `quarter`, `limit`.

Ví dụ request:

```text
GET /api/analytics/salaries/by-experience?year=2026&quarter=2
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy lương theo kinh nghiệm thành công",
  "data": [
    {
      "nhomKinhNghiem": "string",
      "soTin": "number",
      "soTinCoLuong": "number",
      "luongTrungBinh": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `nhomKinhNghiem`, value `luongTrungBinh`, trục X `nhomKinhNghiem`, trục Y `luongTrungBinh`, gợi ý bar chart, sort theo thứ tự nhóm trong dữ liệu aggregate, limit mặc định 10.

### 6.3. Lương theo thành phố

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/salaries/by-city` |
| Mục đích nghiệp vụ | So sánh lương trung bình theo thành phố |

Query parameters: `year`, `quarter`, `city`, `limit`.

Ví dụ request:

```text
GET /api/analytics/salaries/by-city?limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy lương theo thành phố thành công",
  "data": [
    {
      "tenThanhPho": "string",
      "soTin": "number",
      "luongTrungBinh": "number|null",
      "xepHang": "number"
    }
  ]
}
```

Thông tin biểu đồ: label `tenThanhPho`, value `luongTrungBinh`, trục X `tenThanhPho`, trục Y `luongTrungBinh`, gợi ý bar chart, sort theo `xepHang`, limit mặc định 10.

### 6.4. Lương theo kỹ năng

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/salaries/by-skill` |
| Mục đích nghiệp vụ | Ước lượng lương trung bình theo kỹ năng |

Query parameters: `year`, `quarter`, `skill`, `limit`, `sortBy`, `sortOrder`. `sortBy` nhận `jobCount`, `averageSalary`.

Ví dụ request:

```text
GET /api/analytics/salaries/by-skill?skill=Python&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy lương theo kỹ năng thành công",
  "data": [
    {
      "tenKyNang": "string",
      "soTin": "number",
      "soTinCoLuong": "number",
      "luongTrungBinh": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `tenKyNang`, value `luongTrungBinh`, trục X `tenKyNang`, trục Y `luongTrungBinh`, gợi ý bar chart, sort theo `sortBy`, limit mặc định 10.

## 7. Địa Điểm Và Thị Trường

### 7.1. Địa điểm tuyển dụng

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/locations` |
| Mục đích nghiệp vụ | Xếp hạng thành phố tuyển dụng nhiều |

Query parameters: `year`, `quarter`, `city`, `limit`.

Ví dụ request:

```text
GET /api/analytics/locations?limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy phân tích địa điểm thành công",
  "data": [
    {
      "xepHang": "number",
      "tenThanhPho": "string",
      "soTin": "number",
      "luongTrungBinh": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `tenThanhPho`, value `soTin`, trục X `tenThanhPho`, trục Y `soTin`, gợi ý bar chart hoặc map chart, sort theo `xepHang`, limit mặc định 10.

### 7.2. Phường/xã

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/locations/wards` |
| Mục đích nghiệp vụ | Drill-down địa điểm theo phường/xã |

Query parameters: `city`, `ward`, `year`, `quarter`, `limit`.

Ví dụ request:

```text
GET /api/analytics/locations/wards?city=H%C3%A0%20N%E1%BB%99i&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy phân tích phường xã thành công",
  "data": [
    {
      "tenThanhPho": "string",
      "tenPhuongXa": "string|null",
      "soTin": "number"
    }
  ]
}
```

Thông tin biểu đồ: label `tenPhuongXa`, value `soTin`, trục X `tenPhuongXa`, trục Y `soTin`, gợi ý bar chart, sort giảm dần theo `soTin`, limit mặc định 10.

### 7.3. So sánh thị trường thành phố

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/markets/cities` |
| Mục đích nghiệp vụ | So sánh thị trường giữa các thành phố |

Query parameters: `year`, `quarter`, `city`, `limit`, `sortBy`, `sortOrder`. `sortBy` nhận `jobCount`, `averageSalary`, `averageExperience`, `differentPositions`.

Ví dụ request:

```text
GET /api/analytics/markets/cities?sortBy=jobCount&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy so sánh thị trường theo thành phố thành công",
  "data": [
    {
      "tenThanhPho": "string",
      "soTin": "number",
      "luongTrungBinh": "number|null",
      "kinhNghiemTB": "number|null",
      "soViTriKhacNhau": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `tenThanhPho`, value `soTin`, trục X `tenThanhPho`, trục Y có thể là `soTin`, `luongTrungBinh`, `kinhNghiemTB`, gợi ý grouped bar chart, sort theo `sortBy`, limit mặc định 10.

## 8. Công Ty

### 8.1. Top công ty tuyển dụng

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/companies/top` |
| Mục đích nghiệp vụ | Xếp hạng công ty tuyển nhiều nhất |

Query parameters: `year`, `quarter`, `company`, `limit`.

Ví dụ request:

```text
GET /api/analytics/companies/top?limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy top công ty tuyển dụng thành công",
  "data": [
    {
      "xepHang": "number",
      "tenCongTy": "string",
      "linhVuc": "string|null",
      "quyMo": "string|null",
      "soTin": "number"
    }
  ]
}
```

Thông tin biểu đồ: label `tenCongTy`, value `soTin`, trục X `tenCongTy`, trục Y `soTin`, gợi ý horizontal bar chart, sort theo `xepHang`, limit mặc định 10.

### 8.2. Công ty theo lĩnh vực

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/companies/by-field` |
| Mục đích nghiệp vụ | So sánh số tin và số công ty theo lĩnh vực |

Query parameters: `year`, `quarter`, `limit`.

Ví dụ request:

```text
GET /api/analytics/companies/by-field?limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy phân tích công ty theo lĩnh vực thành công",
  "data": [
    {
      "linhVuc": "string",
      "soCongTy": "number",
      "soTin": "number"
    }
  ]
}
```

Thông tin biểu đồ: label `linhVuc`, value `soTin`, trục X `linhVuc`, trục Y `soTin`, gợi ý bar chart, sort giảm dần theo `soTin`, limit mặc định 10.

## 9. Cấp Bậc Và Kinh Nghiệm

### 9.1. Phân bố cấp bậc

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/levels` |
| Mục đích nghiệp vụ | Xem tỷ lệ tuyển dụng theo cấp bậc |

Query parameters: `year`, `quarter`, `level`.

Ví dụ request:

```text
GET /api/analytics/levels?year=2026&quarter=2
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy phân tích cấp bậc thành công",
  "data": [
    {
      "tenCapBac": "string",
      "soTin": "number",
      "tyLe": "number"
    }
  ]
}
```

Thông tin biểu đồ: label `tenCapBac`, value `tyLe` hoặc `soTin`, trục X `tenCapBac`, trục Y `soTin`, gợi ý pie chart hoặc bar chart, sort giảm dần theo `soTin`.

### 9.2. Kinh nghiệm theo vị trí

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/experience/by-position` |
| Mục đích nghiệp vụ | So sánh kinh nghiệm trung bình theo vị trí |

Query parameters: `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder`. `sortBy` nhận `jobCount`, `averageExperience`.

Ví dụ request:

```text
GET /api/analytics/experience/by-position?sortBy=averageExperience&limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy kinh nghiệm theo vị trí thành công",
  "data": [
    {
      "tenViTriChuan": "string",
      "soTin": "number",
      "kinhNghiemTB": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `tenViTriChuan`, value `kinhNghiemTB`, trục X `tenViTriChuan`, trục Y `kinhNghiemTB`, gợi ý bar chart, sort theo `sortBy`, limit mặc định 10.

### 9.3. Kỹ năng theo cấp bậc

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/levels/:level/skills` |
| Mục đích nghiệp vụ | Xem kỹ năng phổ biến theo cấp bậc |

Path parameter: `level` string, bắt buộc, tối đa 100 ký tự.

Query parameters: `year`, `quarter`, `limit`.

Ví dụ request:

```text
GET /api/analytics/levels/Senior/skills?limit=10
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy kỹ năng theo cấp bậc thành công",
  "data": {
    "tenCapBac": "string",
    "kyNang": [
      {
        "tenKyNang": "string",
        "soTin": "number",
        "tyLe": "number"
      }
    ]
  }
}
```

Thông tin biểu đồ: label `tenKyNang`, value `soTin`, trục X `tenKyNang`, trục Y `soTin`, gợi ý bar chart, sort giảm dần theo `soTin`, limit mặc định 10.

## 10. Bộ Lọc Tổng Hợp

### 10.1. Thống kê theo bộ lọc

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/jobs/summary` |
| Mục đích nghiệp vụ | Tổng hợp KPI sau khi người dùng áp dụng nhiều filter |

Query parameters: `year`, `quarter`, `month`, `fromDate`, `toDate`, `city`, `ward`, `skill`, `position`, `company`, `level`, `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax`.

Ví dụ request:

```text
GET /api/analytics/jobs/summary?city=H%C3%A0%20N%E1%BB%99i&skill=Python
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy thống kê theo bộ lọc thành công",
  "data": {
    "soTin": "number",
    "soTinCoLuong": "number",
    "luongTrungBinh": "number|null",
    "kinhNghiemTB": "number|null",
    "soCongTy": "number",
    "soViTri": "number",
    "soKyNang": "number"
  }
}
```

Ghi chú FE: Dùng cho KPI cards sau filter, không phải danh sách bài đăng chi tiết vì DW không có title/link.

### 10.2. Phân rã thống kê

| Mục | Nội dung |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/analytics/jobs/breakdown` |
| Mục đích nghiệp vụ | Phân rã dữ liệu theo một chiều động để vẽ chart |

Query parameters:

| Parameter | Kiểu | Bắt buộc | Mặc định | Validate |
| --- | --- | --- | --- | --- |
| `groupBy` | string | Có | Không có | `quarter`, `month`, `city`, `ward`, `skill`, `position`, `company`, `level` |
| Các filter khác | mixed | Không | Không có | Theo quy tắc chung |

Ví dụ request:

```text
GET /api/analytics/jobs/breakdown?groupBy=city&skill=Python
```

Response schema thành công:

```json
{
  "success": true,
  "message": "Lấy phân rã thống kê thành công",
  "data": [
    {
      "nhom": "string",
      "soTin": "number",
      "soTinCoLuong": "number",
      "luongTrungBinh": "number|null"
    }
  ]
}
```

Thông tin biểu đồ: label `nhom`, value `soTin`, trục X `nhom`, trục Y `soTin` hoặc `luongTrungBinh`, gợi ý bar chart/line chart tùy `groupBy`, sort giảm dần theo `soTin` trừ `month` và `quarter` sort theo thời gian.

## 11. Response lỗi áp dụng cho mọi API

Lỗi validate:

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "error": "quarter chỉ được nhận giá trị từ 1 đến 4"
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

404:

```json
{
  "success": false,
  "message": "Không tìm thấy API yêu cầu"
}
```
