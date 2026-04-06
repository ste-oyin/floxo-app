import { GitCompareArrowsIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { compareFloorPlans, getFloorPlans } from "@/lib/api"
import type { FloorPlan } from "@/types"

type ComparisonMetricRow = {
  key: string
  label: string
  left_value: number
  right_value: number
  unit: string
  higher_is_better: boolean
}

type CompareApiShape = {
  metrics?: ComparisonMetricRow[]
}

function thumbUrl(fp: FloorPlan): string | undefined {
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

function pctChange(before: number, after: number) {
  if (before === 0) return after === 0 ? 0 : 100
  return ((after - before) / Math.abs(before)) * 100
}

function formatValue(row: ComparisonMetricRow, side: "left" | "right") {
  const v = side === "left" ? row.left_value : row.right_value
  if (row.unit === "%") return `${Math.round(v)}%`
  if (row.unit === "s") return `${Math.round(v)}s`
  if (row.unit === "visitors") return Math.round(v).toLocaleString()
  return v.toFixed(2)
}

export function FloorPlanComparePage() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<FloorPlan[]>([])
  const [leftId, setLeftId] = useState<string>("")
  const [rightId, setRightId] = useState<string>("")
  const [rows, setRows] = useState<ComparisonMetricRow[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const data = await getFloorPlans()
      if (cancelled) return
      setItems(data)
      const a = searchParams.get("a")
      const b = searchParams.get("b")
      const hasA = a && data.some((x) => x.id === a)
      const hasB = b && data.some((x) => x.id === b)
      if (hasA) setLeftId(a)
      else if (data[0]) setLeftId(data[0].id)
      if (hasB) setRightId(b)
      else if (data[1]) setRightId(data[1].id)
      else if (data[0]) setRightId(data[0].id)
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  useEffect(() => {
    if (!leftId || !rightId) return
    let cancelled = false
    void (async () => {
      try {
        const res = (await compareFloorPlans({
          floor_plan_ids: [leftId, rightId],
        })) as CompareApiShape
        if (!cancelled) setRows(res.metrics ?? [])
      } catch {
        if (!cancelled) setRows([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [leftId, rightId])

  const left = useMemo(
    () => items.find((x) => x.id === leftId) ?? null,
    [items, leftId]
  )
  const right = useMemo(
    () => items.find((x) => x.id === rightId) ?? null,
    [items, rightId]
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <GitCompareArrowsIcon className="size-4" />
          Compare
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Floor plan comparison
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Select two plans and review directional changes across the core KPIs.
          Green indicates improvement; red indicates regression.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Baseline</CardTitle>
            <CardDescription>Typically the older layout or control space</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={leftId}
              onValueChange={(v) => setLeftId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a floor plan" />
              </SelectTrigger>
              <SelectContent>
                {items.map((fp) => (
                  <SelectItem key={fp.id} value={fp.id}>
                    {fp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {left ? (
              <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
                {thumbUrl(left) ? (
                  <img
                    src={thumbUrl(left)}
                    alt=""
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Comparison</CardTitle>
            <CardDescription>The new layout, campaign window, or variant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={rightId}
              onValueChange={(v) => setRightId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a floor plan" />
              </SelectTrigger>
              <SelectContent>
                {items.map((fp) => (
                  <SelectItem key={fp.id} value={fp.id}>
                    {fp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {right ? (
              <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
                {thumbUrl(right) ? (
                  <img
                    src={thumbUrl(right)}
                    alt=""
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Metric comparison</CardTitle>
          <CardDescription>
            Before / after values with percent change relative to baseline
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="border-b py-3 pr-4 font-medium">Metric</th>
                <th className="border-b py-3 pr-4 font-medium">Before</th>
                <th className="border-b py-3 pr-4 font-medium">After</th>
                <th className="border-b py-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const delta = pctChange(row.left_value, row.right_value)
                const improved =
                  row.higher_is_better ? delta > 0 : delta < 0
                const flat = Math.abs(delta) < 0.0001
                return (
                  <tr key={row.key} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{row.label}</td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                      {formatValue(row, "left")}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {formatValue(row, "right")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            flat
                              ? "tabular-nums text-muted-foreground"
                              : improved
                                ? "tabular-nums text-emerald-600 dark:text-emerald-400"
                                : "tabular-nums text-red-600 dark:text-red-400"
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(1)}%
                        </span>
                        {!flat ? (
                          <Badge variant={improved ? "secondary" : "destructive"}>
                            {improved ? "Improvement" : "Regression"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Flat</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
