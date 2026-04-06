import { Link } from "react-router-dom"
import {
  ActivityIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  Clock3Icon,
  LayoutGridIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const stats = {
  floorPlans: 12,
  pendingJobs: 3,
  completedAnalyses: 28,
}

const recent = [
  { id: "1", label: "Showroom heatmap refreshed", time: "2h ago" },
  { id: "2", label: "New video uploaded for Atrium", time: "Yesterday" },
  { id: "3", label: "Comparison report generated", time: "3 days ago" },
]

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <SparklesIcon className="size-3.5" />
          Floxo workspace
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track visitor movement, surface opportunities, and keep every floor
          plan aligned with what the camera sees.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Floor plans</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.floorPlans}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Spaces connected to your workspace
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Pending jobs</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.pendingJobs}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Videos currently processing
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Completed analyses</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.completedAnalyses}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Finished insight runs across all plans
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Jump into the workflows you use most</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/analysis/upload"
              className="group rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UploadCloudIcon className="size-5" />
                </div>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-medium">Upload video</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Calibrate against a floor plan and run analysis
              </p>
            </Link>
            <Link
              to="/floor-plans"
              className="group rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <LayoutGridIcon className="size-5" />
                </div>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-medium">View floor plans</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Browse spaces, metrics, and AI suggestions
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>Latest updates across your workspace</CardDescription>
            </div>
            <Badge variant="secondary" className="font-normal">
              Placeholder
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3Icon className="size-3.5" />
                      {item.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ActivityIcon className="size-3.5" />
                      Workspace
                    </span>
                  </div>
                </div>
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              </div>
            ))}
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <BarChart3Icon className="size-4" />
                Tip
              </div>
              <p className="mt-2">
                Pin a baseline analysis, then compare after layout changes to
                quantify impact.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
