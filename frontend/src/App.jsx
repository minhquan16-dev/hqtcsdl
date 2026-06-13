import { BrowserRouter, Route, Routes } from "react-router"
import {
  CompanyPage,
  DashboardLayout,
  JobsPage,
  LevelPage,
  LocationPage,
  OverviewPage,
  PositionsPage,
  SalaryPredictionPage,
  SalaryPage,
  SkillsPage,
  TrendsPage,
  UnknownRoute,
} from "@/pages/DashboardPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/xu-huong" element={<TrendsPage />} />
          <Route path="/vi-tri" element={<PositionsPage />} />
          <Route path="/ky-nang" element={<SkillsPage />} />
          <Route path="/luong" element={<SalaryPage />} />
          <Route path="/du-doan-luong" element={<SalaryPredictionPage />} />
          <Route path="/dia-diem" element={<LocationPage />} />
          <Route path="/cong-ty" element={<CompanyPage />} />
          <Route path="/cap-bac" element={<LevelPage />} />
          <Route path="/tong-hop" element={<JobsPage />} />
          <Route path="*" element={<UnknownRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
