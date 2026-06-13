USE JobDW;
GO

EXEC ETL_LoadDimThoiGian;
EXEC ETL_LoadDimensions;
EXEC ETL_LoadFact;
GO

EXEC ETL_LoadAggTables;
EXEC ETL_LoadAggXuHuong;
EXEC ETL_LoadExtraAggTables;
GO

DECLARE @namMoiNhat INT;
DECLARE @quyMoiNhat INT;

SELECT TOP 1
    @namMoiNhat = dt.nam,
    @quyMoiNhat = dt.quy
FROM FactTuyenDung f
JOIN DimThoiGian dt 
    ON dt.thoiGianId = f.thoiGianId
ORDER BY dt.nam DESC, dt.quy DESC;

IF @namMoiNhat IS NOT NULL AND @quyMoiNhat IS NOT NULL
BEGIN
    EXEC ETL_LoadAggTables @nam = @namMoiNhat, @quy = @quyMoiNhat;
    EXEC ETL_LoadExtraAggTables @nam = @namMoiNhat, @quy = @quyMoiNhat;
END;
GO