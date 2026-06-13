import { useState } from "react"
import {
  CalculatorIcon,
  ChevronsUpDownIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchableCombobox } from "@/components/filters/SearchableCombobox"
import { useSalaryPredictionMutation } from "@/hooks/queries/useSalaryQueries"
import { formatNumber, formatSalary, getErrorMessage } from "@/lib/format"

const INITIAL_FORM = {
  position: "",
  city: "",
  level: "",
  experience: "",
  skills: [],
}

const confidenceLabels = {
  very_low: "Rất thấp",
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
}

function getOptions(filtersData, key) {
  return filtersData?.[key] || []
}

function ResultSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-3xl border bg-muted/30 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function MultiSkillSelect({ value, options = [], onChange }) {
  function toggleSkill(skill) {
    const isSelected = value.includes(skill)
    onChange(
      isSelected
        ? value.filter((item) => item !== skill)
        : [...value, skill],
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">Kỹ năng</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="h-auto min-h-9 w-full justify-between bg-muted/50 py-1.5"
          >
            <span className="flex min-w-0 flex-1 flex-wrap gap-1">
              {value.length ? (
                value.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  Chọn nhiều kỹ năng
                </span>
              )}
            </span>
            <ChevronsUpDownIcon data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Tìm kỹ năng..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy kỹ năng phù hợp.</CommandEmpty>
              <CommandGroup>
                {options.map((skill) => (
                  <CommandItem
                    key={skill}
                    value={skill}
                    data-checked={value.includes(skill)}
                    onSelect={() => toggleSkill(skill)}
                  >
                    <span className="truncate" title={skill}>
                      {skill}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PredictionResult({ data }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kết quả dự đoán</CardTitle>
          <CardDescription>
            Model sẽ trả mức lương tham khảo theo dữ liệu tuyển dụng hiện có.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Chưa có kết quả dự đoán.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Kết quả dự đoán</CardTitle>
            <CardDescription>
              Đơn vị: {data.donVi || "triệu VND/tháng"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-3xl border bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">Lương dự đoán</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {formatSalary(data.luongDuDoan)}
          </p>
        </div>
        Độ tin cậy: {confidenceLabels[data.doTinCay] || data.doTinCay}
        <div className="grid gap-3 md:grid-cols-2">
          <MetricTile
            label="Tối thiểu"
            value={formatSalary(data.khoangLuong?.thap)}
          />
          <MetricTile
            label="Tối đa"
            value={formatSalary(data.khoangLuong?.cao)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Badge variant="outline">{data.model?.ten || "Model"}</Badge>
        <Badge variant="outline">MAE {formatNumber(data.model?.mae)}</Badge>
        <Badge variant="outline">R2 {formatNumber(data.model?.r2)}</Badge>
      </CardFooter>
    </Card>
  )
}

export function SalaryPredictionSection({ filtersData }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const predictionMutation = useSalaryPredictionMutation()

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function resetForm() {
    setForm(INITIAL_FORM)
    predictionMutation.reset()
  }

  function handleSubmit(event) {
    event.preventDefault()
    predictionMutation.mutate({
      position: form.position,
      city: form.city,
      level: form.level,
      experience: form.experience,
      skills: form.skills.join(", "),
    })
  }

  const isSubmitDisabled = !form.position || predictionMutation.isPending

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đầu vào</CardTitle>
          <CardDescription>
            Ước lượng dựa trên vị trí, khu vực, cấp bậc, kinh nghiệm và kỹ năng.
          </CardDescription>
        </CardHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-5">
            <SearchableCombobox
              label="Vị trí"
              value={form.position}
              options={getOptions(filtersData, "tenViTriChuan")}
              placeholder="Chọn vị trí"
              onChange={(value) => updateField("position", value)}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SearchableCombobox
                label="Thành phố"
                value={form.city}
                options={getOptions(filtersData, "tenThanhPho")}
                placeholder="Chọn thành phố"
                onChange={(value) => updateField("city", value)}
              />
              <SearchableCombobox
                label="Cấp bậc"
                value={form.level}
                options={getOptions(filtersData, "tenCapBac")}
                placeholder="Chọn cấp bậc"
                allowAll={false}
                onChange={(value) => updateField("level", value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Kinh nghiệm
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.experience}
                  placeholder="2"
                  onChange={(event) =>
                    updateField("experience", event.target.value)
                  }
                />
              </label>
              <MultiSkillSelect
                value={form.skills}
                options={getOptions(filtersData, "tenKyNang")}
                onChange={(value) => updateField("skills", value)}
              />
            </div>
            {predictionMutation.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Không dự đoán được lương</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(predictionMutation.error)}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              <RotateCcwIcon data-icon="inline-start" />
              Xóa
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {predictionMutation.isPending ? (
                <SparklesIcon data-icon="inline-start" />
              ) : (
                <CalculatorIcon data-icon="inline-start" />
              )}
              Dự đoán
            </Button>
          </CardFooter>
        </form>
      </Card>
      {predictionMutation.isPending ? (
        <ResultSkeleton />
      ) : (
        <PredictionResult data={predictionMutation.data} />
      )}
    </div>
  )
}
