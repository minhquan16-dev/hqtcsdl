import { useState } from "react"
import {
  CloudDownloadIcon,
  DatabaseZapIcon,
  LoaderCircleIcon,
  SettingsIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { systemApi } from "@/lib/api/systemApi"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"

const TASKS = [
  {
    key: "crawl",
    label: "Cào dữ liệu tuyển dụng",
    icon: CloudDownloadIcon,
    run: systemApi.runCrawl,
  },
  {
    key: "etl",
    label: "Chạy ETL kho dữ liệu",
    icon: DatabaseZapIcon,
    run: systemApi.runEtl,
  },
]

function MenuDivider() {
  return <div className="my-1 h-px bg-border/80" />
}

export function SidebarSettingsPopover() {
  const [runningTask, setRunningTask] = useState("")
  const [status, setStatus] = useState(null)

  async function runTask(task) {
    setRunningTask(task.key)
    setStatus(null)

    try {
      await task.run()
      setStatus({
        type: "success",
        message: `${task.label} đã hoàn tất.`,
      })
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || `${task.label} thất bại.`,
      })
    } finally {
      setRunningTask("")
    }
  }

  return (
    <Popover>
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

          <MenuDivider />

          <ThemeToggle
            className="w-full"
            iconClassName="size-4"
            label="Chế độ tối"
          />

          {status ? (
            <p
              className={cn(
                "px-2 py-1 text-xs leading-5",
                status.type === "success"
                  ? "text-primary"
                  : "text-destructive",
              )}
            >
              {status.message}
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
