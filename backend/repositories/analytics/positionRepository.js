const {
  applyLimit,
  buildAggregateWhere,
  factWhere,
  orderBy,
  queryRecordset,
} = require('./queryUtils');

async function getPositions(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'position', column: 'tenViTriChuan' }],
    });
    return `
      SELECT TOP (@limit)
        tenViTriChuan,
        soTin,
        soTinCoLuong,
        luongTrungBinh,
        luongMin,
        luongMax,
        kinhNghiemTB
      FROM AggLuongTheoViTri
      ${where}
      ORDER BY ${orderBy(filters.sortBy, filters.sortOrder)}
    `;
  });
}

async function getPositionSkills(position, filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = factWhere(filters, request, { positionExact: position });
    return `
      WITH PositionFacts AS (
        SELECT DISTINCT f.factId
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
        JOIN DimViTri v ON f.viTriId = v.viTriId
        LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
        JOIN DimCongTy ct ON f.congTyId = ct.congTyId
        ${where}
      ),
      TotalFacts AS (
        SELECT COUNT(*) AS totalJobs FROM PositionFacts
      )
      SELECT TOP (@limit)
        dk.tenKyNang,
        COUNT(DISTINCT pf.factId) AS soTin,
        CAST(COUNT(DISTINCT pf.factId) * 100.0 / NULLIF((SELECT totalJobs FROM TotalFacts), 0) AS decimal(10, 2)) AS tyLe
      FROM PositionFacts pf
      JOIN FactTuyenDung_KyNang fk ON pf.factId = fk.factId
      JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
      GROUP BY dk.tenKyNang
      ORDER BY soTin DESC
    `;
  });
}

module.exports = {
  getPositions,
  getPositionSkills,
};
