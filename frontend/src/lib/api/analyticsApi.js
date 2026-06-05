import { axiosClient } from "../axiosClient"

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== ""
    })
  )
}

export const analyticsApi = {
  getHealth() {
    return axiosClient.get("/api/health")
  },
  getOverview(params) {
    return axiosClient.get("/api/analytics/overview", {
      params: cleanParams(params),
    })
  },
  getFilters() {
    return axiosClient.get("/api/analytics/filters")
  },
  getQuarterTrends(params) {
    return axiosClient.get("/api/analytics/trends/quarters", {
      params: cleanParams(params),
    })
  },
  getMonthTrends(params) {
    return axiosClient.get("/api/analytics/trends/months", {
      params: cleanParams(params),
    })
  },
  getPositions(params) {
    return axiosClient.get("/api/analytics/positions", {
      params: cleanParams(params),
    })
  },
  getPositionSkills(position, params) {
    return axiosClient.get(
      `/api/analytics/positions/${encodeURIComponent(position)}/skills`,
      { params: cleanParams(params) }
    )
  },
  getTopSkills(params) {
    return axiosClient.get("/api/analytics/skills/top", {
      params: cleanParams(params),
    })
  },
  getTopLanguages(params) {
    return axiosClient.get("/api/analytics/languages/top", {
      params: cleanParams(params),
    })
  },
  getSkillCoOccurrence(params) {
    return axiosClient.get("/api/analytics/skills/co-occurrence", {
      params: cleanParams(params),
    })
  },
  getSalariesByPosition(params) {
    return axiosClient.get("/api/analytics/salaries/by-position", {
      params: cleanParams(params),
    })
  },
  getSalariesByExperience(params) {
    return axiosClient.get("/api/analytics/salaries/by-experience", {
      params: cleanParams(params),
    })
  },
  getSalariesByCity(params) {
    return axiosClient.get("/api/analytics/salaries/by-city", {
      params: cleanParams(params),
    })
  },
  getSalariesBySkill(params) {
    return axiosClient.get("/api/analytics/salaries/by-skill", {
      params: cleanParams(params),
    })
  },
  getLocations(params) {
    return axiosClient.get("/api/analytics/locations", {
      params: cleanParams(params),
    })
  },
  getWards(params) {
    return axiosClient.get("/api/analytics/locations/wards", {
      params: cleanParams(params),
    })
  },
  getMarketsCities(params) {
    return axiosClient.get("/api/analytics/markets/cities", {
      params: cleanParams(params),
    })
  },
  getTopCompanies(params) {
    return axiosClient.get("/api/analytics/companies/top", {
      params: cleanParams(params),
    })
  },
  getCompaniesByField(params) {
    return axiosClient.get("/api/analytics/companies/by-field", {
      params: cleanParams(params),
    })
  },
  getLevels(params) {
    return axiosClient.get("/api/analytics/levels", {
      params: cleanParams(params),
    })
  },
  getExperienceByPosition(params) {
    return axiosClient.get("/api/analytics/experience/by-position", {
      params: cleanParams(params),
    })
  },
  getLevelSkills(level, params) {
    return axiosClient.get(
      `/api/analytics/levels/${encodeURIComponent(level)}/skills`,
      { params: cleanParams(params) }
    )
  },
  getJobsSummary(params) {
    return axiosClient.get("/api/analytics/jobs/summary", {
      params: cleanParams(params),
    })
  },
  getJobsBreakdown(params) {
    return axiosClient.get("/api/analytics/jobs/breakdown", {
      params: cleanParams(params),
    })
  },
}
