import { Trash2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { FIXTURE_PRESETS, ZONE_PRESETS } from "./fixtures"
import type { Fixture, FloorPlanData, Wall, Zone, ZoneType } from "./types"

type Props = {
  data: FloorPlanData
  selectedId: string | null
  onChange: (data: FloorPlanData) => void
  onSelect: (id: string | null) => void
}

export function EditorSidebar({ data, selectedId, onChange, onSelect }: Props) {
  const wall = data.walls.find((w) => w.id === selectedId)
  const zone = data.zones.find((z) => z.id === selectedId)
  const fixture = data.fixtures.find((f) => f.id === selectedId)

  const handleDelete = () => {
    if (!selectedId) return
    onChange({
      ...data,
      walls: data.walls.filter((w) => w.id !== selectedId),
      zones: data.zones.filter((z) => z.id !== selectedId),
      fixtures: data.fixtures.filter((f) => f.id !== selectedId),
    })
    onSelect(null)
  }

  const updateWall = (patch: Partial<Wall>) => {
    if (!wall) return
    onChange({
      ...data,
      walls: data.walls.map((w) =>
        w.id === wall.id ? { ...w, ...patch } : w,
      ),
    })
  }

  const updateZone = (patch: Partial<Zone>) => {
    if (!zone) return
    onChange({
      ...data,
      zones: data.zones.map((z) =>
        z.id === zone.id ? { ...z, ...patch } : z,
      ),
    })
  }

  const updateFixture = (patch: Partial<Fixture>) => {
    if (!fixture) return
    onChange({
      ...data,
      fixtures: data.fixtures.map((f) =>
        f.id === fixture.id ? { ...f, ...patch } : f,
      ),
    })
  }

  if (!selectedId) {
    return (
      <aside className="w-64 border-l border-sidebar-border bg-sidebar p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Properties
        </h3>
        <p className="text-xs text-muted-foreground">
          Select an element to edit its properties.
        </p>
        <div className="mt-6 space-y-2 text-xs text-sidebar-foreground/70">
          <p>{data.walls.length} walls</p>
          <p>{data.zones.length} zones</p>
          <p>{data.fixtures.length} fixtures</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 space-y-4 border-l border-sidebar-border bg-sidebar p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          {wall ? "Wall" : zone ? "Zone" : fixture ? "Fixture" : "Element"}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleDelete}
          >
            <Trash2Icon className="size-3.5 text-destructive" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onSelect(null)}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {wall && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Thickness</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={wall.thickness}
              onChange={(e) => updateWall({ thickness: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Length</Label>
            <p className="text-sm text-muted-foreground">
              {wall.points.length >= 4
                ? Math.round(
                    Math.hypot(
                      wall.points[2] - wall.points[0],
                      wall.points[3] - wall.points[1],
                    ),
                  )
                : 0}
              px
            </p>
          </div>
        </div>
      )}

      {zone && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={zone.name}
              onChange={(e) => updateZone({ name: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={zone.zoneType ?? "custom"}
              onChange={(e) =>
                updateZone({ zoneType: e.target.value as ZoneType })
              }
            >
              {ZONE_PRESETS.map((z) => (
                <option key={z.type} value={z.type}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={zone.color}
              onChange={(e) => updateZone({ color: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border border-input"
            />
          </div>
        </div>
      )}

      {fixture && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Type</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={fixture.type}
              onChange={(e) => updateFixture({ type: e.target.value })}
            >
              {FIXTURE_PRESETS.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Label</Label>
            <Input
              value={fixture.label ?? ""}
              onChange={(e) => updateFixture({ label: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                min={10}
                value={Math.round(fixture.width)}
                onChange={(e) =>
                  updateFixture({ width: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Depth</Label>
              <Input
                type="number"
                min={10}
                value={Math.round(fixture.height)}
                onChange={(e) =>
                  updateFixture({ height: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Rotation</Label>
            <Input
              type="number"
              value={Math.round(fixture.rotation)}
              onChange={(e) =>
                updateFixture({ rotation: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={
                fixture.color ??
                FIXTURE_PRESETS.find((p) => p.type === fixture.type)?.color ??
                "#4a7ab5"
              }
              onChange={(e) => updateFixture({ color: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border border-input"
            />
          </div>
        </div>
      )}
    </aside>
  )
}
