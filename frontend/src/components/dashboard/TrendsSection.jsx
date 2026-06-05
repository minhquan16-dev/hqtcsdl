import { SimpleBarChart, SimpleLineChart } from "@/components/charts/SimpleCharts"
import { QueryBoundary } from "@/components/common/QueryState"
import { Panel, Section } from "@/components/common/Section"
import { useMonthTrendsQuery, useQuarterTrendsQuery } from "@/hooks/queries/useTrendsQueries"

function sortQuarterRows(rows) {
  return [...(rows || [])].sort((a, b) => (a.nam - b.nam) || (a.quy - b.quy))
}

function sortMonthRows(rows) {
  return [...(rows || [])].sort((a, b) => (a.nam - b.nam) || (a.thang - b.thang))
}

export function TrendsSection({ params }) {
  const quarterQuery = useQuarterTrendsQuery({ year: params.year, limit: 10 })
  const monthQuery = useMonthTrendsQuery({
    year: params.year,
    quarter: params.quarter,
  })

  return (
    <Section
      id="xu-huong"
      title="Xu hướng tuyển dụng"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Theo quý">
          <QueryBoundary query={quarterQuery}>
            {(data) => (
              <SimpleLineChart
                data={sortQuarterRows(data)}
                labelKey="nhanQuy"
                valueKey="soTin"
                secondaryKey="soTinCoLuong"
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Theo tháng">
          <QueryBoundary query={monthQuery}>
            {(data) => (
              <SimpleBarChart
                data={sortMonthRows(data).map((row) => ({
                  ...row,
                  thangLabel: `Tháng ${row.thang}`,
                }))}
                labelKey="thangLabel"
                valueKey="soTin"
                secondaryKey="soTinCoLuong"
              />
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </Section>
  )
}
