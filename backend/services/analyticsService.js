const analyticsRepository = require('../repositories/analyticsRepository');

function roundNullable(value, digits = 2) {
  if (value === null || value === undefined) return null;
  return Number(Number(value).toFixed(digits));
}

function normalizeNumbers(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeNumbers);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (entry && typeof entry === 'object') {
        return [key, normalizeNumbers(entry)];
      }

      if (typeof entry === 'number') {
        return [key, roundNullable(entry)];
      }

      return [key, entry];
    }),
  );
}

function isEmptyData(data) {
  if (Array.isArray(data)) return data.length === 0;
  if (!data || typeof data !== 'object') return !data;
  if (Object.prototype.hasOwnProperty.call(data, 'soTin')) return data.soTin === 0;
  if (Object.prototype.hasOwnProperty.call(data, 'tongSoTin')) return data.tongSoTin === 0;
  return false;
}

async function withEmptyState(fetcher) {
  const data = normalizeNumbers(await fetcher());
  return {
    data,
    isEmpty: isEmptyData(data),
  };
}

async function getOverview(filters) {
  return withEmptyState(() => analyticsRepository.getOverview(filters));
}

async function getFilters() {
  return withEmptyState(() => analyticsRepository.getFilters());
}

async function getQuarterTrends(filters) {
  return withEmptyState(() => analyticsRepository.getQuarterTrends(filters));
}

async function getMonthTrends(filters) {
  return withEmptyState(() => analyticsRepository.getMonthTrends(filters));
}

async function getPositions(filters) {
  return withEmptyState(() => analyticsRepository.getPositions(filters));
}

async function getPositionSkills(position, filters) {
  const rows = await analyticsRepository.getPositionSkills(position, filters);
  return withEmptyState(() => ({
    tenViTriChuan: position,
    kyNang: rows,
  }));
}

async function getTopSkills(filters) {
  return withEmptyState(() => analyticsRepository.getTopSkills(filters));
}

async function getTopLanguages(filters) {
  return withEmptyState(() => analyticsRepository.getTopLanguages(filters));
}

async function getSkillCoOccurrence(filters) {
  return withEmptyState(() => analyticsRepository.getSkillCoOccurrence(filters));
}

async function getSalaryByPosition(filters) {
  return withEmptyState(() => analyticsRepository.getPositions(filters));
}

async function getSalaryByExperience(filters) {
  return withEmptyState(() => analyticsRepository.getSalaryByExperience(filters));
}

async function getSalaryByCity(filters) {
  return withEmptyState(() => analyticsRepository.getSalaryByCity(filters));
}

async function getSalaryBySkill(filters) {
  return withEmptyState(() => analyticsRepository.getSalaryBySkill(filters));
}

async function getLocations(filters) {
  return withEmptyState(() => analyticsRepository.getLocations(filters));
}

async function getWards(filters) {
  return withEmptyState(() => analyticsRepository.getWards(filters));
}

async function getCityMarkets(filters) {
  return withEmptyState(() => analyticsRepository.getCityMarkets(filters));
}

async function getCityPositions(city, filters) {
  const rows = await analyticsRepository.getCityPositions(city, filters);
  return withEmptyState(() => ({
    tenThanhPho: city,
    viTri: rows,
  }));
}

async function getTopCompanies(filters) {
  return withEmptyState(() => analyticsRepository.getTopCompanies(filters));
}

async function getCompaniesByField(filters) {
  return withEmptyState(() => analyticsRepository.getCompaniesByField(filters));
}

async function getLevels(filters) {
  return withEmptyState(() => analyticsRepository.getLevels(filters));
}

async function getExperienceByPosition(filters) {
  return withEmptyState(() => analyticsRepository.getExperienceByPosition(filters));
}

async function getLevelSkills(level, filters) {
  const rows = await analyticsRepository.getLevelSkills(level, filters);
  return withEmptyState(() => ({
    tenCapBac: level,
    kyNang: rows,
  }));
}

async function getJobsSummary(filters) {
  const rows = await analyticsRepository.getJobsSummary(filters);
  return withEmptyState(() => rows[0] || {
    soTin: 0,
    soTinCoLuong: 0,
    luongTrungBinh: null,
    kinhNghiemTB: null,
    soCongTy: 0,
    soViTri: 0,
    soKyNang: 0,
  });
}

async function getJobsBreakdown(filters) {
  return withEmptyState(() => analyticsRepository.getJobsBreakdown(filters));
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
  getSalaryByPosition,
  getSalaryByExperience,
  getSalaryByCity,
  getSalaryBySkill,
  getLocations,
  getWards,
  getCityMarkets,
  getCityPositions,
  getTopCompanies,
  getCompaniesByField,
  getLevels,
  getExperienceByPosition,
  getLevelSkills,
  getJobsSummary,
  getJobsBreakdown,
};
