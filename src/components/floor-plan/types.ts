export type CanvasConfig = {
  width: number
  height: number
  gridSize: number
}

export type Wall = {
  id: string
  points: number[]
  thickness: number
}

export type ZoneType =
  | "high-value"
  | "low-value"
  | "checkout"
  | "walkway"
  | "custom"

export type Zone = {
  id: string
  name: string
  color: string
  points: number[]
  zoneType: ZoneType
}

export type FixtureType =
  | "shelf"
  | "counter"
  | "display"
  | "island"
  | "door"
  | "checkout-lane"
  | "entrance"
  | "pillar"
  | "table"
  | "window"
  | "gondola"

export type Fixture = {
  id: string
  type: FixtureType | string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  label?: string
  color?: string
}

export type FloorPlanData = {
  canvas: CanvasConfig
  walls: Wall[]
  zones: Zone[]
  fixtures: Fixture[]
}

export type EditorTool = "select" | "pan" | "wall" | "zone" | "fixture"

export type FixturePreset = {
  type: FixtureType | string
  label: string
  icon: string
  category: "fixture" | "structure" | "zone-marker"
  width: number
  height: number
  color: string
}

export const EMPTY_FLOOR_PLAN: FloorPlanData = {
  canvas: { width: 1200, height: 800, gridSize: 20 },
  walls: [],
  zones: [],
  fixtures: [],
}
