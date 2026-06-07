const { applyLimit, buildAggregateWhere, factWhere, queryRecordset } = require('./queryUtils');

async function getTopCompanies(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'company', column: 'tenCongTy' }],
    });
    return `
      SELECT TOP (@limit)
        xepHang,
        tenCongTy,
        linhVuc,
        quyMo,
        soTin
      FROM AggCongTyTuyenNhieu
      ${where}
      ORDER BY xepHang ASC, soTin DESC
    `;
  });
}

async function getCompaniesByField(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = factWhere(filters, request);
    return `
      SELECT TOP (@limit)
        COALESCE(NULLIF(ct.linhVuc, ''), N'Không xác định') AS linhVuc,
        COUNT(DISTINCT ct.congTyId) AS soCongTy,
        COUNT(DISTINCT f.factId) AS soTin
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
      GROUP BY COALESCE(NULLIF(ct.linhVuc, ''), N'Không xác định')
      ORDER BY soTin DESC
    `;
  });
}

module.exports = {
  getTopCompanies,
  getCompaniesByField,
};
