import { FlameIcon, ImageIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { FloorPlanCanvas } from "@/components/floor-plan/FloorPlanCanvas"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { assetUrl } from "@/lib/analytics-display"
import { getAnalyticsHistory, getFloorPlans, setupWorkspace } from "@/lib/api"
import type { AnalyticsResult, FloorPlan } from "@/types"

export function HeatmapViewerPage() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([])
  const [selectedFpId, setSelectedFpId] = useState<string>("")
  const [analytics, setAnalytics] = useState<AnalyticsResult[]>([])
  const [opacity, setOpacity] = useState(55)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        await setupWorkspace()
        const fps = await getFloorPlans()
        setFloorPlans(fps)
        if (fps.length > 0) {
          setSelectedFpId(fps[0].id)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedFpId) {
      setAnalytics([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const history = await getAnalyticsHistory(selectedFpId)
        if (!cancelled) setAnalytics(history)
      } catch {
        if (!cancelled) setAnalytics([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedFpId])

  const selectedFp = floorPlans.find((fp) => fp.id === selectedFpId)
  const latestAnalytics = analytics.length > 0 ? analytics[0] : null
  const imageUrl = selectedFp ? assetUrl(selectedFp.image_path) : undefined
  const hmUrl = latestAnalytics?.heatmap_image_path
    ? assetUrl(latestAnalytics.heatmap_image_path)
    : undefined

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Heatmap Viewer
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          View heatmaps overlaid on your floor plans. Select a floor plan to see
          the latest analysis results.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full max-w-xs space-y-1.5">
          <Label>Floor plan</Label>
          <Select value={selectedFpId} onValueChange={(v) => { if (v) setSelectedFpId(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a floor plan" />
            </SelectTrigger>
            <SelectContent>
              {floorPlans.map((fp) => (
                <SelectItem key={fp.id} value={fp.id}>
                  {fp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          <Label>Heatmap opacity: {opacity}%</Label>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[opacity]}
            onValueChange={(v) => setOpacity(Array.isArray(v) ? v[0] : v)}
          />
        </div>
      </div>

      {!selectedFp ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FlameIcon className="size-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              No floor plans found. Create a floor plan first to see heatmaps.
            </p>
          </CardContent>
        </Card>
      ) : !latestAnalytics ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FlameIcon className="size-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              No analysis data yet. Upload a video for this floor plan to
              generate a heatmap.
            </p>
          </CardContent>
        </Card>
      ) : imageUrl ? (
        <FloorPlanCanvas
          image_url={imageUrl}
          heatmap_url={hmUrl}
          heatmap_opacity={opacity / 100}
          className="shadow-sm"
        />
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ImageIcon className="size-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              This floor plan has no image to display.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
