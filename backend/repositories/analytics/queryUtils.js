const { sql, poolPromise } = require('../../config/db');

const sortColumns = {
  jobCount: 'soTin',
  averageSalary: 'luongTrungBinh',
  averageExperience: 'kinhNghiemTB',
  differentPositions: 'soViTriKhacNhau',
};

function toNumber(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function addCommonTimeFilters(filters, clauses, request, alias = '') {
  const prefix = alias ? `${alias}.` : '';

  if (filters.year !== undefined) {
    request.input('year', sql.Int, filters.year);
    clauses.push(`${prefix}nam = @year`);
  }

  if (filters.quarter !== undefined) {
    request.input('quarter', sql.Int, filters.quarter);
    clauses.push(`${prefix}quy = @quarter`);
  }
}

function addAggregateNameFilter(filters, clauses, request, key, columnName, inputName = key) {
  if (filters[key] !== undefined) {
    request.input(inputName, sql.NVarChar, `%${filters[key]}%`);
    clauses.push(`${columnName} LIKE @${inputName}`);
  }
}

function addDirectNameFilter(filters, clauses, request, key, columnName, inputName = key) {
  addAggregateNameFilter(filters, clauses, request, key, columnName, inputName);
}

function appendWhereClauses(where, clauses) {
  const directClauses = clauses.filter(Boolean);
  if (!directClauses.length) return where;
  return where ? `${where} AND ${directClauses.join(' AND ')}` : `WHERE ${directClauses.join(' AND ')}`;
}

function withoutFilters(filters, keys) {
  const nextFilters = { ...filters };
  for (const key of keys) {
    delete nextFilters[key];
  }
  return nextFilters;
}

function buildAggregateWhere(filters, request, options = {}) {
  const clauses = [];
  addCommonTimeFilters(filters, clauses, request);

  if (options.useAllWhenNoTimeFilter && filters.year === undefined && filters.quarter === undefined) {
    request.input('allPeriod', sql.VarChar, 'ALL');
    clauses.push('nhanQuy = @allPeriod');
  }

  for (const filter of options.nameFilters || []) {
    addAggregateNameFilter(filters, clauses, request, filter.key, filter.column, filter.inputName);
  }

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

function applyLimit(request, filters) {
  request.input('limit', sql.Int, filters.limit || 10);
}

function orderBy(sortBy, sortOrder, fallback = 'soTin') {
  const column = sortColumns[sortBy] || fallback;
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
  return `${column} ${direction}`;
}

function addFactFilters(filters, clauses, request, options = {}) {
  if (filters.year !== undefined) {
    request.input('year', sql.Int, filters.year);
    clauses.push('dt.nam = @year');
  }

  if (filters.quarter !== undefined) {
    request.input('quarter', sql.Int, filters.quarter);
    clauses.push('dt.quy = @quarter');
  }

  if (filters.month !== undefined) {
    request.input('month', sql.Int, filters.month);
    clauses.push('dt.thang = @month');
  }

  if (filters.fromDate !== undefined) {
    request.input('fromDate', sql.Date, filters.fromDate);
    clauses.push('dt.ngayDay >= @fromDate');
  }

  if (filters.toDate !== undefined) {
    request.input('toDate', sql.Date, filters.toDate);
    clauses.push('dt.ngayDay <= @toDate');
  }

  if (filters.position !== undefined) {
    request.input('position', sql.NVarChar, `%${filters.position}%`);
    clauses.push('v.tenViTriChuan LIKE @position');
  }

  if (filters.company !== undefined) {
    request.input('company', sql.NVarChar, `%${filters.company}%`);
    clauses.push('ct.tenCongTy LIKE @company');
  }

  if (filters.level !== undefined) {
    request.input('level', sql.NVarChar, `%${filters.level}%`);
    clauses.push('cb.tenCapBac LIKE @level');
  }

  if (filters.city !== undefined) {
    request.input('city', sql.NVarChar, `%${filters.city}%`);
    clauses.push(`EXISTS (
      SELECT 1
      FROM FactTuyenDung_DiaDiem fdFilter
      JOIN DimDiaDiem ddFilter ON fdFilter.diaDiemId = ddFilter.diaDiemId
      WHERE fdFilter.factId = f.factId AND ddFilter.tenThanhPho LIKE @city
    )`);
  }

  if (filters.ward !== undefined) {
    request.input('ward', sql.NVarChar, `%${filters.ward}%`);
    clauses.push(`EXISTS (
      SELECT 1
      FROM FactTuyenDung_DiaDiem fwFilter
      JOIN DimDiaDiem dwFilter ON fwFilter.diaDiemId = dwFilter.diaDiemId
      WHERE fwFilter.factId = f.factId AND dwFilter.tenPhuongXa LIKE @ward
    )`);
  }

  if (filters.skill !== undefined) {
    request.input('skill', sql.NVarChar, `%${filters.skill}%`);
    clauses.push(`EXISTS (
      SELECT 1
      FROM FactTuyenDung_KyNang fkFilter
      JOIN DimKyNang dkFilter ON fkFilter.kyNangId = dkFilter.kyNangId
      WHERE fkFilter.factId = f.factId AND dkFilter.tenKyNang LIKE @skill
    )`);
  }

  if (filters.salaryMin !== undefined) {
    request.input('salaryMin', sql.Decimal(10, 2), filters.salaryMin);
    clauses.push('f.coLuong = 1 AND f.luongTrungBinh >= @salaryMin');
  }

  if (filters.salaryMax !== undefined) {
    request.input('salaryMax', sql.Decimal(10, 2), filters.salaryMax);
    clauses.push('f.coLuong = 1 AND f.luongTrungBinh <= @salaryMax');
  }

  if (filters.experienceMin !== undefined) {
    request.input('experienceMin', sql.Decimal(4, 1), filters.experienceMin);
    clauses.push('f.soNamKinhNghiem >= @experienceMin');
  }

  if (filters.experienceMax !== undefined) {
    request.input('experienceMax', sql.Decimal(4, 1), filters.experienceMax);
    clauses.push('f.soNamKinhNghiem <= @experienceMax');
  }

  if (options.positionExact) {
    request.input('positionExact', sql.NVarChar, options.positionExact);
    clauses.push('v.tenViTriChuan = @positionExact');
  }

  if (options.levelExact) {
    request.input('levelExact', sql.NVarChar, options.levelExact);
    clauses.push('cb.tenCapBac = @levelExact');
  }
}

function factWhere(filters, request, options = {}) {
  const clauses = [];
  addFactFilters(filters, clauses, request, options);
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

async function queryRecordset(configure) {
  const pool = await poolPromise;
  const request = pool.request();
  const query = configure(request);
  const result = await request.query(query);
  return result.recordset;
}

module.exports = {
  sql,
  poolPromise,
  toNumber,
  addCommonTimeFilters,
  addDirectNameFilter,
  appendWhereClauses,
  buildAggregateWhere,
  applyLimit,
  orderBy,
  factWhere,
  queryRecordset,
  withoutFilters,
};
