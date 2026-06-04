# Đề xuất API phân tích JobDW

## 1. Nguyên tắc thiết kế

API được đề xuất cho backend Node.js Express đọc dữ liệu từ SQL Server Data Warehouse `JobDW`. Mục tiêu là phục vụ dashboard phân tích thị trường tuyển dụng IT tại Việt Nam, không phải hệ thống CRUD.

Các nguyên tắc bắt buộc:

- Main backend file sau khi triển khai là `server.js`.
- Tất cả response message trả về frontend phải bằng tiếng Việt.
- Không triển khai login, register, JWT, authentication hoặc authorization.
- Không tạo CRUD endpoint cho từng bảng.
- Không dùng fake data, mock database hoặc schema tự suy diễn.
- Query phải dùng parameterized SQL, không nối trực tiếp input người dùng vào SQL.
- Chỉ đề xuất API dựa trên schema thật: `FactTuyenDung`, các bảng `Dim*`, bridge tables và các bảng `Agg*`.
- Bảng `FactTuyenDung_Backup_BeforeSalaryFix` không được dùng cho API dashboard.

Response format dự kiến:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": []
}
```

Khi không có dữ liệu:

```json
{
  "success": true,
  "message": "Không có dữ liệu phù hợp",
  "data": []
}
```

Khi tham số không hợp lệ:

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "error": "Năm phải là số nguyên dương"
}
```

## 2. Tham số lọc chung

Các endpoint analytics có thể hỗ trợ một phần hoặc toàn bộ các tham số sau, tùy bảng nguồn:

| Tham số | Kiểu | Ghi chú validate |
| --- | --- | --- |
| `year` | integer | Năm, ví dụ `2026` |
| `quarter` | integer | Chỉ nhận `1`, `2`, `3`, `4` |
| `month` | integer | Chỉ nhận `1` đến `12`, dùng khi truy vấn từ `DimThoiGian` |
| `fromDate` | date | ISO date, ví dụ `2026-05-14` |
| `toDate` | date | ISO date, phải >= `fromDate` |
| `city` | string | So khớp với `DimDiaDiem.tenThanhPho` hoặc aggregate city |
| `ward` | string | Chỉ dùng endpoint truy vấn từ `DimDiaDiem.tenPhuongXa` |
| `skill` | string | So khớp với `DimKyNang.tenKyNang` |
| `position` | string | So khớp với `DimViTri.tenViTriChuan` |
| `company` | string | So khớp với `DimCongTy.tenCongTy` |
| `level` | string | So khớp với `DimCapBac.tenCapBac` |
| `salaryMin` | number | Lọc trên `FactTuyenDung.luongTrungBinh`, chỉ nên áp dụng với `coLuong = 1` |
| `salaryMax` | number | Phải >= `salaryMin` nếu có cả hai |
| `experienceMin` | number | Lọc trên `FactTuyenDung.soNamKinhNghiem` |
| `experienceMax` | number | Phải >= `experienceMin` nếu có cả hai |
| `limit` | integer | Mặc định 10 hoặc 20, tối đa đề xuất 100 |
| `page` | integer | Số nguyên dương, dùng endpoint dạng danh sách |
| `pageSize` | integer | Số nguyên dương, tối đa đề xuất 100 |
| `sortBy` | string | Phải whitelist theo từng endpoint |
| `sortOrder` | string | Chỉ nhận `asc` hoặc `desc` |

## 3. Nhóm health check

### 3.1. `GET /api/health`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Xác nhận backend đang chạy, không lộ thông tin nhạy cảm |
| Bảng dùng | Không dùng bảng |
| Query params | Không có |
| Main joins | Không có |
| Metric trả về | `status`, `timestamp` |
| Ghi chú | Không yêu cầu authentication |

Ví dụ response:

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

## 4. Nhóm dashboard overview

