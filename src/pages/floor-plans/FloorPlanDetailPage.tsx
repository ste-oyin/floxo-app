import { ArrowLeftIcon, GitCompareArrowsIcon, UploadCloudIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { MetricCard } from "@/components/analysis/MetricCard"
import { SuggestionCard } from "@/components/analysis/SuggestionCard"
import { FloorPlanCanvas } from "@/components/floor-plan/FloorPlanCanvas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { assetUrl, metricsFromJson } from "@/lib/analytics-display"
import {
  getAnalyticsHistory,
  getFloorPlan,
  getFloorPlans,
  getSuggestions,
} from "@/lib/api"
import type { AnalyticsResult, FloorPlan, Suggestion } from "@/types"

function formatWhen(iso: string | null) {
  if (!iso) return "No analysis yet"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function FloorPlanDetailPage() {
  const { id } = useParams()
  const [fp, setFp] = useState<FloorPlan | null>(null)
  const [latest, setLatest] = useState<AnalyticsResult | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [others, setOthers] = useState<FloorPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const [plan, history, all] = await Promise.all([
          getFloorPlan(id),
          getAnalyticsHistory(id),
          getFloorPlans(),
        ])
        if (cancelled) return
        setFp(plan)
        const sorted = [...history].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        const newest = sorted[0] ?? null
        setLatest(newest)
        setOthers(all.filter((x) => x.id !== id))
        if (newest) {
          const sug = await getSuggestions(newest.job_id)
          if (!cancelled) setSuggestions(sug)
        } else {
          setSuggestions([])
        }
      } catch {
        if (!cancelled) {
          setFp(null)
          setLatest(null)
          setSuggestions([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const compareHref = useMemo(() => {
    if (!id) return "/floor-plans/compare"
    const other = others[0]?.id
    const qs = new URLSearchParams({ a: id })
    if (other) qs.set("b", other)
    return `/floor-plans/compare?${qs.toString()}`
  }, [id, others])

  const floorImageUrl = fp ? assetUrl(fp.image_path) : undefined
  const heatmapUrl = latest?.heatmap_image_path
    ? assetUrl(latest.heatmap_image_path)
    : undefined

  if (!id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        Missing floor plan id.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-[420px] animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!fp) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">Floor plan not found.</p>
        <Link to="/floor-plans">
          <Button variant="secondary">
            <ArrowLeftIcon />
            Back to floor plans
          </Button>
        </Link>
      </div>
    )
  }

  const metricCards = latest
    ? metricsFromJson(latest.metrics_json)
    : []

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/floor-plans"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" />
              Floor plans
            </Link>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  {fp.name}
                </h1>
                <Badge variant="secondary">Live</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Location{" "}
                <span className="font-mono text-xs">{fp.location_id}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/analysis/upload?floorPlanId=${encodeURIComponent(fp.id)}`}>
              <Button>
                <UploadCloudIcon />
                Upload new video
              </Button>
            </Link>
            <Link to={compareHref}>
              <Button variant="secondary">
                <GitCompareArrowsIcon />
                Compare
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="paths">Paths</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Floor plan</CardTitle>
                  <CardDescription>
                    Visual baseline used for calibration and overlays
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {floorImageUrl ? (
                    <FloorPlanCanvas image_url={floorImageUrl} className="shadow-sm" />
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                      No image URL available for this plan.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                  <CardDescription>Latest analysis snapshot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Latest analysis
                    </p>
                    <p className="mt-2 text-base font-medium">
                      {formatWhen(latest?.created_at ?? null)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Coverage
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Metrics reflect the most recent successful processing run for
                      this floor plan.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Next step
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload a new video after layout changes to refresh the
                      baseline.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="heatmap" className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Heatmap overlay</CardTitle>
                <CardDescription>
                  Density highlights layered on your floor plan image
                </CardDescription>
              </CardHeader>
              <CardContent>
                {floorImageUrl && heatmapUrl ? (
                  <FloorPlanCanvas
                    image_url={floorImageUrl}
                    heatmap_url={heatmapUrl}
                    heatmap_opacity={0.55}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                    No heatmap image is available yet. Run an analysis to generate
                    one.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paths" className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Path visualization</CardTitle>
                <CardDescription>
                  Trajectory overlays will appear here after processing completes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                  <div className="max-w-md space-y-2">
                    <p className="text-sm font-medium">Coming soon</p>
                    <p className="text-sm text-muted-foreground">
                      Interactive path traces and directional arrows will render on
                      top of your floor plan for fast qualitative review.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            {latest && metricCards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {metricCards.map((m) => (
                  <MetricCard key={m.name} {...m} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">No metrics yet</CardTitle>
                  <CardDescription>
                    Run an analysis to populate this grid with calibrated values.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6 space-y-4">
            {suggestions.length ? (
              suggestions.map((s, i) => (
                <SuggestionCard key={`${s.title}-${i}`} {...s} />
              ))
            ) : (
              <Card className="border-dashed shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">No suggestions yet</CardTitle>
                  <CardDescription>
                    After your next analysis run, Floxo will propose targeted
                    layout improvements here.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
