import { FILTER_DEFAULTS, ROUTE_FILTER_FIELDS } from "./constants.js";

export function getAllowedFilters(routeKey) {
  return ROUTE_FILTER_FIELDS[routeKey] || [];
}

export function sanitizeRouteParams(params, routeKey) {
  const allowedFilters = new Set(getAllowedFilters(routeKey));

  return Object.fromEntries(
    Object.entries(params || {}).filter(([key]) => {
      return key.startsWith("__") || allowedFilters.has(key);
    }),
  );
}

export function getFilterDefaults(currentFilters, routeKey) {
  const nextFilters = {
    ...FILTER_DEFAULTS,
    ...(currentFilters || {}),
  };

  getAllowedFilters(routeKey).forEach((key) => {
    nextFilters[key] = "";
  });

  return nextFilters;
}
