import { useState } from "react";
import { Navigate, Outlet, useOutletContext } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { QueryError } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { FilterBar } from "@/components/filters/FilterBar";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { TrendsSection } from "@/components/dashboard/TrendsSection";
import { PositionsSection } from "@/components/dashboard/PositionsSection";
import { SkillsSection } from "@/components/dashboard/SkillsSection";
import { SalarySection } from "@/components/dashboard/SalarySection";
import { SqlChatbotSheet } from "@/components/dashboard/SqlChatbotSheet";
import {
  CompanySection,
  LocationSection,
} from "@/components/dashboard/LocationCompanySection";
import {
  JobsSection,
  LevelSection,
} from "@/components/dashboard/LevelJobsSection";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useFiltersQuery } from "@/hooks/queries/useFiltersQuery";
import { useOverviewQuery } from "@/hooks/queries/useOverviewQuery";
import { NAV_ITEMS } from "@/lib/constants";
import {
  createRouteFilterState,
  getAllowedFilters,
  getFilterDefaults,
  getRouteFilterState,
  sanitizeRouteParams,
  updateRouteFilterState,
} from "@/lib/routeFilters";

export function DashboardLayout() {
  const filtersQuery = useFiltersQuery();
  const [draftFiltersByRoute, setDraftFiltersByRoute] = useState(
    createRouteFilterState,
  );
  const [appliedFiltersByRoute, setAppliedFiltersByRoute] = useState(
    createRouteFilterState,
  );
  const [requestId, setRequestId] = useState(0);

  function updateDraftFilters(routeKey, nextFilters) {
    setDraftFiltersByRoute((current) =>
      updateRouteFilterState(current, routeKey, nextFilters),
    );
  }

  function applyFilters(routeKey) {
    setAppliedFiltersByRoute((current) =>
      updateRouteFilterState(
        current,
        routeKey,
        getRouteFilterState(draftFiltersByRoute, routeKey),
      ),
    );
    setRequestId((current) => current + 1);
  }

  function resetFilters(routeKey) {
    setDraftFiltersByRoute((current) =>
      updateRouteFilterState(current, routeKey, (filters) =>
        getFilterDefaults(filters, routeKey),
      ),
    );
    setAppliedFiltersByRoute((current) =>
      updateRouteFilterState(current, routeKey, (filters) =>
        getFilterDefaults(filters, routeKey),
      ),
    );
    setRequestId((current) => current + 1);
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardShell
          filtersQuery={filtersQuery}
          draftFiltersByRoute={draftFiltersByRoute}
          appliedFiltersByRoute={appliedFiltersByRoute}
          requestId={requestId}
          setDraftFilters={updateDraftFilters}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}

function DashboardShell({
  filtersQuery,
  draftFiltersByRoute,
  appliedFiltersByRoute,
  requestId,
  setDraftFilters,
  applyFilters,
  resetFilters,
}) {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <div className="relative flex min-h-dvh w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 overflow-x-clip bg-background">
          <div className="px-4 py-5 md:px-6">
            <div className="w-full">
              <div className="flex w-full flex-col gap-6 px-3 py-5 md:px-6 xl:px-8">
                <Outlet
                  context={{
                    filtersQuery,
                    dashboardFilters: {
                      draftFiltersByRoute,
                      appliedFiltersByRoute,
                      requestId,
                      setDraftFilters,
                      applyFilters,
                      resetFilters,
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <SqlChatbotSheet />
        </SidebarInset>
      </div>
    </div>
  );
}

function useDashboardContext() {
  return useOutletContext();
}

function useRouteFilters(routeKey) {
  const { dashboardFilters } = useDashboardContext();
  const draftFilters = getRouteFilterState(
    dashboardFilters.draftFiltersByRoute,
    routeKey,
  );
  const appliedFilters = getRouteFilterState(
    dashboardFilters.appliedFiltersByRoute,
    routeKey,
  );

  return {
    draftFilters,
    appliedParams: sanitizeRouteParams(
      {
        ...appliedFilters,
        __requestId: dashboardFilters.requestId,
      },
      routeKey,
    ),
    setDraftFilters: (nextFilters) =>
      dashboardFilters.setDraftFilters(routeKey, nextFilters),
    applyFilters: () => dashboardFilters.applyFilters(routeKey),
    resetFilters: () => dashboardFilters.resetFilters(routeKey),
  };
}

function RouteFilterBar({ routeKey, filters, onChange, onReset, onApply }) {
  const { filtersQuery } = useDashboardContext();

  if (filtersQuery.isError) {
    return (
      <QueryError error={filtersQuery.error} onRetry={filtersQuery.refetch} />
    );
  }

  return (
    <FilterBar
      filters={filters}
      filterKeys={getAllowedFilters(routeKey)}
      filterOptions={filtersQuery.data}
      onChange={onChange}
      onReset={onReset}
      onApply={onApply}
    />
  );
}

function getRouteMeta(routeKey) {
  return NAV_ITEMS.find((item) => item.routeKey === routeKey);
}

function DashboardRoutePage({
  routeKey,
  filters,
  onChange,
  onReset,
  onApply,
  children,
}) {
  const routeMeta = getRouteMeta(routeKey);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {routeMeta?.label}
      </h1>
      <RouteFilterBar
        routeKey={routeKey}
        filters={filters}
        onChange={onChange}
        onReset={onReset}
        onApply={onApply}
      />
      {children}
    </>
  );
}

export function OverviewPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("overview");
  const overviewQuery = useOverviewQuery({
    year: appliedParams.year,
    quarter: appliedParams.quarter,
  });

  return (
    <DashboardRoutePage
      routeKey="overview"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <Section id="tong-quan">
        {overviewQuery.isError ? (
          <QueryError
            error={overviewQuery.error}
            onRetry={overviewQuery.refetch}
          />
        ) : (
          <KpiGrid
            data={overviewQuery.data}
            isLoading={overviewQuery.isLoading}
          />
        )}
      </Section>
    </DashboardRoutePage>
  );
}

export function TrendsPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("trends");

  return (
    <DashboardRoutePage
      routeKey="trends"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <TrendsSection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function PositionsPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("positions");

  return (
    <DashboardRoutePage
      routeKey="positions"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <PositionsSection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function SkillsPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("skills");

  return (
    <DashboardRoutePage
      routeKey="skills"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <SkillsSection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function SalaryPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("salary");

  return (
    <DashboardRoutePage
      routeKey="salary"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <SalarySection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function LocationPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("location");

  return (
    <DashboardRoutePage
      routeKey="location"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <LocationSection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function CompanyPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("company");

  return (
    <DashboardRoutePage
      routeKey="company"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <CompanySection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function LevelPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("level");

  return (
    <DashboardRoutePage
      routeKey="level"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <LevelSection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function JobsPage() {
  const {
    draftFilters,
    appliedParams,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useRouteFilters("jobs");

  return (
    <DashboardRoutePage
      routeKey="jobs"
      filters={draftFilters}
      onChange={setDraftFilters}
      onReset={resetFilters}
      onApply={applyFilters}
    >
      <JobsSection params={appliedParams} />
    </DashboardRoutePage>
  );
}

export function UnknownRoute() {
  return <Navigate to="/" replace />;
}
