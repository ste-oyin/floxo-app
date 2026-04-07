import { useMemo } from "react"

type Path = {
  points: [number, number][]
}

type Props = {
  paths: Path[]
  width: number
  height: number
  className?: string
}

const COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
]

export function PathOverlay({ paths, width, height, className }: Props) {
  const rendered = useMemo(() => {
    if (!paths || paths.length === 0) return null
    return paths.slice(0, 50).map((path, idx) => {
      if (!path.points || path.points.length < 2) return null
      const pts = path.points
      const d = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
        .join(" ")
      const color = COLORS[idx % COLORS.length]
      const last = pts[pts.length - 1]
      const prev = pts[pts.length - 2]
      const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0])
      const arrowSize = 6
      const ax1 = last[0] - arrowSize * Math.cos(angle - 0.4)
      const ay1 = last[1] - arrowSize * Math.sin(angle - 0.4)
      const ax2 = last[0] - arrowSize * Math.cos(angle + 0.4)
      const ay2 = last[1] - arrowSize * Math.sin(angle + 0.4)
      return (
        <g key={idx}>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
          <polygon
            points={`${last[0]},${last[1]} ${ax1},${ay1} ${ax2},${ay2}`}
            fill={color}
            opacity={0.8}
          />
        </g>
      )
    })
  }, [paths])

  if (!rendered) return null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {rendered}
    </svg>
  )
}
