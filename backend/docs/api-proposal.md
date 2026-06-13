# Đề xuất API phân tích JobDW

## 1. Nguyên tắc thiết kế

Tài liệu này chỉ là đề xuất API cho backend sau này. Chưa sinh backend code trong task hiện tại.

Nguồn thiết kế:

- Nghiệp vụ trong `BTL CSDL.md`.
- Live SQL Server schema của database `JobDW`, inspected lúc `2026-06-13 18:50:28 +07`.
- `docs/database-schema.md` đã cập nhật từ live schema.

Quy tắc bắt buộc:

- Main backend file sau này là `server.js`.
- Tất cả response message API trả về frontend phải bằng tiếng Việt.
- Không làm login, register, JWT, authentication hoặc authorization.
- Không tạo CRUD endpoint cho mọi bảng.
- Không dùng fake data, mock database hoặc schema tự suy diễn.
- Query phải dùng parameterized SQL.
- Không dùng `FactTuyenDung_Backup_BeforeSalaryFix` vì bảng này không tồn tại trong live schema hiện tại.
- Các phần chưa chắc chắn hoặc không có trong schema thật ghi là `Chưa xác định`.

Response format dự kiến:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": []
}
```

Empty data:

```json
{
  "success": true,
  "message": "Không có dữ liệu phù hợp",
  "data": []
}
```

Validation error:

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "error": "Năm phải là số nguyên dương"
}
```

## 2. Tham số lọc chung

| Tham số | Kiểu | Ghi chú |
| --- | --- | --- |
| `year` | integer | Map với `nam`; ví dụ `2026` |
| `quarter` | integer | Map với `quy`; chỉ nhận `1`, `2`, `3`, `4` |
| `quarterLabel` | string | Map với `nhanQuy`; ví dụ `Q2-2026` hoặc `ALL` nếu endpoint cho phép |
| `month` | integer | Chỉ dùng endpoint query từ `DimThoiGian.thang` |
| `fromDate` | date | Chỉ dùng endpoint query từ `DimThoiGian.ngayDay` |
| `toDate` | date | Phải >= `fromDate` |
| `city` | string | Map với `tenThanhPho` |
| `ward` | string | Map với `DimDiaDiem.tenPhuongXa`; aggregate hiện không hỗ trợ phường/xã |
| `skill` | string | Map với `tenKyNang` |
| `position` | string | Map với `tenViTriChuan` |
| `company` | string | Map với `tenCongTy` |
| `level` | string | Map với `tenCapBac` |
| `salaryMin` | number | Lọc trên `FactTuyenDung.luongTrungBinh`, chỉ nên dùng với `coLuong = 1` |
| `salaryMax` | number | Phải >= `salaryMin` |
| `experienceMin` | number | Lọc trên `FactTuyenDung.soNamKinhNghiem` |
| `experienceMax` | number | Phải >= `experienceMin` |
| `limit` | integer | Mặc định 10 hoặc 20, tối đa đề xuất 100 |
| `sortBy` | string | Whitelist riêng theo từng endpoint |
| `sortOrder` | string | `asc` hoặc `desc` |

## 3. Endpoint đề xuất

### 3.1. `GET /api/health`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xác nhận backend đang chạy, không lộ thông tin nhạy cảm |
| Query params | Không có |
| Source tables/views | Không dùng bảng |
| Join/aggregation chính | Không có |
| Giới hạn | Không kiểm tra DB nếu muốn giữ health check nhẹ; việc có kiểm tra DB hay không là `Chưa xác định` |

```json
{
  "success": true,
  "message": "Backend đang hoạt động",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-13T11:50:28.000Z"
  }
}
```

### 3.2. `GET /api/analytics/overview`

| Mục | Nội dung |
| --- | --- |
| Mục đích | KPI tổng quan cho dashboard thị trường tuyển dụng CNTT |
| Query params | `year`, `quarter`, `quarterLabel`, `fromDate`, `toDate` |
| Source tables/views | `FactTuyenDung`, `DimThoiGian`, `DimCongTy`, `DimViTri`, `FactTuyenDung_KyNang`, `DimKyNang`, `FactTuyenDung_DiaDiem`, `DimDiaDiem` |
| Join/aggregation chính | Join fact với thời gian; đếm fact, công ty, vị trí; lấy top city/skill qua bridge |
| Giới hạn | Không có title/link bài đăng trong DW; đơn vị lương theo nghiệp vụ là triệu VNĐ |

