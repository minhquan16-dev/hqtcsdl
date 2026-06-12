import { Panel } from "@/components/common/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getTabsListClasses,
  getTabsWrapperClasses,
} from "./tabsLayout";

export function DashboardTabs({
  value,
  defaultValue,
  onValueChange,
  tabs,
  listClassName = "",
  allowWrap = false,
}) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <div className={getTabsWrapperClasses(allowWrap)}>
        <TabsList className={getTabsListClasses(allowWrap, listClassName)}>
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
