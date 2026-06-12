const {
  addDirectNameFilter,
  appendWhereClauses,
  factWhere,
  queryRecordset,
  withoutFilters,
} = require('./queryUtils');

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
    directFilters: [
      { key: 'city', column: 'dd.tenThanhPho' },
      { key: 'ward', column: 'dd.tenPhuongXa' },
    ],
  },
  ward: {
    select: 'dd.tenPhuongXa',
    joins: 'JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId',
    order: 'soTin DESC',
    directFilters: [
      { key: 'city', column: 'dd.tenThanhPho' },
      { key: 'ward', column: 'dd.tenPhuongXa' },
    ],
  },
  skill: {
    select: 'dk.tenKyNang',
    joins: 'JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId',
    order: 'soTin DESC',
    directFilters: [{ key: 'skill', column: 'dk.tenKyNang' }],
  },
  position: {
    select: 'v.tenViTriChuan',
    order: 'soTin DESC',
    directFilters: [{ key: 'position', column: 'v.tenViTriChuan' }],
  },
  company: {
    select: 'ct.tenCongTy',
    order: 'soTin DESC',
    directFilters: [{ key: 'company', column: 'ct.tenCongTy' }],
  },
  level: {
    select: 'cb.tenCapBac',
    order: 'soTin DESC',
    directFilters: [{ key: 'level', column: 'cb.tenCapBac' }],
  },
};

function buildBreakdownWhere(filters, request, config) {
  const directFilters = config.directFilters || [];
  const directFilterKeys = directFilters.map((filter) => filter.key);
  const directClauses = [];

  for (const filter of directFilters) {
    addDirectNameFilter(filters, directClauses, request, filter.key, filter.column);
  }

  return appendWhereClauses(
    factWhere(withoutFilters(filters, directFilterKeys), request),
    directClauses,
  );
}

async function getJobsBreakdown(filters) {
  return queryRecordset((request) => {
    const config = groupByConfig[filters.groupBy];
    const where = buildBreakdownWhere(filters, request, config);
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
