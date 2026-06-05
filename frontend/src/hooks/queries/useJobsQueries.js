import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useJobsSummaryQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.jobsSummary(params),
    queryFn: () => analyticsApi.getJobsSummary(params),
  })
}

export function useJobsBreakdownQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.jobsBreakdown(params),
    queryFn: () => analyticsApi.getJobsBreakdown(params),
    enabled: Boolean(params?.groupBy),
  })
}
