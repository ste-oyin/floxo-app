import { cn } from "@/lib/utils"

type FloorPlanCanvasProps = {
  image_url: string
  heatmap_url?: string | null
  heatmap_opacity?: number
  className?: string
}

export function FloorPlanCanvas({
  image_url,
  heatmap_url,
  heatmap_opacity = 0.55,
  className,
}: FloorPlanCanvasProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10",
        className
      )}
    >
      <img
        src={image_url}
        alt=""
        className="block h-auto w-full max-h-[min(70vh,720px)] object-contain"
      />
      {heatmap_url ? (
        <img
          src={heatmap_url}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ opacity: heatmap_opacity }}
        />
      ) : null}
    </div>
  )
}
