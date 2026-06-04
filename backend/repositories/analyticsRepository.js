const { sql, poolPromise } = require('../config/db');

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

async function getOverview(filters) {
  const pool = await poolPromise;
  const request = pool.request();
  const where = factWhere(filters, request);

  const [summary, topCity, topSkill] = await Promise.all([
    request.query(`
      SELECT
        COUNT(DISTINCT f.factId) AS tongSoTin,
        SUM(CASE WHEN f.coLuong = 1 THEN 1 ELSE 0 END) AS soTinCoLuong,
        COUNT(DISTINCT f.congTyId) AS soCongTy,
        COUNT(DISTINCT f.viTriId) AS soViTri,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
    `),
    queryRecordset((topCityRequest) => {
      const topCityWhere = factWhere(filters, topCityRequest);
      return `
        SELECT TOP (1) dd.tenThanhPho, COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
        LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
        LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
        JOIN DimCongTy ct ON f.congTyId = ct.congTyId
        JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId
        JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId
        ${topCityWhere}
        GROUP BY dd.tenThanhPho
        ORDER BY soTin DESC
      `;
    }),
    queryRecordset((topSkillRequest) => {
      const topSkillWhere = factWhere(filters, topSkillRequest);
      return `
        SELECT TOP (1) dk.tenKyNang, COUNT(DISTINCT f.factId) AS soTin
        FROM FactTuyenDung f
        JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
        LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
        LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
        JOIN DimCongTy ct ON f.congTyId = ct.congTyId
        JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
        JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
        ${topSkillWhere}
        GROUP BY dk.tenKyNang
        ORDER BY soTin DESC
      `;
    }),
  ]);

  const totalSkills = await queryRecordset((skillRequest) => {
    const skillWhere = factWhere(filters, skillRequest);
    return `
      SELECT COUNT(DISTINCT dk.kyNangId) AS soKyNang
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
      JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
      ${skillWhere}
    `;
  });

  const row = summary.recordset[0];

  return {
    tongSoTin: row.tongSoTin || 0,
    soTinCoLuong: row.soTinCoLuong || 0,
    soCongTy: row.soCongTy || 0,
    soViTri: row.soViTri || 0,
    soKyNang: totalSkills[0]?.soKyNang || 0,
    luongTrungBinh: toNumber(row.luongTrungBinh),
    thanhPhoNoiBat: topCity[0] || null,
    kyNangNoiBat: topSkill[0] || null,
  };
}

async function getFilters() {
  const [quarters, years, cities, levels, positions, skills, companies] = await Promise.all([
    queryRecordset(() => 'SELECT DISTINCT nhanQuy AS value FROM DimThoiGian ORDER BY nhanQuy'),
    queryRecordset(() => 'SELECT DISTINCT nam AS value FROM DimThoiGian ORDER BY nam DESC'),
    queryRecordset(() => 'SELECT DISTINCT tenThanhPho AS value FROM DimDiaDiem ORDER BY tenThanhPho'),
    queryRecordset(() => 'SELECT DISTINCT tenCapBac AS value FROM DimCapBac ORDER BY tenCapBac'),
    queryRecordset(() => 'SELECT DISTINCT tenViTriChuan AS value FROM DimViTri ORDER BY tenViTriChuan'),
    queryRecordset(() => 'SELECT DISTINCT tenKyNang AS value FROM DimKyNang ORDER BY tenKyNang'),
    queryRecordset(() => 'SELECT DISTINCT tenCongTy AS value FROM DimCongTy ORDER BY tenCongTy'),
  ]);

  return {
    nhanQuy: quarters.map((row) => row.value),
    nam: years.map((row) => row.value),
    tenThanhPho: cities.map((row) => row.value),
    tenCapBac: levels.map((row) => row.value),
    tenViTriChuan: positions.map((row) => row.value),
    tenKyNang: skills.map((row) => row.value),
    tenCongTy: companies.map((row) => row.value),
  };
}

async function getQuarterTrends(filters) {
  return queryRecordset((request) => {
    applyLimit(request, filters);
    const where = buildAggregateWhere(filters, request);
    return `
      SELECT TOP (@limit)
        nhanQuy,
        nam,
        quy,
        soTin,
        soTinCoLuong,
        luongTrungBinh,
        soTinQuyTruoc,
        bienDong,
        phanTramThayDoi
      FROM AggXuHuongTheoQuy
      ${where}
      ORDER BY nam ASC, quy ASC
    `;
  });
}

