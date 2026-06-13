USE JobDW;
GO

CREATE OR ALTER PROCEDURE ETL_LoadDimThoiGian
AS
BEGIN
    INSERT INTO DimThoiGian (
        ngayDay,
        thang,
        quy,
        nam,
        nhanQuy
    )
    SELECT DISTINCT
        CAST(thoiDiemThuThap AS DATE) AS ngayDay,
        MONTH(thoiDiemThuThap) AS thang,
        DATEPART(QUARTER, thoiDiemThuThap) AS quy,
        YEAR(thoiDiemThuThap) AS nam,
        'Q' + CAST(DATEPART(QUARTER, thoiDiemThuThap) AS VARCHAR)
            + '-' + CAST(YEAR(thoiDiemThuThap) AS VARCHAR) AS nhanQuy
    FROM JobCrawlDB.dbo.TinTuyenDung
    WHERE thoiDiemThuThap IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM DimThoiGian dt
          WHERE dt.ngayDay = CAST(JobCrawlDB.dbo.TinTuyenDung.thoiDiemThuThap AS DATE)
      );

    PRINT 'ETL_LoadDimThoiGian hoan thanh';
END;
GO

CREATE OR ALTER PROCEDURE ETL_LoadDimensions
AS
BEGIN
    MERGE DimViTri AS target
    USING (
        SELECT viTriId, tenViTriChuan
        FROM JobCrawlDB.dbo.ViTriCongViec
    ) AS source
    ON target.viTriId = source.viTriId
    WHEN MATCHED THEN
        UPDATE SET target.tenViTriChuan = source.tenViTriChuan
    WHEN NOT MATCHED THEN
        INSERT (viTriId, tenViTriChuan)
        VALUES (source.viTriId, source.tenViTriChuan);

    MERGE DimCapBac AS target
    USING (
        SELECT capBacId, tenCapBac
        FROM JobCrawlDB.dbo.CapBacCongViec
    ) AS source
    ON target.capBacId = source.capBacId
    WHEN MATCHED THEN
        UPDATE SET target.tenCapBac = source.tenCapBac
    WHEN NOT MATCHED THEN
        INSERT (capBacId, tenCapBac)
        VALUES (source.capBacId, source.tenCapBac);

    MERGE DimDiaDiem AS target
    USING (
        SELECT diaDiemId, tenThanhPho, tenPhuongXa
        FROM JobCrawlDB.dbo.DiaDiem
    ) AS source
    ON target.diaDiemId = source.diaDiemId
    WHEN MATCHED THEN
        UPDATE SET 
            target.tenThanhPho = source.tenThanhPho,
            target.tenPhuongXa = source.tenPhuongXa
    WHEN NOT MATCHED THEN
        INSERT (diaDiemId, tenThanhPho, tenPhuongXa)
        VALUES (source.diaDiemId, source.tenThanhPho, source.tenPhuongXa);

    MERGE DimKyNang AS target
    USING (
        SELECT kyNangId, tenKyNang
        FROM JobCrawlDB.dbo.KyNang
    ) AS source
    ON target.kyNangId = source.kyNangId
    WHEN MATCHED THEN
        UPDATE SET target.tenKyNang = source.tenKyNang
    WHEN NOT MATCHED THEN
        INSERT (kyNangId, tenKyNang)
        VALUES (source.kyNangId, source.tenKyNang);

    MERGE DimCongTy AS target
    USING (
        SELECT congTyId, tenCongTy, linhVuc, quyMo
        FROM JobCrawlDB.dbo.CongTy
    ) AS source
    ON target.congTyId = source.congTyId
    WHEN MATCHED THEN
        UPDATE SET
            target.tenCongTy = source.tenCongTy,
            target.linhVuc = source.linhVuc,
            target.quyMo = source.quyMo
    WHEN NOT MATCHED THEN
        INSERT (congTyId, tenCongTy, linhVuc, quyMo)
        VALUES (source.congTyId, source.tenCongTy, source.linhVuc, source.quyMo);

    PRINT 'ETL_LoadDimensions hoan thanh';
END;
GO

CREATE OR ALTER PROCEDURE ETL_LoadFact
AS
BEGIN
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @TyGia DECIMAL(18,2) = 25000;

        UPDATE f
        SET
            f.thoiGianId = dt.thoiGianId,
            f.viTriId = t.viTriId,
            f.capBacId = t.capBacId,
            f.congTyId = t.congTyId,
            f.luongMin = CASE 
                            WHEN t.luongMin > 200 THEN ROUND(t.luongMin * @TyGia / 1000000, 2)
                            ELSE t.luongMin
                         END,
            f.luongMax = CASE 
                            WHEN t.luongMax > 200 THEN ROUND(t.luongMax * @TyGia / 1000000, 2)
                            ELSE t.luongMax
                         END,
            f.soNamKinhNghiem = t.soNamKinhNghiem
        FROM FactTuyenDung f
        JOIN JobCrawlDB.dbo.TinTuyenDung t
            ON f.tinTuyenDungId = t.tinTuyenDungId
        JOIN DimThoiGian dt
            ON dt.ngayDay = CAST(t.thoiDiemThuThap AS DATE);

        INSERT INTO FactTuyenDung (
            tinTuyenDungId,
            thoiGianId,
            viTriId,
            capBacId,
            congTyId,
            luongMin,
            luongMax,
            soNamKinhNghiem
        )
        SELECT
            t.tinTuyenDungId,
            dt.thoiGianId,
            t.viTriId,
            t.capBacId,
            t.congTyId,
            CASE 
                WHEN t.luongMin > 200 THEN ROUND(t.luongMin * @TyGia / 1000000, 2)
                ELSE t.luongMin
            END,
            CASE 
                WHEN t.luongMax > 200 THEN ROUND(t.luongMax * @TyGia / 1000000, 2)
                ELSE t.luongMax
            END,
            t.soNamKinhNghiem
        FROM JobCrawlDB.dbo.TinTuyenDung t
        JOIN DimThoiGian dt
            ON dt.ngayDay = CAST(t.thoiDiemThuThap AS DATE)
        WHERE NOT EXISTS (
            SELECT 1
            FROM FactTuyenDung f
            WHERE f.tinTuyenDungId = t.tinTuyenDungId
        );

        INSERT INTO FactTuyenDung_KyNang (
            factId,
            kyNangId
        )
        SELECT
            f.factId,
            tk.kyNangId
        FROM FactTuyenDung f
        JOIN JobCrawlDB.dbo.TinTuyenDung_KyNang tk
            ON tk.tinTuyenDungId = f.tinTuyenDungId
        WHERE NOT EXISTS (
            SELECT 1
            FROM FactTuyenDung_KyNang fk
            WHERE fk.factId = f.factId
              AND fk.kyNangId = tk.kyNangId
        );

        INSERT INTO FactTuyenDung_DiaDiem (
            factId,
            diaDiemId
        )
        SELECT
            f.factId,
            td.diaDiemId
        FROM FactTuyenDung f
        JOIN JobCrawlDB.dbo.TinTuyenDung_DiaDiem td
            ON td.tinTuyenDungId = f.tinTuyenDungId
        WHERE NOT EXISTS (
            SELECT 1
            FROM FactTuyenDung_DiaDiem fd
            WHERE fd.factId = f.factId
              AND fd.diaDiemId = td.diaDiemId
        );

        COMMIT TRANSACTION;
        PRINT 'ETL_LoadFact hoan thanh';
    END TRY

    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Loi ETL_LoadFact: ' + ERROR_MESSAGE();
    END CATCH;
END;
GO