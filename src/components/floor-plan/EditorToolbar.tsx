import {
  BoxIcon,
  DoorOpenIcon,
  HandIcon,
  MapPinIcon,
  MousePointerIcon,
  RulerIcon,
  ShoppingCartIcon,
  SquareIcon,
  TableIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { FIXTURE_PRESETS, ZONE_PRESETS } from "./fixtures"
import type { EditorTool, ZoneType } from "./types"

type Props = {
  activeTool: EditorTool
  onToolChange: (tool: EditorTool) => void
  activeFixtureType: string | null
  onFixtureTypeChange: (type: string) => void
  activeZoneType: ZoneType | null
  onZoneTypeChange: (type: ZoneType) => void
}

const TOOLS: {
  tool: EditorTool
  label: string
  icon: React.ReactNode
  shortcut: string
}[] = [
  {
    tool: "select",
    label: "Select",
    icon: <MousePointerIcon className="size-4" />,
    shortcut: "V",
  },
  {
    tool: "pan",
    label: "Pan",
    icon: <HandIcon className="size-4" />,
    shortcut: "H",
  },
  {
    tool: "wall",
    label: "Wall",
    icon: <RulerIcon className="size-4" />,
    shortcut: "W",
  },
]

function fixtureIcon(type: string) {
  switch (type) {
    case "shelf":
    case "gondola":
      return <BoxIcon className="size-3.5" />
    case "counter":
      return <SquareIcon className="size-3.5" />
    case "display":
    case "island":
      return <MapPinIcon className="size-3.5" />
    case "door":
    case "entrance":
      return <DoorOpenIcon className="size-3.5" />
    case "table":
      return <TableIcon className="size-3.5" />
    case "checkout-lane":
      return <ShoppingCartIcon className="size-3.5" />
    default:
      return <BoxIcon className="size-3.5" />
  }
}

export function EditorToolbar({
  activeTool,
  onToolChange,
  activeFixtureType,
  onFixtureTypeChange,
  activeZoneType,
  onZoneTypeChange,
}: Props) {
  const fixtures = FIXTURE_PRESETS.filter((p) => p.category === "fixture")
  const structures = FIXTURE_PRESETS.filter((p) => p.category === "structure")

  return (
    <aside className="flex w-52 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar">
      {/* Tools */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Tools
        </p>
        <div className="flex flex-wrap gap-1">
          {TOOLS.map(({ tool, label, icon, shortcut }) => (
            <button
              key={tool}
              title={`${label} (${shortcut})`}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                activeTool === tool
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
              )}
              onClick={() => onToolChange(tool)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Walls */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Walls
        </p>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
            activeTool === "wall"
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
          )}
          onClick={() => onToolChange("wall")}
        >
          <RulerIcon className="size-3.5" />
          Walls
        </button>
      </div>

      {/* Fixtures */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Fixtures
        </p>
        <div className="space-y-0.5">
          {fixtures.map((preset) => (
            <button
              key={preset.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("fixture-type", preset.type)
                e.dataTransfer.effectAllowed = "copy"
                onFixtureTypeChange(preset.type)
                onToolChange("fixture")
              }}
              onClick={() => {
                onFixtureTypeChange(preset.type)
                onToolChange("fixture")
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                activeTool === "fixture" && activeFixtureType === preset.type
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
              )}
            >
              <span
                className="flex size-5 items-center justify-center rounded"
                style={{ backgroundColor: preset.color + "40", color: preset.color }}
              >
                {fixtureIcon(preset.type)}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structure */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Structure
        </p>
        <div className="space-y-0.5">
          {structures.map((preset) => (
            <button
              key={preset.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("fixture-type", preset.type)
                e.dataTransfer.effectAllowed = "copy"
                onFixtureTypeChange(preset.type)
                onToolChange("fixture")
              }}
              onClick={() => {
                onFixtureTypeChange(preset.type)
                onToolChange("fixture")
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                activeTool === "fixture" && activeFixtureType === preset.type
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
              )}
            >
              <span
                className="flex size-5 items-center justify-center rounded"
                style={{ backgroundColor: preset.color + "40", color: preset.color }}
              >
                {fixtureIcon(preset.type)}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zones */}
      <div className="px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Zones
        </p>
        <div className="space-y-0.5">
          {ZONE_PRESETS.map((z) => (
            <button
              key={z.type}
              onClick={() => {
                onZoneTypeChange(z.type as ZoneType)
                onToolChange("zone")
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                activeTool === "zone" && activeZoneType === z.type
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
              )}
            >
              <span
                className="size-3 rounded-sm"
                style={{ backgroundColor: z.color }}
              />
              {z.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
