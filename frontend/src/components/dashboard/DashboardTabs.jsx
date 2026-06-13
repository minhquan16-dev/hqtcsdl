import { useState } from "react";
import { PanelsTopLeft, Rows3 } from "lucide-react";
import { Panel } from "@/components/common/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getTabsListClasses,
  getTabsWrapperClasses,
} from "./tabsLayout";

function getFlatPanelClassName(index, total) {
  if (total <= 2) return "";
  if (index === 0) return "lg:col-span-2";
  if (total % 2 === 0 && index === total - 1) return "lg:col-span-2";
  return "";
}

function ViewModeTrigger({ active, label, onClick, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-active={active ? "" : undefined}
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "relative inline-flex size-8 items-center justify-center gap-2 rounded-full border border-transparent! p-0 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function DashboardTabs({
  value,
  defaultValue,
  onValueChange,
  tabs,
  listClassName = "",
  allowWrap = false,
}) {
  const [viewMode, setViewMode] = useState("tabs");

  return (
    <Tabs
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <div className="flex w-full items-start gap-3">
        {viewMode === "tabs" ? (
          <div className={getTabsWrapperClasses(allowWrap)}>
            <TabsList className={getTabsListClasses(allowWrap, listClassName)}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}
        <TabsList className="ml-auto h-9 shrink-0 p-1">
          <ViewModeTrigger
            active={viewMode === "tabs"}
            label="Xem theo dạng tab"
            onClick={() => setViewMode("tabs")}
          >
            <PanelsTopLeft data-icon="inline-start" />
          </ViewModeTrigger>
          <ViewModeTrigger
            active={viewMode === "flat"}
            label="Xem theo dạng phẳng"
            onClick={() => setViewMode("flat")}
          >
            <Rows3 data-icon="inline-start" />
          </ViewModeTrigger>
        </TabsList>
      </div>
      {viewMode === "flat" ? (
        <div className="mt-2 grid gap-4 lg:grid-cols-2">
          {tabs.map((tab, index) => (
            <Panel
              key={tab.value}
              title={tab.title || tab.label}
              description={tab.description}
              className={cn(
                getFlatPanelClassName(index, tabs.length),
                tab.className,
              )}
            >
              {tab.content}
            </Panel>
          ))}
        </div>
      ) : (
        tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Panel
              title={tab.title || tab.label}
              description={tab.description}
              className={tab.className}
            >
              {tab.content}
            </Panel>
          </TabsContent>
        ))
      )}
    </Tabs>
  );
}
