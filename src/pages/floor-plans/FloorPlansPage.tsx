import { MapPinIcon, PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getFloorPlans } from "@/lib/api"
import type { FloorPlan } from "@/types"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function planImageSrc(fp: FloorPlan): string | undefined {
  if (
    fp.image_path.startsWith("http://") ||
    fp.image_path.startsWith("https://")
  ) {
    return fp.image_path
  }
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "")
  if (!base) return undefined
  return `${base}/files/${encodeURIComponent(fp.image_path)}`
}

export function FloorPlansPage() {
  const [items, setItems] = useState<FloorPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getFloorPlans()
        if (!cancelled) setItems(data)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load floor plans")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
        <Link to="/analysis/upload">
          <Button size="lg">
            <PlusIcon />
            Create new
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No floor plans yet</CardTitle>
            <CardDescription>
              Upload a floor plan image and connect your first video to start
              generating insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/analysis/upload">
              <Button>
                <PlusIcon />
                Create a floor plan
              </Button>
            </Link>
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
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                        No preview
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  </div>
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base leading-snug group-hover:underline">
                      {fp.name}
                    </CardTitle>
                    <CardDescription className="flex items-start gap-2">
                      <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                      <span className="font-mono text-xs">{fp.location_id}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Created: {formatDate(fp.created_at)}
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
