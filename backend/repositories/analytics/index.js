const overviewRepository = require('./overviewRepository');
const trendRepository = require('./trendRepository');
const positionRepository = require('./positionRepository');
const skillRepository = require('./skillRepository');
const salaryRepository = require('./salaryRepository');
const locationRepository = require('./locationRepository');
const companyRepository = require('./companyRepository');
const levelRepository = require('./levelRepository');
const jobRepository = require('./jobRepository');

module.exports = {
  getOverview: overviewRepository.getOverview,
  getFilters: overviewRepository.getFilters,
  getQuarterTrends: trendRepository.getQuarterTrends,
  getMonthTrends: trendRepository.getMonthTrends,
  getPositions: positionRepository.getPositions,
  getPositionSkills: positionRepository.getPositionSkills,
  getTopSkills: skillRepository.getTopSkills,
  getTopLanguages: skillRepository.getTopLanguages,
  getSkillCoOccurrence: skillRepository.getSkillCoOccurrence,
  getSalaryByExperience: salaryRepository.getSalaryByExperience,
  getSalaryByCity: salaryRepository.getSalaryByCity,
  getSalaryBySkill: salaryRepository.getSalaryBySkill,
  getLocations: locationRepository.getLocations,
  getWards: locationRepository.getWards,
  getCityMarkets: locationRepository.getCityMarkets,
  getCityPositions: locationRepository.getCityPositions,
  getTopCompanies: companyRepository.getTopCompanies,
  getCompaniesByField: companyRepository.getCompaniesByField,
  getLevels: levelRepository.getLevels,
  getExperienceByPosition: levelRepository.getExperienceByPosition,
  getLevelSkills: levelRepository.getLevelSkills,
  getJobsSummary: jobRepository.getJobsSummary,
  getJobsBreakdown: jobRepository.getJobsBreakdown,
};
