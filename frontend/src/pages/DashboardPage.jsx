import { useState } from "react";
import { Navigate, NavLink, Outlet, useOutletContext } from "react-router";
import { ActivityIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useFiltersQuery } from "@/hooks/queries/useFiltersQuery";
import { useOverviewQuery } from "@/hooks/queries/useOverviewQuery";
import { FILTER_DEFAULTS, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function cleanDashboardParams(filters) {
  return {
    year: filters.year,
    quarter: filters.quarter,
    city: filters.city,
    level: filters.level,
    position: filters.position,
    skill: filters.skill,
    company: filters.company,
  };
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar/60 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-6 p-5">
        <div>
          <div className="flex size-10 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <ActivityIcon />
          </div>
          {/* <h1 className="mt-4 text-lg font-semibold">IT Market Dashboard</h1> */}
        </div>
        <Separator />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-3xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MobileNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b px-4 py-3 lg:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className={({ isActive }) =>
            cn(
              "shrink-0 rounded-3xl px-3 py-2 text-sm font-medium text-muted-foreground",
              isActive && "bg-muted text-foreground",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function Header() {
  return (
    <header className="border-b bg-background/90 px-4 py-5 backdrop-blur md:px-6 lg:sticky lg:top-0 lg:z-10">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-1xl">
            Dashboard tuyển dụng IT
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function DashboardLayout() {
  const filtersQuery = useFiltersQuery();

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <div className="flex">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <Header />
            <MobileNav />
            <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6">
              <Outlet context={{ filtersQuery }} />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function useDashboardContext() {
  return useOutletContext();
}

function useRouteFilters() {
  const [draftFilters, setDraftFilters] = useState(FILTER_DEFAULTS);
  const [appliedFilters, setAppliedFilters] = useState(FILTER_DEFAULTS);
  const [requestId, setRequestId] = useState(0);

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setRequestId((current) => current + 1);
  }

  function resetFilters() {
    setDraftFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
    setRequestId((current) => current + 1);
  }

  return {
    draftFilters,
    appliedParams: {
      ...cleanDashboardParams(appliedFilters),
      __requestId: requestId,
    },
    setDraftFilters,
    applyFilters,
    resetFilters,
  };
}

function RouteFilterBar({ filters, onChange, onReset, onApply }) {
  const { filtersQuery } = useDashboardContext();

  if (filtersQuery.isError) {
    return (
      <QueryError error={filtersQuery.error} onRetry={filtersQuery.refetch} />
    );
  }

  return (
    <FilterBar
      filters={filters}
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
  } = useRouteFilters();
  const overviewQuery = useOverviewQuery({
    year: appliedParams.year,
    quarter: appliedParams.quarter,
  });

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
  } = useRouteFilters();

  return (
    <>
      <RouteFilterBar
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
