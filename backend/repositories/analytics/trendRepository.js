const { applyLimit, buildAggregateWhere, factWhere, queryRecordset } = require('./queryUtils');

async function getQuarterTrends(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request);
    return `
      SELECT TOP (@limit)
        nhanQuy,
        nam,
        quy,
        soTin,
        soTinCoLuong,
        luongTrungBinh,
        soTinQuyTruoc,
        bienDong,
        phanTramThayDoi
      FROM AggXuHuongTheoQuy
      ${where}
      ORDER BY nam ASC, quy ASC
    `;
  });
}

async function getMonthTrends(filters) {
  return queryRecordset((request) => {
    const where = factWhere(filters, request);
    return `
      SELECT
        dt.nam,
        dt.thang,
        COUNT(DISTINCT f.factId) AS soTin,
        SUM(CASE WHEN f.coLuong = 1 THEN 1 ELSE 0 END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
      GROUP BY dt.nam, dt.thang
      ORDER BY dt.nam ASC, dt.thang ASC
    `;
  });
}

module.exports = {
  getQuarterTrends,
  getMonthTrends,
};
