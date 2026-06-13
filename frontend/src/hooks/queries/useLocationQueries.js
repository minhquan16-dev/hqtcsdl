import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"
import { queryKeys } from "@/lib/queryKeys"

export function useLocationsQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.locations(params),
    queryFn: () => analyticsApi.getLocations(params),
  })
}

export function useMarketsCitiesQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.marketsCities(params),
    queryFn: () => analyticsApi.getMarketsCities(params),
  })
}

export function useCityPositionsQuery(city, params) {
  return useQuery({
    queryKey: queryKeys.analytics.cityPositions(city, params),
    queryFn: () => analyticsApi.getCityPositions(city, params),
    enabled: Boolean(city),
  })
}
