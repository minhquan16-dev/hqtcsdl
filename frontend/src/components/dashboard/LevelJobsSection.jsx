import { useState } from "react";
import {
  DonutChart,
  HorizontalBarChart,
} from "@/components/charts/SimpleCharts";
import { DataTable } from "@/components/common/DataTable";
import { QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useExperienceByPositionQuery,
  useLevelSkillsQuery,
  useLevelsQuery,
} from "@/hooks/queries/useLevelQueries";
import {
  useJobsBreakdownQuery,
  useJobsSummaryQuery,
} from "@/hooks/queries/useJobsQueries";
import { BREAKDOWN_GROUPS } from "@/lib/constants";
import {
  formatExperience,
  formatNumber,
  formatPercent,
  formatSalary,
} from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BREAKDOWN_FILTER_FIELDS = {
  quarter: "quarter",
  city: "city",
  skill: "skill",
  position: "position",
  company: "company",
  level: "level",
};

const BREAKDOWN_FALLBACKS = {
  quarter: "month",
  city: "ward",
  skill: "position",
  position: "skill",
  company: "position",
  level: "skill",
};

function getAvailableBreakdownGroups(params) {
  return BREAKDOWN_GROUPS.filter((item) => {
    const filterKey = BREAKDOWN_FILTER_FIELDS[item.value];
    return !filterKey || !params?.[filterKey];
  });
}

function getBreakdownGroup(params, currentGroup) {
  const availableGroups = getAvailableBreakdownGroups(params);
  const isCurrentAvailable = availableGroups.some(
    (item) => item.value === currentGroup,
  );

  if (isCurrentAvailable) return currentGroup;

  const activeFilter = Object.entries(BREAKDOWN_FALLBACKS).find(
    ([filterKey]) => params?.[filterKey],
  );
  const preferredGroup = activeFilter?.[1];

  return (
    availableGroups.find((item) => item.value === preferredGroup)?.value ||
    availableGroups[0]?.value ||
    currentGroup
  );
}

