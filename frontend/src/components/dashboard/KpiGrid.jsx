import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber, formatSalary } from "@/lib/format"

export function KpiGrid({ data, isLoading }) {
  const items = [
    { label: "Tổng số tin", value: formatNumber(data?.tongSoTin) },
    { label: "Tin có lương", value: formatNumber(data?.soTinCoLuong) },
    { label: "Công ty", value: formatNumber(data?.soCongTy) },
    { label: "Vị trí", value: formatNumber(data?.soViTri) },
    { label: "Kỹ năng", value: formatNumber(data?.soKyNang) },
    { label: "Lương trung bình", value: formatSalary(data?.luongTrungBinh) },
    {
      label: "Thành phố nổi bật",
      value: data?.thanhPhoNoiBat?.tenThanhPho || "Chưa có dữ liệu",
      meta: data?.thanhPhoNoiBat?.soTin
        ? `${formatNumber(data.thanhPhoNoiBat.soTin)} tin`
        : "",
    },
    {
      label: "Kỹ năng nổi bật",
      value: data?.kyNangNoiBat?.tenKyNang || "Chưa có dữ liệu",
      meta: data?.kyNangNoiBat?.soTin ? `${formatNumber(data.kyNangNoiBat.soTin)} tin` : "",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-20 flex-col justify-end gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-2xl" />
            ) : (
              <>
                <div className="truncate text-2xl font-semibold tracking-tight" title={item.value}>
                  {item.value}
                </div>
                {item.meta ? <Badge variant="secondary">{item.meta}</Badge> : null}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
