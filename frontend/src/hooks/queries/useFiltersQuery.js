import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useFiltersQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.filters,
    queryFn: analyticsApi.getFilters,
  })
}
