import {
  HorizontalBarChart,
  SalaryRangeChart,
  SimpleBarChart,
} from "@/components/charts/SimpleCharts";
import { DataTable } from "@/components/common/DataTable";
import { QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import {
  useSalariesByCityQuery,
  useSalariesByExperienceQuery,
  useSalariesByPositionQuery,
  useSalariesBySkillQuery,
} from "@/hooks/queries/useSalaryQueries";
import { formatNumber, formatSalary } from "@/lib/format";

export function SalarySection({ params }) {
  const byPositionQuery = useSalariesByPositionQuery({
    year: params.year,
    quarter: params.quarter,
    position: params.position,
    sortBy: "averageSalary",
    limit: 10,
  });
  const byExperienceQuery = useSalariesByExperienceQuery({
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });
  const byCityQuery = useSalariesByCityQuery({
    year: params.year,
    quarter: params.quarter,
    city: params.city,
    limit: 10,
  });
  const bySkillQuery = useSalariesBySkillQuery({
    year: params.year,
    quarter: params.quarter,
    skill: params.skill,
    sortBy: "averageSalary",
    limit: 10,
  });

  return (
    <Section id="luong">
      <DashboardTabs
        defaultValue="position"
        tabs={[
          {
            value: "position",
            label: "Theo vị trí",
            title: "Lương theo vị trí",
            description: "Các vị trí có mức lương trung bình nổi bật",
            content: (
              <QueryBoundary query={byPositionQuery}>
                {(data) => (
                  <div className="flex flex-col gap-5">
                    <SalaryRangeChart data={data} labelKey="tenViTriChuan" />
                    <DataTable
                      rows={data}
                      columns={[
                        { key: "tenViTriChuan", label: "Vị trí" },
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
                      ]}
                    />
                  </div>
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "experience",
            label: "Theo kinh nghiệm",
            title: "Lương theo kinh nghiệm",
            description: "Mức lương trung bình theo từng nhóm kinh nghiệm",
            content: (
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
            ),
          },
          {
            value: "city",
            label: "Theo thành phố",
            title: "Lương theo thành phố",
            description: "So sánh mức lương trung bình giữa các thành phố",
            content: (
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
            ),
          },
          {
            value: "skill",
            label: "Theo kỹ năng",
            title: "Lương theo kỹ năng",
            description: "Các kỹ năng gắn với mức lương trung bình cao hơn",
            content: (
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
            ),
          },
        ]}
      />
    </Section>
  );
}
