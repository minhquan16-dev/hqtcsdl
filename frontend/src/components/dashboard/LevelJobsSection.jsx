import { useState } from "react"
import { DonutChart, HorizontalBarChart } from "@/components/charts/SimpleCharts"
import { DataTable } from "@/components/common/DataTable"
import { QueryBoundary } from "@/components/common/QueryState"
import { Panel, Section } from "@/components/common/Section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useExperienceByPositionQuery,
  useLevelSkillsQuery,
  useLevelsQuery,
} from "@/hooks/queries/useLevelQueries"
import { useJobsBreakdownQuery, useJobsSummaryQuery } from "@/hooks/queries/useJobsQueries"
import { BREAKDOWN_GROUPS } from "@/lib/constants"
import { formatExperience, formatNumber, formatPercent, formatSalary } from "@/lib/format"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LevelSection({ params }) {
  const [selectedLevel, setSelectedLevel] = useState("")
  const levelsQuery = useLevelsQuery({
    year: params.year,
    quarter: params.quarter,
    level: params.level,
  })
  const experienceQuery = useExperienceByPositionQuery({
    year: params.year,
    quarter: params.quarter,
    position: params.position,
    sortBy: "averageExperience",
    limit: 10,
  })
  const levelSkillsQuery = useLevelSkillsQuery(selectedLevel, {
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  })

  return (
    <Section
      id="cap-bac"
      title="Cấp bậc và kinh nghiệm"
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Phân bố cấp bậc">
          <QueryBoundary query={levelsQuery}>
            {(data) => (
              <div className="flex flex-col gap-4">
                <DonutChart data={data} labelKey="tenCapBac" valueKey="tyLe" valueName="Tỷ lệ" />
                <DataTable
                  rows={data}
                  columns={[
                    {
                      key: "tenCapBac",
                      label: "Cấp bậc",
                      render: (row) => (
                        <Button
                          variant="link"
                          className="h-auto justify-start p-0"
                          onClick={() => setSelectedLevel(row.tenCapBac)}
                        >
                          {row.tenCapBac}
                        </Button>
                      ),
                    },
                    { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
                    { key: "tyLe", label: "Tỷ lệ", render: (row) => formatPercent(row.tyLe) },
                  ]}
                />
              </div>
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Kinh nghiệm theo vị trí">
          <QueryBoundary query={experienceQuery}>
            {(data) => (
              <DataTable
                rows={data}
                columns={[
                  { key: "tenViTriChuan", label: "Vị trí" },
                  { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
                  {
                    key: "kinhNghiemTB",
                    label: "Kinh nghiệm TB",
                    render: (row) => formatExperience(row.kinhNghiemTB),
                  },
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Kỹ năng theo cấp bậc">
          {!selectedLevel ? (
            <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
              Chọn cấp bậc để xem kỹ năng phổ biến.
            </div>
          ) : (
            <QueryBoundary query={levelSkillsQuery}>
              {(data) => (
                <div className="flex flex-col gap-3">
                  {(data.kyNang || []).map((item) => (
                    <div
                      key={item.tenKyNang}
                      className="flex items-center justify-between gap-3 rounded-3xl bg-muted/40 px-4 py-3"
                    >
                      <span className="truncate font-medium">{item.tenKyNang}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{formatNumber(item.soTin)} tin</Badge>
                        <Badge>{formatPercent(item.tyLe)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </QueryBoundary>
          )}
        </Panel>
      </div>
    </Section>
  )
}

export function JobsSection({ params }) {
  const [groupBy, setGroupBy] = useState("city")
  const summaryQuery = useJobsSummaryQuery(params)
  const breakdownQuery = useJobsBreakdownQuery({ ...params, groupBy })

  return (
    <Section id="tong-hop" title="Bộ lọc tổng hợp">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Summary sau bộ lọc">
          <QueryBoundary query={summaryQuery}>
            {(data) => (
              <div className="grid gap-3 sm:grid-cols-2">
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
        </Panel>
        <Panel title="Breakdown">
          <div className="mb-4 max-w-56">
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BREAKDOWN_GROUPS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <QueryBoundary query={breakdownQuery}>
            {(data) => <HorizontalBarChart data={data} labelKey="nhom" valueKey="soTin" />}
          </QueryBoundary>
        </Panel>
      </div>
    </Section>
  )
}
