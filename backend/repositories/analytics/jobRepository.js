const { factWhere, queryRecordset } = require('./queryUtils');

async function getJobsSummary(filters) {
  return queryRecordset((request) => {
    const where = factWhere(filters, request);
    return `
      SELECT
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh,
        AVG(f.soNamKinhNghiem) AS kinhNghiemTB,
        COUNT(DISTINCT f.congTyId) AS soCongTy,
        COUNT(DISTINCT f.viTriId) AS soViTri,
        (
          SELECT COUNT(DISTINCT fk.kyNangId)
          FROM FactTuyenDung f2
          JOIN DimThoiGian dt ON f2.thoiGianId = dt.thoiGianId
          LEFT JOIN DimViTri v ON f2.viTriId = v.viTriId
          LEFT JOIN DimCapBac cb ON f2.capBacId = cb.capBacId
          JOIN DimCongTy ct ON f2.congTyId = ct.congTyId
          JOIN FactTuyenDung_KyNang fk ON f2.factId = fk.factId
          WHERE f2.factId IN (
            SELECT f.factId
            FROM FactTuyenDung f
            JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
            LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
            LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
            JOIN DimCongTy ct ON f.congTyId = ct.congTyId
            ${where}
          )
        ) AS soKyNang
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
    `;
  });
}

const groupByConfig = {
  quarter: {
    select: 'dt.nhanQuy',
    order: 'MIN(dt.nam) ASC, MIN(dt.quy) ASC',
  },
  month: {
    select: "CONCAT(dt.nam, '-', RIGHT(CONCAT('0', dt.thang), 2))",
    order: 'MIN(dt.nam) ASC, MIN(dt.thang) ASC',
  },
  city: {
    select: 'dd.tenThanhPho',
    joins: 'JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId',
    order: 'soTin DESC',
  },
  ward: {
    select: 'dd.tenPhuongXa',
    joins: 'JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId',
    order: 'soTin DESC',
  },
  skill: {
    select: 'dk.tenKyNang',
    joins: 'JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId',
    order: 'soTin DESC',
  },
  position: {
    select: 'v.tenViTriChuan',
    order: 'soTin DESC',
  },
  company: {
    select: 'ct.tenCongTy',
    order: 'soTin DESC',
  },
  level: {
    select: 'cb.tenCapBac',
    order: 'soTin DESC',
  },
};

async function getJobsBreakdown(filters) {
  return queryRecordset((request) => {
    const config = groupByConfig[filters.groupBy];
    const where = factWhere(filters, request);
    return `
      SELECT
        ${config.select} AS nhom,
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${config.joins || ''}
      ${where}
      GROUP BY ${config.select}
      ORDER BY ${config.order}
    `;
  });
}

module.exports = {
  getJobsSummary,
  getJobsBreakdown,
};
