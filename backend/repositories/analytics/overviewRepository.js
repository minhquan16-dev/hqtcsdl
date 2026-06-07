const { factWhere, poolPromise, queryRecordset, toNumber } = require('./queryUtils');

async function getOverview(filters) {
  const pool = await poolPromise;
  const request = pool.request();
  const where = factWhere(filters, request);

  const [summary, topCity, topSkill] = await Promise.all([
    request.query(`
      SELECT
        COUNT(DISTINCT f.factId) AS tongSoTin,
        SUM(CASE WHEN f.coLuong = 1 THEN 1 ELSE 0 END) AS soTinCoLuong,
        COUNT(DISTINCT f.congTyId) AS soCongTy,
        COUNT(DISTINCT f.viTriId) AS soViTri,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
    `),
    queryRecordset((topCityRequest) => {
      const topCityWhere = factWhere(filters, topCityRequest);
      return `
        SELECT TOP (1) dd.tenThanhPho, COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
        LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
        LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
        JOIN DimCongTy ct ON f.congTyId = ct.congTyId
        JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId
        JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId
        ${topCityWhere}
        GROUP BY dd.tenThanhPho
        ORDER BY soTin DESC
      `;
    }),
    queryRecordset((topSkillRequest) => {
      const topSkillWhere = factWhere(filters, topSkillRequest);
      return `
        SELECT TOP (1) dk.tenKyNang, COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
        LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
        LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
        JOIN DimCongTy ct ON f.congTyId = ct.congTyId
        JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
        JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
        ${topSkillWhere}
        GROUP BY dk.tenKyNang
        ORDER BY soTin DESC
      `;
    }),
  ]);

  const totalSkills = await queryRecordset((skillRequest) => {
    const skillWhere = factWhere(filters, skillRequest);
    return `
      SELECT COUNT(DISTINCT dk.kyNangId) AS soKyNang
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
      JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
      ${skillWhere}
    `;
  });

  const row = summary.recordset[0];

  return {
    tongSoTin: row.tongSoTin || 0,
    soTinCoLuong: row.soTinCoLuong || 0,
    soCongTy: row.soCongTy || 0,
    soViTri: row.soViTri || 0,
    soKyNang: totalSkills[0]?.soKyNang || 0,
    luongTrungBinh: toNumber(row.luongTrungBinh),
    thanhPhoNoiBat: topCity[0] || null,
    kyNangNoiBat: topSkill[0] || null,
  };
}

async function getFilters() {
  const [quarters, years, cities, levels, positions, skills, companies] = await Promise.all([
    queryRecordset(() => 'SELECT DISTINCT nhanQuy AS value FROM DimThoiGian ORDER BY nhanQuy'),
    queryRecordset(() => 'SELECT DISTINCT nam AS value FROM DimThoiGian ORDER BY nam DESC'),
    queryRecordset(() => 'SELECT DISTINCT tenThanhPho AS value FROM DimDiaDiem ORDER BY tenThanhPho'),
    queryRecordset(() => 'SELECT DISTINCT tenCapBac AS value FROM DimCapBac ORDER BY tenCapBac'),
    queryRecordset(() => 'SELECT DISTINCT tenViTriChuan AS value FROM DimViTri ORDER BY tenViTriChuan'),
    queryRecordset(() => 'SELECT DISTINCT tenKyNang AS value FROM DimKyNang ORDER BY tenKyNang'),
    queryRecordset(() => 'SELECT DISTINCT tenCongTy AS value FROM DimCongTy ORDER BY tenCongTy'),
  ]);

  return {
    nhanQuy: quarters.map((row) => row.value),
    nam: years.map((row) => row.value),
    tenThanhPho: cities.map((row) => row.value),
    tenCapBac: levels.map((row) => row.value),
    tenViTriChuan: positions.map((row) => row.value),
    tenKyNang: skills.map((row) => row.value),
    tenCongTy: companies.map((row) => row.value),
  };
}

module.exports = {
  getOverview,
  getFilters,
};
