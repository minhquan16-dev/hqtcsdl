import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useQuarterTrendsQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.quarterTrends(params),
    queryFn: () => analyticsApi.getQuarterTrends(params),
  })
}

export function useMonthTrendsQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.monthTrends(params),
    queryFn: () => analyticsApi.getMonthTrends(params),
  })
}
