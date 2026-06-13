USE JobDW;
GO

CREATE OR ALTER PROCEDURE ETL_LoadAggTables
    @nam INT = NULL,
    @quy INT = NULL
AS
BEGIN
    DECLARE @nhanQuy VARCHAR(10);

    IF @nam IS NULL OR @quy IS NULL
        SET @nhanQuy = 'ALL';
    ELSE
        SET @nhanQuy = 'Q' + CAST(@quy AS VARCHAR) + '-' + CAST(@nam AS VARCHAR);

    DELETE FROM AggTopSkill WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggNgonNguLapTrinh WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggLuongTheoViTri WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggLuongTheoKinhNghiem WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggCongTyTuyenNhieu WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggViecTheoDiaDiem WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggCapBacTuyenDung WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggThiTruongThanhPho WHERE nhanQuy = @nhanQuy;

    DECLARE @tongTin INT;

    SELECT @tongTin = COUNT(*)
    FROM FactTuyenDung f
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy));

    ;WITH SkillCTE AS (
        SELECT
            dk.tenKyNang,
            COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
        JOIN FactTuyenDung_KyNang fk ON fk.factId = f.factId
        JOIN DimKyNang dk ON dk.kyNangId = fk.kyNangId
        WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
        GROUP BY dk.tenKyNang
    )
    INSERT INTO AggTopSkill (
        nhanQuy, nam, quy, tenKyNang, soTin, tyLeTheoTongTin, xepHang
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        tenKyNang,
        soTin,
        CAST(soTin * 100.0 / NULLIF(@tongTin, 0) AS DECIMAL(5,2)),
        RANK() OVER (ORDER BY soTin DESC)
    FROM SkillCTE;

    ;WITH NgonNguCTE AS (
        SELECT
            dk.tenKyNang AS ngonNgu,
            COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
        JOIN FactTuyenDung_KyNang fk ON fk.factId = f.factId
        JOIN DimKyNang dk ON dk.kyNangId = fk.kyNangId
        WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
          AND dk.tenKyNang IN (
              N'Python', N'Java', N'JavaScript', N'TypeScript',
              N'C#', N'C++', N'C', N'PHP', N'Go',
              N'Kotlin', N'Swift', N'Ruby', N'SQL'
          )
        GROUP BY dk.tenKyNang
    )
    INSERT INTO AggNgonNguLapTrinh (
        nhanQuy, nam, quy, ngonNgu, soTin, tyLeTheoTongTin, xepHang
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        ngonNgu,
        soTin,
        CAST(soTin * 100.0 / NULLIF(@tongTin, 0) AS DECIMAL(5,2)),
        RANK() OVER (ORDER BY soTin DESC)
    FROM NgonNguCTE;

    INSERT INTO AggLuongTheoViTri (
        nhanQuy, nam, quy, tenViTriChuan, soTin, soTinCoLuong,
        luongTrungBinh, luongMin, luongMax, kinhNghiemTB
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        dv.tenViTriChuan,
        COUNT(*) AS soTin,
        SUM(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN 1 ELSE 0 END) AS soTinCoLuong,
        CAST(AVG(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN f.luongTrungBinh END) AS DECIMAL(10,2)),
        MIN(CASE WHEN f.luongMin BETWEEN 1 AND 300 THEN f.luongMin END),
        MAX(CASE WHEN f.luongMax BETWEEN 1 AND 300 THEN f.luongMax END),
        CAST(AVG(CASE WHEN f.soNamKinhNghiem > 0 THEN f.soNamKinhNghiem END) AS DECIMAL(4,1))
    FROM FactTuyenDung f
    JOIN DimViTri dv ON dv.viTriId = f.viTriId
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY dv.tenViTriChuan;

    INSERT INTO AggLuongTheoKinhNghiem (
        nhanQuy, nam, quy, nhomKinhNghiem, soTin, soTinCoLuong, luongTrungBinh
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        CASE
            WHEN f.soNamKinhNghiem = 0 THEN N'Không yêu cầu / Fresher'
            WHEN f.soNamKinhNghiem BETWEEN 1 AND 2 THEN N'1-2 năm'
            WHEN f.soNamKinhNghiem BETWEEN 3 AND 4 THEN N'3-4 năm'
            ELSE N'Từ 5 năm trở lên'
        END,
        COUNT(*),
        SUM(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN 1 ELSE 0 END),
        CAST(AVG(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN f.luongTrungBinh END) AS DECIMAL(10,2))
    FROM FactTuyenDung f
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY
        CASE
            WHEN f.soNamKinhNghiem = 0 THEN N'Không yêu cầu / Fresher'
            WHEN f.soNamKinhNghiem BETWEEN 1 AND 2 THEN N'1-2 năm'
            WHEN f.soNamKinhNghiem BETWEEN 3 AND 4 THEN N'3-4 năm'
            ELSE N'Từ 5 năm trở lên'
        END;

    INSERT INTO AggCongTyTuyenNhieu (
        nhanQuy, nam, quy, tenCongTy, linhVuc, quyMo, soTin, xepHang
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        dc.tenCongTy,
        dc.linhVuc,
        dc.quyMo,
        COUNT(*),
        RANK() OVER (ORDER BY COUNT(*) DESC)
    FROM FactTuyenDung f
    JOIN DimCongTy dc ON dc.congTyId = f.congTyId
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY dc.tenCongTy, dc.linhVuc, dc.quyMo;

    INSERT INTO AggViecTheoDiaDiem (
        nhanQuy, nam, quy, tenThanhPho, soTin, luongTrungBinh, xepHang
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        dd.tenThanhPho,
        COUNT(DISTINCT f.factId),
        CAST(AVG(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN f.luongTrungBinh END) AS DECIMAL(10,2)),
        RANK() OVER (ORDER BY COUNT(DISTINCT f.factId) DESC)
    FROM FactTuyenDung f
    JOIN FactTuyenDung_DiaDiem fd ON fd.factId = f.factId
    JOIN DimDiaDiem dd ON dd.diaDiemId = fd.diaDiemId
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY dd.tenThanhPho;

    INSERT INTO AggCapBacTuyenDung (
        nhanQuy, nam, quy, tenCapBac, soTin, tyLe
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        dc.tenCapBac,
        COUNT(*),
        CAST(COUNT(*) * 100.0 / NULLIF(@tongTin, 0) AS DECIMAL(5,2))
    FROM FactTuyenDung f
    JOIN DimCapBac dc ON dc.capBacId = f.capBacId
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY dc.tenCapBac;

    INSERT INTO AggThiTruongThanhPho (
        nhanQuy, nam, quy, tenThanhPho, soTin, luongTrungBinh, kinhNghiemTB, soViTriKhacNhau
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        dd.tenThanhPho,
        COUNT(DISTINCT f.factId),
        CAST(AVG(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN f.luongTrungBinh END) AS DECIMAL(10,2)),
        CAST(AVG(CASE WHEN f.soNamKinhNghiem > 0 THEN f.soNamKinhNghiem END) AS DECIMAL(4,1)),
        COUNT(DISTINCT f.viTriId)
    FROM FactTuyenDung f
    JOIN FactTuyenDung_DiaDiem fd ON fd.factId = f.factId
    JOIN DimDiaDiem dd ON dd.diaDiemId = fd.diaDiemId
    JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY dd.tenThanhPho;

    PRINT 'ETL_LoadAggTables hoan thanh: ' + @nhanQuy;
END;
GO

CREATE OR ALTER PROCEDURE ETL_LoadAggXuHuong
AS
BEGIN
    DELETE FROM AggXuHuongTheoQuy;

    ;WITH Base AS (
        SELECT
            dt.nhanQuy,
            dt.nam,
            dt.quy,
            COUNT(*) AS soTin,
            SUM(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN 1 ELSE 0 END) AS soTinCoLuong,
            CAST(AVG(CASE WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN f.luongTrungBinh END) AS DECIMAL(10,2)) AS luongTrungBinh
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON dt.thoiGianId = f.thoiGianId
        GROUP BY dt.nhanQuy, dt.nam, dt.quy
    ),
    Growth AS (
        SELECT
            nhanQuy,
            nam,
            quy,
            soTin,
            soTinCoLuong,
            luongTrungBinh,
            LAG(soTin) OVER (ORDER BY nam, quy) AS soTinQuyTruoc
        FROM Base
    )
    INSERT INTO AggXuHuongTheoQuy (
        nhanQuy,
        nam,
        quy,
        soTin,
        soTinCoLuong,
        luongTrungBinh,
        soTinQuyTruoc,
        bienDong,
        phanTramThayDoi
    )
    SELECT
        nhanQuy,
        nam,
        quy,
        soTin,
        soTinCoLuong,
        luongTrungBinh,
        soTinQuyTruoc,
        soTin - soTinQuyTruoc,
        CAST((soTin - soTinQuyTruoc) * 100.0 / NULLIF(soTinQuyTruoc, 0) AS DECIMAL(5,2))
    FROM Growth;

    PRINT 'ETL_LoadAggXuHuong hoan thanh';
END;
GO
CREATE OR ALTER PROCEDURE ETL_LoadExtraAggTables
    @nam INT = NULL,
    @quy INT = NULL
AS
BEGIN
    DECLARE @nhanQuy VARCHAR(10);

    IF @nam IS NULL OR @quy IS NULL
        SET @nhanQuy = 'ALL';
    ELSE
        SET @nhanQuy = 'Q' + CAST(@quy AS VARCHAR) + '-' + CAST(@nam AS VARCHAR);

    DELETE FROM AggSkillTheoViTri WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggLuongTheoKyNang WHERE nhanQuy = @nhanQuy;
    DELETE FROM AggViTriTheoThanhPho WHERE nhanQuy = @nhanQuy;

    ;WITH SkillPosition AS (
        SELECT
            @nhanQuy AS nhanQuy,
            @nam AS nam,
            @quy AS quy,
            dv.tenViTriChuan,
            dk.tenKyNang,
            COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt 
            ON dt.thoiGianId = f.thoiGianId
        JOIN DimViTri dv 
            ON dv.viTriId = f.viTriId
        JOIN FactTuyenDung_KyNang fk 
            ON fk.factId = f.factId
        JOIN DimKyNang dk 
            ON dk.kyNangId = fk.kyNangId
        WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
        GROUP BY dv.tenViTriChuan, dk.tenKyNang
    ),
    RankedSkillPosition AS (
        SELECT *,
            RANK() OVER (
                PARTITION BY nhanQuy, tenViTriChuan
                ORDER BY soTin DESC
            ) AS xepHang
        FROM SkillPosition
    )
    INSERT INTO AggSkillTheoViTri (
        nhanQuy, nam, quy, tenViTriChuan, tenKyNang, soTin, xepHang
    )
    SELECT
        nhanQuy, nam, quy, tenViTriChuan, tenKyNang, soTin, xepHang
    FROM RankedSkillPosition;

    INSERT INTO AggLuongTheoKyNang (
        nhanQuy, nam, quy, tenKyNang, soTin, soTinCoLuong, luongTrungBinh
    )
    SELECT
        @nhanQuy,
        @nam,
        @quy,
        dk.tenKyNang,
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE 
            WHEN f.luongTrungBinh BETWEEN 1 AND 300 THEN f.factId 
        END) AS soTinCoLuong,
        CAST(AVG(CASE 
            WHEN f.luongTrungBinh BETWEEN 1 AND 300 
            THEN f.luongTrungBinh 
        END) AS DECIMAL(10,2)) AS luongTrungBinh
    FROM FactTuyenDung f
    JOIN DimThoiGian dt 
        ON dt.thoiGianId = f.thoiGianId
    JOIN FactTuyenDung_KyNang fk 
        ON fk.factId = f.factId
    JOIN DimKyNang dk 
        ON dk.kyNangId = fk.kyNangId
    WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
    GROUP BY dk.tenKyNang
    HAVING COUNT(DISTINCT f.factId) >= 3;

    ;WITH CityPosition AS (
        SELECT
            @nhanQuy AS nhanQuy,
            @nam AS nam,
            @quy AS quy,
            dd.tenThanhPho,
            dv.tenViTriChuan,
            COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt 
            ON dt.thoiGianId = f.thoiGianId
        JOIN DimViTri dv 
            ON dv.viTriId = f.viTriId
        JOIN FactTuyenDung_DiaDiem fd 
            ON fd.factId = f.factId
        JOIN DimDiaDiem dd 
            ON dd.diaDiemId = fd.diaDiemId
        WHERE (@nam IS NULL OR (dt.nam = @nam AND dt.quy = @quy))
        GROUP BY dd.tenThanhPho, dv.tenViTriChuan
    ),
    RankedCityPosition AS (
        SELECT *,
            RANK() OVER (
                PARTITION BY nhanQuy, tenThanhPho
                ORDER BY soTin DESC
            ) AS xepHang
        FROM CityPosition
    )
    INSERT INTO AggViTriTheoThanhPho (
        nhanQuy, nam, quy, tenThanhPho, tenViTriChuan, soTin, xepHang
    )
    SELECT
        nhanQuy, nam, quy, tenThanhPho, tenViTriChuan, soTin, xepHang
    FROM RankedCityPosition;

    PRINT 'ETL_LoadExtraAggTables hoan thanh: ' + @nhanQuy;
END;
GO