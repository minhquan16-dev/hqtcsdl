const { applyLimit, buildAggregateWhere, factWhere, queryRecordset } = require('./queryUtils');

async function getLevels(filters) {
  return queryRecordset((request) => {
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'level', column: 'tenCapBac' }],
    });
    return `
      SELECT
        tenCapBac,
        soTin,
        tyLe
      FROM AggCapBacTuyenDung
      ${where}
      ORDER BY soTin DESC
    `;
  });
}

async function getExperienceByPosition(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request, {
      useAllWhenNoTimeFilter: true,
      nameFilters: [{ key: 'position', column: 'tenViTriChuan' }],
    });
    const orderColumn = filters.sortBy === 'averageExperience' ? 'kinhNghiemTB' : 'soTin';
    const direction = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    return `
      SELECT TOP (@limit)
        tenViTriChuan,
        soTin,
        kinhNghiemTB
      FROM AggLuongTheoViTri
      ${where}
      ORDER BY ${orderColumn} ${direction}
    `;
  });
}

async function getLevelSkills(level, filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = factWhere(filters, request, { levelExact: level });
    return `
      WITH LevelFacts AS (
        SELECT DISTINCT f.factId
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
        LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
        JOIN DimCapBac cb ON f.capBacId = cb.capBacId
        JOIN DimCongTy ct ON f.congTyId = ct.congTyId
        ${where}
      ),
      TotalFacts AS (
        SELECT COUNT(*) AS totalJobs FROM LevelFacts
      )
      SELECT TOP (@limit)
        dk.tenKyNang,
        COUNT(DISTINCT lf.factId) AS soTin,
        CAST(COUNT(DISTINCT lf.factId) * 100.0 / NULLIF((SELECT totalJobs FROM TotalFacts), 0) AS decimal(10, 2)) AS tyLe
      FROM LevelFacts lf
      JOIN FactTuyenDung_KyNang fk ON lf.factId = fk.factId
      JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
      GROUP BY dk.tenKyNang
      ORDER BY soTin DESC
    `;
  });
}

module.exports = {
  getLevels,
  getExperienceByPosition,
  getLevelSkills,
};