async function getMonthTrends(filters) {
  return queryRecordset((request) => {
    const where = factWhere(filters, request);
    return `
      SELECT
        dt.nam,
        dt.thang,
        COUNT(DISTINCT f.factId) AS soTin,
        SUM(CASE WHEN f.coLuong = 1 THEN 1 ELSE 0 END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
      GROUP BY dt.nam, dt.thang
      ORDER BY dt.nam ASC, dt.thang ASC
    `;
  });
}

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
    const where = factWhere(filters, request);
    return `
      SELECT TOP (@limit)
        dk.tenKyNang,
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId
      JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId
      ${where}
      GROUP BY dk.tenKyNang
      ORDER BY ${orderBy(filters.sortBy, filters.sortOrder)}
    `;
  });
}

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

async function getJobsSummary(filters) {
  return queryRecordset((request) => {
    const where = factWhere(filters, request);
    return `
      SELECT
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh,
        AVG(f.soNamKinhNghiem) AS kinhNghiemTB,
        COUNT(DISTINCT f.congTyId) AS soCongTy,
        COUNT(DISTINCT f.viTriId) AS soViTri,
        (
          SELECT COUNT(DISTINCT fk.kyNangId)
          FROM FactTuyenDung f2
          JOIN DimThoiGian dt ON f2.thoiGianId = dt.thoiGianId
          LEFT JOIN DimViTri v ON f2.viTriId = v.viTriId
          LEFT JOIN DimCapBac cb ON f2.capBacId = cb.capBacId
          JOIN DimCongTy ct ON f2.congTyId = ct.congTyId
          JOIN FactTuyenDung_KyNang fk ON f2.factId = fk.factId
          WHERE f2.factId IN (
            SELECT f.factId
            FROM FactTuyenDung f
            JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
            LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
            LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
            JOIN DimCongTy ct ON f.congTyId = ct.congTyId
            ${where}
          )
        ) AS soKyNang
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${where}
    `;
  });
}

const groupByConfig = {
  quarter: {
    select: 'dt.nhanQuy',
    order: 'MIN(dt.nam) ASC, MIN(dt.quy) ASC',
  },
  month: {
    select: "CONCAT(dt.nam, '-', RIGHT(CONCAT('0', dt.thang), 2))",
    order: 'MIN(dt.nam) ASC, MIN(dt.thang) ASC',
  },
  city: {
    select: 'dd.tenThanhPho',
    joins: 'JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId',
    order: 'soTin DESC',
  },
  ward: {
    select: 'dd.tenPhuongXa',
    joins: 'JOIN FactTuyenDung_DiaDiem fd ON f.factId = fd.factId JOIN DimDiaDiem dd ON fd.diaDiemId = dd.diaDiemId',
    order: 'soTin DESC',
  },
  skill: {
    select: 'dk.tenKyNang',
    joins: 'JOIN FactTuyenDung_KyNang fk ON f.factId = fk.factId JOIN DimKyNang dk ON fk.kyNangId = dk.kyNangId',
    order: 'soTin DESC',
  },
  position: {
    select: 'v.tenViTriChuan',
    order: 'soTin DESC',
  },
  company: {
    select: 'ct.tenCongTy',
    order: 'soTin DESC',
  },
  level: {
    select: 'cb.tenCapBac',
    order: 'soTin DESC',
  },
};

async function getJobsBreakdown(filters) {
  return queryRecordset((request) => {
    const config = groupByConfig[filters.groupBy];
    const where = factWhere(filters, request);
    return `
      SELECT
        ${config.select} AS nhom,
        COUNT(DISTINCT f.factId) AS soTin,
        COUNT(DISTINCT CASE WHEN f.coLuong = 1 THEN f.factId END) AS soTinCoLuong,
        AVG(CASE WHEN f.coLuong = 1 THEN f.luongTrungBinh END) AS luongTrungBinh
      FROM FactTuyenDung f
      JOIN DimThoiGian dt ON f.thoiGianId = dt.thoiGianId
      LEFT JOIN DimViTri v ON f.viTriId = v.viTriId
      LEFT JOIN DimCapBac cb ON f.capBacId = cb.capBacId
      JOIN DimCongTy ct ON f.congTyId = ct.congTyId
      ${config.joins || ''}
      ${where}
      GROUP BY ${config.select}
      ORDER BY ${config.order}
    `;
  });
}

module.exports = {
  getOverview,
  getFilters,
  getQuarterTrends,
  getMonthTrends,
  getPositions,
  getPositionSkills,
  getTopSkills,
  getTopLanguages,
  getSkillCoOccurrence,
  getSalaryByExperience,
  getSalaryByCity,
  getSalaryBySkill,
  getLocations,
  getWards,
  getCityMarkets,
  getTopCompanies,
  getCompaniesByField,
  getLevels,
  getExperienceByPosition,
  getLevelSkills,
  getJobsSummary,
  getJobsBreakdown,
};
