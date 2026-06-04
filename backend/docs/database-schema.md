# Tài liệu schema JobDW

## 1. Tổng quan database

Database được kiểm tra trực tiếp qua `.env` của backend.

| Thuộc tính | Giá trị |
| --- | --- |
| Database | `JobDW` |
| SQL Server | Microsoft SQL Server 2022 Developer Edition |
| Mục tiêu nghiệp vụ | Phân tích thị trường tuyển dụng IT tại Việt Nam từ dữ liệu tin tuyển dụng TopCV |
| Mô hình chính | Data Warehouse dạng fact/dimension, có thêm bảng aggregate phục vụ dashboard |
| Số bảng/view-object | 19 |
| Số cột | 123 |
| Số khóa ngoại | 8 |
| View | Chưa phát hiện view trong metadata, toàn bộ object hiện là user table |

Coverage dữ liệu hiện tại:

| Chỉ số | Giá trị |
| --- | ---: |
| Số dòng `FactTuyenDung` | 3.611 |
| Số tin có lương (`coLuong = 1`) | 2.187 |
| Ngày nhỏ nhất trong `DimThoiGian` gắn với fact | 14/05/2026 |
| Ngày lớn nhất trong `DimThoiGian` gắn với fact | 21/05/2026 |
| Số quý hiện có dữ liệu fact | 1 (`Q2-2026`) |
| Số vị trí có dữ liệu fact | 136 |
| Số cấp bậc có dữ liệu fact | 8 |
| Số công ty có dữ liệu fact | 1.966 |

## 2. Danh sách bảng và row count

| Bảng | Loại nhận diện | Số dòng | Ghi chú |
| --- | --- | ---: | --- |
| `AggCapBacTuyenDung` | Aggregate | 16 | Phân bố tuyển dụng theo cấp bậc và quý |
| `AggCongTyTuyenNhieu` | Aggregate | 3.932 | Công ty tuyển nhiều theo quý |
| `AggLuongTheoKinhNghiem` | Aggregate | 8 | Lương theo nhóm kinh nghiệm |
| `AggLuongTheoViTri` | Aggregate | 150 | Lương và kinh nghiệm theo vị trí |
| `AggNgonNguLapTrinh` | Aggregate | 20 | Top ngôn ngữ lập trình |
| `AggThiTruongThanhPho` | Aggregate | 72 | So sánh thị trường theo thành phố |
| `AggTopSkill` | Aggregate | 214 | Top kỹ năng theo quý |
| `AggViecTheoDiaDiem` | Aggregate | 72 | Số tin và lương theo thành phố |
| `AggXuHuongTheoQuy` | Aggregate | 1 | Xu hướng theo quý, hiện chỉ có `Q2-2026` |
| `DimCapBac` | Dimension | 8 | Cấp bậc công việc |
| `DimCongTy` | Dimension | 2.183 | Công ty |
| `DimDiaDiem` | Dimension | 515 | Thành phố/phường xã |
| `DimKyNang` | Dimension | 108 | Kỹ năng |
| `DimThoiGian` | Dimension | 13 | Ngày, tháng, quý, năm |
| `DimViTri` | Dimension | 142 | Vị trí chuẩn hóa |
| `FactTuyenDung` | Fact | 3.611 | Fact chính cho tin tuyển dụng |
| `FactTuyenDung_Backup_BeforeSalaryFix` | Backup | 3.611 | Bảng backup, không nên dùng cho API dashboard |
| `FactTuyenDung_DiaDiem` | Bridge fact-dimension | 4.410 | Quan hệ nhiều-nhiều giữa fact và địa điểm |
| `FactTuyenDung_KyNang` | Bridge fact-dimension | 7.988 | Quan hệ nhiều-nhiều giữa fact và kỹ năng |

## 3. Cột và kiểu dữ liệu

### Bảng aggregate

