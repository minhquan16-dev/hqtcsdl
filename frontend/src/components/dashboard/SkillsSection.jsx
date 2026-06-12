import {
  CategoryTreemap,
  HorizontalBarChart,
} from "@/components/charts/SimpleCharts";
import { DataTable } from "@/components/common/DataTable";
import { QueryBoundary } from "@/components/common/QueryState";
import { Section } from "@/components/common/Section";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import {
  useSkillCoOccurrenceQuery,
  useTopLanguagesQuery,
  useTopSkillsQuery,
} from "@/hooks/queries/useSkillsQueries";
import { formatNumber, formatPercent } from "@/lib/format";

export function SkillsSection({ params }) {
  const skillsQuery = useTopSkillsQuery({
    year: params.year,
    quarter: params.quarter,
    skill: params.skill,
    limit: 10,
  });
  const languagesQuery = useTopLanguagesQuery({
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });
  const coOccurrenceQuery = useSkillCoOccurrenceQuery({
    skill: params.skill,
    year: params.year,
    quarter: params.quarter,
    limit: 10,
  });

  return (
    <Section id="ky-nang" title="Kỹ năng và ngôn ngữ">
      <DashboardTabs
        defaultValue="skills"
        tabs={[
          {
            value: "skills",
            label: "Top kỹ năng",
            title: "Top kỹ năng",
            description:
              "Các kỹ năng xuất hiện nhiều nhất trong tin tuyển dụng",
            content: (
              <QueryBoundary query={skillsQuery}>
                {(data) => (
                  <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <CategoryTreemap
                      data={data}
                      labelKey="tenKyNang"
                      valueKey="soTin"
                    />
                    <DataTable
                      rows={data}
                      columns={[
                        { key: "xepHang", label: "#" },
                        { key: "tenKyNang", label: "Kỹ năng" },
                        {
                          key: "soTin",
                          label: "Số tin",
                          render: (row) => formatNumber(row.soTin),
                        },
                        {
                          key: "tyLeTheoTongTin",
                          label: "Tỷ lệ",
                          render: (row) => formatPercent(row.tyLeTheoTongTin),
                        },
                      ]}
                    />
                  </div>
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "languages",
            label: "Ngôn ngữ",
            title: "Top ngôn ngữ",
            description: "Những ngôn ngữ lập trình được nhắc đến nhiều nhất",
            content: (
              <QueryBoundary query={languagesQuery}>
                {(data) => (
                  <HorizontalBarChart
                    data={data}
                    labelKey="ngonNgu"
                    valueKey="soTin"
                  />
                )}
              </QueryBoundary>
            ),
          },
          {
            value: "co-occurrence",
            label: "Kỹ năng đi kèm",
            title: "Kỹ năng đi kèm",
            description:
              "Các cặp kỹ năng thường xuất hiện cùng nhau trong cùng tin tuyển dụng",
            content: (
              <QueryBoundary query={coOccurrenceQuery}>
                {(data) => (
                  <DataTable
                    rows={data}
                    columns={[
                      { key: "tenKyNang", label: "Kỹ năng" },
                      { key: "tenKyNangLienQuan", label: "Đi kèm" },
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
        ]}
      />
    </Section>
  );
}
