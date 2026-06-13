USE JobDW;
GO

SELECT COUNT(*) AS soDongFact
FROM FactTuyenDung;
GO

SELECT TOP 10 *
FROM AggTopSkill
WHERE nhanQuy = 'ALL'
ORDER BY xepHang;
GO

SELECT TOP 10 *
FROM AggNgonNguLapTrinh
WHERE nhanQuy = 'ALL'
ORDER BY xepHang;
GO

SELECT TOP 10 *
FROM AggLuongTheoViTri
WHERE nhanQuy = 'ALL'
ORDER BY luongTrungBinh DESC;
GO

SELECT TOP 10 *
FROM AggSkillTheoViTri
WHERE nhanQuy = 'ALL'
ORDER BY tenViTriChuan, xepHang;
GO

SELECT TOP 10 *
FROM AggLuongTheoKyNang
WHERE nhanQuy = 'ALL'
ORDER BY luongTrungBinh DESC;
GO

SELECT TOP 10 *
FROM AggViTriTheoThanhPho
WHERE nhanQuy = 'ALL'
ORDER BY tenThanhPho, xepHang;
GO

SELECT *
FROM AggXuHuongTheoQuy
ORDER BY nam, quy;
GO