import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useTopCompaniesQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.companiesTop(params),
    queryFn: () => analyticsApi.getTopCompanies(params),
  })
}

export function useCompaniesByFieldQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.companiesByField(params),
    queryFn: () => analyticsApi.getCompaniesByField(params),
  })
}
