import { AlertCircleIcon, CheckCircle2Icon, TrashIcon } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

type CalibrationPoint = {
  camera: [number, number]
  floor_plan: [number, number]
}

type Props = {
  videoFrameUrl: string
  videoWidth: number
  videoHeight: number
  floorPlanImageUrl: string
  onCalibrationChange: (points: CalibrationPoint[]) => void
}

type DraftState = "pick-camera" | "pick-floor"

export function CalibrationEditor({
  videoFrameUrl,
  videoWidth,
  videoHeight,
  floorPlanImageUrl,
  onCalibrationChange,
}: Props) {
  const [points, setPoints] = useState<CalibrationPoint[]>([])
  const [draft, setDraft] = useState<{
    state: DraftState
    camera?: [number, number]
  }>({ state: "pick-camera" })

  const videoRef = useRef<HTMLDivElement>(null)
  const floorRef = useRef<HTMLDivElement>(null)

  const handleVideoClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draft.state !== "pick-camera") return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * videoWidth
      const y = ((e.clientY - rect.top) / rect.height) * videoHeight
      setDraft({ state: "pick-floor", camera: [Math.round(x), Math.round(y)] })
    },
    [draft.state, videoWidth, videoHeight],
  )

  const handleFloorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draft.state !== "pick-floor" || !draft.camera) return
      const rect = e.currentTarget.getBoundingClientRect()
      const img = e.currentTarget.querySelector("img")
      const imgW = img?.naturalWidth ?? 1200
      const imgH = img?.naturalHeight ?? 800
      const x = ((e.clientX - rect.left) / rect.width) * imgW
      const y = ((e.clientY - rect.top) / rect.height) * imgH
      const newPoint: CalibrationPoint = {
        camera: draft.camera,
        floor_plan: [Math.round(x), Math.round(y)],
      }
      const updated = [...points, newPoint]
      setPoints(updated)
      onCalibrationChange(updated)
      setDraft({ state: "pick-camera" })
    },
    [draft, points, onCalibrationChange],
  )

  const removePoint = useCallback(
    (idx: number) => {
      const updated = points.filter((_, i) => i !== idx)
      setPoints(updated)
      onCalibrationChange(updated)
    },
    [points, onCalibrationChange],
  )

  const clearAll = useCallback(() => {
    setPoints([])
    onCalibrationChange([])
    setDraft({ state: "pick-camera" })
  }, [onCalibrationChange])

  const isReady = points.length >= 4

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {isReady ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-500">
            <CheckCircle2Icon className="size-4" />
            {points.length} points — ready for homography
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <AlertCircleIcon className="size-4" />
            {points.length}/4 points minimum — {draft.state === "pick-camera" ? "click a point on the video" : "now click the same point on the floor plan"}
          </span>
        )}
        {points.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <TrashIcon className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Video frame */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Video Frame
          </p>
          <div
            ref={videoRef}
            className="relative cursor-crosshair overflow-hidden rounded-lg border border-border"
            onClick={handleVideoClick}
            style={{ opacity: draft.state === "pick-camera" ? 1 : 0.6 }}
          >
            <img
              src={videoFrameUrl}
              alt="Video frame"
              className="block w-full"
              draggable={false}
            />
            {points.map((p, i) => (
              <div
                key={`vc-${i}`}
                className="pointer-events-none absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                style={{
                  left: `${(p.camera[0] / videoWidth) * 100}%`,
                  top: `${(p.camera[1] / videoHeight) * 100}%`,
                }}
              >
                {i + 1}
              </div>
            ))}
            {draft.state === "pick-floor" && draft.camera && (
              <div
                className="pointer-events-none absolute flex size-5 -translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full border-2 border-primary bg-primary/30 text-[10px] font-bold text-primary-foreground"
                style={{
                  left: `${(draft.camera[0] / videoWidth) * 100}%`,
                  top: `${(draft.camera[1] / videoHeight) * 100}%`,
                }}
              >
                ?
              </div>
            )}
          </div>
        </div>

        {/* Floor plan */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Floor Plan
          </p>
          <div
            ref={floorRef}
            className="relative cursor-crosshair overflow-hidden rounded-lg border border-border"
            onClick={handleFloorClick}
            style={{ opacity: draft.state === "pick-floor" ? 1 : 0.6 }}
          >
            <img
              src={floorPlanImageUrl}
              alt="Floor plan"
              className="block w-full"
              draggable={false}
            />
            {points.map((p, i) => {
              const img = floorRef.current?.querySelector("img")
              const imgW = img?.naturalWidth ?? 1200
              const imgH = img?.naturalHeight ?? 800
              return (
                <div
                  key={`fp-${i}`}
                  className="absolute flex size-5 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground hover:bg-destructive"
                  style={{
                    left: `${(p.floor_plan[0] / imgW) * 100}%`,
                    top: `${(p.floor_plan[1] / imgH) * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    removePoint(i)
                  }}
                >
                  {i + 1}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {points.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Calibration Points
          </p>
          <div className="space-y-1">
            {points.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs text-foreground"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span>
                  Video ({p.camera[0]}, {p.camera[1]}) → Floor (
                  {p.floor_plan[0]}, {p.floor_plan[1]})
                </span>
                <button
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() => removePoint(i)}
                >
                  <TrashIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
