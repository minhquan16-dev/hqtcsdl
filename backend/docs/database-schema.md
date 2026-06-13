# Tài liệu schema JobDW

## 1. Tổng quan

| Mục | Giá trị |
| --- | --- |
| Database | `JobDW` |
| Last inspected | `2026-06-13 18:50:28 +07` |
| Source of truth | Live JobDW SQL Server schema, query trực tiếp từ SQL Server metadata (`sys.objects`, `sys.columns`, `sys.key_constraints`, `sys.foreign_keys`, `sys.dm_db_partition_stats`) |
| SQL Server | Microsoft SQL Server 2022 Developer Edition |
| Mục tiêu nghiệp vụ | Phân tích thị trường tuyển dụng CNTT tại Việt Nam từ dữ liệu tin tuyển dụng TopCV |
| Mô hình chính | Data Warehouse dạng fact/dimension, có thêm bảng aggregate phục vụ dashboard |
| User tables | 21 |
| Views | 0 |
| Columns | 132 |
| Primary keys | 21 object có PK |
| Foreign keys | 8 relationship |

Coverage dữ liệu hiện tại:

| Chỉ số | Giá trị |
| --- | ---: |
| Số dòng `FactTuyenDung` | 3.954 |
| Số `tinTuyenDungId` khác nhau | 3.954 |
| Số tin có lương (`coLuong = 1`) | 2.379 |
| Lương trung bình trên tin có lương | 19,95 |
| Ngày nhỏ nhất gắn với fact | 14/05/2026 |
| Ngày lớn nhất gắn với fact | 06/06/2026 |
| Số quý hiện có dữ liệu fact | 1 (`Q2-2026`) |
| Số vị trí có dữ liệu fact | 128 |
| Số cấp bậc có dữ liệu fact | 8 |
| Số công ty có dữ liệu fact | 2.095 |

## 2. So sánh với tài liệu schema cũ

Tài liệu cũ chỉ dùng để tham khảo, không phải nguồn sự thật. Kết quả live schema mới khác các điểm sau:

| Nhóm thay đổi | Chi tiết |
| --- | --- |
| Bảng mới | `AggLuongTheoKyNang`, `AggSkillTheoViTri`, `AggViTriTheoThanhPho` |
| Bảng đã bị xóa/không còn thấy trong live schema | `FactTuyenDung_Backup_BeforeSalaryFix` |
| View | Docs cũ ghi không có view; live schema hiện cũng không có view |
| Row count thay đổi | `FactTuyenDung` từ 3.611 lên 3.954; `DimCongTy` từ 2.183 xuống 2.095; `DimDiaDiem` từ 515 xuống 472; `DimKyNang` từ 108 xuống 107; `DimThoiGian` từ 13 xuống 5; `DimViTri` từ 142 xuống 128 |
| Aggregate row count thay đổi | `AggCongTyTuyenNhieu` 3.932 -> 4.190; `AggLuongTheoViTri` 150 -> 256; `AggThiTruongThanhPho` 72 -> 74; `AggViecTheoDiaDiem` 72 -> 74 |
| Data type/max length thay đổi | Một số cột text ngắn hơn docs cũ: ví dụ `tenCapBac nvarchar(50)`, `tenCongTy nvarchar(200)`, `linhVuc nvarchar(100)`, `quyMo nvarchar(50)`, `tenThanhPho nvarchar(100)`, `tenKyNang nvarchar(100)`, `tenViTriChuan nvarchar(200)` |
| Quan hệ | 8 foreign key hiện vẫn là quan hệ thật giữa fact/bridge và dimension; các bảng aggregate không có FK thật trong metadata |
| Metric mới được schema hỗ trợ | Lương theo kỹ năng qua `AggLuongTheoKyNang`; kỹ năng theo vị trí qua `AggSkillTheoViTri`; vị trí theo thành phố qua `AggViTriTheoThanhPho` |
| Metric cũ cần điều chỉnh | Endpoint lương theo kỹ năng và kỹ năng theo vị trí không cần tự tính từ fact nếu dùng aggregate mới. Endpoint dùng bảng backup không còn được hỗ trợ vì bảng backup không tồn tại trong live schema |

