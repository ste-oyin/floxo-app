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

export type Zone = {
  id: string
  name: string
  color: string
  points: number[]
}

export type Fixture = {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  label?: string
}

export type FloorPlanData = {
  canvas: CanvasConfig
  walls: Wall[]
  zones: Zone[]
  fixtures: Fixture[]
}

export type EditorTool = "select" | "pan" | "wall" | "zone" | "fixture"

export type FixturePreset = {
  type: string
  label: string
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
