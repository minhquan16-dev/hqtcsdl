const {
  applyLimit,
  buildAggregateWhere,
  orderBy,
  queryRecordset,
  sql,
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
    const skillClauses = [];

    if (filters.year !== undefined) {
      request.input('year', sql.Int, filters.year);
      skillClauses.push('s.nam = @year');
    }

    if (filters.quarter !== undefined) {
      request.input('quarter', sql.Int, filters.quarter);
      skillClauses.push('s.quy = @quarter');
    }

    if (filters.year === undefined && filters.quarter === undefined) {
      request.input('allPeriod', sql.VarChar, 'ALL');
      skillClauses.push('s.nhanQuy = @allPeriod');
    }

    request.input('positionExact', sql.NVarChar, position);
    skillClauses.push('s.tenViTriChuan = @positionExact');

    const where = `WHERE ${skillClauses.join(' AND ')}`;

    return `
      SELECT TOP (@limit)
        s.xepHang,
        s.tenKyNang,
        s.soTin,
        CAST(s.soTin * 100.0 / NULLIF(p.soTin, 0) AS decimal(10, 2)) AS tyLe
      FROM AggSkillTheoViTri s
      JOIN AggLuongTheoViTri p
        ON p.nhanQuy = s.nhanQuy
        AND p.tenViTriChuan = s.tenViTriChuan
      ${where}
      ORDER BY s.xepHang ASC, s.soTin DESC
    `;
  });
}

module.exports = {
  getPositions,
  getPositionSkills,
};
