const {
  addCommonTimeFilters,
  applyLimit,
  buildAggregateWhere,
  queryRecordset,
  sql,
} = require('./queryUtils');

async function getTopSkills(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'skill', column: 'tenKyNang' }],
    });
    return `
      SELECT TOP (@limit)
        xepHang,
        tenKyNang,
        soTin,
        tyLeTheoTongTin
      FROM AggTopSkill
      ${where}
      ORDER BY xepHang ASC, soTin DESC
    `;
  });
}

async function getTopLanguages(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, { useAllWhenNoTimeFilter: true });
    return `
      SELECT TOP (@limit)
        xepHang,
        ngonNgu,
        soTin,
        tyLeTheoTongTin
      FROM AggNgonNguLapTrinh
      ${where}
      ORDER BY xepHang ASC, soTin DESC
    `;
  });
}

async function getSkillCoOccurrence(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const clauses = [];
    addCommonTimeFilters(filters, clauses, request, 'dt');

    if (filters.skill !== undefined) {
      request.input('skillName', sql.NVarChar, filters.skill);
      clauses.push('k1.tenKyNang = @skillName');
    } else {
      clauses.push('k1.kyNangId < k2.kyNangId');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    return `
      SELECT TOP (@limit)
        k1.tenKyNang,
        k2.tenKyNang AS tenKyNangLienQuan,
        COUNT(DISTINCT f.factId) AS soTin
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      JOIN FactTuyenDung_KyNang fk1 ON f.factId = fk1.factId
      JOIN DimKyNang k1 ON fk1.kyNangId = k1.kyNangId
      JOIN FactTuyenDung_KyNang fk2 ON f.factId = fk2.factId AND fk1.kyNangId <> fk2.kyNangId
      JOIN DimKyNang k2 ON fk2.kyNangId = k2.kyNangId
      ${where}
      GROUP BY k1.tenKyNang, k2.tenKyNang
      ORDER BY soTin DESC
    `;
  });
}

module.exports = {
  getTopSkills,
  getTopLanguages,
  getSkillCoOccurrence,
};
