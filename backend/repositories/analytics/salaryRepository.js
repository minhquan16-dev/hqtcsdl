const {
  applyLimit,
  buildAggregateWhere,
  factWhere,
  orderBy,
  queryRecordset,
} = require('./queryUtils');

async function getSalaryByExperience(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, { useAllWhenNoTimeFilter: true });
    return `
      SELECT TOP (@limit)
        nhomKinhNghiem,
        soTin,
        soTinCoLuong,
        luongTrungBinh
      FROM AggLuongTheoKinhNghiem
      ${where}
      ORDER BY soTin DESC
    `;
  });
}

async function getSalaryByCity(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'city', column: 'tenThanhPho' }],
    });
    return `
      SELECT TOP (@limit)
        tenThanhPho,
        soTin,
        luongTrungBinh,
        xepHang
      FROM AggViecTheoDiaDiem
      ${where}
      ORDER BY xepHang ASC, soTin DESC
    `;
  });
}

async function getSalaryBySkill(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = factWhere(filters, request);
    return `
      SELECT TOP (@limit)
        dk.tenKyNang,
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
      JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
      ${where}
      GROUP BY dk.tenKyNang
      ORDER BY ${orderBy(filters.sortBy, filters.sortOrder)}
    `;
  });
}

module.exports = {
  getSalaryByExperience,
  getSalaryByCity,
  getSalaryBySkill,
};
