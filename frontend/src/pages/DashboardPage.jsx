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
import { FILTER_DEFAULTS } from "@/lib/constants";
import {
  getAllowedFilters,
  getFilterDefaults,
  sanitizeRouteParams,
} from "@/lib/routeFilters";

export function DashboardLayout() {
  const filtersQuery = useFiltersQuery();
  const [draftFilters, setDraftFilters] = useState(FILTER_DEFAULTS);
  const [appliedFilters, setAppliedFilters] = useState(FILTER_DEFAULTS);
  const [requestId, setRequestId] = useState(0);

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setRequestId((current) => current + 1);
  }

  function resetFilters(routeKey) {
    setDraftFilters((current) => getFilterDefaults(current, routeKey));
    setAppliedFilters((current) => getFilterDefaults(current, routeKey));
    setRequestId((current) => current + 1);
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardShell
          filtersQuery={filtersQuery}
          draftFilters={draftFilters}
          appliedFilters={appliedFilters}
          requestId={requestId}
          setDraftFilters={setDraftFilters}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}

function DashboardShell({
  filtersQuery,
  draftFilters,
  appliedFilters,
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
                      draftFilters,
                      appliedFilters,
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

  return {
    draftFilters: dashboardFilters.draftFilters,
    appliedParams: sanitizeRouteParams(
      {
        ...dashboardFilters.appliedFilters,
        __requestId: dashboardFilters.requestId,
      },
      routeKey,
    ),
    setDraftFilters: dashboardFilters.setDraftFilters,
    applyFilters: dashboardFilters.applyFilters,
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
    <>
      <RouteFilterBar
        routeKey="overview"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <Section id="tong-quan" title="Tổng quan">
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
    </>
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
    <>
      <RouteFilterBar
        routeKey="trends"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <TrendsSection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="positions"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <PositionsSection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="skills"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <SkillsSection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="salary"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <SalarySection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="location"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <LocationSection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="company"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <CompanySection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="level"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <LevelSection params={appliedParams} />
    </>
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
    <>
      <RouteFilterBar
        routeKey="jobs"
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        onApply={applyFilters}
      />
      <JobsSection params={appliedParams} />
    </>
  );
}

export function UnknownRoute() {
  return <Navigate to="/" replace />;
}
