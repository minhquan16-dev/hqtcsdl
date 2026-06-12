import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "dashboard-theme"

function getInitialTheme() {
  if (typeof window === "undefined") return "light"
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle({ className, label = "Giao diện" }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const isDark = theme === "dark"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [isDark, theme])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isDark ? <MoonIcon /> : <SunIcon />}
      <span className="text-sm font-medium">{label}</span>
      <Switch
        checked={isDark}
        aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  )
}
