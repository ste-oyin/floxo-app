import { useEffect, useMemo, useState } from "react"
import { CheckIcon } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { FloorPlanUploader } from "@/components/upload/FloorPlanUploader"
import { VideoUploader } from "@/components/upload/VideoUploader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  createFloorPlan,
  createJob,
  getFloorPlans,
  getUploadUrl,
  registerVideo,
} from "@/lib/api"
import type { FloorPlan } from "@/types"

const steps = [
  "Floor plan",
  "Video",
  "Calibration",
  "Submit",
] as const

async function putToSignedUrl(url: string, file: File) {
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  })
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }
}

export function UploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<FloorPlan[]>([])
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<"pick" | "create">("pick")
  const [selectedId, setSelectedId] = useState<string>("")
  const [newName, setNewName] = useState("")
  const [newImage, setNewImage] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await getFloorPlans()
        if (cancelled) return
        setItems(data)
        const fp = searchParams.get("floorPlanId")
        if (fp && data.some((x) => x.id === fp)) setSelectedId(fp)
        else if (data[0]) setSelectedId(data[0].id)
      } catch {
        if (!cancelled) setItems([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const activeFloorPlanId = useMemo(() => {
    if (mode === "create") return null
    return selectedId || null
  }, [mode, selectedId])

  const progressPct = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step]
  )

  const locationIdForCreate = items[0]?.location_id

  async function ensureFloorPlanId(): Promise<string | null> {
    if (mode === "pick") return selectedId || null
    if (!newName.trim() || !newImage) return null
    if (!locationIdForCreate) {
      throw new Error(
        "Add at least one floor plan first so a location can be selected for new plans."
      )
    }
    const up = await getUploadUrl({
      filename: newImage.name,
      content_type: newImage.type || "image/png",
    })
    await putToSignedUrl(up.upload_url, newImage)
    const created = await createFloorPlan({
      location_id: locationIdForCreate,
      name: newName.trim(),
      image_path: up.storage_path,
      metadata_json: {},
    })
    setItems((prev) => [created, ...prev])
    setSelectedId(created.id)
    setMode("pick")
    return created.id
  }

  async function handleSubmit() {
    setFormError(null)
    const fpId = activeFloorPlanId ?? (await ensureFloorPlanId())
    if (!fpId || !videoFile) return
    setSubmitting(true)
    try {
      const videoUp = await getUploadUrl({
        filename: videoFile.name,
        content_type: videoFile.type || "video/mp4",
      })
      await putToSignedUrl(videoUp.upload_url, videoFile)
      const video = await registerVideo({
        floor_plan_id: fpId,
        storage_path: videoUp.storage_path,
        duration_seconds: null,
      })
      const job = await createJob({ video_id: video.id })
      navigate(`/analysis/jobs/${encodeURIComponent(job.id)}`)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const canCreateNew = Boolean(locationIdForCreate)

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Upload video
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect a floor plan, add footage, and send it through the Floxo
          processing pipeline.
        </p>
      </div>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <span className="tabular-nums">{progressPct}%</span>
        </div>
        <Progress
          value={progressPct}
          className="w-full flex-col gap-2 [&_[data-slot=progress-track]]:w-full"
        />
        <div className="grid grid-cols-4 gap-2">
          {steps.map((label, idx) => {
            const done = idx < step
            const active = idx === step
            return (
              <div
                key={label}
                className={
                  active
                    ? "rounded-lg border bg-card px-2 py-2 text-center text-xs font-medium shadow-sm ring-1 ring-foreground/10"
                    : done
                      ? "rounded-lg border border-transparent bg-muted/40 px-2 py-2 text-center text-xs text-muted-foreground"
                      : "rounded-lg border border-dashed bg-muted/10 px-2 py-2 text-center text-xs text-muted-foreground"
                }
              >
                <div className="flex items-center justify-center gap-1">
                  {done ? (
                    <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                  <span className="line-clamp-2">{label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {step === 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select or create a floor plan</CardTitle>
            <CardDescription>
              The floor plan anchors every overlay and metric you will see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === "pick" ? "default" : "secondary"}
                onClick={() => setMode("pick")}
              >
                Choose existing
              </Button>
              <Button
                type="button"
                variant={mode === "create" ? "default" : "secondary"}
                onClick={() => setMode("create")}
                disabled={!canCreateNew}
              >
                Create new
              </Button>
            </div>
            {mode === "create" && !canCreateNew ? (
              <p className="text-sm text-muted-foreground">
                Create a floor plan in an existing location first. After that,
                you can add additional plans here.
              </p>
            ) : null}

            {mode === "pick" ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Floor plan
                </p>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {items.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Name</p>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. North wing showroom"
                  />
                </div>
                <FloorPlanUploader onUpload={(file) => setNewImage(file)} />
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              onClick={() => setStep(1)}
              disabled={
                mode === "pick"
                  ? !selectedId
                  : !newName.trim() || !newImage || !canCreateNew
              }
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Upload video</CardTitle>
            <CardDescription>
              Footage is processed to extract movement and engagement signals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploader onUpload={(file) => setVideoFile(file)} />
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(2)} disabled={!videoFile}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Calibration</CardTitle>
            <CardDescription>
              Align the camera view with your floor plan geometry
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
            Calibration tool coming soon, using auto-calibration for now.
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Submit for processing</CardTitle>
            <CardDescription>
              Your job will move through detection, tracking, and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs font-medium text-foreground">Summary</p>
              <ul className="mt-3 space-y-2">
                <li>
                  Floor plan:{" "}
                  <span className="text-foreground">
                    {mode === "create" && newName.trim()
                      ? newName.trim()
                      : items.find((x) => x.id === selectedId)?.name ?? "—"}
                  </span>
                </li>
                <li>
                  Video:{" "}
                  <span className="text-foreground">
                    {videoFile ? videoFile.name : "—"}
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={
                submitting ||
                !videoFile ||
                (mode === "pick" ? !selectedId : !newName.trim() || !newImage)
              }
            >
              {submitting ? "Submitting…" : "Start processing"}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  )
}
