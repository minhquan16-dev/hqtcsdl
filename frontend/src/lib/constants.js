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

export const FILTER_FIELD_CONFIG = {
  year: {
    label: "Năm",
    type: "select",
    optionsKey: "nam",
    placeholder: "Chọn năm",
    className: "md:w-[132px]",
  },
  quarter: {
    label: "Quý",
    type: "select",
    optionsKey: "nhanQuy",
    placeholder: "Chọn quý",
    className: "md:w-[132px]",
  },
  city: {
    label: "Thành phố",
    type: "combobox",
    optionsKey: "tenThanhPho",
    placeholder: "Tất cả thành phố",
    className: "md:min-w-[220px] md:flex-1",
  },
  level: {
    label: "Cấp bậc",
    type: "combobox",
    optionsKey: "tenCapBac",
    placeholder: "Tất cả cấp bậc",
    className: "md:min-w-[180px] md:flex-1",
  },
  position: {
    label: "Vị trí",
    type: "combobox",
    optionsKey: "tenViTriChuan",
    placeholder: "Tất cả vị trí",
    className: "md:min-w-[220px] md:flex-1",
  },
  skill: {
    label: "Kỹ năng",
    type: "combobox",
    optionsKey: "tenKyNang",
    placeholder: "Tất cả kỹ năng",
    className: "md:min-w-[220px] md:flex-1",
  },
  company: {
    label: "Công ty",
    type: "combobox",
    optionsKey: "tenCongTy",
    placeholder: "Tất cả công ty",
    className: "md:min-w-[260px] md:flex-[1.2]",
  },
}

export const ROUTE_FILTER_FIELDS = {
  overview: ["year", "quarter"],
  trends: ["year", "quarter"],
  positions: ["year", "quarter", "position"],
  skills: ["year", "quarter", "skill"],
  salary: ["year", "quarter", "city", "position", "skill"],
  location: ["year", "quarter", "city"],
  company: ["year", "quarter", "company"],
  level: ["year", "quarter", "level", "position"],
  jobs: ["year", "quarter", "city", "level", "position", "skill", "company"],
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
