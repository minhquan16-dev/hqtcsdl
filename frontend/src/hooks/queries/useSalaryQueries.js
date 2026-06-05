import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useSalariesByPositionQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.salariesByPosition(params),
    queryFn: () => analyticsApi.getSalariesByPosition(params),
  })
}

export function useSalariesByExperienceQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.salariesByExperience(params),
    queryFn: () => analyticsApi.getSalariesByExperience(params),
  })
}

export function useSalariesByCityQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.salariesByCity(params),
    queryFn: () => analyticsApi.getSalariesByCity(params),
  })
}

export function useSalariesBySkillQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.salariesBySkill(params),
    queryFn: () => analyticsApi.getSalariesBySkill(params),
  })
}
