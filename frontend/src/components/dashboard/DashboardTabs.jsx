import { Panel } from "@/components/common/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function DashboardTabs({
  value,
  defaultValue,
  onValueChange,
  tabs,
  listClassName = "",
}) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <div className="overflow-x-auto pb-1">
        <TabsList className={cn("min-w-max", listClassName)}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <Panel
            title={tab.title || tab.label}
            description={tab.description}
            className={tab.className}
          >
            {tab.content}
          </Panel>
        </TabsContent>
      ))}
    </Tabs>
  );
}
