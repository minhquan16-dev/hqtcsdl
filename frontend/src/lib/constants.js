export const DEFAULT_LIMIT = 10

export const FILTER_DEFAULTS = {
  year: "",
  quarter: "",
  city: "",
  level: "",
  position: "",
  skill: "",
  company: "",
}

export const SORT_OPTIONS = [
  { value: "jobCount", label: "Số tin" },
  { value: "averageSalary", label: "Lương trung bình" },
  { value: "averageExperience", label: "Kinh nghiệm trung bình" },
]

export const BREAKDOWN_GROUPS = [
  { value: "quarter", label: "Theo quý" },
  { value: "month", label: "Theo tháng" },
  { value: "city", label: "Theo thành phố" },
  { value: "ward", label: "Theo phường/xã" },
  { value: "skill", label: "Theo kỹ năng" },
  { value: "position", label: "Theo vị trí" },
  { value: "company", label: "Theo công ty" },
  { value: "level", label: "Theo cấp bậc" },
]

export const NAV_ITEMS = [
  { path: "/", label: "Tổng quan" },
  { path: "/xu-huong", label: "Xu hướng" },
  { path: "/vi-tri", label: "Vị trí" },
  { path: "/ky-nang", label: "Kỹ năng" },
  { path: "/luong", label: "Lương" },
  { path: "/dia-diem", label: "Địa điểm" },
  { path: "/cong-ty", label: "Công ty" },
  { path: "/cap-bac", label: "Cấp bậc" },
  { path: "/tong-hop", label: "Tổng hợp" },
]