## 3. Danh sách tables/views và row count

| Object | Type | Row count | Nhận diện |
| --- | --- | ---: | --- |
| `dbo.AggCapBacTuyenDung` | table | 16 | Aggregate cấp bậc |
| `dbo.AggCongTyTuyenNhieu` | table | 4.190 | Aggregate công ty tuyển nhiều |
| `dbo.AggLuongTheoKinhNghiem` | table | 8 | Aggregate lương theo nhóm kinh nghiệm |
| `dbo.AggLuongTheoKyNang` | table | 210 | Aggregate lương theo kỹ năng |
| `dbo.AggLuongTheoViTri` | table | 256 | Aggregate lương theo vị trí |
| `dbo.AggNgonNguLapTrinh` | table | 20 | Aggregate ngôn ngữ lập trình |
| `dbo.AggSkillTheoViTri` | table | 3.026 | Aggregate kỹ năng theo vị trí |
| `dbo.AggThiTruongThanhPho` | table | 74 | Aggregate thị trường theo thành phố |
| `dbo.AggTopSkill` | table | 214 | Aggregate top kỹ năng |
| `dbo.AggViecTheoDiaDiem` | table | 74 | Aggregate việc theo thành phố |
| `dbo.AggViTriTheoThanhPho` | table | 1.070 | Aggregate vị trí theo thành phố |
| `dbo.AggXuHuongTheoQuy` | table | 1 | Aggregate xu hướng theo quý |
| `dbo.DimCapBac` | table | 8 | Dimension cấp bậc |
| `dbo.DimCongTy` | table | 2.095 | Dimension công ty |
| `dbo.DimDiaDiem` | table | 472 | Dimension địa điểm |
| `dbo.DimKyNang` | table | 107 | Dimension kỹ năng |
| `dbo.DimThoiGian` | table | 5 | Dimension thời gian |
| `dbo.DimViTri` | table | 128 | Dimension vị trí |
| `dbo.FactTuyenDung` | table | 3.954 | Fact chính |
| `dbo.FactTuyenDung_DiaDiem` | table | 4.772 | Bridge fact - địa điểm |
| `dbo.FactTuyenDung_KyNang` | table | 8.772 | Bridge fact - kỹ năng |

Không phát hiện user view trong live schema.

## 4. Columns theo từng table

### Aggregate tables

| Table | Columns |
| --- | --- |
| `AggCapBacTuyenDung` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenCapBac nvarchar(50) NOT NULL`, `soTin int NOT NULL`, `tyLe decimal(5,2) NOT NULL` |
| `AggCongTyTuyenNhieu` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenCongTy nvarchar(200) NOT NULL`, `linhVuc nvarchar(100) NULL`, `quyMo nvarchar(50) NULL`, `soTin int NOT NULL`, `xepHang int NOT NULL` |
| `AggLuongTheoKinhNghiem` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `nhomKinhNghiem nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL` |
| `AggLuongTheoKyNang` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenKyNang nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL` |
| `AggLuongTheoViTri` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenViTriChuan nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `luongMin decimal(10,2) NULL`, `luongMax decimal(10,2) NULL`, `kinhNghiemTB decimal(4,1) NULL` |
| `AggNgonNguLapTrinh` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `ngonNgu nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `tyLeTheoTongTin decimal(5,2) NULL`, `xepHang int NOT NULL` |
| `AggSkillTheoViTri` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenViTriChuan nvarchar(200) NOT NULL`, `tenKyNang nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `xepHang int NOT NULL` |
| `AggThiTruongThanhPho` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenThanhPho nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `kinhNghiemTB decimal(4,1) NULL`, `soViTriKhacNhau int NULL` |
| `AggTopSkill` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenKyNang nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `tyLeTheoTongTin decimal(5,2) NULL`, `xepHang int NOT NULL` |
| `AggViecTheoDiaDiem` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenThanhPho nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `xepHang int NOT NULL` |
| `AggViTriTheoThanhPho` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenThanhPho nvarchar(100) NOT NULL`, `tenViTriChuan nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `xepHang int NOT NULL` |
| `AggXuHuongTheoQuy` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NOT NULL`, `quy int NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `soTinQuyTruoc int NULL`, `bienDong int NULL`, `phanTramThayDoi decimal(5,2) NULL` |

