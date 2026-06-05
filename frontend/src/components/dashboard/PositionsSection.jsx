import { useState } from "react"
import { HorizontalBarChart } from "@/components/charts/SimpleCharts"
import { DataTable } from "@/components/common/DataTable"
import { QueryBoundary } from "@/components/common/QueryState"
import { Panel, Section } from "@/components/common/Section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePositionSkillsQuery, usePositionsQuery } from "@/hooks/queries/usePositionsQueries"
import { formatExperience, formatNumber, formatPercent, formatSalary } from "@/lib/format"

export function PositionsSection({ params }) {
  const [selectedPosition, setSelectedPosition] = useState("")
  const positionsQuery = usePositionsQuery({
    year: params.year,
    quarter: params.quarter,
    position: params.position,
    sortBy: "jobCount",
    limit: 10,
  })
  const positionSkillsQuery = usePositionSkillsQuery(selectedPosition, {
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  })

  return (
    <Section
      id="vi-tri"
      title="Phân tích vị trí"
    >
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Vị trí nổi bật">
          <QueryBoundary query={positionsQuery}>
            {(data) => (
              <div className="flex flex-col gap-5">
                <HorizontalBarChart data={data} labelKey="tenViTriChuan" valueKey="soTin" />
                <DataTable
                  rows={data}
                  columns={[
                    {
                      key: "tenViTriChuan",
                      label: "Vị trí",
                      render: (row) => (
                        <Button
                          variant="link"
                          className="h-auto max-w-64 justify-start p-0"
                          onClick={() => setSelectedPosition(row.tenViTriChuan)}
                        >
                          <span className="truncate" title={row.tenViTriChuan}>
                            {row.tenViTriChuan}
                          </span>
                        </Button>
                      ),
                    },
                    { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
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
                  ]}
                />
              </div>
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Kỹ năng theo vị trí">
          {!selectedPosition ? (
            <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
              Chọn một vị trí để xem danh sách kỹ năng liên quan.
            </div>
          ) : (
            <QueryBoundary query={positionSkillsQuery}>
              {(data) => (
                <div className="flex flex-col gap-3">
                  {(data.kyNang || []).map((item) => (
                    <div
                      key={item.tenKyNang}
                      className="flex items-center justify-between gap-3 rounded-3xl bg-muted/40 px-4 py-3"
                    >
                      <span className="truncate font-medium" title={item.tenKyNang}>
                        {item.tenKyNang}
                      </span>
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
