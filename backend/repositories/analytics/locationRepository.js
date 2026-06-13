const {
  applyLimit,
  addDirectNameFilter,
  appendWhereClauses,
  buildAggregateWhere,
  factWhere,
  orderBy,
  queryRecordset,
  sql,
  withoutFilters,
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
    const directClauses = [];
    addDirectNameFilter(filters, directClauses, request, 'city', 'dd.tenThanhPho');
    addDirectNameFilter(filters, directClauses, request, 'ward', 'dd.tenPhuongXa');
    const where = appendWhereClauses(
      factWhere(withoutFilters(filters, ['city', 'ward']), request),
      directClauses,
    );
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

async function getCityPositions(city, filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const clauses = [];

    if (filters.year !== undefined) {
      request.input('year', sql.Int, filters.year);
      clauses.push('nam = @year');
    }

    if (filters.quarter !== undefined) {
      request.input('quarter', sql.Int, filters.quarter);
      clauses.push('quy = @quarter');
    }

    if (filters.year === undefined && filters.quarter === undefined) {
      request.input('allPeriod', sql.VarChar, 'ALL');
      clauses.push('nhanQuy = @allPeriod');
    }

    request.input('cityExact', sql.NVarChar, city);
    clauses.push('tenThanhPho = @cityExact');

    return `
      SELECT TOP (@limit)
        xepHang,
        tenViTriChuan,
        soTin,
        CAST(NULL AS decimal(10, 2)) AS luongTrungBinh
      FROM AggViTriTheoThanhPho
      WHERE ${clauses.join(' AND ')}
      ORDER BY xepHang ASC, soTin DESC
    `;
  });
}

module.exports = {
  getLocations,
  getWards,
  getCityMarkets,
  getCityPositions,
};
