USE JobDW;
GO

-- ================================================================
-- FILE: 07_create_indexes.sql
-- Mục đích: Tạo indexes để cải thiện hiệu suất truy vấn
-- Ghi chú: Chạy SAU khi đã load dữ liệu (sau 06_check_output.sql)
--          SQL Server Query Optimizer tự động sử dụng các index này
-- ================================================================


-- ================================================================
-- 1. FACT TABLE - Foreign Key Indexes (Ưu tiên CAO)
--    Mọi query analytics đều JOIN qua các FK này
-- ================================================================

PRINT N'[1/5] Tạo FK indexes trên FactTuyenDung...';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactTuyenDung_thoiGianId' AND object_id = OBJECT_ID('FactTuyenDung'))
    CREATE NONCLUSTERED INDEX IX_FactTuyenDung_thoiGianId
        ON FactTuyenDung(thoiGianId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactTuyenDung_viTriId' AND object_id = OBJECT_ID('FactTuyenDung'))
    CREATE NONCLUSTERED INDEX IX_FactTuyenDung_viTriId
        ON FactTuyenDung(viTriId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactTuyenDung_capBacId' AND object_id = OBJECT_ID('FactTuyenDung'))
    CREATE NONCLUSTERED INDEX IX_FactTuyenDung_capBacId
        ON FactTuyenDung(capBacId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactTuyenDung_congTyId' AND object_id = OBJECT_ID('FactTuyenDung'))
    CREATE NONCLUSTERED INDEX IX_FactTuyenDung_congTyId
        ON FactTuyenDung(congTyId);

PRINT N'    → FK indexes hoàn thành';
GO


-- ================================================================
-- 2. BRIDGE TABLES - Reverse Indexes (Ưu tiên CAO)
--    PK (factId, kyNangId) tối ưu cho "tìm kỹ năng theo job"
--    Reverse index tối ưu cho "tìm job theo kỹ năng/địa điểm"
-- ================================================================

PRINT N'[2/5] Tạo reverse indexes trên bridge tables...';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactKyNang_kyNangId' AND object_id = OBJECT_ID('FactTuyenDung_KyNang'))
    CREATE NONCLUSTERED INDEX IX_FactKyNang_kyNangId
        ON FactTuyenDung_KyNang(kyNangId, factId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactDiaDiem_diaDiemId' AND object_id = OBJECT_ID('FactTuyenDung_DiaDiem'))
    CREATE NONCLUSTERED INDEX IX_FactDiaDiem_diaDiemId
        ON FactTuyenDung_DiaDiem(diaDiemId, factId);

PRINT N'    → Reverse indexes hoàn thành';
GO


-- ================================================================
-- 3. DIMENSION TABLES - Name Indexes (Ưu tiên TRUNG BÌNH)
--    Hỗ trợ filter theo tên, ORDER BY, và covering
-- ================================================================

PRINT N'[3/5] Tạo indexes trên dimension tables...';

-- DimViTri: dùng trong LIKE filter + exact match
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DimViTri_tenViTriChuan' AND object_id = OBJECT_ID('DimViTri'))
    CREATE NONCLUSTERED INDEX IX_DimViTri_tenViTriChuan
        ON DimViTri(tenViTriChuan);

-- DimKyNang: dùng trong LIKE filter + exact match
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DimKyNang_tenKyNang' AND object_id = OBJECT_ID('DimKyNang'))
    CREATE NONCLUSTERED INDEX IX_DimKyNang_tenKyNang
        ON DimKyNang(tenKyNang);

-- DimDiaDiem: filter theo thành phố, covering phường/xã
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DimDiaDiem_tenThanhPho' AND object_id = OBJECT_ID('DimDiaDiem'))
    CREATE NONCLUSTERED INDEX IX_DimDiaDiem_tenThanhPho
        ON DimDiaDiem(tenThanhPho)
        INCLUDE (tenPhuongXa);

-- DimCongTy: filter theo tên, covering lĩnh vực + quy mô
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DimCongTy_tenCongTy' AND object_id = OBJECT_ID('DimCongTy'))
    CREATE NONCLUSTERED INDEX IX_DimCongTy_tenCongTy
        ON DimCongTy(tenCongTy)
        INCLUDE (linhVuc, quyMo);

-- DimThoiGian: filter theo năm + quý
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DimThoiGian_nam_quy' AND object_id = OBJECT_ID('DimThoiGian'))
    CREATE NONCLUSTERED INDEX IX_DimThoiGian_nam_quy
        ON DimThoiGian(nam, quy)
        INCLUDE (thang, nhanQuy);

PRINT N'    → Dimension indexes hoàn thành';
GO


-- ================================================================
-- 4. AGGREGATE TABLES - nhanQuy Indexes (Ưu tiên TRUNG BÌNH)
--    Mọi query Agg đều filter theo nhanQuy
--    Dùng covering index để tránh key lookup
-- ================================================================

PRINT N'[4/5] Tạo indexes trên aggregate tables...';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggTopSkill_nhanQuy' AND object_id = OBJECT_ID('AggTopSkill'))
    CREATE NONCLUSTERED INDEX IX_AggTopSkill_nhanQuy
        ON AggTopSkill(nhanQuy)
        INCLUDE (xepHang, tenKyNang, soTin, tyLeTheoTongTin);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggNgonNguLapTrinh_nhanQuy' AND object_id = OBJECT_ID('AggNgonNguLapTrinh'))
    CREATE NONCLUSTERED INDEX IX_AggNgonNguLapTrinh_nhanQuy
        ON AggNgonNguLapTrinh(nhanQuy)
        INCLUDE (xepHang, ngonNgu, soTin, tyLeTheoTongTin);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggLuongTheoViTri_nhanQuy' AND object_id = OBJECT_ID('AggLuongTheoViTri'))
    CREATE NONCLUSTERED INDEX IX_AggLuongTheoViTri_nhanQuy
        ON AggLuongTheoViTri(nhanQuy)
        INCLUDE (tenViTriChuan, soTin, soTinCoLuong, luongTrungBinh, luongMin, luongMax, kinhNghiemTB);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggCongTyTuyenNhieu_nhanQuy' AND object_id = OBJECT_ID('AggCongTyTuyenNhieu'))
    CREATE NONCLUSTERED INDEX IX_AggCongTyTuyenNhieu_nhanQuy
        ON AggCongTyTuyenNhieu(nhanQuy)
        INCLUDE (xepHang, tenCongTy, linhVuc, quyMo, soTin);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggViecTheoDiaDiem_nhanQuy' AND object_id = OBJECT_ID('AggViecTheoDiaDiem'))
    CREATE NONCLUSTERED INDEX IX_AggViecTheoDiaDiem_nhanQuy
        ON AggViecTheoDiaDiem(nhanQuy)
        INCLUDE (xepHang, tenThanhPho, soTin, luongTrungBinh);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggThiTruongThanhPho_nhanQuy' AND object_id = OBJECT_ID('AggThiTruongThanhPho'))
    CREATE NONCLUSTERED INDEX IX_AggThiTruongThanhPho_nhanQuy
        ON AggThiTruongThanhPho(nhanQuy)
        INCLUDE (tenThanhPho, soTin, luongTrungBinh, kinhNghiemTB, soViTriKhacNhau);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggLuongTheoKyNang_nhanQuy' AND object_id = OBJECT_ID('AggLuongTheoKyNang'))
    CREATE NONCLUSTERED INDEX IX_AggLuongTheoKyNang_nhanQuy
        ON AggLuongTheoKyNang(nhanQuy)
        INCLUDE (tenKyNang, soTin, soTinCoLuong, luongTrungBinh);

PRINT N'    → Aggregate indexes hoàn thành';
GO


-- ================================================================
-- 5. AGGREGATE TABLES - Composite Indexes (Ưu tiên TRUNG BÌNH)
--    Cho các query filter theo nhanQuy + tên cụ thể
-- ================================================================

PRINT N'[5/5] Tạo composite indexes trên aggregate tables...';

-- AggSkillTheoViTri: query luôn filter theo nhanQuy + tenViTriChuan
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggSkillTheoViTri_lookup' AND object_id = OBJECT_ID('AggSkillTheoViTri'))
    CREATE NONCLUSTERED INDEX IX_AggSkillTheoViTri_lookup
        ON AggSkillTheoViTri(nhanQuy, tenViTriChuan)
        INCLUDE (xepHang, tenKyNang, soTin);

-- AggViTriTheoThanhPho: query filter theo nhanQuy + tenThanhPho
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AggViTriTheoThanhPho_lookup' AND object_id = OBJECT_ID('AggViTriTheoThanhPho'))
    CREATE NONCLUSTERED INDEX IX_AggViTriTheoThanhPho_lookup
        ON AggViTriTheoThanhPho(nhanQuy, tenThanhPho)
        INCLUDE (xepHang, tenViTriChuan, soTin);

PRINT N'    → Composite indexes hoàn thành';
GO


PRINT N'';
PRINT N'================================================================';
PRINT N'HOÀN THÀNH TẠO INDEXES CHO JobDW';
PRINT N'Tổng cộng: 22 indexes';
PRINT N'  - 4 FK indexes trên FactTuyenDung';
PRINT N'  - 2 reverse indexes trên bridge tables';
PRINT N'  - 5 indexes trên dimension tables';
PRINT N'  - 9 indexes trên aggregate tables';
PRINT N'  - 2 composite indexes trên aggregate tables';
PRINT N'================================================================';
GO