```json
{
  "success": true,
  "message": "Lấy dữ liệu tổng quan thành công",
  "data": {
    "jobCount": 3954,
    "jobsWithSalary": 2379,
    "companyCount": 2095,
    "positionCount": 128,
    "averageSalary": 19.95,
    "topCity": {
      "city": "Hà Nội",
      "jobCount": 2427
    },
    "topSkill": {
      "skill": "Photoshop",
      "jobCount": 824
    }
  }
}
```

### 3.3. `GET /api/analytics/filters`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Cung cấp option cho frontend filter |
| Query params | Không có |
| Source tables/views | `DimThoiGian`, `DimViTri`, `DimCapBac`, `DimCongTy`, `DimDiaDiem`, `DimKyNang` |
| Join/aggregation chính | `SELECT DISTINCT` theo từng dimension |
| Giới hạn | Không trả `linkCongTy` vì live schema không có cột này |

```json
{
  "success": true,
  "message": "Lấy danh sách bộ lọc thành công",
  "data": {
    "quarters": ["Q2-2026"],
    "cities": ["Hà Nội", "Hồ Chí Minh"],
    "levels": ["Fresher", "Junior", "Middle", "Senior"],
    "positions": ["Backend Developer"],
    "skills": ["Python", "Java"]
  }
}
```

### 3.4. `GET /api/analytics/trends/quarters`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Trả số tin, số tin có lương và biến động theo quý |
| Query params | `year`, `quarter`, `quarterLabel`, `limit` |
| Source tables/views | `AggXuHuongTheoQuy` |
| Join/aggregation chính | Không cần join, dùng aggregate sẵn |
| Giới hạn | Live data hiện chỉ có `Q2-2026`, nên `soTinQuyTruoc`, `bienDong`, `phanTramThayDoi` có thể null |

```json
{
  "success": true,
  "message": "Lấy xu hướng tuyển dụng theo quý thành công",
  "data": [
    {
      "quarterLabel": "Q2-2026",
      "year": 2026,
      "quarter": 2,
      "jobCount": 3954,
      "jobsWithSalary": 2379,
      "averageSalary": 19.95,
      "previousQuarterJobs": null,
      "change": null,
      "changePercent": null
    }
  ]
}
```

### 3.5. `GET /api/analytics/trends/months`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Trả số tin tuyển dụng theo tháng/ngày để xem trend chi tiết hơn quý |
| Query params | `year`, `quarter`, `month`, `fromDate`, `toDate` |
| Source tables/views | `FactTuyenDung`, `DimThoiGian` |
| Join/aggregation chính | `FactTuyenDung.thoiGianId -> DimThoiGian.thoiGianId`, group theo `nam`, `thang` |
| Giới hạn | Không có aggregate theo tháng; hiện `DimThoiGian` chỉ có 5 dòng |

```json
{
  "success": true,
  "message": "Lấy xu hướng tuyển dụng theo tháng thành công",
  "data": [
    {
      "year": 2026,
      "month": 5,
      "jobCount": 2322,
      "jobsWithSalary": 1376,
      "averageSalary": 19.88
    }
  ]
}
```

### 3.6. `GET /api/analytics/skills/top`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xác định kỹ năng được yêu cầu nhiều nhất |
| Query params | `year`, `quarter`, `quarterLabel`, `skill`, `limit` |
| Source tables/views | `AggTopSkill` |
| Join/aggregation chính | Không cần join, lọc theo `nhanQuy`/`nam`/`quy`, sort theo `xepHang` hoặc `soTin` |
| Giới hạn | `DimKyNang` không có category; không tự phân loại ngôn ngữ từ skill |

```json
{
  "success": true,
  "message": "Lấy top kỹ năng thành công",
  "data": [
    {
      "rank": 1,
      "skill": "Photoshop",
      "jobCount": 824,
      "percentage": 20.84
    }
  ]
}
```

### 3.7. `GET /api/analytics/languages/top`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xác định ngôn ngữ lập trình được yêu cầu nhiều nhất |
| Query params | `year`, `quarter`, `quarterLabel`, `limit` |
| Source tables/views | `AggNgonNguLapTrinh` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Cách ETL xác định ngôn ngữ từ kỹ năng là `Chưa xác định`; API chỉ đọc aggregate có sẵn |

```json
{
  "success": true,
  "message": "Lấy top ngôn ngữ lập trình thành công",
  "data": [
    {
      "rank": 1,
      "language": "Python",
      "jobCount": 365,
      "percentage": 9.23
    }
  ]
}
```

