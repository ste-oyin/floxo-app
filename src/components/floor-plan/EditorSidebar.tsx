import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { FIXTURE_PRESETS } from "./fixtures"
import type { Fixture, FloorPlanData, Wall, Zone } from "./types"

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
      walls: data.walls.map((w) => (w.id === wall.id ? { ...w, ...patch } : w)),
    })
  }

  const updateZone = (patch: Partial<Zone>) => {
    if (!zone) return
    onChange({
      ...data,
      zones: data.zones.map((z) => (z.id === zone.id ? { ...z, ...patch } : z)),
    })
  }

  const updateFixture = (patch: Partial<Fixture>) => {
    if (!fixture) return
    onChange({
      ...data,
      fixtures: data.fixtures.map((f) =>
        f.id === fixture.id ? { ...f, ...patch } : f
      ),
    })
  }

  if (!selectedId) {
    return (
      <div className="w-60 border-l bg-background p-4">
        <p className="text-sm text-muted-foreground">
          Select an element to edit its properties.
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Summary</p>
          <p className="text-sm">{data.walls.length} walls</p>
          <p className="text-sm">{data.zones.length} zones</p>
          <p className="text-sm">{data.fixtures.length} fixtures</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-60 space-y-4 border-l bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {wall ? "Wall" : zone ? "Zone" : fixture ? "Fixture" : "Element"}
        </h3>
        <Button variant="ghost" size="icon" className="size-8" onClick={handleDelete}>
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
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
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={zone.color}
              onChange={(e) => updateZone({ color: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border"
            />
          </div>
        </div>
      )}

      {fixture && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Label</Label>
            <Input
              value={fixture.label ?? ""}
              onChange={(e) => updateFixture({ label: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <p className="text-sm capitalize text-muted-foreground">
              {FIXTURE_PRESETS.find((p) => p.type === fixture.type)?.label ??
                fixture.type}
            </p>
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
              <Label className="text-xs">Height</Label>
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
        </div>
      )}
    </div>
  )
}
