import { useState } from "react"
import {
  CloudDownloadIcon,
  DatabaseZapIcon,
  LoaderCircleIcon,
  CalendarClockIcon,
  SettingsIcon,
  ShuffleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { systemApi } from "@/lib/api/systemApi"
import { ThemeToggle } from "./ThemeToggle"

const DEFAULT_SCHEDULE = {
  enabled: false,
  jobType: "crawl",
  frequency: "daily",
  time: "02:00",
  dayOfWeek: "1",
  intervalHours: "6",
  dayOfMonth: "1",
  quarterMonth: "first",
}

const TASKS = [
  {
    key: "crawl",
    label: "Cào dữ liệu tuyển dụng",
    icon: CloudDownloadIcon,
    run: systemApi.runCrawl,
  },
  {
    key: "etl",
    label: "Chạy ETL",
    icon: DatabaseZapIcon,
    run: systemApi.runEtl,
  },
  {
    key: "crawl_then_etl",
    label: "Cào dữ liệu và chạy ETL",
    icon: ShuffleIcon,
    run: systemApi.runCrawlThenEtl,
  },
]

const JOB_OPTIONS = [
  { value: "crawl", label: "Cào data" },
  { value: "etl", label: "Chạy ETL" },
  { value: "crawl_then_etl", label: "Cào data và chạy ETL" },
]

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Hằng ngày" },
  { value: "weekly", label: "Hằng tuần" },
  { value: "monthly", label: "Hằng tháng" },
  { value: "quarterly", label: "Hằng quý" },
  { value: "interval", label: "Mỗi vài giờ" },
]

const WEEK_DAYS = [
  { value: "1", label: "Thứ 2" },
  { value: "2", label: "Thứ 3" },
  { value: "3", label: "Thứ 4" },
  { value: "4", label: "Thứ 5" },
  { value: "5", label: "Thứ 6" },
  { value: "6", label: "Thứ 7" },
  { value: "0", label: "Chủ nhật" },
]

const QUARTER_MONTHS = [
  { value: "first", label: "Tháng đầu quý" },
  { value: "middle", label: "Tháng giữa quý" },
  { value: "last", label: "Tháng cuối quý" },
]

function FieldLabel({ children }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>
}

function MenuDivider() {
  return <div className="my-1 h-px bg-border/80" />
}

