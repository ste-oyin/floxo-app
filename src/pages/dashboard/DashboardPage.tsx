import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRightIcon,
  BarChart3Icon,
  LayoutGridIcon,
  Loader2,
  MapIcon,
  SparklesIcon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type DashboardStats, getDashboardStats, setupWorkspace } from "@/lib/api"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export function DashboardPage() {
  const { user } = useSupabaseAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function init() {
      try {
        await setupWorkspace()
        const s = await getDashboardStats()
        if (active) setStats(s)
      } catch {
        // API may not be reachable yet
      } finally {
        if (active) setLoading(false)
      }
    }
    init()
    return () => { active = false }
  }, [])

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there"

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <SparklesIcon className="size-3.5" />
          Floxo workspace
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track visitor movement, surface opportunities, and keep every floor
          plan aligned with what the camera sees.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : stats && (stats.floor_plans > 0 || stats.total_videos > 0) ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Floor plans" value={stats.floor_plans} icon={<MapIcon className="size-4" />} />
          <StatCard label="Videos uploaded" value={stats.total_videos} icon={<VideoIcon className="size-4" />} />
          <StatCard label="Pending jobs" value={stats.pending_jobs} icon={<Loader2 className="size-4" />} />
          <StatCard label="Completed analyses" value={stats.completed_analyses} icon={<BarChart3Icon className="size-4" />} />
        </div>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapIcon className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No floor plans yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first floor plan to start analysing foot traffic and
              optimising your layout.
            </p>
            <Link
              to="/floor-plans"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create floor plan
              <ArrowRightIcon className="size-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Jump into the workflows you use most</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              to="/analysis/upload"
              icon={<UploadCloudIcon className="size-5" />}
              title="Upload video"
              description="Calibrate against a floor plan and run analysis"
              accent
            />
            <QuickAction
              to="/floor-plans"
              icon={<LayoutGridIcon className="size-5" />}
              title="View floor plans"
              description="Browse spaces, metrics, and AI suggestions"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Getting started</CardTitle>
            <CardDescription>Follow these steps to run your first analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Step num={1} title="Create a floor plan" description="Upload an image of your store layout" done={!!stats && stats.floor_plans > 0} />
            <Step num={2} title="Upload security footage" description="Record a video of foot traffic in your store" done={!!stats && stats.total_videos > 0} />
            <Step num={3} title="Run analysis" description="Our AI extracts heatmaps, paths, and dwell times" done={!!stats && stats.completed_analyses > 0} />
            <Step num={4} title="Review suggestions" description="Get actionable layout recommendations" done={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}

function QuickAction({
  to,
  icon,
  title,
  description,
  accent,
}: {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  accent?: boolean
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`inline-flex size-10 items-center justify-center rounded-xl ${
            accent ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
          }`}
        >
          {icon}
        </div>
        <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  )
}

function Step({
  num,
  title,
  description,
  done,
}: {
  num: number
  title: string
  description: string
  done: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
      <span
        className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? "\u2713" : num}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${done ? "line-through opacity-60" : ""}`}>{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
