import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function usePositionsQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.positions(params),
    queryFn: () => analyticsApi.getPositions(params),
  })
}

export function usePositionSkillsQuery(position, params) {
  return useQuery({
    queryKey: queryKeys.analytics.positionSkills(position, params),
    queryFn: () => analyticsApi.getPositionSkills(position, params),
    enabled: Boolean(position),
  })
}
