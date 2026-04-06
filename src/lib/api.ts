import { supabase } from "@/lib/supabase"
import type {
  AnalyticsResult,
  FloorPlan,
  Job,
  Suggestion,
  Video,
} from "@/types"

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
  if (!headers.has("Content-Type") && options?.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const res = await fetch(`${base}${normalized}`, {
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

export function getUploadUrl(body: {
  filename: string
  content_type: string
}) {
  return apiFetch<{ upload_url: string; storage_path: string }>(
    "/videos/upload-url",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
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

export function createJob(body: { video_id: string }) {
  return apiFetch<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getJobStatus(id: string) {
  return apiFetch<Job>(`/jobs/${encodeURIComponent(id)}`)
}

export function getJobResults(id: string) {
  return apiFetch<AnalyticsResult>(
    `/jobs/${encodeURIComponent(id)}/results`
  )
}

export function getAnalytics(jobId: string) {
  return apiFetch<AnalyticsResult>(
    `/analytics/${encodeURIComponent(jobId)}`
  )
}

export function getAnalyticsHistory(floorPlanId: string) {
  return apiFetch<AnalyticsResult[]>(
    `/floor-plans/${encodeURIComponent(floorPlanId)}/analytics`
  )
}

export function getSuggestions(jobId: string) {
  return apiFetch<Suggestion[]>(
    `/jobs/${encodeURIComponent(jobId)}/suggestions`
  )
}

export function compareFloorPlans(body: { floor_plan_ids: string[] }) {
  return apiFetch<unknown>("/floor-plans/compare", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
