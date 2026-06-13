import {
  BadgeDollarSign,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChartColumnIncreasing,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  MapPinned,
  Sparkles,
} from "lucide-react"

export const DEFAULT_LIMIT = 10

export const FILTER_DEFAULTS = {
  year: "",
  quarter: "",
  city: "",
  level: "",
  position: "",
  skill: "",
  company: "",
  salaryMin: "",
  salaryMax: "",
  experienceMin: "",
  experienceMax: "",
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
  salaryMin: {
    label: "Khoảng lương",
    type: "range",
    minKey: "salaryMin",
    maxKey: "salaryMax",
    min: 0,
    max: 100,
    step: 5,
    unit: "triệu",
    className: "md:min-w-[260px] md:flex-1",
  },
  salaryMax: {
    type: "range-peer",
  },
  experienceMin: {
    label: "Kinh nghiệm",
    type: "range",
    minKey: "experienceMin",
    maxKey: "experienceMax",
    min: 0,
    max: 10,
    step: 0.5,
    unit: "năm",
    className: "md:min-w-[260px] md:flex-1",
  },
  experienceMax: {
    type: "range-peer",
  },
}

export const ROUTE_FILTER_FIELDS = {
  overview: ["year", "quarter"],
  trends: ["year", "quarter"],
  positions: ["year", "quarter", "position"],
  skills: ["year", "quarter", "skill"],
  salary: ["year", "quarter", "city", "position", "skill"],
  salaryPrediction: [],
  location: ["year", "quarter", "city"],
  company: ["year", "quarter", "company"],
  level: ["year", "quarter", "level", "position"],
  jobs: ["year", "quarter", "city", "level", "position", "skill", "company", "salaryMin", "salaryMax", "experienceMin", "experienceMax"],
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
  {
    path: "/",
    routeKey: "overview",
    label: "Tổng quan",
    description: "Bức tranh tổng thể về quy mô tuyển dụng, lương và điểm nóng thị trường.",
    icon: LayoutDashboard,
  },
  {
    path: "/xu-huong",
    routeKey: "trends",
    label: "Xu hướng",
    description: "Theo dõi biến động nhu cầu tuyển dụng theo quý và theo tháng.",
    icon: ChartColumnIncreasing,
  },
  {
    path: "/vi-tri",
    routeKey: "positions",
    label: "Vị trí",
    description: "So sánh mức độ quan tâm, lương và kỹ năng đi kèm của từng vị trí.",
    icon: BriefcaseBusiness,
  },
  {
    path: "/ky-nang",
    routeKey: "skills",
    label: "Kỹ năng & Ngôn ngữ",
    description: "Khám phá các kỹ năng nổi bật, ngôn ngữ phổ biến và độ đồng xuất hiện.",
    icon: BrainCircuit,
  },
  {
    path: "/luong",
    routeKey: "salary",
    label: "Lương",
    description: "Nhìn nhanh mặt bằng lương theo vị trí, thành phố, kỹ năng và kinh nghiệm.",
    icon: BadgeDollarSign,
  },
  {
    path: "/du-doan-luong",
    routeKey: "salaryPrediction",
    label: "Dự đoán lương",
    description: "Ước lượng lương tham khảo từ model học máy đã train trên dữ liệu tuyển dụng.",
    icon: Sparkles,
  },
  {
    path: "/dia-diem",
    routeKey: "location",
    label: "Địa điểm",
    description: "So sánh thị trường tuyển dụng giữa các thành phố và cụm nhu cầu nổi bật.",
    icon: MapPinned,
  },
  {
    path: "/cong-ty",
    routeKey: "company",
    label: "Công ty",
    description: "Theo dõi nhóm công ty tuyển dụng mạnh và phân bố theo lĩnh vực.",
    icon: Building2,
  },
  {
    path: "/cap-bac",
    routeKey: "level",
    label: "Cấp bậc & Kinh nghiệm",
    description: "Quan sát phân bố cấp bậc, kinh nghiệm và nhóm kỹ năng theo seniority.",
    icon: Layers3,
  },
  {
    path: "/tong-hop",
    routeKey: "jobs",
    label: "Tổng hợp",
    description: "Tổng hợp dữ liệu theo các lát cắt quan trọng sau khi áp dụng bộ lọc.",
    icon: FolderKanban,
  },
]
