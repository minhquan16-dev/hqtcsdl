import { HorizontalBarChart, SimpleBarChart } from "@/components/charts/SimpleCharts"
import { DataTable } from "@/components/common/DataTable"
import { QueryBoundary } from "@/components/common/QueryState"
import { Panel, Section } from "@/components/common/Section"
import {
  useSalariesByCityQuery,
  useSalariesByExperienceQuery,
  useSalariesByPositionQuery,
  useSalariesBySkillQuery,
} from "@/hooks/queries/useSalaryQueries"
import { formatNumber, formatSalary } from "@/lib/format"

export function SalarySection({ params }) {
  const byPositionQuery = useSalariesByPositionQuery({
    year: params.year,
    quarter: params.quarter,
    position: params.position,
    sortBy: "averageSalary",
    limit: 10,
  })
  const byExperienceQuery = useSalariesByExperienceQuery({
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  })
  const byCityQuery = useSalariesByCityQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    limit: 10,
  })
  const bySkillQuery = useSalariesBySkillQuery({
    year: params.year,
    quarter: params.quarter,
    skill: params.skill,
    sortBy: "averageSalary",
    limit: 10,
  })

  return (
    <Section id="luong" title="Phân tích lương">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Lương theo vị trí">
          <QueryBoundary query={byPositionQuery}>
            {(data) => (
              <DataTable
                rows={data}
                columns={[
                  { key: "tenViTriChuan", label: "Vị trí" },
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
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Lương theo kinh nghiệm">
          <QueryBoundary query={byExperienceQuery}>
            {(data) => (
              <SimpleBarChart
                data={data}
                labelKey="nhomKinhNghiem"
                valueKey="luongTrungBinh"
                valueName="Lương trung bình"
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Lương theo thành phố">
          <QueryBoundary query={byCityQuery}>
            {(data) => (
              <HorizontalBarChart
                data={data}
                labelKey="tenThanhPho"
                valueKey="luongTrungBinh"
                valueName="Lương trung bình"
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Lương theo kỹ năng">
          <QueryBoundary query={bySkillQuery}>
            {(data) => (
              <HorizontalBarChart
                data={data}
                labelKey="tenKyNang"
                valueKey="luongTrungBinh"
                valueName="Lương trung bình"
              />
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </Section>
  )
}