### 4.1. `GET /api/analytics/overview`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Cung cấp KPI tổng quan cho dashboard thị trường tuyển dụng IT |
| Query params | `year`, `quarter`, `fromDate`, `toDate` |
| Bảng dùng | `FactTuyenDung`, `DimThoiGian`, `DimCongTy`, `DimViTri`, `DimKyNang`, `FactTuyenDung_KyNang`, `DimDiaDiem`, `FactTuyenDung_DiaDiem` |
| Main joins | `FactTuyenDung.thoiGianId -> DimThoiGian.thoiGianId`; bridge kỹ năng/địa điểm để lấy top skill/city |
| Metric trả về | Tổng số tin, số tin có lương, tổng công ty, tổng vị trí, tổng kỹ năng, lương trung bình, thành phố tuyển nhiều nhất, kỹ năng được yêu cầu nhiều nhất |
| Notes | Lương trung bình chỉ tính trên `coLuong = 1`; dữ liệu hiện chỉ có `Q2-2026` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy dữ liệu tổng quan thành công",
  "data": {
    "totalJobs": 3611,
    "jobsWithSalary": 2187,
    "totalCompanies": 1966,
    "totalPositions": 136,
    "totalSkills": 108,
    "averageSalary": 18.75,
    "topCity": {
      "city": "Hà Nội",
      "jobCount": 2242
    },
    "topSkill": {
      "skill": "Photoshop",
      "jobCount": 749
    }
  }
}
```

### 4.2. `GET /api/analytics/filters`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Cung cấp danh sách option cho frontend filter |
| Query params | Không có |
| Bảng dùng | `DimThoiGian`, `DimViTri`, `DimCapBac`, `DimCongTy`, `DimDiaDiem`, `DimKyNang` |
| Main joins | Không cần join |
| Metric trả về | Danh sách năm/quý, vị trí, cấp bậc, công ty, thành phố, kỹ năng |
| Notes | Không trả link công ty vì `DimCongTy` không có `linkCongTy` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy danh sách bộ lọc thành công",
  "data": {
    "quarters": ["Q2-2026"],
    "cities": ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng"],
    "levels": ["Nhân viên", "Senior", "Junior"],
    "positions": ["Backend Developer", "Business Analyst (Phân tích nghiệp vụ)"],
    "skills": ["Python", "Java", "Docker"]
  }
}
```

## 5. Nhóm xu hướng tuyển dụng

### 5.1. `GET /api/analytics/trends/quarters`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Trả số tin tuyển dụng, số tin có lương và biến động theo quý |
| Query params | `year`, `limit` |
| Bảng dùng | Ưu tiên `AggXuHuongTheoQuy`; có thể fallback `FactTuyenDung` + `DimThoiGian` |
| Main joins | Không cần join nếu dùng aggregate; fallback join `FactTuyenDung.thoiGianId -> DimThoiGian.thoiGianId` |
| Metric trả về | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `soTinQuyTruoc`, `bienDong`, `phanTramThayDoi` |
| Notes | Hiện `AggXuHuongTheoQuy` chỉ có 1 dòng `Q2-2026`, nên biến động quý trước có thể null |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy xu hướng tuyển dụng theo quý thành công",
  "data": [
    {
      "quarterLabel": "Q2-2026",
      "year": 2026,
      "quarter": 2,
      "jobCount": 3611,
      "jobsWithSalary": 2187,
      "averageSalary": 18.75,
      "previousQuarterJobs": null,
      "change": null,
      "changePercent": null
    }
  ]
}
```

### 5.2. `GET /api/analytics/trends/months`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Trả số tin tuyển dụng theo tháng để frontend hiển thị trend chi tiết hơn quý |
| Query params | `year`, `quarter` |
| Bảng dùng | `FactTuyenDung`, `DimThoiGian` |
| Main joins | `FactTuyenDung.thoiGianId -> DimThoiGian.thoiGianId` |
| Metric trả về | `nam`, `thang`, `soTin`, `soTinCoLuong`, `luongTrungBinh` |
| Notes | Không có bảng aggregate theo tháng, nên endpoint này cần query từ fact |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy xu hướng tuyển dụng theo tháng thành công",
  "data": [
    {
      "year": 2026,
      "month": 5,
      "jobCount": 3611,
      "jobsWithSalary": 2187,
      "averageSalary": 18.75
    }
  ]
}
```

