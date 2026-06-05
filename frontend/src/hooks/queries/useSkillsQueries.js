import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useTopSkillsQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.skillsTop(params),
    queryFn: () => analyticsApi.getTopSkills(params),
  })
}

export function useTopLanguagesQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.languagesTop(params),
    queryFn: () => analyticsApi.getTopLanguages(params),
  })
}

export function useSkillCoOccurrenceQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.skillCoOccurrence(params),
    queryFn: () => analyticsApi.getSkillCoOccurrence(params),
  })
}
