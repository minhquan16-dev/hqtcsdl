const analyticsService = require('../services/analyticsService');
const { sendEmpty, sendSuccess } = require('../utils/apiResponse');
const { createValidationError, validateAnalyticsQuery } = require('../utils/queryValidation');

const groupByWhitelist = ['quarter', 'month', 'city', 'ward', 'skill', 'position', 'company', 'level'];

function createHandler({ service, message, allowed, sortByWhitelist, groupByRequired = false, required = [], pathParam }) {
  return async (req, res, next) => {
    try {
      const filters = validateAnalyticsQuery(req.query, {
        allowed,
        sortByWhitelist,
        groupByWhitelist,
        required: groupByRequired ? ['groupBy', ...required] : required,
      });

      let result;
      if (pathParam) {
        const value = req.params[pathParam]?.trim();
        if (!value) {
          throw createValidationError(`Thiếu tham số bắt buộc: ${pathParam}`);
        }
        result = await service(value, filters);
      } else {
        result = await service(filters);
      }

      if (result.isEmpty) {
        return sendEmpty(res, result.data);
      }

      return sendSuccess(res, message, result.data);
    } catch (error) {
      return next(error);
    }
  };
}

const commonTime = ['year', 'quarter'];
const commonFactFilters = [
  'year',
  'quarter',
  'month',
  'fromDate',
  'toDate',
  'city',
  'ward',
  'skill',
  'position',
  'company',
  'level',
  'salaryMin',
  'salaryMax',
  'experienceMin',
  'experienceMax',
];

module.exports = {
  getOverview: createHandler({
    service: analyticsService.getOverview,
    message: 'Lấy dữ liệu tổng quan thành công',
    allowed: ['year', 'quarter', 'fromDate', 'toDate'],
  }),
  getFilters: createHandler({
    service: analyticsService.getFilters,
    message: 'Lấy danh sách bộ lọc thành công',
    allowed: [],
  }),
  getQuarterTrends: createHandler({
    service: analyticsService.getQuarterTrends,
    message: 'Lấy xu hướng tuyển dụng theo quý thành công',
    allowed: ['year', 'limit'],
  }),
  getMonthTrends: createHandler({
    service: analyticsService.getMonthTrends,
    message: 'Lấy xu hướng tuyển dụng theo tháng thành công',
    allowed: commonTime,
  }),
  getPositions: createHandler({
    service: analyticsService.getPositions,
    message: 'Lấy phân tích vị trí thành công',
    allowed: [...commonTime, 'position', 'limit', 'sortBy', 'sortOrder'],
    sortByWhitelist: ['jobCount', 'averageSalary', 'averageExperience'],
  }),
  getPositionSkills: createHandler({
    service: analyticsService.getPositionSkills,
    message: 'Lấy kỹ năng theo vị trí thành công',
    allowed: [...commonTime, 'limit'],
    pathParam: 'position',
  }),
  getTopSkills: createHandler({
    service: analyticsService.getTopSkills,
    message: 'Lấy top kỹ năng thành công',
    allowed: [...commonTime, 'skill', 'limit'],
  }),
  getTopLanguages: createHandler({
    service: analyticsService.getTopLanguages,
    message: 'Lấy top ngôn ngữ lập trình thành công',
    allowed: [...commonTime, 'limit'],
  }),
  getSkillCoOccurrence: createHandler({
    service: analyticsService.getSkillCoOccurrence,
    message: 'Lấy kỹ năng thường đi kèm thành công',
    allowed: ['skill', ...commonTime, 'limit'],
  }),
  getSalaryByPosition: createHandler({
    service: analyticsService.getSalaryByPosition,
    message: 'Lấy lương theo vị trí thành công',
    allowed: [...commonTime, 'position', 'limit', 'sortBy', 'sortOrder'],
    sortByWhitelist: ['jobCount', 'averageSalary', 'averageExperience'],
  }),
  getSalaryByExperience: createHandler({
    service: analyticsService.getSalaryByExperience,
    message: 'Lấy lương theo kinh nghiệm thành công',
    allowed: [...commonTime, 'limit'],
  }),
  getSalaryByCity: createHandler({
    service: analyticsService.getSalaryByCity,
    message: 'Lấy lương theo thành phố thành công',
    allowed: [...commonTime, 'city', 'limit'],
  }),
  getSalaryBySkill: createHandler({
    service: analyticsService.getSalaryBySkill,
    message: 'Lấy lương theo kỹ năng thành công',
    allowed: [...commonTime, 'skill', 'limit', 'sortBy', 'sortOrder'],
    sortByWhitelist: ['jobCount', 'averageSalary'],
  }),
  predictSalary: createHandler({
    service: analyticsService.predictSalary,
    message: 'Dự đoán lương thành công',
    allowed: ['position', 'city', 'level', 'experience', 'skills', 'companyField', 'companySize'],
    required: ['position'],
  }),
  getLocations: createHandler({
    service: analyticsService.getLocations,
    message: 'Lấy phân tích địa điểm thành công',
    allowed: [...commonTime, 'city', 'limit'],
  }),
  getWards: createHandler({
    service: analyticsService.getWards,
    message: 'Lấy phân tích phường xã thành công',
    allowed: ['city', 'ward', ...commonTime, 'limit'],
  }),
  getCityMarkets: createHandler({
    service: analyticsService.getCityMarkets,
    message: 'Lấy so sánh thị trường theo thành phố thành công',
    allowed: [...commonTime, 'city', 'limit', 'sortBy', 'sortOrder'],
    sortByWhitelist: ['jobCount', 'averageSalary', 'averageExperience', 'differentPositions'],
  }),
  getCityPositions: createHandler({
    service: analyticsService.getCityPositions,
    message: 'Lấy vị trí theo thành phố thành công',
    allowed: [...commonTime, 'limit'],
    pathParam: 'city',
  }),
  getTopCompanies: createHandler({
    service: analyticsService.getTopCompanies,
    message: 'Lấy top công ty tuyển dụng thành công',
    allowed: [...commonTime, 'company', 'limit'],
  }),
  getCompaniesByField: createHandler({
    service: analyticsService.getCompaniesByField,
    message: 'Lấy phân tích công ty theo lĩnh vực thành công',
    allowed: [...commonTime, 'limit'],
  }),
  getLevels: createHandler({
    service: analyticsService.getLevels,
    message: 'Lấy phân tích cấp bậc thành công',
    allowed: [...commonTime, 'level'],
  }),
  getExperienceByPosition: createHandler({
    service: analyticsService.getExperienceByPosition,
    message: 'Lấy kinh nghiệm theo vị trí thành công',
    allowed: [...commonTime, 'position', 'limit', 'sortBy', 'sortOrder'],
    sortByWhitelist: ['jobCount', 'averageExperience'],
  }),
  getLevelSkills: createHandler({
    service: analyticsService.getLevelSkills,
    message: 'Lấy kỹ năng theo cấp bậc thành công',
    allowed: [...commonTime, 'limit'],
    pathParam: 'level',
  }),
  getJobsSummary: createHandler({
    service: analyticsService.getJobsSummary,
    message: 'Lấy thống kê theo bộ lọc thành công',
    allowed: commonFactFilters,
  }),
  getJobsBreakdown: createHandler({
    service: analyticsService.getJobsBreakdown,
    message: 'Lấy phân rã thống kê thành công',
    allowed: [...commonFactFilters, 'groupBy'],
    groupByRequired: true,
  }),
};
