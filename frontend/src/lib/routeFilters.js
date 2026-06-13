import { FILTER_DEFAULTS, ROUTE_FILTER_FIELDS } from "./constants.js";

export function createRouteFilterState() {
  return Object.fromEntries(
    Object.keys(ROUTE_FILTER_FIELDS).map((routeKey) => [
      routeKey,
      { ...FILTER_DEFAULTS },
    ]),
  );
}

export function getAllowedFilters(routeKey) {
  return ROUTE_FILTER_FIELDS[routeKey] || [];
}

export function getRouteFilterState(state, routeKey) {
  return {
    ...FILTER_DEFAULTS,
    ...(state?.[routeKey] || {}),
  };
}

export function updateRouteFilterState(state, routeKey, nextFilters) {
  return {
    ...(state || {}),
    [routeKey]: {
      ...FILTER_DEFAULTS,
      ...(typeof nextFilters === "function"
        ? nextFilters(getRouteFilterState(state, routeKey))
        : nextFilters),
    },
  };
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
