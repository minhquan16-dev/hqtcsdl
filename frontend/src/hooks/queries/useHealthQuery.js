import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useHealthQuery() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: analyticsApi.getHealth,
    staleTime: 30 * 1000,
  })
}
