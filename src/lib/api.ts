import { supabase } from "@/lib/supabase"
import type {
  AnalyticsResult,
  FloorPlan,
  Job,
  Location,
  Organization,
  Suggestion,
  Video,
} from "@/types"

const API_PREFIX = "/api/v1"

function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL
  if (!base) {
    throw new Error("Missing VITE_API_URL environment variable.")
  }
  return base.replace(/\/$/, "")
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = getApiBase()
  const normalized = path.startsWith("/") ? path : `/${path}`
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  const headers = new Headers(options?.headers)
  if (
    !headers.has("Content-Type") &&
    options?.body !== undefined &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const res = await fetch(`${base}${API_PREFIX}${normalized}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }
  const contentType = res.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    const text = await res.text()
    if (!text) {
      return undefined as T
    }
    return JSON.parse(text) as T
  }
  return undefined as T
}

// -- Onboarding --

type OnboardingResult = {
  user: { id: string; email: string; role: string }
  organization: Organization
  locations: Location[]
}

export function setupWorkspace() {
  return apiFetch<OnboardingResult>("/onboarding/setup", { method: "POST" })
}

// -- Dashboard --

export type DashboardStats = {
  floor_plans: number
  pending_jobs: number
  completed_analyses: number
  total_videos: number
}

export function getDashboardStats() {
  return apiFetch<DashboardStats>("/dashboard/stats")
}

// -- Floor plans --

export function getFloorPlans() {
  return apiFetch<FloorPlan[]>("/floor-plans")
}

export function createFloorPlan(body: {
  location_id: string
  name: string
  image_path: string
  metadata_json?: Record<string, unknown>
}) {
  return apiFetch<FloorPlan>("/floor-plans", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getFloorPlan(id: string) {
  return apiFetch<FloorPlan>(`/floor-plans/${encodeURIComponent(id)}`)
}

export function deleteFloorPlan(id: string) {
  return apiFetch<void>(`/floor-plans/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export function updateFloorPlan(
  id: string,
  body: {
    location_id: string
    name: string
    image_path?: string
    metadata_json?: Record<string, unknown>
  }
) {
  return apiFetch<FloorPlan>(`/floor-plans/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export function uploadFloorPlanImage(file: File) {
  const form = new FormData()
  form.append("file", file)
  return apiFetch<{ image_path: string; image_url: string }>(
    "/floor-plans/upload-image",
    { method: "POST", body: form }
  )
}

// -- Videos --

export function getUploadUrl(body: {
  floor_plan_id: string
  filename: string
  content_type?: string | null
}) {
  return apiFetch<{ signed_url: string; path: string; token: string | null }>(
    "/videos/upload-url",
    { method: "POST", body: JSON.stringify(body) }
  )
}

export function registerVideo(body: {
  floor_plan_id: string
  storage_path: string
  duration_seconds?: number | null
}) {
  return apiFetch<Video>("/videos", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

// -- Jobs --

export function createJob(body: { video_id: string; calibration_json?: unknown }) {
  return apiFetch<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getJobStatus(id: string) {
  return apiFetch<Job>(`/jobs/${encodeURIComponent(id)}`)
}

export function getJobResults(id: string) {
  return apiFetch<AnalyticsResult[]>(
    `/jobs/${encodeURIComponent(id)}/results`
  )
}

// -- Analytics --

export function getAnalytics(floorPlanId: string) {
  return apiFetch<AnalyticsResult>(
    `/analytics/${encodeURIComponent(floorPlanId)}`
  )
}

export function getAnalyticsHistory(floorPlanId: string) {
  return apiFetch<AnalyticsResult[]>(
    `/floor-plans/${encodeURIComponent(floorPlanId)}/analytics`
  )
}

export function getSuggestions(floorPlanId: string) {
  return apiFetch<Suggestion[]>(
    `/suggestions/${encodeURIComponent(floorPlanId)}`
  )
}

export function compareFloorPlans(firstId: string, secondId: string) {
  return apiFetch<unknown>(
    `/floor-plans/compare?first_id=${encodeURIComponent(firstId)}&second_id=${encodeURIComponent(secondId)}`
  )
}
