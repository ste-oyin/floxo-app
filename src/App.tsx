import { Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SupabaseAuthProvider } from "@/hooks/useSupabaseAuth"
import { JobStatusPage } from "@/pages/analysis/JobStatusPage"
import { ResultsPage } from "@/pages/analysis/ResultsPage"
import { UploadPage } from "@/pages/analysis/UploadPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { SignupPage } from "@/pages/auth/SignupPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { FloorPlanComparePage } from "@/pages/floor-plans/FloorPlanComparePage"
import { FloorPlanDetailPage } from "@/pages/floor-plans/FloorPlanDetailPage"
import { FloorPlanEditorPage } from "@/pages/floor-plans/FloorPlanEditorPage"
import { FloorPlansPage } from "@/pages/floor-plans/FloorPlansPage"
import { HeatmapViewerPage } from "@/pages/heatmap/HeatmapViewerPage"
import { SettingsPage } from "@/pages/settings/SettingsPage"

export default function App() {
  return (
    <SupabaseAuthProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="floor-plans" element={<FloorPlansPage />} />
              <Route
                path="floor-plans/new"
                element={<FloorPlanEditorPage />}
              />
              <Route
                path="floor-plans/compare"
                element={<FloorPlanComparePage />}
              />
              <Route
                path="floor-plans/:id/edit"
                element={<FloorPlanEditorPage />}
              />
              <Route
                path="floor-plans/:id"
                element={<FloorPlanDetailPage />}
              />
              <Route path="heatmap" element={<HeatmapViewerPage />} />
              <Route path="analysis/upload" element={<UploadPage />} />
              <Route path="analysis/jobs/:id" element={<JobStatusPage />} />
              <Route path="analysis/results/:id" element={<ResultsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </TooltipProvider>
    </SupabaseAuthProvider>
  )
}
