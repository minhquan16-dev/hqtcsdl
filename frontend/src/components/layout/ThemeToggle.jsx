import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const STORAGE_KEY = "dashboard-theme"

function getInitialTheme() {
  if (typeof window === "undefined") return "light"
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)
  const isDark = theme === "dark"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [isDark, theme])

  return (
    <>
      {isDark ? <MoonIcon /> : <SunIcon />}
      <Switch
        checked={isDark}
        aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </>
  )
}
