import Konva from "konva"
import { FlameIcon, ImageIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Layer, Line, Rect, Stage } from "react-konva"

import { FIXTURE_PRESETS } from "@/components/floor-plan/fixtures"
import type { FloorPlanData } from "@/components/floor-plan/types"
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
import { getAnalyticsHistory, getFloorPlans, setupWorkspace } from "@/lib/api"
import type { AnalyticsResult, FloorPlan } from "@/types"

function planImageUrl(fp: FloorPlan): string | undefined {
  if (!fp.image_path) return undefined
  if (fp.image_path.startsWith("http")) return fp.image_path
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) return undefined
  return `${base}/storage/v1/object/public/${fp.image_path}`
}

function heatmapUrl(result: AnalyticsResult): string | undefined {
  const path = result.heatmap_image_path
  if (!path) return undefined
  if (path.startsWith("http")) return path
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) return undefined
  return `${base}/storage/v1/object/public/${path}`
}

function hasEditorData(fp: FloorPlan): FloorPlanData | null {
  const meta = fp.metadata_json as FloorPlanData | undefined
  if (meta?.canvas && Array.isArray(meta.walls)) return meta
  return null
}

export function HeatmapViewerPage() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([])
  const [selectedFpId, setSelectedFpId] = useState<string>("")
  const [analytics, setAnalytics] = useState<AnalyticsResult[]>([])
  const [opacity, setOpacity] = useState(55)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const selectedFp = floorPlans.find((fp) => fp.id === selectedFpId)
  const latestAnalytics = analytics.length > 0 ? analytics[0] : null
  const editorData = selectedFp ? hasEditorData(selectedFp) : null
  const imageUrl = selectedFp ? planImageUrl(selectedFp) : undefined
  const hmUrl = latestAnalytics ? heatmapUrl(latestAnalytics) : undefined

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
          <Select value={selectedFpId} onValueChange={setSelectedFpId}>
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
            onValueChange={([v]) => setOpacity(v)}
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
      ) : editorData ? (
        <EditorHeatmapOverlay
          data={editorData}
          heatmapUrl={hmUrl}
          opacity={opacity / 100}
          containerRef={containerRef}
          containerSize={containerSize}
        />
      ) : imageUrl ? (
        <ImageHeatmapOverlay
          imageUrl={imageUrl}
          heatmapUrl={hmUrl}
          opacity={opacity / 100}
        />
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ImageIcon className="size-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              This floor plan has no image or editor data to display.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ImageHeatmapOverlay({
  imageUrl,
  heatmapUrl,
  opacity,
}: {
  imageUrl: string
  heatmapUrl?: string
  opacity: number
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-muted">
      <img
        src={imageUrl}
        alt="Floor plan"
        className="block h-auto max-h-[70vh] w-full object-contain"
      />
      {heatmapUrl && (
        <img
          src={heatmapUrl}
          alt="Heatmap overlay"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ opacity }}
        />
      )}
    </div>
  )
}

function EditorHeatmapOverlay({
  data,
  heatmapUrl,
  opacity,
  containerRef,
  containerSize,
}: {
  data: FloorPlanData
  heatmapUrl?: string
  opacity: number
  containerRef: React.RefObject<HTMLDivElement | null>
  containerSize: { width: number; height: number }
}) {
  const [heatmapImage, setHeatmapImage] = useState<HTMLImageElement | null>(
    null
  )

  useEffect(() => {
    if (!heatmapUrl) {
      setHeatmapImage(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = heatmapUrl
    img.onload = () => setHeatmapImage(img)
  }, [heatmapUrl])

  const scale = useMemo(() => {
    const sx = containerSize.width / data.canvas.width
    const sy = (containerSize.height || 600) / data.canvas.height
    return Math.min(sx, sy, 1)
  }, [containerSize, data.canvas])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border bg-white"
      style={{
        height: data.canvas.height * scale,
      }}
    >
      <Stage
        width={data.canvas.width * scale}
        height={data.canvas.height * scale}
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={data.canvas.width}
            height={data.canvas.height}
            fill="#ffffff"
          />

          {data.zones.map((zone) => (
            <Line
              key={zone.id}
              points={zone.points}
              closed
              fill={zone.color + "30"}
              stroke={zone.color}
              strokeWidth={2}
            />
          ))}

          {data.walls.map((wall) => (
            <Line
              key={wall.id}
              points={wall.points}
              stroke="#1e293b"
              strokeWidth={wall.thickness}
              lineCap="round"
            />
          ))}

          {data.fixtures.map((fixture) => {
            const preset = FIXTURE_PRESETS.find((p) => p.type === fixture.type)
            const fill = preset?.color ?? "#94a3b8"
            return (
              <Rect
                key={fixture.id}
                x={fixture.x}
                y={fixture.y}
                width={fixture.width}
                height={fixture.height}
                rotation={fixture.rotation}
                fill={fill + "CC"}
                stroke={fill}
                strokeWidth={1.5}
                cornerRadius={4}
              />
            )
          })}
        </Layer>
      </Stage>

      {heatmapUrl && (
        <img
          src={heatmapUrl}
          alt="Heatmap overlay"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ opacity }}
        />
      )}
    </div>
  )
}
