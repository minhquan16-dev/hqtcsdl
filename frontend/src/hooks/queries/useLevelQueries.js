import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useLevelsQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.levels(params),
    queryFn: () => analyticsApi.getLevels(params),
  })
}

export function useExperienceByPositionQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.experienceByPosition(params),
    queryFn: () => analyticsApi.getExperienceByPosition(params),
  })
}

export function useLevelSkillsQuery(level, params) {
  return useQuery({
    queryKey: queryKeys.analytics.levelSkills(level, params),
    queryFn: () => analyticsApi.getLevelSkills(level, params),
    enabled: Boolean(level),
  })
}