| Bảng | Cột |
| --- | --- |
| `AggCapBacTuyenDung` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenCapBac nvarchar(100) NOT NULL`, `soTin int NOT NULL`, `tyLe decimal(5,2) NOT NULL` |
| `AggCongTyTuyenNhieu` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenCongTy nvarchar(400) NOT NULL`, `linhVuc nvarchar(200) NULL`, `quyMo nvarchar(100) NULL`, `soTin int NOT NULL`, `xepHang int NOT NULL` |
| `AggLuongTheoKinhNghiem` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `nhomKinhNghiem nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL` |
| `AggLuongTheoViTri` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenViTriChuan nvarchar(400) NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `luongMin decimal(10,2) NULL`, `luongMax decimal(10,2) NULL`, `kinhNghiemTB decimal(4,1) NULL` |
| `AggNgonNguLapTrinh` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `ngonNgu nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `tyLeTheoTongTin decimal(5,2) NULL`, `xepHang int NOT NULL` |
| `AggThiTruongThanhPho` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenThanhPho nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `kinhNghiemTB decimal(4,1) NULL`, `soViTriKhacNhau int NULL` |
| `AggTopSkill` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenKyNang nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `tyLeTheoTongTin decimal(5,2) NULL`, `xepHang int NOT NULL` |
| `AggViecTheoDiaDiem` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NULL`, `quy int NULL`, `tenThanhPho nvarchar(200) NOT NULL`, `soTin int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `xepHang int NOT NULL` |
| `AggXuHuongTheoQuy` | `aggId int NOT NULL IDENTITY`, `nhanQuy varchar(10) NOT NULL`, `nam int NOT NULL`, `quy int NOT NULL`, `soTin int NOT NULL`, `soTinCoLuong int NOT NULL`, `luongTrungBinh decimal(10,2) NULL`, `soTinQuyTruoc int NULL`, `bienDong int NULL`, `phanTramThayDoi decimal(5,2) NULL` |

### Bảng dimension

| Bảng | Cột |
| --- | --- |
| `DimCapBac` | `capBacId int NOT NULL`, `tenCapBac nvarchar(100) NOT NULL` |
| `DimCongTy` | `congTyId int NOT NULL`, `tenCongTy nvarchar(400) NOT NULL`, `linhVuc nvarchar(200) NULL`, `quyMo nvarchar(100) NULL` |
| `DimDiaDiem` | `diaDiemId int NOT NULL`, `tenThanhPho nvarchar(200) NOT NULL`, `tenPhuongXa nvarchar(200) NULL` |
| `DimKyNang` | `kyNangId int NOT NULL`, `tenKyNang nvarchar(200) NOT NULL` |
| `DimThoiGian` | `thoiGianId int NOT NULL IDENTITY`, `ngayDay date NOT NULL`, `thang int NOT NULL`, `quy int NOT NULL`, `nam int NOT NULL`, `nhanQuy varchar(10) NOT NULL` |
| `DimViTri` | `viTriId int NOT NULL`, `tenViTriChuan nvarchar(400) NOT NULL` |

### Bảng fact và bridge

| Bảng | Cột |
| --- | --- |
| `FactTuyenDung` | `factId int NOT NULL IDENTITY`, `tinTuyenDungId int NOT NULL`, `thoiGianId int NOT NULL`, `viTriId int NULL`, `capBacId int NULL`, `congTyId int NOT NULL`, `luongMin decimal(10,2) NULL`, `luongMax decimal(10,2) NULL`, `luongTrungBinh numeric(16,6) NULL`, `soNamKinhNghiem decimal(4,1) NULL`, `coLuong int NOT NULL` |
| `FactTuyenDung_Backup_BeforeSalaryFix` | Cùng cấu trúc với `FactTuyenDung`, là bảng backup trước khi sửa lương |
| `FactTuyenDung_DiaDiem` | `factId int NOT NULL`, `diaDiemId int NOT NULL` |
| `FactTuyenDung_KyNang` | `factId int NOT NULL`, `kyNangId int NOT NULL` |

## 4. Khóa chính

| Bảng | Khóa chính |
| --- | --- |
| `AggCapBacTuyenDung` | `aggId` |
| `AggCongTyTuyenNhieu` | `aggId` |
| `AggLuongTheoKinhNghiem` | `aggId` |
| `AggLuongTheoViTri` | `aggId` |
| `AggNgonNguLapTrinh` | `aggId` |
| `AggThiTruongThanhPho` | `aggId` |
| `AggTopSkill` | `aggId` |
| `AggViecTheoDiaDiem` | `aggId` |
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

## 5. Khóa ngoại và quan hệ

| Bảng con | Cột | Bảng cha | Cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `FactTuyenDung` | `thoiGianId` | `DimThoiGian` | `thoiGianId` | Một tin tuyển dụng thuộc một ngày/quý phân tích |
| `FactTuyenDung` | `viTriId` | `DimViTri` | `viTriId` | Một tin gắn tối đa một vị trí chuẩn hóa |
| `FactTuyenDung` | `capBacId` | `DimCapBac` | `capBacId` | Một tin gắn tối đa một cấp bậc |
| `FactTuyenDung` | `congTyId` | `DimCongTy` | `congTyId` | Một tin thuộc một công ty |
| `FactTuyenDung_DiaDiem` | `factId` | `FactTuyenDung` | `factId` | Bridge từ tin tuyển dụng sang địa điểm |
| `FactTuyenDung_DiaDiem` | `diaDiemId` | `DimDiaDiem` | `diaDiemId` | Một tin có thể có nhiều địa điểm |
| `FactTuyenDung_KyNang` | `factId` | `FactTuyenDung` | `factId` | Bridge từ tin tuyển dụng sang kỹ năng |
| `FactTuyenDung_KyNang` | `kyNangId` | `DimKyNang` | `kyNangId` | Một tin có thể yêu cầu nhiều kỹ năng |

Quan hệ thực tế khớp với yêu cầu nghiệp vụ trong `BTL CSDL.md`: công ty/vị trí/cấp bậc là quan hệ 1-n với tin tuyển dụng; kỹ năng và địa điểm là quan hệ n-n thông qua bảng bridge.

## 6. Fact tables

| Bảng | Vai trò | Measure khả dụng |
| --- | --- | --- |
| `FactTuyenDung` | Fact chính, mỗi dòng tương ứng một tin tuyển dụng trong DW | `COUNT(*)`, `COUNT(DISTINCT tinTuyenDungId)`, `AVG(luongTrungBinh)`, `MIN(luongMin)`, `MAX(luongMax)`, `AVG(soNamKinhNghiem)`, `SUM(coLuong)` |
| `FactTuyenDung_DiaDiem` | Bridge để phân tích theo thành phố/phường xã | `COUNT(DISTINCT factId)` theo `DimDiaDiem` |
| `FactTuyenDung_KyNang` | Bridge để phân tích theo kỹ năng/ngôn ngữ | `COUNT(DISTINCT factId)` theo `DimKyNang` |

Không nên dùng `FactTuyenDung_Backup_BeforeSalaryFix` cho API vì đây là bảng backup trước khi sửa lương, dễ gây sai lệch so với fact chính.

## 7. Dimension tables

| Bảng | Dimension | Thuộc tính phân tích |
| --- | --- | --- |
| `DimThoiGian` | Thời gian | `ngayDay`, `thang`, `quy`, `nam`, `nhanQuy` |
| `DimViTri` | Vị trí công việc | `tenViTriChuan` |
| `DimCapBac` | Cấp bậc | `tenCapBac` |
| `DimCongTy` | Công ty | `tenCongTy`, `linhVuc`, `quyMo` |
| `DimDiaDiem` | Địa điểm | `tenThanhPho`, `tenPhuongXa` |
| `DimKyNang` | Kỹ năng | `tenKyNang` |

## 8. Bảng aggregate hữu ích cho dashboard

Các bảng `Agg*` đã có sẵn metric tổng hợp và có thể dùng cho endpoint dashboard cần tốc độ cao:

| Bảng | Metric chính | Filter thời gian |
| --- | --- | --- |
| `AggXuHuongTheoQuy` | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `bienDong`, `phanTramThayDoi` | `nam`, `quy`, `nhanQuy` |
| `AggTopSkill` | `soTin`, `tyLeTheoTongTin`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggNgonNguLapTrinh` | `soTin`, `tyLeTheoTongTin`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggLuongTheoViTri` | `soTin`, `soTinCoLuong`, `luongTrungBinh`, `luongMin`, `luongMax`, `kinhNghiemTB` | `nam`, `quy`, `nhanQuy` |
| `AggLuongTheoKinhNghiem` | `soTin`, `soTinCoLuong`, `luongTrungBinh` | `nam`, `quy`, `nhanQuy` |
| `AggViecTheoDiaDiem` | `soTin`, `luongTrungBinh`, `xepHang` | `nam`, `quy`, `nhanQuy` |
| `AggThiTruongThanhPho` | `soTin`, `luongTrungBinh`, `kinhNghiemTB`, `soViTriKhacNhau` | `nam`, `quy`, `nhanQuy` |
| `AggCapBacTuyenDung` | `soTin`, `tyLe` | `nam`, `quy`, `nhanQuy` |
| `AggCongTyTuyenNhieu` | `soTin`, `xepHang`, `linhVuc`, `quyMo` | `nam`, `quy`, `nhanQuy` |

## 9. Index hữu ích

| Bảng | Index | Loại | Cột |
| --- | --- | --- | --- |
| `FactTuyenDung` | PK clustered | Unique | `factId` |
| `FactTuyenDung` | Unique nonclustered | Unique | `tinTuyenDungId` |
| `FactTuyenDung_DiaDiem` | PK clustered | Unique | `factId, diaDiemId` |
| `FactTuyenDung_KyNang` | PK clustered | Unique | `factId, kyNangId` |
| `DimThoiGian` | Unique nonclustered | Unique | `ngayDay` |
| `AggXuHuongTheoQuy` | Unique nonclustered | Unique | `nhanQuy` |
| Các bảng dimension và aggregate còn lại | PK clustered | Unique | Khóa chính từng bảng |

Ghi chú: metadata hiện chưa cho thấy index riêng trên các khóa ngoại như `thoiGianId`, `viTriId`, `congTyId`, `kyNangId`, `diaDiemId`. Nếu dữ liệu tăng lớn, các truy vấn phân tích filter/join nhiều có thể cần bổ sung index sau khi đo hiệu năng.

## 10. Business measures có thể hỗ trợ

Schema hiện hỗ trợ trực tiếp các nhóm phân tích sau:

| Nhu cầu phân tích | Mức hỗ trợ | Bảng/cột dùng |
| --- | --- | --- |
| Tổng số tin tuyển dụng theo thời gian | Có | `FactTuyenDung`, `DimThoiGian`, `AggXuHuongTheoQuy` |
| Top kỹ năng được yêu cầu nhiều nhất | Có | `FactTuyenDung_KyNang`, `DimKyNang`, `AggTopSkill` |
| Top ngôn ngữ lập trình | Có qua aggregate | `AggNgonNguLapTrinh` |
| Vị trí tuyển nhiều nhất | Có | `FactTuyenDung`, `DimViTri`, `AggLuongTheoViTri` |
| Lương trung bình theo vị trí | Có | `FactTuyenDung.luongTrungBinh`, `AggLuongTheoViTri` |
| Lương theo nhóm kinh nghiệm | Có qua aggregate | `AggLuongTheoKinhNghiem` |
| Lương theo thành phố | Có | `FactTuyenDung`, `FactTuyenDung_DiaDiem`, `DimDiaDiem`, `AggViecTheoDiaDiem`, `AggThiTruongThanhPho` |
| Công ty tuyển nhiều nhất | Có | `FactTuyenDung`, `DimCongTy`, `AggCongTyTuyenNhieu` |
| Phân bố cấp bậc | Có | `FactTuyenDung`, `DimCapBac`, `AggCapBacTuyenDung` |
| So sánh thị trường theo thành phố | Có | `AggThiTruongThanhPho`, hoặc join fact với địa điểm |
| Kỹ năng thường xuất hiện cùng nhau | Có thể tính từ bridge | Self-join `FactTuyenDung_KyNang` theo `factId` |

## 11. Giới hạn schema và dữ liệu

- DW hiện chỉ có dữ liệu fact trong một quý (`Q2-2026`), nên các API xu hướng tăng/giảm theo quý sẽ trả được cấu trúc nhưng chưa có nhiều điểm thời gian để so sánh có ý nghĩa.
- `AggXuHuongTheoQuy` hiện chỉ có 1 dòng, các cột `soTinQuyTruoc`, `bienDong`, `phanTramThayDoi` có thể null vì chưa có quý trước.
- `FactTuyenDung` không có các cột text gốc như `tieuDeCongViec`, `linkBaiDang`, `moTa`, `yeuCau`, `quyenLoi`; backend dashboard không nên đề xuất API chi tiết bài đăng nếu chỉ dựa trên DW này.
- `DimCongTy` không có `linkCongTy`; API không nên trả link công ty.
- `DimDiaDiem` có `tenPhuongXa`, nhưng các bảng aggregate địa điểm chỉ tổng hợp theo `tenThanhPho`; phân tích theo phường/xã cần truy vấn từ fact/bridge thay vì dùng aggregate.
- `DimKyNang` không có cột phân loại kỹ năng/ngôn ngữ. Bảng `AggNgonNguLapTrinh` có sẵn `ngonNgu`, nên endpoint ngôn ngữ nên dựa vào aggregate này thay vì tự suy diễn từ tên kỹ năng.
- Lương bằng `luongTrungBinh` chỉ nên tính trên tin có `coLuong = 1` để tránh làm lệch bởi tin không công khai lương.
- Không phát hiện bảng user/authentication. Điều này phù hợp yêu cầu hiện tại: không login, không JWT, không phân quyền.