### 3.8. `GET /api/analytics/positions`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xác định vị trí tuyển nhiều, lương trung bình và kinh nghiệm trung bình |
| Query params | `year`, `quarter`, `quarterLabel`, `position`, `limit`, `sortBy`, `sortOrder` |
| Source tables/views | `AggLuongTheoViTri` |
| Join/aggregation chính | Không cần join, dùng aggregate theo vị trí |
| Giới hạn | `sortBy` nên whitelist: `jobCount`, `averageSalary`, `averageExperience` |

```json
{
  "success": true,
  "message": "Lấy phân tích vị trí thành công",
  "data": [
    {
      "position": "IT Helpdesk/IT support",
      "jobCount": 101,
      "jobsWithSalary": 61,
      "averageSalary": 16.16,
      "minSalary": 6,
      "maxSalary": 150,
      "averageExperience": 1.7
    }
  ]
}
```

### 3.9. `GET /api/analytics/positions/:position/skills`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Cho biết kỹ năng phổ biến trong một vị trí cụ thể |
| Query params | `year`, `quarter`, `quarterLabel`, `limit` |
| Source tables/views | `AggSkillTheoViTri` |
| Join/aggregation chính | Không cần join, filter `tenViTriChuan`, sort `xepHang` |
| Giới hạn | Aggregate có `soTin` và `xepHang`, không có tỷ lệ phần trăm; nếu cần tỷ lệ phải tính thêm từ fact hoặc tổng vị trí |

```json
{
  "success": true,
  "message": "Lấy kỹ năng theo vị trí thành công",
  "data": {
    "position": "3D Modeler",
    "skills": [
      {
        "rank": 1,
        "skill": "Photoshop",
        "jobCount": 14,
        "percentage": "Chưa xác định"
      }
    ]
  }
}
```

### 3.10. `GET /api/analytics/salaries/by-position`

| Mục | Nội dung |
| --- | --- |
| Mục đích | So sánh lương theo vị trí |
| Query params | `year`, `quarter`, `quarterLabel`, `position`, `limit`, `sortBy`, `sortOrder` |
| Source tables/views | `AggLuongTheoViTri` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Chỉ diễn giải `luongTrungBinh` khi `soTinCoLuong` đủ lớn; ngưỡng đủ lớn là `Chưa xác định` |

```json
{
  "success": true,
  "message": "Lấy lương theo vị trí thành công",
  "data": [
    {
      "position": "Concept Artist",
      "jobCount": 31,
      "jobsWithSalary": 24,
      "averageSalary": 17.85,
      "minSalary": 2,
      "maxSalary": 85,
      "averageExperience": 1.9
    }
  ]
}
```

### 3.11. `GET /api/analytics/salaries/by-experience`

| Mục | Nội dung |
| --- | --- |
| Mục đích | So sánh lương theo nhóm kinh nghiệm |
| Query params | `year`, `quarter`, `quarterLabel`, `limit` |
| Source tables/views | `AggLuongTheoKinhNghiem` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Nhóm kinh nghiệm do ETL tạo sẵn; quy tắc bucket chi tiết là `Chưa xác định` |

```json
{
  "success": true,
  "message": "Lấy lương theo kinh nghiệm thành công",
  "data": [
    {
      "experienceGroup": "1-2 năm",
      "jobCount": 2346,
      "jobsWithSalary": 1521,
      "averageSalary": 18.01
    }
  ]
}
```

### 3.12. `GET /api/analytics/salaries/by-skill`

| Mục | Nội dung |
| --- | --- |
| Mục đích | So sánh lương trung bình theo kỹ năng yêu cầu |
| Query params | `year`, `quarter`, `quarterLabel`, `skill`, `limit`, `sortBy`, `sortOrder` |
| Source tables/views | `AggLuongTheoKyNang` |
| Join/aggregation chính | Không cần join, dùng aggregate mới trong live schema |
| Giới hạn | Không có `luongMin`/`luongMax` theo kỹ năng trong aggregate |

```json
{
  "success": true,
  "message": "Lấy lương theo kỹ năng thành công",
  "data": [
    {
      "skill": "Adobe Premiere",
      "jobCount": 42,
      "jobsWithSalary": 30,
      "averageSalary": 14.32,
      "minSalary": "Chưa xác định",
      "maxSalary": "Chưa xác định"
    }
  ]
}
```

### 3.13. `GET /api/analytics/locations`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xếp hạng thành phố tuyển dụng nhiều nhất và lương trung bình theo thành phố |
| Query params | `year`, `quarter`, `quarterLabel`, `city`, `limit` |
| Source tables/views | `AggViecTheoDiaDiem` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Aggregate chỉ hỗ trợ cấp thành phố, không hỗ trợ phường/xã |

