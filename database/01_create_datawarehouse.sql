USE JobDW;
GO

CREATE TABLE DimThoiGian (
    thoiGianId INT IDENTITY(1,1) PRIMARY KEY,
    ngayDay DATE NOT NULL UNIQUE,
    thang INT NOT NULL,
    quy INT NOT NULL,
    nam INT NOT NULL,
    nhanQuy VARCHAR(10) NOT NULL
);
GO

CREATE TABLE DimViTri (
    viTriId INT PRIMARY KEY,
    tenViTriChuan NVARCHAR(200) NOT NULL
);
GO

CREATE TABLE DimCapBac (
    capBacId INT PRIMARY KEY,
    tenCapBac NVARCHAR(50) NOT NULL
);
GO

CREATE TABLE DimDiaDiem (
    diaDiemId INT PRIMARY KEY,
    tenThanhPho NVARCHAR(100) NOT NULL,
    tenPhuongXa NVARCHAR(100)
);
GO

CREATE TABLE DimKyNang (
    kyNangId INT PRIMARY KEY,
    tenKyNang NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE DimCongTy (
    congTyId INT PRIMARY KEY,
    tenCongTy NVARCHAR(200) NOT NULL,
    linhVuc NVARCHAR(100),
    quyMo NVARCHAR(50)
);
GO

CREATE TABLE FactTuyenDung (
    factId INT IDENTITY(1,1) PRIMARY KEY,

    tinTuyenDungId INT NOT NULL UNIQUE,

    thoiGianId INT NOT NULL REFERENCES DimThoiGian(thoiGianId),
    viTriId INT NULL REFERENCES DimViTri(viTriId),
    capBacId INT NULL REFERENCES DimCapBac(capBacId),
    congTyId INT NOT NULL REFERENCES DimCongTy(congTyId),

    luongMin DECIMAL(10,2),
    luongMax DECIMAL(10,2),

    luongTrungBinh AS (
        CASE 
            WHEN luongMin > 0 AND luongMax > 0 THEN (luongMin + luongMax) / 2.0
            WHEN luongMin > 0 THEN luongMin
            WHEN luongMax > 0 THEN luongMax
            ELSE NULL
        END
    ),

    soNamKinhNghiem DECIMAL(4,1),

    coLuong AS (
        CASE 
            WHEN luongMin > 0 OR luongMax > 0 THEN 1
            ELSE 0
        END
    )
);
GO

CREATE TABLE FactTuyenDung_KyNang (
    factId INT NOT NULL REFERENCES FactTuyenDung(factId),
    kyNangId INT NOT NULL REFERENCES DimKyNang(kyNangId),
    PRIMARY KEY (factId, kyNangId)
);
GO

CREATE TABLE FactTuyenDung_DiaDiem (
    factId INT NOT NULL REFERENCES FactTuyenDung(factId),
    diaDiemId INT NOT NULL REFERENCES DimDiaDiem(diaDiemId),
    PRIMARY KEY (factId, diaDiemId)
);
GO