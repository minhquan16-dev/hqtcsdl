const {
  applyLimit,
  buildAggregateWhere,
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
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'skill', column: 'tenKyNang' }],
    });
    return `
      SELECT TOP (@limit)
        tenKyNang,
        soTin,
        soTinCoLuong,
        luongTrungBinh
      FROM AggLuongTheoKyNang
      ${where}
      ORDER BY ${orderBy(filters.sortBy, filters.sortOrder)}
    `;
  });
}

module.exports = {
  getSalaryByExperience,
  getSalaryByCity,
  getSalaryBySkill,
};
