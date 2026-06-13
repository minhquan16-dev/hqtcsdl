const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const stringMaxLengths = {
  city: 200,
  ward: 200,
  skill: 200,
  skills: 500,
  position: 400,
  company: 400,
  companyField: 100,
  companySize: 100,
  level: 100,
  groupBy: 50,
  sortBy: 50,
  sortOrder: 10,
};

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function parseInteger(value, name) {
  if (value === undefined) return undefined;
  if (!/^-?\d+$/.test(String(value))) {
    throw createValidationError(`${name} phải là số nguyên`);
  }
  return Number(value);
}

function parseNumber(value, name) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${name} phải là số`);
  }
  return parsed;
}

function parseDate(value, name) {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw createValidationError(`${name} phải có định dạng YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw createValidationError(`${name} không hợp lệ`);
  }
  return value;
}

function parseString(value, name) {
  if (value === undefined) return undefined;
  const parsed = String(value).trim();
  const maxLength = stringMaxLengths[name] || 200;
  if (parsed.length > maxLength) {
    throw createValidationError(`${name} không được vượt quá ${maxLength} ký tự`);
  }
  return parsed || undefined;
}

function ensureAllowedParams(query, allowed) {
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key)) {
      throw createValidationError(`Tham số ${key} không được hỗ trợ`);
    }
  }
}

function validateAnalyticsQuery(query, options = {}) {
  const allowed = options.allowed || [];
  ensureAllowedParams(query, allowed);

  const result = {};

  for (const key of allowed) {
    const value = query[key];
    if (value === undefined) continue;

    if (key === 'year') {
      const year = parseInteger(value, key);
      if (year < 2000 || year > 2100) {
        throw createValidationError('year phải nằm trong khoảng 2000 đến 2100');
      }
      result.year = year;
      continue;
    }

    if (key === 'quarter') {
      const quarter = parseInteger(value, key);
      if (![1, 2, 3, 4].includes(quarter)) {
        throw createValidationError('quarter chỉ được nhận giá trị từ 1 đến 4');
      }
      result.quarter = quarter;
      continue;
    }

    if (key === 'month') {
      const month = parseInteger(value, key);
      if (month < 1 || month > 12) {
        throw createValidationError('month chỉ được nhận giá trị từ 1 đến 12');
      }
      result.month = month;
      continue;
    }

    if (key === 'limit') {
      const limit = parseInteger(value, key);
      if (limit < 1 || limit > MAX_LIMIT) {
        throw createValidationError(`limit phải nằm trong khoảng 1 đến ${MAX_LIMIT}`);
      }
      result.limit = limit;
      continue;
    }

    if (key === 'fromDate' || key === 'toDate') {
      result[key] = parseDate(value, key);
      continue;
    }

    if (['salaryMin', 'salaryMax', 'experienceMin', 'experienceMax', 'experience'].includes(key)) {
      const number = parseNumber(value, key);
      if (number < 0) {
        throw createValidationError(`${key} phải lớn hơn hoặc bằng 0`);
      }
      result[key] = number;
      continue;
    }

    if (key === 'sortOrder') {
      const sortOrder = parseString(value, key)?.toLowerCase();
      if (!['asc', 'desc'].includes(sortOrder)) {
        throw createValidationError('sortOrder chỉ được nhận asc hoặc desc');
      }
      result.sortOrder = sortOrder;
      continue;
    }

    result[key] = parseString(value, key);
  }

  if (!result.limit && allowed.includes('limit')) {
    result.limit = options.defaultLimit || DEFAULT_LIMIT;
  }

  if (!result.sortOrder && allowed.includes('sortOrder')) {
    result.sortOrder = options.defaultSortOrder || 'desc';
  }

  if (result.fromDate && result.toDate && result.toDate < result.fromDate) {
    throw createValidationError('toDate phải lớn hơn hoặc bằng fromDate');
  }

  if (result.salaryMin !== undefined && result.salaryMax !== undefined && result.salaryMax < result.salaryMin) {
    throw createValidationError('salaryMax phải lớn hơn hoặc bằng salaryMin');
  }

  if (result.experienceMin !== undefined && result.experienceMax !== undefined && result.experienceMax < result.experienceMin) {
    throw createValidationError('experienceMax phải lớn hơn hoặc bằng experienceMin');
  }

  if (options.sortByWhitelist && result.sortBy && !options.sortByWhitelist.includes(result.sortBy)) {
    throw createValidationError(`sortBy chỉ được nhận một trong các giá trị: ${options.sortByWhitelist.join(', ')}`);
  }

  if (options.groupByWhitelist && result.groupBy && !options.groupByWhitelist.includes(result.groupBy)) {
    throw createValidationError(`groupBy chỉ được nhận một trong các giá trị: ${options.groupByWhitelist.join(', ')}`);
  }

  if (options.required) {
    for (const key of options.required) {
      if (result[key] === undefined) {
        throw createValidationError(`Thiếu tham số bắt buộc: ${key}`);
      }
    }
  }

  return result;
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  createValidationError,
  validateAnalyticsQuery,
};
