import { useState } from "react";
import {
  HorizontalBarChart,
  MarketScatterChart,
} from "@/components/charts/SimpleCharts";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState, QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useCityPositionsQuery,
  useLocationsQuery,
  useMarketsCitiesQuery,
} from "@/hooks/queries/useLocationQueries";
import { formatExperience, formatNumber, formatSalary } from "@/lib/format";

export function LocationSection({ params }) {
  const [selectedCity, setSelectedCity] = useState("");
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
  const cityOptions = marketsQuery.data || [];
  const cityForPositions =
    params.city || selectedCity || cityOptions[0]?.tenThanhPho || "";
  const cityPositionsQuery = useCityPositionsQuery(cityForPositions, {
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });

  return (
    <Section id="dia-diem">
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
            value: "city-positions",
            label: "Vị trí theo thành phố",
            title: "Vị trí theo thành phố",
            description:
              "Drill-down các vị trí tuyển nhiều trong một thành phố",
            content: (
              <div className="flex flex-col gap-4">
                {params.city ? (
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                    Đang xem thành phố từ bộ lọc:{" "}
                    <span className="font-medium text-foreground">
                      {params.city}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:max-w-xs">
                    <span className="text-xs font-medium text-muted-foreground">
                      Thành phố
                    </span>
                    <Select
                      value={cityForPositions}
                      onValueChange={setSelectedCity}
                      disabled={!cityOptions.length}
                    >
                      <SelectTrigger className="h-9 bg-muted/50">
                        <SelectValue placeholder="Chọn thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cityOptions.map((city) => (
                            <SelectItem
                              key={city.tenThanhPho}
                              value={city.tenThanhPho}
                            >
                              {city.tenThanhPho}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!cityForPositions ? (
                  <EmptyState description="Chọn một thành phố để xem các vị trí tuyển dụng phổ biến" />
                ) : (
                  <QueryBoundary query={cityPositionsQuery}>
                    {(data) => {
                      const rows = data?.viTri || [];

                      if (!rows.length) {
                        return (
                          <EmptyState description="Thành phố này chưa có dữ liệu vị trí phù hợp với bộ lọc hiện tại" />
                        );
                      }

                      return (
                        <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                          <HorizontalBarChart
                            data={rows}
                            labelKey="tenViTriChuan"
                            valueKey="soTin"
                          />
                          <DataTable
                            rows={rows}
                            columns={[
                              { key: "xepHang", label: "#" },
                              {
                                key: "tenViTriChuan",
                                label: "Vị trí",
                                render: (row) => (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block max-w-72 truncate">
                                        {row.tenViTriChuan}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {row.tenViTriChuan}
                                    </TooltipContent>
                                  </Tooltip>
                                ),
                              },
                              {
                                key: "soTin",
                                label: "Số tin",
                                render: (row) => formatNumber(row.soTin),
                              },
                              {
                                key: "luongTrungBinh",
                                label: "Lương TB",
                                render: (row) =>
                                  formatSalary(row.luongTrungBinh),
                              },
                            ]}
                          />
                        </div>
                      );
                    }}
                  </QueryBoundary>
                )}
              </div>
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
    <Section id="cong-ty">
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
