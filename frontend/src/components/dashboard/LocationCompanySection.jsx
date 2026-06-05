import { HorizontalBarChart, MarketScatterChart } from "@/components/charts/SimpleCharts"
import { DataTable } from "@/components/common/DataTable"
import { QueryBoundary } from "@/components/common/QueryState"
import { Panel, Section } from "@/components/common/Section"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCompaniesByFieldQuery, useTopCompaniesQuery } from "@/hooks/queries/useCompanyQueries"
import { useLocationsQuery, useMarketsCitiesQuery, useWardsQuery } from "@/hooks/queries/useLocationQueries"
import { formatExperience, formatNumber, formatSalary } from "@/lib/format"

export function LocationSection({ params }) {
  const locationsQuery = useLocationsQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    limit: 10,
  })
  const wardsQuery = useWardsQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    limit: 10,
  })
  const marketsQuery = useMarketsCitiesQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    sortBy: "jobCount",
    limit: 10,
  })

  return (
    <Section id="dia-diem" title="Địa điểm và thị trường">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Thành phố tuyển nhiều">
          <QueryBoundary query={locationsQuery}>
            {(data) => <HorizontalBarChart data={data} labelKey="tenThanhPho" valueKey="soTin" />}
          </QueryBoundary>
        </Panel>
        <Panel title="Phường/xã">
          <QueryBoundary query={wardsQuery}>
            {(data) => <HorizontalBarChart data={data} labelKey="tenPhuongXa" valueKey="soTin" />}
          </QueryBoundary>
        </Panel>
        <Panel title="So sánh thị trường" className="xl:col-span-2">
          <QueryBoundary query={marketsQuery}>
            {(data) => (
              <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                <MarketScatterChart data={data} labelKey="tenThanhPho" />
                <DataTable
                  rows={data}
                  columns={[
                    { key: "tenThanhPho", label: "Thành phố" },
                    { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
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
                      key: "soViTriKhacNhau",
                      label: "Vị trí khác nhau",
                      render: (row) => formatNumber(row.soViTriKhacNhau),
                    },
                  ]}
                />
              </div>
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </Section>
  )
}

export function CompanySection({ params }) {
  const topCompaniesQuery = useTopCompaniesQuery({
    year: params.year,
    quarter: params.quarter,
    company: params.company,
    limit: 10,
  })
  const byFieldQuery = useCompaniesByFieldQuery({
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  })

  return (
    <Section id="cong-ty" title="Công ty">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Top công ty">
          <QueryBoundary query={topCompaniesQuery}>
            {(data) => (
              <DataTable
                rows={data}
                columns={[
                  { key: "xepHang", label: "#" },
                  {
                    key: "tenCongTy",
                    label: "Công ty",
                    render: (row) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block max-w-72 truncate">{row.tenCongTy}</span>
                        </TooltipTrigger>
                        <TooltipContent>{row.tenCongTy}</TooltipContent>
                      </Tooltip>
                    ),
                  },
                  { key: "linhVuc", label: "Lĩnh vực", render: (row) => row.linhVuc || "Chưa có dữ liệu" },
                  { key: "quyMo", label: "Quy mô", render: (row) => row.quyMo || "Chưa có dữ liệu" },
                  { key: "soTin", label: "Số tin", render: (row) => formatNumber(row.soTin) },
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
        <Panel title="Theo lĩnh vực">
          <QueryBoundary query={byFieldQuery}>
            {(data) => <HorizontalBarChart data={data} labelKey="linhVuc" valueKey="soTin" />}
          </QueryBoundary>
        </Panel>
      </div>
    </Section>
  )
}