### Dimension tables

| Table | Columns |
| --- | --- |
| `DimCapBac` | `capBacId int NOT NULL`, `tenCapBac nvarchar(50) NOT NULL` |
| `DimCongTy` | `congTyId int NOT NULL`, `tenCongTy nvarchar(200) NOT NULL`, `linhVuc nvarchar(100) NULL`, `quyMo nvarchar(50) NULL` |
| `DimDiaDiem` | `diaDiemId int NOT NULL`, `tenThanhPho nvarchar(100) NOT NULL`, `tenPhuongXa nvarchar(100) NULL` |
| `DimKyNang` | `kyNangId int NOT NULL`, `tenKyNang nvarchar(100) NOT NULL` |
| `DimThoiGian` | `thoiGianId int NOT NULL IDENTITY`, `ngayDay date NOT NULL`, `thang int NOT NULL`, `quy int NOT NULL`, `nam int NOT NULL`, `nhanQuy varchar(10) NOT NULL` |
| `DimViTri` | `viTriId int NOT NULL`, `tenViTriChuan nvarchar(200) NOT NULL` |

### Fact và bridge tables

| Table | Columns |
| --- | --- |
| `FactTuyenDung` | `factId int NOT NULL IDENTITY`, `tinTuyenDungId int NOT NULL`, `thoiGianId int NOT NULL`, `viTriId int NULL`, `capBacId int NULL`, `congTyId int NOT NULL`, `luongMin decimal(10,2) NULL`, `luongMax decimal(10,2) NULL`, `luongTrungBinh numeric(16,6) NULL`, `soNamKinhNghiem decimal(4,1) NULL`, `coLuong int NOT NULL` |
| `FactTuyenDung_DiaDiem` | `factId int NOT NULL`, `diaDiemId int NOT NULL` |
| `FactTuyenDung_KyNang` | `factId int NOT NULL`, `kyNangId int NOT NULL` |

## 5. Primary keys

| Table | Primary key |
| --- | --- |
| `AggCapBacTuyenDung` | `aggId` |
| `AggCongTyTuyenNhieu` | `aggId` |
| `AggLuongTheoKinhNghiem` | `aggId` |
| `AggLuongTheoKyNang` | `aggId` |
| `AggLuongTheoViTri` | `aggId` |
| `AggNgonNguLapTrinh` | `aggId` |
| `AggSkillTheoViTri` | `aggId` |
| `AggThiTruongThanhPho` | `aggId` |
| `AggTopSkill` | `aggId` |
| `AggViecTheoDiaDiem` | `aggId` |
| `AggViTriTheoThanhPho` | `aggId` |
| `AggXuHuongTheoQuy` | `aggId` |
| `DimCapBac` | `capBacId` |
| `DimCongTy` | `congTyId` |
| `DimDiaDiem` | `diaDiemId` |
| `DimKyNang` | `kyNangId` |
| `DimThoiGian` | `thoiGianId` |
| `DimViTri` | `viTriId` |
| `FactTuyenDung` | `factId` |
| `FactTuyenDung_DiaDiem` | `(factId, diaDiemId)` |
| `FactTuyenDung_KyNang` | `(factId, kyNangId)` |

## 6. Foreign keys và relationship thật