export function LevelSection({ params }) {
  const [activeTab, setActiveTab] = useState("levels");
  const [selectedLevel, setSelectedLevel] = useState("");
  const levelsQuery = useLevelsQuery({
    year: params.year,
    quarter: params.quarter,
    level: params.level,
  });
  const experienceQuery = useExperienceByPositionQuery({
    year: params.year,
    quarter: params.quarter,
    position: params.position,
    sortBy: "averageExperience",
    limit: 10,
  });
  const levelSkillsQuery = useLevelSkillsQuery(selectedLevel, {
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });

  function openLevelSkills(level) {
    setSelectedLevel(level);
    setActiveTab("skills");
  }

  return (
    <Section id="cap-bac" title="Cấp bậc và kinh nghiệm">
      <DashboardTabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          {
            value: "levels",
            label: "Phân bố cấp bậc",
            title: "Phân bố cấp bậc",
            description: "Tỷ trọng tin tuyển dụng theo từng cấp bậc",
            content: (
              <QueryBoundary query={levelsQuery}>
                {(data) => (
                  <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                    <DonutChart
                      data={data}
                      labelKey="tenCapBac"
                      valueKey="tyLe"
                      valueName="Tỷ lệ"
                    />
                    <DataTable
                      rows={data}
                      columns={[
                        { key: "tenCapBac", label: "Cấp bậc" },
                        {
                          key: "soTin",
                          label: "Số tin",
                          render: (row) => formatNumber(row.soTin),
                        },
                        {
                          key: "tyLe",
                          label: "Tỷ lệ",
                          render: (row) => formatPercent(row.tyLe),
                        },
                        {
                          key: "skills",
                          label: "",
                          render: (row) => (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLevelSkills(row.tenCapBac)}
                            >
                              Xem kỹ năng
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "experience",
            label: "Kinh nghiệm theo vị trí",
            title: "Kinh nghiệm theo vị trí",
            description: "Các vị trí có yêu cầu kinh nghiệm trung bình cao hơn",
            content: (
              <QueryBoundary query={experienceQuery}>
                {(data) => (
                  <DataTable
                    rows={data}
                    columns={[
                      { key: "tenViTriChuan", label: "Vị trí" },
                      {
                        key: "soTin",
                        label: "Số tin",
                        render: (row) => formatNumber(row.soTin),
                      },
                      {
                        key: "kinhNghiemTB",
                        label: "Kinh nghiệm TB",
                        render: (row) => formatExperience(row.kinhNghiemTB),
                      },
                    ]}
                  />
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "skills",
            label: "Kỹ năng theo cấp bậc",
            title: "Kỹ năng theo cấp bậc",
            description:
              "Chọn cấp bậc và xem nhóm kỹ năng phổ biến trong cấp bậc đó",
            content: (
              <QueryBoundary query={levelsQuery}>
                {(levels) => (
                  <div className="flex flex-col gap-5">
                    <div className="max-w-xl">
                      <Select
                        value={selectedLevel}
                        onValueChange={setSelectedLevel}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn cấp bậc" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {levels.map((item) => (
                              <SelectItem
                                key={item.tenCapBac}
                                value={item.tenCapBac}
                              >
                                {item.tenCapBac}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    {!selectedLevel ? (
                      <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
                        Chọn cấp bậc ở trên để xem kỹ năng phổ biến.
                      </div>
                    ) : (
                      <QueryBoundary query={levelSkillsQuery}>
                        {(data) => (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {(data.kyNang || []).map((item) => (
                              <div
                                key={item.tenKyNang}
                                className="flex items-center justify-between gap-3 rounded-3xl bg-muted/40 px-4 py-3"
                              >
                                <span className="truncate font-medium">
                                  {item.tenKyNang}
                                </span>
                                <div className="flex shrink-0 items-center gap-2">
                                  <Badge variant="secondary">
                                    {formatNumber(item.soTin)} tin
                                  </Badge>
                                  <Badge>{formatPercent(item.tyLe)}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </QueryBoundary>
                    )}
                  </div>
                )}
              </QueryBoundary>
            ),
          },
        ]}
      />
    </Section>
  );
}

export function JobsSection({ params }) {
  const [groupBy, setGroupBy] = useState("city");
  const selectedGroupBy = getBreakdownGroup(params, groupBy);
  const availableBreakdownGroups = getAvailableBreakdownGroups(params);
  const summaryQuery = useJobsSummaryQuery(params);
  const breakdownQuery = useJobsBreakdownQuery({
    ...params,
    groupBy: selectedGroupBy,
  });

  return (
    <Section id="tong-hop" title="Bộ lọc tổng hợp">
      <div className="flex flex-col gap-4">
        <DashboardTabs
          value={selectedGroupBy}
          onValueChange={setGroupBy}
          listClassName="h-auto flex-wrap justify-start"
          tabs={availableBreakdownGroups.map((item) => ({
            value: item.value,
            label: item.label,
            title: `Kết quả ${item.label.toLowerCase()}`,
            description: "Chọn cách nhóm dữ liệu sau khi áp dụng bộ lọc",
            content: (
              <QueryBoundary query={breakdownQuery}>
                {(data) => (
                  <HorizontalBarChart
                    data={data}
                    labelKey="nhom"
                    valueKey="soTin"
                  />
                )}
              </QueryBoundary>
            ),
          }))}
        />
        <Section id="tong-hop-summary" title="Tóm tắt tổng hợp">
          <QueryBoundary query={summaryQuery}>
            {(data) => (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Số tin", formatNumber(data.soTin)],
                  ["Tin có lương", formatNumber(data.soTinCoLuong)],
                  ["Lương TB", formatSalary(data.luongTrungBinh)],
                  ["Kinh nghiệm TB", formatExperience(data.kinhNghiemTB)],
                  ["Công ty", formatNumber(data.soCongTy)],
                  ["Vị trí", formatNumber(data.soViTri)],
                  ["Kỹ năng", formatNumber(data.soKyNang)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </QueryBoundary>
        </Section>
      </div>
    </Section>
  );
}
