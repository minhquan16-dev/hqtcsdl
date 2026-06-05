export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "Chưa có dữ liệu"
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0)
}

export function formatSalary(value) {
  if (value === null || value === undefined || value === "") return "Chưa có dữ liệu"
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(Number(value))} triệu`
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "Chưa có dữ liệu"
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(Number(value))}%`
}

export function formatExperience(value) {
  if (value === null || value === undefined || value === "") return "Chưa có dữ liệu"
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(Number(value))} năm`
}

export function getErrorMessage(error) {
  return error?.message || "Đã có lỗi xảy ra"
}

export function isEmptyData(data) {
  if (Array.isArray(data)) return data.length === 0
  if (!data) return true
  if (typeof data === "object") {
    return Object.values(data).every((value) => {
      if (Array.isArray(value)) return value.length === 0
      if (value && typeof value === "object") return false
      return value === 0 || value === null || value === undefined || value === ""
    })
  }
  return false
}
