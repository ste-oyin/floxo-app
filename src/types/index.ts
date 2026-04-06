export type Organization = {
  id: string
  name: string
  plan_tier: string
  created_at: string
}

export type Location = {
  id: string
  org_id: string
  name: string
  address: string
  created_at: string
}

export type FloorPlan = {
  id: string
  location_id: string
  name: string
  image_path: string
  metadata_json: Record<string, unknown>
  created_at: string
}

export type Video = {
  id: string
  floor_plan_id: string
  storage_path: string
  duration_seconds: number | null
  status: string
  uploaded_at: string
}

export type Job = {
  id: string
  video_id: string
  status: string
  progress_pct: number
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export type AnalyticsResult = {
  id: string
  job_id: string
  floor_plan_id: string
  metrics_json: Record<string, unknown>
  heatmap_image_path: string | null
  paths_json: unknown[]
  suggestions_json: unknown[] | null
  created_at: string
}

export type Suggestion = {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  metric_source: string
  expected_impact: string
}
