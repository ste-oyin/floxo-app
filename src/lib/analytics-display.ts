export function assetUrl(path: string): string | undefined {
  if (!path) return undefined
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "")
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${path}`
  }
  const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "")
  if (apiBase) {
    return `${apiBase}/files/${encodeURIComponent(path)}`
  }
  return undefined
}

type MetricSummary = {
  name: string
  value: string
  unit: string
  description: string
  impact: string
  action: string
}

function safeNum(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback
}

function safeLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0
}

export function metricsFromJson(
  metrics: Record<string, unknown>,
): MetricSummary[] {
  const out: MetricSummary[] = []

  const paths = metrics.paths as any
  if (paths) {
    const tracks = Array.isArray(paths) ? paths : paths?.tracks ?? paths?.paths
    const count = safeLen(tracks)
    out.push({
      name: "Total Paths",
      value: count.toLocaleString(),
      unit: "tracks",
      description: "Number of individual trajectories detected.",
      impact: "Higher counts indicate heavier foot traffic.",
      action: "Compare across time periods to spot trends.",
    })
    if (count > 0 && Array.isArray(tracks)) {
      const avgLen =
        tracks.reduce((s: number, t: any) => {
          const pts = t?.points ?? t
          return s + safeLen(pts)
        }, 0) / count
      out.push({
        name: "Avg Path Length",
        value: Math.round(avgLen).toLocaleString(),
        unit: "points",
        description: "Average number of tracked waypoints per path.",
        impact: "Longer paths suggest more browsing behavior.",
        action: "Identify short paths that may indicate confusion.",
      })
    }
  }

  const congestion = metrics.congestion as any
  if (congestion) {
    const peak = safeNum(congestion.global_peak_count)
    const cells = congestion.cells
    const congestedCount = Array.isArray(cells)
      ? cells.filter((c: any) => safeNum(c.congestion_score) > 15).length
      : 0
    out.push({
      name: "Peak Congestion",
      value: peak.toLocaleString(),
      unit: "people",
      description: "Most people observed in a single zone at once.",
      impact: "High peaks may indicate bottlenecks.",
      action: "Widen aisles or redistribute displays in congested areas.",
    })
    if (congestedCount > 0) {
      out.push({
        name: "Congested Zones",
        value: congestedCount.toLocaleString(),
        unit: "zones",
        description: "Number of grid cells with high congestion scores.",
        impact: "Multiple congested zones suggest systemic layout issues.",
        action: "Review floor plan layout near these zones.",
      })
    }
  }

  const dwell = metrics.dwell_zones as any
  if (dwell) {
    const zones = dwell.zones
    if (Array.isArray(zones) && zones.length > 0) {
      const allDwells = zones
        .map((z: any) => safeNum(z.mean_dwell_seconds ?? z.avg_dwell))
        .filter((v: number) => v > 0)
      if (allDwells.length > 0) {
        const avg = allDwells.reduce((s: number, v: number) => s + v, 0) / allDwells.length
        out.push({
          name: "Avg Dwell Time",
          value: avg.toFixed(1),
          unit: "sec",
          description: "Mean time customers linger in tracked zones.",
          impact: "Higher dwell in high-value zones is positive.",
          action: "Investigate low-dwell zones for engagement opportunities.",
        })
      }
      const topZone = zones.reduce((best: any, z: any) =>
        safeNum(z.mean_dwell_seconds ?? z.avg_dwell) >
        safeNum(best?.mean_dwell_seconds ?? best?.avg_dwell)
          ? z
          : best,
      )
      if (topZone) {
        out.push({
          name: "Top Dwell Zone",
          value: `Zone ${topZone.zone?.[0] ?? "?"}, ${topZone.zone?.[1] ?? "?"}`,
          unit: `${safeNum(topZone.mean_dwell_seconds ?? topZone.avg_dwell).toFixed(1)}s avg`,
          description: "The zone with the longest average dwell time.",
          impact: "This is where customers spend the most time.",
          action: "Ensure high-value products are positioned here.",
        })
      }
    }
  }

  const deadZones = metrics.dead_zones as any
  if (deadZones) {
    const dz = deadZones.dead_zones
    const count = safeLen(dz)
    out.push({
      name: "Dead Zones",
      value: count.toLocaleString(),
      unit: "areas",
      description: "Regions with little to no foot traffic.",
      impact: "Dead zones represent wasted floor space.",
      action: "Reposition signage or displays to attract traffic.",
    })
  }

  const traffic = metrics.traffic_flow as any
  if (traffic && traffic.grid) {
    out.push({
      name: "Traffic Grid",
      value: "Mapped",
      unit: "",
      description: "Directional flow patterns have been computed.",
      impact: "Use flow data to optimize aisle direction and signage.",
      action: "Overlay paths visualization for detailed flow review.",
    })
  }

  const queue = metrics.queue_time as any
  if (queue) {
    const avg = safeNum(queue.avg_wait ?? queue.average_wait)
    if (avg > 0) {
      out.push({
        name: "Avg Queue Time",
        value: avg.toFixed(1),
        unit: "sec",
        description: "Average time customers spend waiting.",
        impact: "Long queues reduce satisfaction and conversion.",
        action: "Add checkout lanes or staff during peak hours.",
      })
    }
  }

  const peak = metrics.peak_patterns as any
  if (peak) {
    const peakHour = peak.peak_hour ?? peak.busiest_hour
    if (peakHour !== undefined) {
      out.push({
        name: "Peak Hour",
        value: `${peakHour}:00`,
        unit: "",
        description: "Busiest hour observed during analysis.",
        impact: "Staff accordingly to handle peak traffic.",
        action: "Schedule promotions outside peak to balance load.",
      })
    }
  }

  if (out.length === 0) {
    out.push({
      name: "Analysis Complete",
      value: Object.keys(metrics).length.toString(),
      unit: "metric groups",
      description: "Raw analytics data has been captured.",
      impact: "Run another analysis for more detailed insights.",
      action: "Upload additional footage to improve accuracy.",
    })
  }

  return out
}