export function SidebarSettingsPopover() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [runningTask, setRunningTask] = useState("")
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)

  async function loadSchedule() {
    setIsLoadingSchedule(true)

    try {
      const data = await systemApi.getSchedule()
      setSchedule({ ...DEFAULT_SCHEDULE, ...data })
    } catch (error) {
      toast.error("Không tải được lịch chạy", {
        description: error.message,
      })
    } finally {
      setIsLoadingSchedule(false)
    }
  }

  function handleScheduleDialogOpenChange(nextOpen) {
    setIsScheduleDialogOpen(nextOpen)
    if (nextOpen) {
      loadSchedule()
    }
  }

  function openScheduleDialog() {
    setIsPopoverOpen(false)
    setIsScheduleDialogOpen(true)
    loadSchedule()
  }

  function updateSchedule(key, value) {
    setSchedule((current) => ({ ...current, [key]: value }))
  }

  async function runTask(task) {
    setRunningTask(task.key)

    try {
      await task.run()
      toast.success("Đã bắt đầu tác vụ nền", {
        description: `${task.label} đang chạy. Tác vụ cào dữ liệu có thể mất hơn 2 giờ.`,
      })
    } catch (error) {
      toast.error(`${task.label} thất bại`, {
        description: error.message,
      })
    } finally {
      setRunningTask("")
    }
  }

  async function saveSchedule(event) {
    event.preventDefault()
    setIsSavingSchedule(true)

    try {
      const data = await systemApi.saveSchedule(schedule)
      setSchedule({ ...DEFAULT_SCHEDULE, ...data })
      toast.success("Đã lưu lịch chạy", {
        description: data.enabled
          ? "Backend sẽ tự chạy tác vụ theo lịch đã chọn."
          : "Lịch chạy tự động đang tắt.",
      })
    } catch (error) {
      toast.error("Không lưu được lịch chạy", {
        description: error.message,
      })
    } finally {
      setIsSavingSchedule(false)
    }
  }

  async function clearSchedule() {
    setIsSavingSchedule(true)

    try {
      const data = await systemApi.clearSchedule()
      setSchedule({ ...DEFAULT_SCHEDULE, ...data })
      toast.success("Đã tắt lịch chạy tự động")
    } catch (error) {
      toast.error("Không tắt được lịch chạy", {
        description: error.message,
      })
    } finally {
      setIsSavingSchedule(false)
    }
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start rounded-xl px-2.5 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <SettingsIcon />
            <span className="group-data-[collapsible=icon]:hidden">Cài đặt</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <div className="flex flex-col gap-1">
            {TASKS.map((task) => {
              const Icon = task.icon
              const isRunning = runningTask === task.key
              const hasRunningTask = Boolean(runningTask)

              return (
                <Button
                  key={task.key}
                  type="button"
                  variant="ghost"
                  disabled={hasRunningTask}
                  onClick={() => runTask(task)}
                  className="h-9 w-full justify-start gap-2 px-2 font-normal"
                >
                  <Icon className="size-4 shrink-0" />

                  <span className="min-w-0 flex-1 truncate text-left">
                    {task.label}
                  </span>

                  {isRunning ? (
                    <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
                  ) : null}
                </Button>
              )
            })}

            <Button
              type="button"
              variant="ghost"
              onClick={openScheduleDialog}
              className="h-9 w-full justify-start gap-2 px-2 font-normal"
            >
              <CalendarClockIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">
                Cài đặt cronjob
              </span>
            </Button>

            <MenuDivider />

            <ThemeToggle
              className="w-full"
              iconClassName="size-4"
              label="Chế độ tối"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={handleScheduleDialogOpenChange}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cài đặt cronjob</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <form className="flex flex-col gap-4" onSubmit={saveSchedule}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Lịch chạy tự động</p>
                </div>
                <Switch
                  checked={schedule.enabled}
                  disabled={isLoadingSchedule || isSavingSchedule}
                  onCheckedChange={(value) => updateSchedule("enabled", value)}
                />
              </div>

              <label className="flex flex-col gap-1.5">
                <FieldLabel>Tác vụ</FieldLabel>
                <Select
                  value={schedule.jobType}
                  disabled={isLoadingSchedule || isSavingSchedule}
                  onValueChange={(value) => updateSchedule("jobType", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Tần suất</FieldLabel>
                  <Select
                    value={schedule.frequency}
                    disabled={isLoadingSchedule || isSavingSchedule}
                    onValueChange={(value) => updateSchedule("frequency", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                {schedule.frequency === "interval" ? (
                  <label className="flex flex-col gap-1.5">
                    <FieldLabel>Số giờ lặp lại</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="23"
                      value={schedule.intervalHours}
                      disabled={isLoadingSchedule || isSavingSchedule}
                      onChange={(event) =>
                        updateSchedule("intervalHours", event.target.value)
                      }
                    />
                  </label>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <FieldLabel>Giờ chạy</FieldLabel>
                    <Input
                      type="time"
                      value={schedule.time}
                      disabled={isLoadingSchedule || isSavingSchedule}
                      onChange={(event) =>
                        updateSchedule("time", event.target.value)
                      }
                    />
                  </label>
                )}
              </div>

              {schedule.frequency === "weekly" ? (
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Ngày trong tuần</FieldLabel>
                  <Select
                    value={schedule.dayOfWeek}
                    disabled={isLoadingSchedule || isSavingSchedule}
                    onValueChange={(value) => updateSchedule("dayOfWeek", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEK_DAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}

              {schedule.frequency === "monthly" ||
              schedule.frequency === "quarterly" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <FieldLabel>Ngày trong tháng</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={schedule.dayOfMonth}
                      disabled={isLoadingSchedule || isSavingSchedule}
                      onChange={(event) =>
                        updateSchedule("dayOfMonth", event.target.value)
                      }
                    />
                  </label>

                  {schedule.frequency === "quarterly" ? (
                    <label className="flex flex-col gap-1.5">
                      <FieldLabel>Tháng trong quý</FieldLabel>
                      <Select
                        value={schedule.quarterMonth}
                        disabled={isLoadingSchedule || isSavingSchedule}
                        onValueChange={(value) =>
                          updateSchedule("quarterMonth", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUARTER_MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  ) : null}
                </div>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoadingSchedule || isSavingSchedule}
                  onClick={clearSchedule}
                >
                  Tắt lịch
                </Button>
                <Button
                  type="submit"
                  disabled={isLoadingSchedule || isSavingSchedule}
                >
                  {isSavingSchedule &&
                    <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                  }
                  Lưu lịch
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
