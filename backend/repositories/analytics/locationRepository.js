const {
  applyLimit,
  buildAggregateWhere,
  factWhere,
  orderBy,
  queryRecordset,
} = require('./queryUtils');

async function getLocations(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'city', column: 'tenThanhPho' }],
    });
    return `
      SELECT TOP (@limit)
        xepHang,
        tenThanhPho,
        soTin,
        luongTrungBinh
      FROM AggViecTheoDiaDiem
      ${where}
      ORDER BY xepHang ASC, soTin DESC
    `;
  });
}

async function getWards(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = factWhere(filters, request);
    return `
      SELECT TOP (@limit)
        dd.tenThanhPho,
        dd.tenPhuongXa,
        COUNT(DISTINCT f.factId) AS soTin
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId
      JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId
      ${where}
      GROUP BY dd.tenThanhPho, dd.tenPhuongXa
      ORDER BY soTin DESC
    `;
  });
}

async function getCityMarkets(filters) {
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
        kinhNghiemTB,
        soViTriKhacNhau
      FROM AggThiTruongThanhPho
      ${where}
      ORDER BY ${orderBy(filters.sortBy, filters.sortOrder)}
    `;
  });
}

module.exports = {
  getLocations,
  getWards,
  getCityMarkets,
};