## 6. Nhóm phân tích vị trí

### 6.1. `GET /api/analytics/positions`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Xác định vị trí đang tuyển nhiều, lương trung bình và kinh nghiệm trung bình theo vị trí |
| Query params | `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder` |
| Bảng dùng | Ưu tiên `AggLuongTheoViTri`; có thể dùng `FactTuyenDung` + `DimViTri` khi cần filter sâu |
| Main joins | Aggregate không cần join; fact join `FactTuyenDung.viTriId -> DimViTri.viTriId` |
| Metric trả về | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `luongMin`, `luongMax`, `kinhNghiemTB` |
| Notes | `sortBy` whitelist: `jobCount`, `averageSalary`, `averageExperience` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy phân tích vị trí thành công",
  "data": [
    {
      "position": "Backend Developer",
      "jobCount": 103,
      "jobsWithSalary": 86,
      "averageSalary": 26.32,
      "minSalary": 8,
      "maxSalary": 80,
      "averageExperience": 2.7
    }
  ]
}
```

### 6.2. `GET /api/analytics/positions/:position/skills`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Cho biết kỹ năng phổ biến trong một vị trí cụ thể |
| Query params | `year`, `quarter`, `limit` |
| Bảng dùng | `FactTuyenDung`, `DimThoiGian`, `DimViTri`, `FactTuyenDung_KyNang`, `DimKyNang` |
| Main joins | `FactTuyenDung -> DimViTri`; `FactTuyenDung -> FactTuyenDung_KyNang -> DimKyNang`; `FactTuyenDung -> DimThoiGian` |
| Metric trả về | Kỹ năng, số tin, tỷ lệ theo tổng số tin của vị trí |
| Notes | Schema hỗ trợ vì kỹ năng là bridge theo `factId` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy kỹ năng theo vị trí thành công",
  "data": {
    "position": "Backend Developer",
    "skills": [
      {
        "skill": "Java",
        "jobCount": 45,
        "percentage": 43.69
      }
    ]
  }
}
```

## 7. Nhóm phân tích kỹ năng và ngôn ngữ

### 7.1. `GET /api/analytics/skills/top`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Xác định kỹ năng được yêu cầu nhiều nhất trên thị trường |
| Query params | `year`, `quarter`, `skill`, `limit` |
| Bảng dùng | Ưu tiên `AggTopSkill`; có thể dùng `FactTuyenDung_KyNang`, `DimKyNang`, `FactTuyenDung`, `DimThoiGian` khi cần filter sâu |
| Main joins | Aggregate không cần join; fact join qua bridge kỹ năng |
| Metric trả về | `soTin`, `tyLeTheoTongTin`, `xepHang` |
| Notes | Không tự phân loại ngôn ngữ từ `DimKyNang`; dùng endpoint language riêng |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy top kỹ năng thành công",
  "data": [
    {
      "rank": 1,
      "skill": "Photoshop",
      "jobCount": 749,
      "percentage": 20.74
    }
  ]
}
```

### 7.2. `GET /api/analytics/languages/top`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Xác định ngôn ngữ lập trình được yêu cầu nhiều nhất |
| Query params | `year`, `quarter`, `limit` |
| Bảng dùng | `AggNgonNguLapTrinh` |
| Main joins | Không cần join |
| Metric trả về | `ngonNgu`, `soTin`, `tyLeTheoTongTin`, `xepHang` |
| Notes | Chỉ dựa trên bảng aggregate thật, không suy diễn ngôn ngữ từ tên kỹ năng |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy top ngôn ngữ lập trình thành công",
  "data": [
    {
      "rank": 1,
      "language": "Python",
      "jobCount": 328,
      "percentage": 9.09
    }
  ]
}
```

