import {
  ImageIcon,
  Loader2,
  MapIcon,
  MapPinIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  createFloorPlan,
  getFloorPlans,
  setupWorkspace,
  uploadFloorPlanImage,
} from "@/lib/api"
import type { FloorPlan } from "@/types"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(iso))
}

function planImageSrc(fp: FloorPlan): string | undefined {
  if (!fp.image_path) return undefined
  if (
    fp.image_path.startsWith("http://") ||
    fp.image_path.startsWith("https://")
  ) {
    return fp.image_path
  }
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) return undefined
  return `${base}/storage/v1/object/public/${fp.image_path}`
}

export function FloorPlansPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<FloorPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await setupWorkspace()
      const data = await getFloorPlans()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load floor plans")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleCreated(fp: FloorPlan) {
    setDialogOpen(false)
    navigate(`/floor-plans/${fp.id}`)
  }

  function handleBuildFromScratch() {
    setDialogOpen(false)
    navigate("/floor-plans/new")
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Floor plans
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every space you measure, with the latest analysis snapshot surfaced
            on each card.
          </p>
        </div>
        <Button size="lg" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="size-4" />
          New floor plan
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <CreateFloorPlanDialog onCreated={handleCreated} onBuildFromScratch={handleBuildFromScratch} />
        </Dialog>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center" role="alert">
          <p className="text-sm text-destructive">Something went wrong loading your floor plans.</p>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapIcon className="size-7" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">
              No floor plans yet
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Upload a floor plan image of your store to start analysing foot
              traffic patterns and get AI-powered layout suggestions.
            </p>
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-4" />
              Create your first floor plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((fp) => {
            const src = planImageSrc(fp)
            return (
              <Link key={fp.id} to={`/floor-plans/${fp.id}`} className="group">
                <Card className="h-full overflow-hidden shadow-sm transition-colors hover:bg-muted/20">
                  <div className="relative aspect-[4/3] bg-muted">
                    {src ? (
                      <img
                        src={src}
                        alt={fp.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-10 opacity-30" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="space-y-1.5 pb-2">
                    <CardTitle className="text-base leading-snug group-hover:underline">
                      {fp.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPinIcon className="size-3.5" />
                    Created {formatDate(fp.created_at)}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

type DialogMode = "choose" | "upload"

function CreateFloorPlanDialog({
  onCreated,
  onBuildFromScratch,
}: {
  onCreated: (fp: FloorPlan) => void
  onBuildFromScratch: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<DialogMode>("choose")
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  function clearFile() {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !file) return
    setSubmitting(true)
    setError(null)
    try {
      const workspace = await setupWorkspace()
      const locationId = workspace.locations[0]?.id
      if (!locationId) throw new Error("No location available")

      const { image_path } = await uploadFloorPlanImage(file)
      const fp = await createFloorPlan({
        location_id: locationId,
        name: name.trim(),
        image_path,
      })
      onCreated(fp)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create floor plan")
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === "choose") {
    return (
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New floor plan</DialogTitle>
          <DialogDescription>
            Choose how you'd like to create your floor plan.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
            onClick={onBuildFromScratch}
          >
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Build from scratch</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Draw walls, zones and place fixtures using our editor
              </p>
            </div>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
            onClick={() => setMode("upload")}
          >
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload image</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload an existing floor plan image of your store
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    )
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Upload floor plan image</DialogTitle>
          <DialogDescription>
            Upload an image of your store layout and give it a name.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="fp-name"
              className="text-sm font-medium leading-none"
            >
              Name
            </label>
            <Input
              id="fp-name"
              placeholder="e.g. Main showroom, Aisle A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Floor plan image
            </label>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-56 w-full rounded-lg border object-contain bg-muted"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 backdrop-blur hover:bg-background"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <UploadIcon className="size-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload an image
                </span>
                <span className="text-xs text-muted-foreground/60">
                  PNG, JPG, or SVG
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter className="mt-6">
          <Button variant="ghost" type="button" onClick={() => setMode("choose")}>
            Back
          </Button>
          <Button type="submit" disabled={submitting || !name.trim() || !file}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            {submitting ? "Creating..." : "Create floor plan"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