```json
{
  "success": true,
  "message": "Lấy phân tích địa điểm thành công",
  "data": [
    {
      "rank": 1,
      "city": "Hà Nội",
      "jobCount": 2427,
      "averageSalary": 21.23
    }
  ]
}
```

### 3.14. `GET /api/analytics/locations/wards`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Drill-down tuyển dụng theo phường/xã nếu frontend cần |
| Query params | `city`, `ward`, `year`, `quarter`, `fromDate`, `toDate`, `limit` |
| Source tables/views | `FactTuyenDung`, `FactTuyenDung_DiaDiem`, `DimDiaDiem`, `DimThoiGian` |
| Join/aggregation chính | Fact -> bridge địa điểm -> `DimDiaDiem`, thêm `DimThoiGian` để filter |
| Giới hạn | Không có aggregate theo phường/xã; một số `tenPhuongXa` có thể null |

```json
{
  "success": true,
  "message": "Lấy phân tích phường xã thành công",
  "data": [
    {
      "city": "Hà Nội",
      "ward": "Chưa xác định",
      "jobCount": 18
    }
  ]
}
```

### 3.15. `GET /api/analytics/markets/cities`

| Mục | Nội dung |
| --- | --- |
| Mục đích | So sánh thị trường tuyển dụng giữa các thành phố |
| Query params | `year`, `quarter`, `quarterLabel`, `city`, `limit`, `sortBy`, `sortOrder` |
| Source tables/views | `AggThiTruongThanhPho` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Dữ liệu chỉ phản ánh các thành phố/phường đã parse được từ ETL |

```json
{
  "success": true,
  "message": "Lấy so sánh thị trường theo thành phố thành công",
  "data": [
    {
      "city": "Hải Phòng",
      "jobCount": 64,
      "averageSalary": 17.09,
      "averageExperience": 1.5,
      "differentPositions": 27
    }
  ]
}
```

### 3.16. `GET /api/analytics/markets/cities/:city/positions`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xác định vị trí phổ biến trong một thành phố |
| Query params | `year`, `quarter`, `quarterLabel`, `limit` |
| Source tables/views | `AggViTriTheoThanhPho` |
| Join/aggregation chính | Không cần join, filter `tenThanhPho`, sort `xepHang` |
| Giới hạn | Aggregate có số tin và xếp hạng, không có lương/kinh nghiệm theo cặp thành phố-vị trí |

```json
{
  "success": true,
  "message": "Lấy vị trí theo thành phố thành công",
  "data": {
    "city": "An Giang",
    "positions": [
      {
        "rank": 1,
        "position": "Thiết kế đồ họa (Graphic Design)",
        "jobCount": 7,
        "averageSalary": "Chưa xác định"
      }
    ]
  }
}
```

### 3.17. `GET /api/analytics/companies/top`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Xác định công ty tuyển nhiều nhất |
| Query params | `year`, `quarter`, `quarterLabel`, `company`, `limit` |
| Source tables/views | `AggCongTyTuyenNhieu` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Không trả `linkCongTy`; live schema không có cột này |

```json
{
  "success": true,
  "message": "Lấy top công ty tuyển dụng thành công",
  "data": [
    {
      "rank": 1,
      "company": "CÔNG TY TNHH CÔNG NGHỆ PHẦN MỀM NASANI",
      "field": "Marketing / Truyền thông / Quảng cáo",
      "size": "500-1000 nhân viên",
      "jobCount": 80
    }
  ]
}
```

### 3.18. `GET /api/analytics/companies/by-field`

| Mục | Nội dung |
| --- | --- |
| Mục đích | So sánh số tin tuyển dụng theo lĩnh vực công ty |
| Query params | `year`, `quarter`, `fromDate`, `toDate`, `limit` |
| Source tables/views | `FactTuyenDung`, `DimCongTy`, `DimThoiGian` |
| Join/aggregation chính | `FactTuyenDung.congTyId -> DimCongTy.congTyId`; group by `linhVuc` |
| Giới hạn | Không có aggregate riêng theo lĩnh vực; giá trị `N/A` có thể xuất hiện |

```json
{
  "success": true,
  "message": "Lấy phân tích công ty theo lĩnh vực thành công",
  "data": [
    {
      "field": "IT - Phần mềm",
      "companyCount": 679,
      "jobCount": 1843
    }
  ]
}
```

