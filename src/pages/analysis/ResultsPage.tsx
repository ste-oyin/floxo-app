import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import { MetricCard } from "@/components/analysis/MetricCard"
import { SuggestionCard } from "@/components/analysis/SuggestionCard"
import { FloorPlanCanvas } from "@/components/floor-plan/FloorPlanCanvas"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { assetUrl, metricsFromJson } from "@/lib/analytics-display"
import { getFloorPlan, getJobResults, getSuggestions } from "@/lib/api"
import type { AnalyticsResult, FloorPlan, Suggestion } from "@/types"

export function ResultsPage() {
  const { id: jobId } = useParams<{ id: string }>()
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await getJobResults(jobId)
        if (cancelled) return
        const result = Array.isArray(results) ? results[0] ?? null : results
        setAnalytics(result)

        if (result?.floor_plan_id) {
          const [fp, sug] = await Promise.all([
            getFloorPlan(result.floor_plan_id),
            getSuggestions(result.floor_plan_id).catch(() => [] as Suggestion[]),
          ])
          if (!cancelled) {
            setFloorPlan(fp)
            setSuggestions(sug)
          }
        } else {
          setFloorPlan(null)
          setSuggestions([])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load results")
          setAnalytics(null)
          setSuggestions([])
          setFloorPlan(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [jobId])

  const floorSrc =
    floorPlan && assetUrl(floorPlan.image_path)
      ? assetUrl(floorPlan.image_path)
      : undefined
  const heatmapSrc = analytics?.heatmap_image_path
    ? assetUrl(analytics.heatmap_image_path)
    : undefined

  const metricCards = analytics
    ? metricsFromJson(analytics.metrics_json)
    : []

  if (!jobId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        Missing job id.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-[420px] animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <p className="text-sm text-destructive" role="alert">
          {error ?? "No analytics for this job yet."}
        </p>
        <Link
          to={floorPlan ? `/floor-plans/${floorPlan.id}` : "/floor-plans"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to floor plan
        </Link>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              to={`/floor-plans/${analytics.floor_plan_id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" />
              Back to floor plan
            </Link>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Analysis results
            </h1>
            <p className="text-sm text-muted-foreground">
              Job{" "}
              <span className="font-mono text-xs text-foreground">{jobId}</span>
            </p>
          </div>
          <Button type="button" variant="secondary" disabled>
            Export
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Heatmap</CardTitle>
            <CardDescription>
              Density and engagement layered on your calibrated floor plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {floorSrc && heatmapSrc ? (
              <FloorPlanCanvas
                image_url={floorSrc}
                heatmap_url={heatmapSrc}
                heatmap_opacity={0.55}
              />
            ) : floorSrc ? (
              <FloorPlanCanvas image_url={floorSrc} className="shadow-sm" />
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                Heatmap image not available for this run.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Metrics
          </h2>
          {metricCards.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metricCards.map((m) => (
                <MetricCard key={m.name} {...m} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">No metric values</CardTitle>
                <CardDescription>
                  The analytics payload did not include metric fields for this
                  job.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Suggestions
          </h2>
          {suggestions.length ? (
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <SuggestionCard key={`${s.title}-${i}`} {...s} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">No suggestions</CardTitle>
                <CardDescription>
                  Suggestions will appear when the model flags actionable layout
                  opportunities.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
