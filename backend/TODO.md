# TODO backend

## Bổ sung phân tích lương theo kinh nghiệm có filter tổng hợp

Frontend hiện có bộ lọc tổng gồm `skill`, `position`, `city`, `company`, `level`, nhưng endpoint:

```text
GET /api/analytics/salaries/by-experience
```

hiện chỉ hỗ trợ:

```text
year, quarter, limit
```

Vì vậy khi người dùng chọn ví dụ `skill=Angular`, chart "Lương theo kinh nghiệm" không đổi. Đây là đúng với API contract hiện tại, nhưng trải nghiệm dashboard sẽ tốt hơn nếu backend hỗ trợ lọc sâu hơn.

### Hướng bổ sung đề xuất

Ưu tiên một trong hai hướng:

1. Mở rộng `GET /api/analytics/jobs/breakdown`
   - Thêm `groupBy=experience`.
   - Cho phép dùng toàn bộ filter fact hiện có: `skill`, `position`, `city`, `ward`, `company`, `level`, `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax`, thời gian.
   - Response giữ schema hiện tại của breakdown:

```json
[
  {
    "nhom": "2-3 năm",
    "soTin": 120,
    "soTinCoLuong": 80,
    "luongTrungBinh": 24.5
  }
]
```

2. Hoặc mở rộng `GET /api/analytics/salaries/by-experience`
   - Cho endpoint này nhận thêm các filter fact như `skill`, `position`, `city`, `company`, `level`.
   - Khi có filter ngoài `year/quarter`, query từ `FactTuyenDung` thay vì chỉ đọc `AggLuongTheoKinhNghiem`.
   - Khi không có filter sâu, vẫn có thể dùng `AggLuongTheoKinhNghiem` để nhanh.

### Cơ sở dữ liệu có thể hỗ trợ

Schema hiện có đủ dữ liệu để query từ fact:

- `FactTuyenDung.soNamKinhNghiem`: dùng để tạo nhóm kinh nghiệm.
- `FactTuyenDung.luongTrungBinh`, `FactTuyenDung.coLuong`: tính lương trung bình trên tin có lương.
- `FactTuyenDung_KyNang` + `DimKyNang`: lọc theo kỹ năng.
- `FactTuyenDung_DiaDiem` + `DimDiaDiem`: lọc theo thành phố/phường xã.
- `DimViTri`, `DimCongTy`, `DimCapBac`: lọc theo vị trí, công ty, cấp bậc.

### Lưu ý implementation

- Không truyền filter không được whitelist, vì `validateAnalyticsQuery` hiện reject param lạ bằng lỗi `Tham số ... không được hỗ trợ`.
- Nếu thêm `groupBy=experience`, cập nhật:
  - `controllers/analyticsController.js`: `groupByWhitelist`.
  - `repositories/analyticsRepository.js`: `groupByConfig`.
  - `docs/api-spec.md`: contract chính thức.
  - `README.md`: danh sách query/groupBy nếu cần.
- Bucket kinh nghiệm nên được định nghĩa rõ và dùng nhất quán, ví dụ:
  - `Chưa có dữ liệu`
  - `0-1 năm`
  - `1-2 năm`
  - `2-3 năm`
  - `3-5 năm`
  - `5+ năm`
- Lương trung bình chỉ tính trên `coLuong = 1`.
