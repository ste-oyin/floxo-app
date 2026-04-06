import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRealtimeJob } from "@/hooks/useRealtimeJob"

const pipeline = [
  "Queued",
  "Detecting",
  "Tracking",
  "Analyzing",
  "Complete",
] as const

function stageIndex(status: string | null) {
  if (!status) return 0
  const s = status.toLowerCase()
  if (s.includes("fail") || s.includes("error")) return 2
  if (s.includes("complete") || s.includes("done")) return 4
  if (s.includes("analyz")) return 3
  if (s.includes("track")) return 2
  if (s.includes("detect")) return 1
  return 0
}

export function JobStatusPage() {
  const { id } = useParams<{ id: string }>()
  const { status, progress_pct, error_message } = useRealtimeJob(id)

  const activeIdx = useMemo(() => stageIndex(status), [status])

  const failed =
    Boolean(error_message) ||
    (status?.toLowerCase().includes("fail") ?? false)

  const complete =
    status?.toLowerCase().includes("complete") ||
    status?.toLowerCase().includes("done")

  const pct = progress_pct ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Processing status
        </h1>
        <p className="text-sm text-muted-foreground">
          Floxo is turning your footage into movement, paths, and KPIs.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Job pipeline</CardTitle>
            <CardDescription>
              Each stage unlocks the next set of models and analytics
            </CardDescription>
          </div>
          <Badge variant={failed ? "destructive" : "secondary"} className="capitalize">
            {failed ? "Failed" : (status ?? "—")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 sm:grid-cols-5">
            {pipeline.map((label, idx) => {
              const reached = !failed && idx <= activeIdx
              const current = !failed && idx === activeIdx
              return (
                <div
                  key={label}
                  className={
                    reached
                      ? current
                        ? "rounded-xl border bg-primary/10 px-3 py-3 text-center shadow-sm ring-1 ring-primary/20"
                        : "rounded-xl border bg-muted/30 px-3 py-3 text-center"
                      : "rounded-xl border border-dashed bg-muted/10 px-3 py-3 text-center text-muted-foreground"
                  }
                >
                  <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-foreground/10">
                    {reached ? (
                      <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium">{label}</p>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall completion</span>
              <span className="tabular-nums">{Math.round(pct)}%</span>
            </div>
            <Progress
              value={pct}
              className="w-full flex-col gap-2 [&_[data-slot=progress-track]]:w-full"
            />
          </div>

          {failed ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="mt-0.5 size-5 text-red-600 dark:text-red-400" />
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-medium">Processing failed</p>
                  <p className="text-sm text-muted-foreground">
                    {error_message ?? "The job stopped unexpectedly."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {complete && id ? (
            <div className="flex flex-wrap gap-2">
              <Link to={`/analysis/results/${id}`}>
                <Button>View results</Button>
              </Link>
            </div>
          ) : null}

          {!failed && !complete ? (
            <p className="text-xs text-muted-foreground">
              This page updates automatically while the job runs.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
