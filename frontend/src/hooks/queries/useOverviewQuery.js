import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useOverviewQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.overview(params),
    queryFn: () => analyticsApi.getOverview(params),
  })
}
