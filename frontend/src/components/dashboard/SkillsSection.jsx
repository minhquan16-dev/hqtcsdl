import { HorizontalBarChart } from "@/components/charts/SimpleCharts"
import { DataTable } from "@/components/common/DataTable"
import { QueryBoundary } from "@/components/common/QueryState"
import { Panel, Section } from "@/components/common/Section"
import { useSkillCoOccurrenceQuery, useTopLanguagesQuery, useTopSkillsQuery } from "@/hooks/queries/useSkillsQueries"
import { formatNumber, formatPercent } from "@/lib/format"

export function SkillsSection({ params }) {
  const skillsQuery = useTopSkillsQuery({
    year: params.year,
    quarter: params.quarter,
    skill: params.skill,
    limit: 10,
  })
  const languagesQuery = useTopLanguagesQuery({
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  })
  const coOccurrenceQuery = useSkillCoOccurrenceQuery({
    skill: params.skill,
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  })

  return (
    <Section id="ky-nang" title="Kỹ năng và ngôn ngữ">
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Top kỹ năng">
          <QueryBoundary query={skillsQuery}>
            {(data) => (
              <DataTable
                rows={data}
                columns={[
                  { key: "xepHang", label: "#" },
                  { key: "tenKyNang", label: "Kỹ năng" },
                  { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
                  {
                    key: "tyLeTheoTongTin",
                    label: "Tỷ lệ",
                    render: (row) => formatPercent(row.tyLeTheoTongTin),
                  },
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Top ngôn ngữ">
          <QueryBoundary query={languagesQuery}>
            {(data) => (
              <HorizontalBarChart data={data} labelKey="ngonNgu" valueKey="soTin" />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Kỹ năng đi kèm">
          <QueryBoundary query={coOccurrenceQuery}>
            {(data) => (
              <DataTable
                rows={data}
                columns={[
                  { key: "tenKyNang", label: "Kỹ năng" },
                  { key: "tenKyNangLienQuan", label: "Đi kèm" },
                  { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </Section>
  )
}