### 7.3. `GET /api/analytics/skills/co-occurrence`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Phân tích các kỹ năng thường xuất hiện cùng nhau trong cùng tin tuyển dụng |
| Query params | `skill`, `year`, `quarter`, `limit` |
| Bảng dùng | `FactTuyenDung_KyNang`, `DimKyNang`, `FactTuyenDung`, `DimThoiGian` |
| Main joins | Self-join `FactTuyenDung_KyNang` theo `factId`, join 2 lần với `DimKyNang` |
| Metric trả về | Cặp kỹ năng, số tin cùng xuất hiện |
| Notes | Schema hỗ trợ qua bridge kỹ năng; nếu không truyền `skill`, trả top cặp kỹ năng toàn thị trường |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy kỹ năng thường đi kèm thành công",
  "data": [
    {
      "skill": "Docker",
      "relatedSkill": "CI/CD",
      "jobCount": 82
    }
  ]
}
```

## 8. Nhóm phân tích lương

### 8.1. `GET /api/analytics/salaries/by-position`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | So sánh lương theo vị trí để người dùng thấy nhóm nghề có đãi ngộ cao |
| Query params | `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder` |
| Bảng dùng | `AggLuongTheoViTri` |
| Main joins | Không cần join nếu dùng aggregate |
| Metric trả về | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `luongMin`, `luongMax`, `kinhNghiemTB` |
| Notes | Chỉ nên xem `luongTrungBinh` khi `soTinCoLuong` đủ lớn |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy lương theo vị trí thành công",
  "data": [
    {
      "position": "IT Project Manager",
      "jobCount": 101,
      "jobsWithSalary": 68,
      "averageSalary": 36.19,
      "minSalary": 12,
      "maxSalary": 100,
      "averageExperience": 4.2
    }
  ]
}
```

### 8.2. `GET /api/analytics/salaries/by-experience`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | So sánh lương theo nhóm kinh nghiệm |
| Query params | `year`, `quarter`, `limit` |
| Bảng dùng | `AggLuongTheoKinhNghiem` |
| Main joins | Không cần join |
| Metric trả về | `nhomKinhNghiem`, `soTin`, `soTinCoLuong`, `luongTrungBinh` |
| Notes | Nhóm kinh nghiệm đến từ aggregate thật, không tự tạo bucket ở API |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy lương theo kinh nghiệm thành công",
  "data": [
    {
      "experienceGroup": "2-3 năm",
      "jobCount": 420,
      "jobsWithSalary": 310,
      "averageSalary": 24.5
    }
  ]
}
```

### 8.3. `GET /api/analytics/salaries/by-city`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | So sánh lương trung bình theo thành phố |
| Query params | `year`, `quarter`, `city`, `limit` |
| Bảng dùng | `AggViecTheoDiaDiem` hoặc `AggThiTruongThanhPho` |
| Main joins | Không cần join nếu dùng aggregate |
| Metric trả về | `tenThanhPho`, `soTin`, `luongTrungBinh`, `xepHang` |
| Notes | Nếu cần `kinhNghiemTB` và `soViTriKhacNhau`, dùng `AggThiTruongThanhPho` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy lương theo thành phố thành công",
  "data": [
    {
      "city": "Hà Nội",
      "jobCount": 2242,
      "averageSalary": 19.2,
      "rank": 1
    }
  ]
}
```

### 8.4. `GET /api/analytics/salaries/by-skill`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Ước lượng lương trung bình theo kỹ năng yêu cầu |
| Query params | `year`, `quarter`, `skill`, `limit`, `sortBy`, `sortOrder` |
| Bảng dùng | `FactTuyenDung`, `FactTuyenDung_KyNang`, `DimKyNang`, `DimThoiGian` |
| Main joins | `FactTuyenDung -> FactTuyenDung_KyNang -> DimKyNang`, thêm `DimThoiGian` để filter thời gian |
| Metric trả về | Kỹ năng, số tin, số tin có lương, lương trung bình |
| Notes | Không có bảng aggregate lương theo kỹ năng, nên endpoint này query từ fact và chỉ tính `coLuong = 1` cho lương |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy lương theo kỹ năng thành công",
  "data": [
    {
      "skill": "Python",
      "jobCount": 328,
      "jobsWithSalary": 210,
      "averageSalary": 27.4
    }
  ]
}
```

## 9. Nhóm phân tích địa điểm và thị trường

### 9.1. `GET /api/analytics/locations`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Xếp hạng địa điểm tuyển dụng nhiều nhất |
| Query params | `year`, `quarter`, `city`, `limit` |
| Bảng dùng | `AggViecTheoDiaDiem` |
| Main joins | Không cần join |
| Metric trả về | `tenThanhPho`, `soTin`, `luongTrungBinh`, `xepHang` |
| Notes | Aggregate chỉ hỗ trợ cấp thành phố |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy phân tích địa điểm thành công",
  "data": [
    {
      "rank": 1,
      "city": "Hà Nội",
      "jobCount": 2242,
      "averageSalary": 19.2
    }
  ]
}
```

