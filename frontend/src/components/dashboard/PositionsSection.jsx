import { useState } from "react";
import { HorizontalBarChart } from "@/components/charts/SimpleCharts";
import { DataTable } from "@/components/common/DataTable";
import { QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePositionSkillsQuery,
  usePositionsQuery,
} from "@/hooks/queries/usePositionsQueries";
import {
  formatExperience,
  formatNumber,
  formatPercent,
  formatSalary,
} from "@/lib/format";

export function PositionsSection({ params }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPosition, setSelectedPosition] = useState("");
  const positionsQuery = usePositionsQuery({
    year: params.year,
    quarter: params.quarter,
    position: params.position,
    sortBy: "jobCount",
    limit: 10,
  });
  const positionSkillsQuery = usePositionSkillsQuery(selectedPosition, {
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });

  function openPositionSkills(position) {
    setSelectedPosition(position);
    setActiveTab("skills");
  }

  return (
    <Section id="vi-tri" title="Phân tích vị trí">
      <DashboardTabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          {
            value: "overview",
            label: "Theo vị trí",
            title: "Vị trí nổi bật",
            description:
              "So sánh số tin, lương và kinh nghiệm trung bình theo từng vị trí",
            content: (
              <QueryBoundary query={positionsQuery}>
                {(data) => (
                  <div className="flex flex-col gap-5">
                    <HorizontalBarChart
                      data={data}
                      labelKey="tenViTriChuan"
                      valueKey="soTin"
                    />
                    <DataTable
                      rows={data}
                      columns={[
                        {
                          key: "tenViTriChuan",
                          label: "Vị trí",
                          render: (row) => (
                            <span
                              className="block max-w-72 truncate font-medium"
                              title={row.tenViTriChuan}
                            >
                              {row.tenViTriChuan}
                            </span>
                          ),
                        },
                        {
                          key: "soTin",
                          label: "Số tin",
                          render: (row) => formatNumber(row.soTin),
                        },
                        {
                          key: "soTinCoLuong",
                          label: "Có lương",
                          render: (row) => formatNumber(row.soTinCoLuong),
                        },
                        {
                          key: "luongTrungBinh",
                          label: "Lương TB",
                          render: (row) => formatSalary(row.luongTrungBinh),
                        },
                        {
                          key: "kinhNghiemTB",
                          label: "Kinh nghiệm",
                          render: (row) => formatExperience(row.kinhNghiemTB),
                        },
                        {
                          key: "skills",
                          label: "",
                          render: (row) => (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openPositionSkills(row.tenViTriChuan)
                              }
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
            value: "skills",
            label: "Kỹ năng theo vị trí",
            title: "Kỹ năng theo vị trí",
            description:
              "Chọn một vị trí và xem các kỹ năng thường đi cùng vị trí đó",
            content: (
              <QueryBoundary query={positionsQuery}>
                {(positions) => (
                  <div className="flex flex-col gap-5">
                    <div className="max-w-xl">
                      <Select
                        value={selectedPosition}
                        onValueChange={setSelectedPosition}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vị trí" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {positions.map((item) => (
                              <SelectItem
                                key={item.tenViTriChuan}
                                value={item.tenViTriChuan}
                              >
                                {item.tenViTriChuan}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    {!selectedPosition ? (
                      <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
                        Chọn một vị trí ở trên để xem danh sách kỹ năng liên
                        quan
                      </div>
                    ) : (
                      <QueryBoundary query={positionSkillsQuery}>
                        {(data) => (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {(data.kyNang || []).map((item) => (
                              <div
                                key={item.tenKyNang}
                                className="flex items-center justify-between gap-3 rounded-3xl bg-muted/40 px-4 py-3"
                              >
                                <span
                                  className="truncate font-medium"
                                  title={item.tenKyNang}
                                >
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