| Bảng con | Cột | Bảng cha | Cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `FactTuyenDung` | `thoiGianId` | `DimThoiGian` | `thoiGianId` | Một fact thuộc một ngày/quý phân tích |
| `FactTuyenDung` | `viTriId` | `DimViTri` | `viTriId` | Một fact gắn tối đa một vị trí chuẩn hóa |
| `FactTuyenDung` | `capBacId` | `DimCapBac` | `capBacId` | Một fact gắn tối đa một cấp bậc |
| `FactTuyenDung` | `congTyId` | `DimCongTy` | `congTyId` | Một fact thuộc một công ty |
| `FactTuyenDung_DiaDiem` | `factId` | `FactTuyenDung` | `factId` | Bridge từ fact sang địa điểm |
| `FactTuyenDung_DiaDiem` | `diaDiemId` | `DimDiaDiem` | `diaDiemId` | Một fact có thể có nhiều địa điểm |
| `FactTuyenDung_KyNang` | `factId` | `FactTuyenDung` | `factId` | Bridge từ fact sang kỹ năng |
| `FactTuyenDung_KyNang` | `kyNangId` | `DimKyNang` | `kyNangId` | Một fact có thể yêu cầu nhiều kỹ năng |

Các bảng `Agg*` không có foreign key thật trong metadata. Quan hệ nghiệp vụ của chúng được suy ra từ tên/cột aggregate, nhưng relationship vật lý là `Chưa xác định`.

## 7. Fact, dimension và measure

| Bảng | Vai trò | Measure/thuộc tính phân tích |
| --- | --- | --- |
| `FactTuyenDung` | Fact chính, mỗi dòng tương ứng một tin tuyển dụng trong DW | `COUNT(*)`, `COUNT(DISTINCT tinTuyenDungId)`, `SUM(coLuong)`, `AVG(luongTrungBinh)`, `MIN(luongMin)`, `MAX(luongMax)`, `AVG(soNamKinhNghiem)` |
| `FactTuyenDung_DiaDiem` | Bridge fact - địa điểm | `COUNT(DISTINCT factId)` theo `DimDiaDiem` |
| `FactTuyenDung_KyNang` | Bridge fact - kỹ năng | `COUNT(DISTINCT factId)` theo `DimKyNang` |
| `DimThoiGian` | Dimension thời gian | `ngayDay`, `thang`, `quy`, `nam`, `nhanQuy` |
| `DimViTri` | Dimension vị trí | `tenViTriChuan` |
| `DimCapBac` | Dimension cấp bậc | `tenCapBac` |
| `DimCongTy` | Dimension công ty | `tenCongTy`, `linhVuc`, `quyMo` |
| `DimDiaDiem` | Dimension địa điểm | `tenThanhPho`, `tenPhuongXa` |
| `DimKyNang` | Dimension kỹ năng | `tenKyNang` |

## 8. Aggregate tables hữu ích cho dashboard

