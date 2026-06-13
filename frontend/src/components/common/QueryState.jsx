import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage, isEmptyData } from "@/lib/format"

export function QueryError({ error, onRetry }) {
  const message = getErrorMessage(error)

  useEffect(() => {
    toast.error("Không tải được dữ liệu", {
      description: message,
    })
  }, [message])

  return (
    <div className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-muted/30 p-6 text-center">
      <p className="text-sm font-medium">Không tải được dữ liệu</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title = "Chưa có dữ liệu", description }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed bg-muted/30 p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {description || "Hãy thử đổi bộ lọc hoặc kiểm tra dữ liệu backend"}
      </p>
    </div>
  )
}

export function CardSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-2xl" />
      ))}
    </div>
  )
}

export function QueryBoundary({ query, children, skeletonRows = 4, emptyDescription }) {
  if (query.isLoading) return <CardSkeleton rows={skeletonRows} />
  if (query.isError) return <QueryError error={query.error} onRetry={query.refetch} />
  if (isEmptyData(query.data)) {
    return <EmptyState description={emptyDescription} />
  }
  return children(query.data)
}
