import { useLayoutEffect, useRef, useState } from "react";
import { PanelsTopLeft, Rows3 } from "lucide-react";
import { motion } from "motion/react";
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
  const initialValue = defaultValue ?? tabs[0]?.value;
  const listRef = useRef(null);
  const triggerRefs = useRef(new Map());
  const [viewMode, setViewMode] = useState("tabs");
  const [internalValue, setInternalValue] = useState(initialValue);
  const [activeIndicator, setActiveIndicator] = useState(null);
  const activeValue = value ?? internalValue;

  useLayoutEffect(() => {
    if (viewMode !== "tabs") return undefined;

    const listElement = listRef.current;
    const activeTrigger = triggerRefs.current.get(activeValue);
    if (!listElement || !activeTrigger) return undefined;

    function updateActiveIndicator() {
      const listRect = listElement.getBoundingClientRect();
      const triggerRect = activeTrigger.getBoundingClientRect();

      setActiveIndicator({
        x: triggerRect.left - listRect.left,
        y: triggerRect.top - listRect.top,
        width: triggerRect.width,
        height: triggerRect.height,
      });
    }

    const animationFrame = requestAnimationFrame(updateActiveIndicator);

    const resizeObserver = new ResizeObserver(updateActiveIndicator);
    resizeObserver.observe(listElement);
    resizeObserver.observe(activeTrigger);
    window.addEventListener("resize", updateActiveIndicator);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateActiveIndicator);
    };
  }, [activeValue, tabs.length, viewMode]);

  function handleValueChange(nextValue) {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <Tabs
      value={value}
      defaultValue={initialValue}
      onValueChange={handleValueChange}
    >
      <div className="flex w-full items-start gap-3">
        {viewMode === "tabs" ? (
          <div className={getTabsWrapperClasses(allowWrap)}>
            <TabsList
              ref={listRef}
              className={getTabsListClasses(
                allowWrap,
                cn("relative", listClassName),
              )}
            >
              {viewMode === "tabs" && activeIndicator ? (
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={activeIndicator}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="pointer-events-none absolute left-0 top-0 rounded-full bg-primary/15"
                />
              ) : null}
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  ref={(node) => {
                    if (node) {
                      triggerRefs.current.set(tab.value, node);
                    } else {
                      triggerRefs.current.delete(tab.value);
                    }
                  }}
                >
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