| Bảng | Metric chính | Filter thời gian |
| --- | --- | --- |
| `AggXuHuongTheoQuy` | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `soTinQuyTruoc`, `bienDong`, `phanTramThayDoi` | `nam`, `quy`, `nhanQuy` |
| `AggTopSkill` | `soTin`, `tyLeTheoTongTin`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggNgonNguLapTrinh` | `soTin`, `tyLeTheoTongTin`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggLuongTheoViTri` | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `luongMin`, `luongMax`, `kinhNghiemTB` | `nam`, `quy`, `nhanQuy` |
| `AggLuongTheoKinhNghiem` | `soTin`, `soTinCoLuong`, `luongTrungBinh` | `nam`, `quy`, `nhanQuy` |
| `AggLuongTheoKyNang` | `soTin`, `soTinCoLuong`, `luongTrungBinh` | `nam`, `quy`, `nhanQuy` |
| `AggViecTheoDiaDiem` | `soTin`, `luongTrungBinh`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggThiTruongThanhPho` | `soTin`, `luongTrungBinh`, `kinhNghiemTB`, `soViTriKhacNhau` | `nam`, `quy`, `nhanQuy` |
| `AggViTriTheoThanhPho` | `tenThanhPho`, `tenViTriChuan`, `soTin`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggSkillTheoViTri` | `tenViTriChuan`, `tenKyNang`, `soTin`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggCapBacTuyenDung` | `soTin`, `tyLe` | `nam`, `quy`, `nhanQuy` |
| `AggCongTyTuyenNhieu` | `soTin`, `xepHang`, `linhVuc`, `quyMo` | `nam`, `quy`, `nhanQuy` |

## 9. Business measures có thể hỗ trợ

| Nhu cầu phân tích từ `BTL CSDL.md` | Mức hỗ trợ | Bảng/cột dùng |
| --- | --- | --- |
| Mỗi quý có bao nhiêu tin tuyển dụng IT | Có | `AggXuHuongTheoQuy`, hoặc `FactTuyenDung` + `DimThoiGian` |
| Nhu cầu tuyển dụng tăng/giảm theo quý | Có cấu trúc, dữ liệu hiện chỉ có 1 quý | `AggXuHuongTheoQuy.bienDong`, `phanTramThayDoi` |
| Kỹ năng được yêu cầu nhiều nhất | Có | `AggTopSkill`, hoặc bridge `FactTuyenDung_KyNang` |
| Ngôn ngữ lập trình được yêu cầu nhiều nhất | Có qua aggregate | `AggNgonNguLapTrinh` |
| Vị trí đang hot/tuyển nhiều | Có | `AggLuongTheoViTri`, `AggViTriTheoThanhPho`, hoặc `FactTuyenDung` + `DimViTri` |
| Lương trung bình theo vị trí | Có | `AggLuongTheoViTri` |
| Lương trung bình theo kinh nghiệm | Có | `AggLuongTheoKinhNghiem` |
| Lương trung bình theo thành phố | Có | `AggViecTheoDiaDiem`, `AggThiTruongThanhPho` |
| Lương trung bình theo kỹ năng | Có | `AggLuongTheoKyNang` |
| Công ty tuyển nhiều nhất | Có | `AggCongTyTuyenNhieu` |
| Fresher/Junior/Middle/Senior chiếm tỷ lệ bao nhiêu | Có | `AggCapBacTuyenDung` |
| Kỹ năng phổ biến theo vị trí | Có | `AggSkillTheoViTri` |
| Vị trí phổ biến theo thành phố | Có | `AggViTriTheoThanhPho` |
| So sánh thị trường theo thành phố | Có | `AggThiTruongThanhPho` |
| Chi tiết bài đăng gồm title/link/mô tả/quyền lợi/yêu cầu | Không được DW hiện tại hỗ trợ | `FactTuyenDung` không có các cột text/link gốc |

## 10. Ghi chú giới hạn và điểm chưa rõ

- Live DW hiện chỉ có dữ liệu fact trong một quý `Q2-2026`, nên metric tăng/giảm theo quý có cột nhưng chưa đủ nhiều mốc thời gian để diễn giải xu hướng dài hạn.
- Một số bảng aggregate có cả dòng `ALL` (`nam`, `quy` NULL) và dòng theo quý. API cần quy ước rõ khi nào dùng tổng toàn bộ và khi nào filter theo năm/quý.
- `FactTuyenDung` không có `linkBaiDang`, `tieuDeCongViec`, `moTa`, `yeuCau`, `quyenLoi`, `hanNopHoSo`, nên không nên đề xuất API chi tiết bài đăng nếu chỉ dựa vào DW.
- `DimCongTy` không có `linkCongTy`; không nên trả link công ty trong API dashboard.
- `DimKyNang` không có cột phân loại kỹ năng/ngôn ngữ. Endpoint ngôn ngữ nên dùng `AggNgonNguLapTrinh`, không tự suy diễn từ tên kỹ năng.
- Các bảng aggregate không có FK vật lý, nên lineage ETL từ aggregate về fact/dimension là `Chưa xác định` trong schema metadata.
- `coLuong` là `int`; ý nghĩa nghiệp vụ đang được sử dụng như flag có lương (`1` là có lương) dựa trên tên cột và aggregate `soTinCoLuong`. Các giá trị khác ngoài 0/1 nếu có là `Chưa xác định`.
- Đơn vị lương không được lưu trong schema. Theo `BTL CSDL.md`, lương chuẩn hóa là triệu VNĐ; API nên ghi chú đơn vị này trong tài liệu/response.
