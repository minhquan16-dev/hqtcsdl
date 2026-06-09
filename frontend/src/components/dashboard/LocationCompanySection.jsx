import {
  HorizontalBarChart,
  MarketScatterChart,
} from "@/components/charts/SimpleCharts";
import { DataTable } from "@/components/common/DataTable";
import { QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCompaniesByFieldQuery,
  useTopCompaniesQuery,
} from "@/hooks/queries/useCompanyQueries";
import {
  useLocationsQuery,
  useMarketsCitiesQuery,
} from "@/hooks/queries/useLocationQueries";
import { formatExperience, formatNumber, formatSalary } from "@/lib/format";

export function LocationSection({ params }) {
  const locationsQuery = useLocationsQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    limit: 10,
  });
  const marketsQuery = useMarketsCitiesQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    sortBy: "jobCount",
    limit: 10,
  });

  return (
    <Section id="dia-diem" title="Địa điểm và thị trường">
      <DashboardTabs
        defaultValue="cities"
        tabs={[
          {
            value: "cities",
            label: "Thành phố",
            title: "Thành phố tuyển nhiều",
            description: "Các thành phố có số lượng tin tuyển dụng nổi bật",
            content: (
              <QueryBoundary query={locationsQuery}>
                {(data) => (
                  <HorizontalBarChart
                    data={data}
                    labelKey="tenThanhPho"
                    valueKey="soTin"
                  />
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "markets",
            label: "So sánh thị trường",
            title: "So sánh thị trường",
            description:
              "Đặt số tin, lương trung bình và độ đa dạng vị trí lên cùng một góc nhìn",
            content: (
              <QueryBoundary query={marketsQuery}>
                {(data) => (
                  <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                    <MarketScatterChart data={data} labelKey="tenThanhPho" />
                    <DataTable
                      rows={data}
                      columns={[
                        { key: "tenThanhPho", label: "Thành phố" },
                        {
                          key: "soTin",
                          label: "Số tin",
                          render: (row) => formatNumber(row.soTin),
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
                          key: "soViTriKhacNhau",
                          label: "Vị trí khác nhau",
                          render: (row) => formatNumber(row.soViTriKhacNhau),
                        },
                      ]}
                    />
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

export function CompanySection({ params }) {
  const topCompaniesQuery = useTopCompaniesQuery({
    year: params.year,
    quarter: params.quarter,
    company: params.company,
    limit: 10,
  });
  const byFieldQuery = useCompaniesByFieldQuery({
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });

  return (
    <Section id="cong-ty" title="Công ty">
      <DashboardTabs
        defaultValue="top"
        tabs={[
          {
            value: "top",
            label: "Top công ty",
            title: "Top công ty",
            description:
              "Các công ty đăng nhiều tin nhất trong bộ lọc hiện tại",
            content: (
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
                              <span className="block max-w-72 truncate">
                                {row.tenCongTy}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{row.tenCongTy}</TooltipContent>
                          </Tooltip>
                        ),
                      },
                      {
                        key: "linhVuc",
                        label: "Lĩnh vực",
                        render: (row) => row.linhVuc || "Chưa có dữ liệu",
                      },
                      {
                        key: "quyMo",
                        label: "Quy mô",
                        render: (row) => row.quyMo || "Chưa có dữ liệu",
                      },
                      {
                        key: "soTin",
                        label: "Số tin",
                        render: (row) => formatNumber(row.soTin),
                      },
                    ]}
                  />
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "fields",
            label: "Theo lĩnh vực",
            title: "Theo lĩnh vực",
            description: "Nhóm công ty theo lĩnh vực hoạt động",
            content: (
              <QueryBoundary query={byFieldQuery}>
                {(data) => (
                  <HorizontalBarChart
                    data={data}
                    labelKey="linhVuc"
                    valueKey="soTin"
                  />
                )}
              </QueryBoundary>
            ),
          },
        ]}
      />
    </Section>
  );
}