### 3.19. `GET /api/analytics/levels`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Phân tích tỷ lệ Fresher/Junior/Middle/Senior và các cấp bậc khác |
| Query params | `year`, `quarter`, `quarterLabel`, `level` |
| Source tables/views | `AggCapBacTuyenDung` |
| Join/aggregation chính | Không cần join |
| Giới hạn | Ý nghĩa chuẩn hóa cấp bậc chi tiết theo ETL là `Chưa xác định` ngoài mô tả nghiệp vụ trong `BTL CSDL.md` |

```json
{
  "success": true,
  "message": "Lấy phân tích cấp bậc thành công",
  "data": [
    {
      "level": "Nhân viên",
      "jobCount": 3143,
      "percentage": 79.49
    }
  ]
}
```

### 3.20. `GET /api/analytics/jobs/summary`

| Mục | Nội dung |
| --- | --- |
| Mục đích | Trả thống kê tổng hợp sau khi người dùng áp dụng nhiều filter |
| Query params | `year`, `quarter`, `month`, `fromDate`, `toDate`, `city`, `ward`, `skill`, `position`, `company`, `level`, `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax` |
| Source tables/views | `FactTuyenDung`, `DimThoiGian`, `DimViTri`, `DimCapBac`, `DimCongTy`, `FactTuyenDung_DiaDiem`, `DimDiaDiem`, `FactTuyenDung_KyNang`, `DimKyNang` |
| Join/aggregation chính | Join fact với các dimension/bridge theo filter được truyền; aggregate tổng số tin, lương, kinh nghiệm |
| Giới hạn | Đây không phải API list job chi tiết vì DW không có title/link/mô tả |

```json
{
  "success": true,
  "message": "Lấy thống kê theo bộ lọc thành công",
  "data": {
    "jobCount": 3954,
    "jobsWithSalary": 2379,
    "averageSalary": 19.95,
    "averageExperience": 1.85,
    "companyCount": 2095,
    "positionCount": 128,
    "skillCount": 107
  }
}
```

## 4. Endpoint/metric cũ không còn nên giữ nguyên

| Endpoint/metric trong docs cũ | Trạng thái theo live schema | Điều chỉnh đề xuất |
| --- | --- | --- |
| API dùng `FactTuyenDung_Backup_BeforeSalaryFix` | Không được hỗ trợ, bảng không tồn tại trong live schema | Không đề xuất |
| `GET /api/analytics/salaries/by-skill` tự tính từ fact là hướng chính | Vẫn có thể tính từ fact, nhưng live schema đã có `AggLuongTheoKyNang` | Ưu tiên aggregate mới |
| `GET /api/analytics/positions/:position/skills` tự tính từ fact là hướng chính | Vẫn có thể tính từ fact, nhưng live schema đã có `AggSkillTheoViTri` | Ưu tiên aggregate mới; tỷ lệ phần trăm là `Chưa xác định` nếu chỉ dùng aggregate |
| Thiếu endpoint vị trí theo thành phố | Live schema có `AggViTriTheoThanhPho` | Thêm `GET /api/analytics/markets/cities/:city/positions` |
| API chi tiết bài đăng gồm title/link/mô tả/quyền lợi/yêu cầu | Không được DW hiện tại hỗ trợ | Không đề xuất nếu chỉ dùng `JobDW` |
| API trả `linkCongTy` | Không được `DimCongTy` hỗ trợ | Không trả `linkCongTy` |
| CRUD endpoint cho từng bảng | Không phù hợp nghiệp vụ và yêu cầu | Không đề xuất |
| Login/auth/JWT | Không có yêu cầu và không có bảng user/auth trong schema | Không đề xuất |

## 5. Câu hỏi cần duyệt trước khi sinh backend

- Có dùng `quarterLabel=ALL` như một filter chính thức cho các aggregate có dòng tổng toàn bộ không, hay frontend chỉ filter theo `year`/`quarter`?
- Có giữ tất cả endpoint đề xuất ở trên, hay gộp một số endpoint lương/vị trí/thị trường để backend nhỏ hơn?
- Với các endpoint aggregate không có tỷ lệ phần trăm (`AggSkillTheoViTri`, `AggViTriTheoThanhPho`), có cần tính tỷ lệ bổ sung từ fact không?
- Có cần endpoint list job chi tiết không? Nếu có, cần xác nhận nguồn OLTP khác vì `JobDW` hiện không có title/link/mô tả bài đăng.
- Ngưỡng tối thiểu `soTinCoLuong` để hiển thị lương trung bình đáng tin cậy là bao nhiêu? Hiện là `Chưa xác định`.
