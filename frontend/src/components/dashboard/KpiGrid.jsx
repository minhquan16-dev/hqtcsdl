import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber, formatSalary } from "@/lib/format"

function getSalaryCoverage(data) {
  if (!data?.tongSoTin || !data?.soTinCoLuong) return 0
  return Math.round((Number(data.soTinCoLuong) / Number(data.tongSoTin)) * 100)
}

function MetricCard({ item, isLoading }) {
  return (
    <Card size="sm" className="gap-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {item.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-24 rounded-2xl" />
        ) : (
          <div
            className="truncate text-2xl font-semibold tracking-tight"
            title={item.value}
          >
            {item.value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HighlightCard({ title, value, meta, isLoading }) {
  return (
    <Card className="gap-2 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-end justify-between gap-4">
            <Skeleton className="h-8 w-44 rounded-2xl" />
            <Skeleton className="h-10 w-28 rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="truncate text-2xl font-semibold tracking-tight sm:min-w-0">
              {value}
            </div>
            {meta ? (
              <Badge
                variant="secondary"
                className="h-9 shrink-0 px-3 text-base font-semibold"
              >
                {meta}
              </Badge>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function KpiGrid({ data, isLoading }) {
  const salaryCoverage = getSalaryCoverage(data)
  const marketTitle = isLoading
    ? "Đang tải dữ liệu tuyển dụng IT"
    : `Nhu cầu tuyển dụng IT đang có ${formatNumber(data?.tongSoTin)} tin`
  const primaryItems = [
    {
      label: "Tổng số tin",
      value: formatNumber(data?.tongSoTin),
    },
    {
      label: "Lương trung bình",
      value: formatSalary(data?.luongTrungBinh),
    },
    {
      label: "Tin có lương",
      value: formatNumber(data?.soTinCoLuong),
    },
  ]
  const secondaryItems = [
    { label: "Công ty", value: formatNumber(data?.soCongTy) },
    { label: "Vị trí", value: formatNumber(data?.soViTri) },
    { label: "Kỹ năng", value: formatNumber(data?.soKyNang) },
  ]
  const highlights = [
    {
      title: "Thành phố nổi bật",
      value: data?.thanhPhoNoiBat?.tenThanhPho || "Chưa có dữ liệu",
      meta: data?.thanhPhoNoiBat?.soTin
        ? `${formatNumber(data.thanhPhoNoiBat.soTin)} tin`
        : "",
    },
    {
      title: "Kỹ năng nổi bật",
      value: data?.kyNangNoiBat?.tenKyNang || "Chưa có dữ liệu",
      meta: data?.kyNangNoiBat?.soTin
        ? `${formatNumber(data.kyNangNoiBat.soTin)} tin`
        : "",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-primary/6 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl font-semibold tracking-tight md:text-3xl">
                {marketTitle}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 md:grid-cols-3">
              {primaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl bg-background/70 p-4 ring-1 ring-border/70"
                >
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  {isLoading ? (
                    <Skeleton className="mt-3 h-8 w-24 rounded-2xl" />
                  ) : (
                    <div className="mt-2 truncate text-2xl font-semibold tracking-tight">
                      {item.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  Độ phủ dữ liệu lương
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold text-muted-foreground"
                        aria-label="Giải thích độ phủ dữ liệu lương"
                      >
                        ?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-64 leading-relaxed">
                      Tỷ lệ tin tuyển dụng có thông tin lương trên tổng số tin
                      trong bộ lọc hiện tại.
                    </TooltipContent>
                  </Tooltip>
                </span>
                <span className="text-muted-foreground">
                  {isLoading ? "Đang tải" : `${salaryCoverage}%`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${salaryCoverage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {secondaryItems.map((item) => (
            <MetricCard key={item.label} item={item} isLoading={isLoading} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {highlights.map((item) => (
          <HighlightCard key={item.title} {...item} isLoading={isLoading} />
        ))}
      </div>
    </div>
  )
}
