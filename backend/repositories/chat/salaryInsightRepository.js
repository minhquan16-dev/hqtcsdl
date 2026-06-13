const { sql, poolPromise } = require('../../config/db');

let dimensionCatalogCache = null;
let dimensionCatalogExpiresAt = 0;

function toNumber(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function roundNullable(value) {
  const numberValue = toNumber(value);
  if (numberValue === null || Number.isNaN(numberValue)) return null;
  return Number(numberValue.toFixed(2));
}

function addCommonFactFilters(request, clauses, intent, alias = 'f') {
  if (intent.position) {
    request.input('position', sql.NVarChar, `%${intent.position}%`);
    clauses.push('v.tenViTriChuan LIKE @position');
  }

  if (intent.level) {
    request.input('level', sql.NVarChar, `%${intent.level}%`);
    clauses.push('cb.tenCapBac LIKE @level');
  }

  if (intent.city) {
    request.input('city', sql.NVarChar, `%${intent.city}%`);
    clauses.push(`EXISTS (
      SELECT 1
      FROM FactTuyenDung_DiaDiem fd
      JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId
      WHERE fd.factId = ${alias}.factId AND dd.tenThanhPho LIKE @city
    )`);
  }

  if (intent.company) {
    request.input('company', sql.NVarChar, `%${intent.company}%`);
    clauses.push('ct.tenCongTy LIKE @company');
  }

  if (intent.companyField) {
    request.input('companyField', sql.NVarChar, `%${intent.companyField}%`);
    clauses.push('ct.linhVuc LIKE @companyField');
  }

  if (intent.skills?.length) {
    intent.skills.slice(0, 3).forEach((skill, index) => {
      const inputName = `skill${index}`;
      request.input(inputName, sql.NVarChar, `%${skill}%`);
      clauses.push(`EXISTS (
        SELECT 1
        FROM FactTuyenDung_KyNang fk${index}
        JOIN DimKyNang dk${index} ON fk${index}.kyNangId = dk${index}.kyNangId
        WHERE fk${index}.factId = ${alias}.factId AND dk${index}.tenKyNang LIKE @${inputName}
      )`);
    });
  }
}

function buildWhere(clauses) {
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

async function queryDimensionCatalog(pool) {
  const result = await pool.request().query(`
    SELECT 'position' AS dimension, tenViTriChuan AS value FROM DimViTri
    UNION ALL
    SELECT 'skill' AS dimension, tenKyNang AS value FROM DimKyNang
    UNION ALL
    SELECT 'level' AS dimension, tenCapBac AS value FROM DimCapBac
    UNION ALL
    SELECT 'city' AS dimension, tenThanhPho AS value FROM DimDiaDiem
    UNION ALL
    SELECT 'company' AS dimension, tenCongTy AS value FROM DimCongTy
    UNION ALL
    SELECT 'companyField' AS dimension, linhVuc AS value FROM DimCongTy WHERE linhVuc IS NOT NULL
  `);

  return result.recordset.reduce((catalog, row) => {
    const key = `${row.dimension}s`;
    if (!catalog[key]) catalog[key] = [];
    if (row.value && !catalog[key].includes(row.value)) {
      catalog[key].push(row.value);
    }
    return catalog;
  }, {
    positions: [],
    skills: [],
    levels: [],
    cities: [],
    companies: [],
    companyFields: [],
  });
}

function toPlanningContext(catalog) {
  return {
    positions: catalog.positions.slice(0, 180),
    skills: catalog.skills.slice(0, 180),
    levels: catalog.levels,
    cities: catalog.cities,
    companyFields: catalog.companyFields.slice(0, 120),
  };
}

async function getDimensionCatalog(pool) {
  if (dimensionCatalogCache && Date.now() < dimensionCatalogExpiresAt) {
    return dimensionCatalogCache;
  }

  dimensionCatalogCache = await queryDimensionCatalog(pool);
  dimensionCatalogExpiresAt = Date.now() + 5 * 60 * 1000;
  return dimensionCatalogCache;
}

async function getChatPlanningContext() {
  const pool = await poolPromise;
  return toPlanningContext(await getDimensionCatalog(pool));
}

function salaryWhere(request, intent) {
  const clauses = [];
  addCommonFactFilters(request, clauses, intent);
  return buildWhere(clauses);
}

function mapSalaryRow(row) {
  if (!row || Number(row.sampleSize || 0) === 0) {
    return {
      sampleSize: 0,
      salarySampleSize: 0,
      minSalary: null,
      medianSalary: null,
      avgSalary: null,
      maxSalary: null,
      topSkills: [],
    };
  }

  return {
    sampleSize: Number(row.sampleSize),
    salarySampleSize: Number(row.salarySampleSize || 0),
    minSalary: roundNullable(row.minSalary),
    medianSalary: roundNullable(row.medianSalary),
    avgSalary: roundNullable(row.avgSalary),
    maxSalary: roundNullable(row.maxSalary),
    topSkills: [],
  };
}

const breakdownConfig = {
  city: {
    select: 'dd.tenThanhPho',
    joins: 'JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId',
    label: 'Thành phố',
  },
  position: {
    select: 'v.tenViTriChuan',
    joins: '',
    label: 'Vị trí',
  },
  skill: {
    select: 'dk.tenKyNang',
    joins: 'JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId',
    label: 'Kỹ năng',
  },
  company: {
    select: 'ct.tenCongTy',
    joins: '',
    label: 'Công ty',
  },
  level: {
    select: 'cb.tenCapBac',
    joins: '',
    label: 'Cấp bậc',
  },
};

function getBreakdownConfig(groupBy) {
  return breakdownConfig[groupBy] || breakdownConfig.city;
}

function taskFiltersToIntent(filters = {}) {
  return {
    position: filters.position || null,
    level: filters.level || null,
    city: filters.city || null,
    company: filters.company || null,
    companyField: filters.companyField || null,
    skills: Array.isArray(filters.skills) ? filters.skills : [],
  };
}

async function querySalaryAggregate(intent) {
  const pool = await poolPromise;
  const request = pool.request();
  const where = salaryWhere(request, intent);

  const result = await request.query(`
    WITH filteredRows AS (
      SELECT f.factId, f.luongMin, f.luongMax, f.luongTrungBinh
      FROM FactTuyenDung f
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
    ),
    salaryRows AS (
      SELECT factId, luongMin, luongMax, luongTrungBinh
      FROM filteredRows
      WHERE luongTrungBinh IS NOT NULL
    ),
    medianRows AS (
      SELECT DISTINCT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY luongTrungBinh) OVER () AS medianSalary
      FROM salaryRows
    )
    SELECT
      (SELECT COUNT(DISTINCT factId) FROM filteredRows) AS sampleSize,
      (SELECT COUNT(DISTINCT factId) FROM salaryRows) AS salarySampleSize,
      (SELECT MIN(luongMin) FROM salaryRows) AS minSalary,
      (SELECT TOP (1) medianSalary FROM medianRows) AS medianSalary,
      (SELECT AVG(luongTrungBinh) FROM salaryRows) AS avgSalary,
      (SELECT MAX(luongMax) FROM salaryRows) AS maxSalary
  `);

  return mapSalaryRow(result.recordset[0]);
}

async function getAnalyticsBreakdown(intent) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input('limit', sql.Int, 10);

  const config = getBreakdownConfig(intent.groupBy);
  const clauses = [`${config.select} IS NOT NULL`];
  addCommonFactFilters(request, clauses, intent);
  const where = `WHERE ${clauses.join(' AND ')}`;

  const result = await request.query(`
    SELECT TOP (@limit)
      ${config.select} AS name,
      COUNT(DISTINCT f.factId) AS sampleSize,
      COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS salarySampleSize,
      AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS avgSalary
    FROM FactTuyenDung f
    LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
    LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
    JOIN DimCongTy ct ON f.congTyId = ct.congTyId
    ${config.joins}
    ${where}
    GROUP BY ${config.select}
    ORDER BY sampleSize DESC, name ASC
  `);

  return result.recordset.map((row) => ({
    groupBy: intent.groupBy || 'city',
    label: config.label,
    name: row.name,
    sampleSize: Number(row.sampleSize),
    salarySampleSize: Number(row.salarySampleSize),
    avgSalary: roundNullable(row.avgSalary),
  }));
}

async function executeChatTask(task) {
  const intent = {
    ...taskFiltersToIntent(task.filters),
    groupBy: task.groupBy,
  };

  if (task.type === 'salary_aggregate') {
    return {
      type: task.type,
      label: task.label,
      filters: task.filters,
      data: await querySalaryAggregate(intent),
    };
  }

  if (task.type === 'top_skills') {
    return {
      type: task.type,
      label: task.label,
      filters: task.filters,
      data: await queryTopSkills(intent),
    };
  }

  if (task.type === 'breakdown') {
    return {
      type: task.type,
      label: task.label,
      groupBy: task.groupBy,
      filters: task.filters,
      data: await getAnalyticsBreakdown(intent),
    };
  }

  return null;
}

async function executeChatPlan(plan) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks.slice(0, 6) : [];
  const results = [];

  for (const task of tasks) {
    const result = await executeChatTask(task);
    if (result) results.push(result);
  }

  return results;
}

async function queryTopSkills(intent) {
  const pool = await poolPromise;
  const request = pool.request();
  const clauses = [];
  addCommonFactFilters(request, clauses, intent);
  const where = buildWhere(clauses);

  const result = await request.query(`
    SELECT TOP (5)
      dk.tenKyNang,
      COUNT(DISTINCT f.factId) AS soTin
    FROM FactTuyenDung f
    LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
    LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
    JOIN DimCongTy ct ON f.congTyId = ct.congTyId
    JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
    JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
    ${where}
    GROUP BY dk.tenKyNang
    ORDER BY soTin DESC, dk.tenKyNang ASC
  `);

  return result.recordset.map((row) => row.tenKyNang);
}

module.exports = {
  executeChatPlan,
  getChatPlanningContext,
};