### 9.2. `GET /api/analytics/locations/wards`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Phân tích tuyển dụng theo phường/xã nếu frontend cần drill-down |
| Query params | `city`, `ward`, `year`, `quarter`, `limit` |
| Bảng dùng | `FactTuyenDung`, `FactTuyenDung_DiaDiem`, `DimDiaDiem`, `DimThoiGian` |
| Main joins | `FactTuyenDung -> FactTuyenDung_DiaDiem -> DimDiaDiem`, thêm `DimThoiGian` |
| Metric trả về | `tenThanhPho`, `tenPhuongXa`, số tin |
| Notes | Không có aggregate theo phường/xã; phải query từ fact/bridge |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy phân tích phường xã thành công",
  "data": [
    {
      "city": "Hà Nội",
      "ward": "Phường Dịch Vọng Hậu",
      "jobCount": 18
    }
  ]
}
```

### 9.3. `GET /api/analytics/markets/cities`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | So sánh thị trường tuyển dụng giữa các thành phố |
| Query params | `year`, `quarter`, `city`, `limit`, `sortBy`, `sortOrder` |
| Bảng dùng | `AggThiTruongThanhPho` |
| Main joins | Không cần join |
| Metric trả về | `soTin`, `luongTrungBinh`, `kinhNghiemTB`, `soViTriKhacNhau` |
| Notes | Phù hợp dashboard so sánh Hà Nội, Hồ Chí Minh, Đà Nẵng và các thành phố khác |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy so sánh thị trường theo thành phố thành công",
  "data": [
    {
      "city": "Hà Nội",
      "jobCount": 2242,
      "averageSalary": 19.2,
      "averageExperience": 2.1,
      "differentPositions": 120
    }
  ]
}
```

## 10. Nhóm phân tích công ty

### 10.1. `GET /api/analytics/companies/top`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Xác định công ty tuyển nhiều nhất theo quý |
| Query params | `year`, `quarter`, `company`, `limit` |
| Bảng dùng | `AggCongTyTuyenNhieu` |
| Main joins | Không cần join |
| Metric trả về | `tenCongTy`, `linhVuc`, `quyMo`, `soTin`, `xepHang` |
| Notes | Không trả `linkCongTy` vì schema DW không có cột này |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy top công ty tuyển dụng thành công",
  "data": [
    {
      "rank": 1,
      "company": "CÔNG TY CỔ PHẦN ABC",
      "field": "Công nghệ thông tin",
      "size": "100-499 nhân viên",
      "jobCount": 24
    }
  ]
}
```

### 10.2. `GET /api/analytics/companies/by-field`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | So sánh số tin tuyển dụng theo lĩnh vực công ty |
| Query params | `year`, `quarter`, `limit` |
| Bảng dùng | `FactTuyenDung`, `DimCongTy`, `DimThoiGian` |
| Main joins | `FactTuyenDung.congTyId -> DimCongTy.congTyId`; `FactTuyenDung.thoiGianId -> DimThoiGian.thoiGianId` |
| Metric trả về | `linhVuc`, số công ty, số tin |
| Notes | Không có aggregate riêng theo lĩnh vực, nhưng schema hỗ trợ qua `DimCongTy.linhVuc` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy phân tích công ty theo lĩnh vực thành công",
  "data": [
    {
      "field": "Công nghệ thông tin",
      "companyCount": 320,
      "jobCount": 680
    }
  ]
}
```

