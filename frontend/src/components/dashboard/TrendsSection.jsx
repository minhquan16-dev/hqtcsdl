import {
  SimpleBarChart,
  TrendAreaChart,
} from "@/components/charts/SimpleCharts";
import { QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import {
  useMonthTrendsQuery,
  useQuarterTrendsQuery,
} from "@/hooks/queries/useTrendsQueries";

function sortQuarterRows(rows) {
  return [...(rows || [])].sort((a, b) => a.nam - b.nam || a.quy - b.quy);
}

function sortMonthRows(rows) {
  return [...(rows || [])].sort((a, b) => a.nam - b.nam || a.thang - b.thang);
}

export function TrendsSection({ params }) {
  const quarterQuery = useQuarterTrendsQuery({ year: params.year, limit: 10 });
  const monthQuery = useMonthTrendsQuery({
    year: params.year,
    quarter: params.quarter,
  });

  return (
    <Section id="xu-huong" title="Xu hướng tuyển dụng">
      <DashboardTabs
        defaultValue="quarters"
        tabs={[
          {
            value: "quarters",
            label: "Theo quý",
            title: "Xu hướng theo quý",
            description: "Theo dõi số tin và số tin có lương qua từng quý",
            content: (
              <QueryBoundary query={quarterQuery}>
                {(data) => (
                  <TrendAreaChart
                    data={sortQuarterRows(data)}
                    labelKey="nhanQuy"
                    valueKey="soTin"
                    secondaryKey="soTinCoLuong"
                  />
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "months",
            label: "Theo tháng",
            title: "Xu hướng theo tháng",
            description: "Chi tiết biến động tuyển dụng theo từng tháng",
            content: (
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
            ),
          },
        ]}
      />
    </Section>
  );
}
