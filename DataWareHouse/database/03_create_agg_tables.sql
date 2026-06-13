USE JobDW;
GO

CREATE TABLE AggTopSkill (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenKyNang NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    tyLeTheoTongTin DECIMAL(5,2),
    xepHang INT NOT NULL
);
GO

CREATE TABLE AggNgonNguLapTrinh (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    ngonNgu NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    tyLeTheoTongTin DECIMAL(5,2),
    xepHang INT NOT NULL
);
GO

CREATE TABLE AggLuongTheoViTri (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenViTriChuan NVARCHAR(200) NOT NULL,
    soTin INT NOT NULL,
    soTinCoLuong INT NOT NULL,
    luongTrungBinh DECIMAL(10,2),
    luongMin DECIMAL(10,2),
    luongMax DECIMAL(10,2),
    kinhNghiemTB DECIMAL(4,1)
);
GO

CREATE TABLE AggLuongTheoKinhNghiem (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    nhomKinhNghiem NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    soTinCoLuong INT NOT NULL,
    luongTrungBinh DECIMAL(10,2)
);
GO

CREATE TABLE AggXuHuongTheoQuy (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL UNIQUE,
    nam INT NOT NULL,
    quy INT NOT NULL,
    soTin INT NOT NULL,
    soTinCoLuong INT NOT NULL,
    luongTrungBinh DECIMAL(10,2),
    soTinQuyTruoc INT,
    bienDong INT,
    phanTramThayDoi DECIMAL(5,2)
);
GO

CREATE TABLE AggCongTyTuyenNhieu (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenCongTy NVARCHAR(200) NOT NULL,
    linhVuc NVARCHAR(100),
    quyMo NVARCHAR(50),
    soTin INT NOT NULL,
    xepHang INT NOT NULL
);
GO

CREATE TABLE AggViecTheoDiaDiem (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenThanhPho NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    luongTrungBinh DECIMAL(10,2),
    xepHang INT NOT NULL
);
GO

CREATE TABLE AggCapBacTuyenDung (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenCapBac NVARCHAR(50) NOT NULL,
    soTin INT NOT NULL,
    tyLe DECIMAL(5,2) NOT NULL
);
GO

CREATE TABLE AggThiTruongThanhPho (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenThanhPho NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    luongTrungBinh DECIMAL(10,2),
    kinhNghiemTB DECIMAL(4,1),
    soViTriKhacNhau INT
);
GO
CREATE TABLE AggSkillTheoViTri (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenViTriChuan NVARCHAR(200) NOT NULL,
    tenKyNang NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    xepHang INT NOT NULL
);
GO

CREATE TABLE AggLuongTheoKyNang (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenKyNang NVARCHAR(100) NOT NULL,
    soTin INT NOT NULL,
    soTinCoLuong INT NOT NULL,
    luongTrungBinh DECIMAL(10,2)
);
GO

CREATE TABLE AggViTriTheoThanhPho (
    aggId INT IDENTITY(1,1) PRIMARY KEY,
    nhanQuy VARCHAR(10) NOT NULL,
    nam INT,
    quy INT,
    tenThanhPho NVARCHAR(100) NOT NULL,
    tenViTriChuan NVARCHAR(200) NOT NULL,
    soTin INT NOT NULL,
    xepHang INT NOT NULL
);
GO