## 11. Nhóm cấp bậc và kinh nghiệm

### 11.1. `GET /api/analytics/levels`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Phân tích tỷ lệ Fresher, Junior, Middle, Senior và các cấp bậc khác |
| Query params | `year`, `quarter`, `level` |
| Bảng dùng | `AggCapBacTuyenDung` |
| Main joins | Không cần join |
| Metric trả về | `tenCapBac`, `soTin`, `tyLe` |
| Notes | Dữ liệu hiện có các cấp: `Nhân viên`, `Senior`, `Manager`, `Lead`, `Intern`, `Junior`, `Fresher`, `Middle` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy phân tích cấp bậc thành công",
  "data": [
    {
      "level": "Nhân viên",
      "jobCount": 2875,
      "percentage": 79.62
    }
  ]
}
```

### 11.2. `GET /api/analytics/experience/by-position`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Cho biết kinh nghiệm trung bình theo vị trí |
| Query params | `year`, `quarter`, `position`, `limit`, `sortBy`, `sortOrder` |
| Bảng dùng | `AggLuongTheoViTri` hoặc `FactTuyenDung` + `DimViTri` |
| Main joins | Aggregate không cần join; fact join `FactTuyenDung.viTriId -> DimViTri.viTriId` |
| Metric trả về | Vị trí, số tin, `kinhNghiemTB` |
| Notes | Có thể dùng chung dữ liệu với endpoint vị trí, nhưng tách endpoint giúp frontend dễ vẽ chart kinh nghiệm |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy kinh nghiệm theo vị trí thành công",
  "data": [
    {
      "position": "Backend Developer",
      "jobCount": 103,
      "averageExperience": 2.7
    }
  ]
}
```

### 11.3. `GET /api/analytics/levels/:level/skills`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Cho biết kỹ năng phổ biến theo cấp bậc, ví dụ Fresher khác Senior như thế nào |
| Query params | `year`, `quarter`, `limit` |
| Bảng dùng | `FactTuyenDung`, `DimCapBac`, `FactTuyenDung_KyNang`, `DimKyNang`, `DimThoiGian` |
| Main joins | `FactTuyenDung -> DimCapBac`; `FactTuyenDung -> FactTuyenDung_KyNang -> DimKyNang`; thêm `DimThoiGian` |
| Metric trả về | Kỹ năng, số tin theo cấp bậc, tỷ lệ trong cấp bậc |
| Notes | Schema hỗ trợ qua `capBacId` và bridge kỹ năng |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy kỹ năng theo cấp bậc thành công",
  "data": {
    "level": "Senior",
    "skills": [
      {
        "skill": "Docker",
        "jobCount": 48,
        "percentage": 24.87
      }
    ]
  }
}
```

## 12. Nhóm tìm kiếm/phân tích có filter tổng hợp

### 12.1. `GET /api/analytics/jobs/summary`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Trả kết quả phân tích sau khi người dùng áp dụng nhiều filter cùng lúc |
| Query params | `year`, `quarter`, `month`, `fromDate`, `toDate`, `city`, `ward`, `skill`, `position`, `company`, `level`, `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax` |
| Bảng dùng | `FactTuyenDung`, `DimThoiGian`, `DimViTri`, `DimCapBac`, `DimCongTy`, `FactTuyenDung_DiaDiem`, `DimDiaDiem`, `FactTuyenDung_KyNang`, `DimKyNang` |
| Main joins | Join fact với các dimension và bridge theo filter được truyền |
| Metric trả về | Tổng số tin, số tin có lương, lương trung bình, kinh nghiệm trung bình, số công ty, số vị trí, số kỹ năng |
| Notes | Đây không phải API list job chi tiết vì DW không có title/link/mô tả; chỉ trả summary analytics |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy thống kê theo bộ lọc thành công",
  "data": {
    "jobCount": 86,
    "jobsWithSalary": 62,
    "averageSalary": 28.1,
    "averageExperience": 3.2,
    "companyCount": 70,
    "positionCount": 1,
    "skillCount": 24
  }
}
```

### 12.2. `GET /api/analytics/jobs/breakdown`

| Mục | Nội dung |
| --- | --- |
| Mục đích nghiệp vụ | Sau khi filter, trả breakdown theo một chiều để frontend vẽ chart động |
| Query params | Toàn bộ filter của `/jobs/summary`, thêm `groupBy` |
| Bảng dùng | Tùy `groupBy`: `DimThoiGian`, `DimViTri`, `DimCapBac`, `DimCongTy`, `DimDiaDiem`, `DimKyNang` |
| Main joins | Join fact với dimension tương ứng; kỹ năng/địa điểm cần bridge |
| Metric trả về | Nhóm, số tin, số tin có lương, lương trung bình |
| Notes | `groupBy` whitelist: `quarter`, `month`, `city`, `ward`, `skill`, `position`, `company`, `level` |

Ví dụ response:

```json
{
  "success": true,
  "message": "Lấy phân rã thống kê thành công",
  "data": [
    {
      "group": "Hà Nội",
      "jobCount": 52,
      "jobsWithSalary": 39,
      "averageSalary": 27.6
    }
  ]
}
```

## 13. Các yêu cầu từ BTL CSDL.md và mức hỗ trợ

| Yêu cầu nghiệp vụ | Endpoint đề xuất | Mức hỗ trợ |
| --- | --- | --- |
| Mỗi quý có bao nhiêu tin tuyển dụng IT | `/api/analytics/trends/quarters` | Có, nhưng hiện chỉ có 1 quý dữ liệu |
| Ngôn ngữ được yêu cầu nhiều nhất | `/api/analytics/languages/top` | Có qua `AggNgonNguLapTrinh` |
| Vị trí nào đang hot | `/api/analytics/positions` | Có |
| Mức lương trung bình theo vị trí | `/api/analytics/salaries/by-position` | Có |
| Mức lương trung bình theo kinh nghiệm | `/api/analytics/salaries/by-experience` | Có qua aggregate |
| Mức lương trung bình theo thành phố | `/api/analytics/salaries/by-city` | Có |
| Nhu cầu tuyển dụng tăng/giảm theo quý | `/api/analytics/trends/quarters` | Có cấu trúc, nhưng hiện thiếu nhiều quý để so sánh |
| Công ty nào tuyển nhiều nhất | `/api/analytics/companies/top` | Có |
| Fresher/Junior/Middle/Senior chiếm tỷ lệ bao nhiêu | `/api/analytics/levels` | Có |
| So sánh thị trường theo địa điểm/kỹ năng/vị trí/cấp bậc | `/api/analytics/markets/cities`, `/jobs/breakdown`, các endpoint chuyên đề | Có |
| Tìm kiếm bài đăng chi tiết theo title/link | Không đề xuất | DW không có `tieuDeCongViec`, `linkBaiDang`, mô tả hoặc yêu cầu công việc |

## 14. Thứ tự triển khai đề xuất sau khi được duyệt

Nếu proposal được phê duyệt, nên triển khai theo thứ tự:

1. `GET /api/health`
2. Response helper, error handler, validation helper tiếng Việt
3. DB pool `config/db.js` dùng `.env`
4. `/api/analytics/overview`
5. `/api/analytics/filters`
6. Nhóm aggregate đơn giản: trends, positions, skills, languages, salaries, locations, companies, levels
7. Nhóm fact-query phức tạp: skill co-occurrence, jobs summary, jobs breakdown, ward drill-down

## 15. Điểm cần xác nhận trước khi sinh backend code

- Có giữ toàn bộ endpoint trong proposal này không, hay ưu tiên một subset MVP cho dashboard đầu tiên?
- Với endpoint dùng aggregate và fact đều làm được, có ưu tiên aggregate để nhanh hơn không?
- Có cần phân trang cho các endpoint filter option như công ty/kỹ năng/vị trí không, vì `DimCongTy` có 2.183 dòng?

Sau bước này cần dừng và chờ phê duyệt trước khi tạo backend code.
