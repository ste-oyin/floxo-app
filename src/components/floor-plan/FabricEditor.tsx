import * as fabric from "fabric"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { FIXTURE_PRESETS } from "./fixtures"
import { snapToGrid } from "./grid"
import type {
  EditorTool,
  Fixture,
  FloorPlanData,
  Wall,
  Zone,
  ZoneType,
} from "./types"

const CANVAS_BG = "#111827"
const GRID_COLOR = "#1e293b"
const WALL_COLOR = "#c8d6e5"
const FIXTURE_STROKE = "#4a6a8e"
const DRAFT_COLOR = "#f97316"
const SELECTION_COLOR = "#f97316"

export type FabricEditorHandle = {
  toDataURL: (multiplier?: number) => string
  toSVG: () => string
  toJSON: () => string
}

type Props = {
  data: FloorPlanData
  onChange: (data: FloorPlanData) => void
  activeTool: EditorTool
  activeFixtureType: string | null
  activeZoneType: ZoneType | null
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function uid(): string {
  return crypto.randomUUID()
}

export const FabricEditor = forwardRef<FabricEditorHandle, Props>(
  function FabricEditor(
    { data, onChange, activeTool, activeFixtureType, activeZoneType, selectedId: _selectedId, onSelect },
    ref,
  ) {
    const canvasElRef = useRef<HTMLCanvasElement>(null)
    const fcRef = useRef<fabric.Canvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dataRef = useRef(data)
    dataRef.current = data

    const wallDraftRef = useRef<number[] | null>(null)
    const zoneDraftRef = useRef<number[] | null>(null)
    const [, forceUpdate] = useState(0)

    const activeToolRef = useRef(activeTool)
    activeToolRef.current = activeTool
    const activeFixtureTypeRef = useRef(activeFixtureType)
    activeFixtureTypeRef.current = activeFixtureType
    const activeZoneTypeRef = useRef(activeZoneType)
    activeZoneTypeRef.current = activeZoneType

    useImperativeHandle(ref, () => ({
      toDataURL(multiplier = 2) {
        const fc = fcRef.current
        if (!fc) return ""
        return fc.toDataURL({ format: "png", multiplier })
      },
      toSVG() {
        return fcRef.current?.toSVG() ?? ""
      },
      toJSON() {
        return JSON.stringify(dataRef.current, null, 2)
      },
    }))

    const renderCanvas = useCallback(() => {
      const fc = fcRef.current
      if (!fc) return
      const d = dataRef.current
      const { canvas: cfg } = d

      fc.clear()
      fc.backgroundColor = CANVAS_BG

      const canvasRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: cfg.width,
        height: cfg.height,
        fill: CANVAS_BG,
        stroke: "#2a3a5c",
        strokeWidth: 2,
        selectable: false,
        evented: false,
        hoverCursor: "default",
      })
      fc.add(canvasRect)

      for (let x = 0; x <= cfg.width; x += cfg.gridSize) {
        fc.add(
          new fabric.Line([x, 0, x, cfg.height], {
            stroke: GRID_COLOR,
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            hoverCursor: "default",
          }),
        )
      }
      for (let y = 0; y <= cfg.height; y += cfg.gridSize) {
        fc.add(
          new fabric.Line([0, y, cfg.width, y], {
            stroke: GRID_COLOR,
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            hoverCursor: "default",
          }),
        )
      }

      for (const zone of d.zones) {
        const pts = []
        for (let i = 0; i < zone.points.length; i += 2) {
          pts.push(new fabric.Point(zone.points[i], zone.points[i + 1]))
        }
        const poly = new fabric.Polygon(pts, {
          fill: zone.color + "30",
          stroke: zone.color,
          strokeWidth: 2,
          selectable: activeToolRef.current === "select",
          hasControls: false,
          hasBorders: true,
          borderColor: SELECTION_COLOR,
          hoverCursor: activeToolRef.current === "select" ? "move" : "default",
        })
        ;(poly as any).__fpId = zone.id
        ;(poly as any).__fpType = "zone"
        fc.add(poly)
      }

      for (const wall of d.walls) {
        const pts = wall.points
        if (pts.length < 4) continue
        const line = new fabric.Line(
          [pts[0], pts[1], pts[2], pts[3]],
          {
            stroke: WALL_COLOR,
            strokeWidth: wall.thickness,
            strokeLineCap: "round",
            selectable: activeToolRef.current === "select",
            hasControls: false,
            hasBorders: true,
            borderColor: SELECTION_COLOR,
            hoverCursor: activeToolRef.current === "select" ? "move" : "default",
          },
        )
        ;(line as any).__fpId = wall.id
        ;(line as any).__fpType = "wall"
        fc.add(line)
      }

      for (const fixture of d.fixtures) {
        const preset = FIXTURE_PRESETS.find((p) => p.type === fixture.type)
        const fillColor = fixture.color ?? preset?.color ?? "#4a7ab5"

        const rect = new fabric.Rect({
          left: fixture.x,
          top: fixture.y,
          width: fixture.width,
          height: fixture.height,
          angle: fixture.rotation,
          fill: fillColor + "CC",
          stroke: FIXTURE_STROKE,
          strokeWidth: 1.5,
          rx: 3,
          ry: 3,
          selectable: activeToolRef.current === "select",
          hasControls: true,
          hasBorders: true,
          borderColor: SELECTION_COLOR,
          cornerColor: SELECTION_COLOR,
          cornerStyle: "circle",
          cornerSize: 8,
          transparentCorners: false,
          hoverCursor: activeToolRef.current === "select" ? "move" : "default",
        })
        ;(rect as any).__fpId = fixture.id
        ;(rect as any).__fpType = "fixture"

        if (fixture.label) {
          const text = new fabric.FabricText(fixture.label, {
            left: fixture.x + fixture.width / 2,
            top: fixture.y + fixture.height / 2,
            fontSize: 11,
            fill: "#e2e8f0",
            fontFamily: "sans-serif",
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          })
          fc.add(rect)
          fc.add(text)
        } else {
          fc.add(rect)
        }
      }

      const wd = wallDraftRef.current
      if (wd && wd.length >= 2) {
        fc.add(
          new fabric.Circle({
            left: wd[0] - 4,
            top: wd[1] - 4,
            radius: 4,
            fill: DRAFT_COLOR,
            selectable: false,
            evented: false,
          }),
        )
      }

      const zd = zoneDraftRef.current
      if (zd && zd.length >= 4) {
        const pts: number[] = []
        for (let i = 0; i < zd.length; i += 2) {
          pts.push(zd[i], zd[i + 1])
        }
        fc.add(
          new fabric.Polyline(
            pts.reduce<fabric.Point[]>((acc, _, i) => {
              if (i % 2 === 0) acc.push(new fabric.Point(pts[i], pts[i + 1]))
              return acc
            }, []),
            {
              fill: "transparent",
              stroke: DRAFT_COLOR,
              strokeWidth: 2,
              strokeDashArray: [6, 4],
              selectable: false,
              evented: false,
            },
          ),
        )
        fc.add(
          new fabric.Circle({
            left: zd[0] - 6,
            top: zd[1] - 6,
            radius: 6,
            fill: DRAFT_COLOR + "60",
            stroke: DRAFT_COLOR,
            strokeWidth: 2,
            selectable: false,
            evented: false,
          }),
        )
      }

      fc.renderAll()
    }, [])

    useEffect(() => {
      const el = canvasElRef.current
      if (!el || fcRef.current) return

      const fc = new fabric.Canvas(el, {
        backgroundColor: CANVAS_BG,
        selection: false,
        preserveObjectStacking: true,
      })
      fcRef.current = fc

      const resize = () => {
        const parent = containerRef.current
        if (!parent) return
        fc.setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        })
        renderCanvas()
      }

      const ro = new ResizeObserver(resize)
      if (containerRef.current) ro.observe(containerRef.current)
      resize()

      fc.on("mouse:wheel", (opt) => {
        const evt = opt.e as WheelEvent
        evt.preventDefault()
        const delta = evt.deltaY
        let zoom = fc.getZoom()
        zoom *= 0.999 ** delta
        zoom = Math.min(5, Math.max(0.2, zoom))
        fc.zoomToPoint(new fabric.Point(evt.offsetX, evt.offsetY), zoom)
      })

      fc.on("mouse:down", (opt) => {
        const tool = activeToolRef.current
        const rawEvt = opt.e as MouseEvent | TouchEvent
        const cx = "clientX" in rawEvt ? rawEvt.clientX : rawEvt.touches?.[0]?.clientX ?? 0
        const cy = "clientY" in rawEvt ? rawEvt.clientY : rawEvt.touches?.[0]?.clientY ?? 0
        if (tool === "pan") {
          ;(fc as any).__panning = true
          ;(fc as any).__panStart = { x: cx, y: cy }
          return
        }

        const pointer = fc.getScenePoint(opt.e)
        const gridSize = dataRef.current.canvas.gridSize
        const sx = snapToGrid(pointer.x, gridSize)
        const sy = snapToGrid(pointer.y, gridSize)

        if (tool === "select") {
          const target = opt.target
          if (target && (target as any).__fpId) {
            onSelect((target as any).__fpId)
          } else {
            onSelect(null)
          }
          return
        }

        if (tool === "wall") {
          const wd = wallDraftRef.current
          if (!wd) {
            wallDraftRef.current = [sx, sy]
            forceUpdate((v) => v + 1)
            renderCanvas()
          } else {
            const newWall: Wall = {
              id: uid(),
              points: [...wd, sx, sy],
              thickness: 6,
            }
            wallDraftRef.current = null
            const d = dataRef.current
            onChange({ ...d, walls: [...d.walls, newWall] })
          }
          return
        }

        if (tool === "zone") {
          const zd = zoneDraftRef.current
          if (!zd) {
            zoneDraftRef.current = [sx, sy]
            forceUpdate((v) => v + 1)
            renderCanvas()
          } else {
            const pts = [...zd, sx, sy]
            if (pts.length >= 6) {
              const dist = Math.hypot(sx - pts[0], sy - pts[1])
              if (dist < gridSize) {
                const currentData = dataRef.current
                const zoneType = activeZoneTypeRef.current ?? "custom"
                const newZone: Zone = {
                  id: uid(),
                  name: `Zone ${currentData.zones.length + 1}`,
                  color: ZONE_COLORS[currentData.zones.length % ZONE_COLORS.length],
                  points: zd,
                  zoneType,
                }
                zoneDraftRef.current = null
                onChange({ ...currentData, zones: [...currentData.zones, newZone] })
                return
              }
            }
            zoneDraftRef.current = pts
            forceUpdate((v) => v + 1)
            renderCanvas()
          }
          return
        }

        if (tool === "fixture" && activeFixtureTypeRef.current) {
          const preset = FIXTURE_PRESETS.find(
            (p) => p.type === activeFixtureTypeRef.current,
          )
          if (!preset) return
          const d = dataRef.current
          const newFixture: Fixture = {
            id: uid(),
            type: preset.type,
            x: sx - preset.width / 2,
            y: sy - preset.height / 2,
            width: preset.width,
            height: preset.height,
            rotation: 0,
            label: preset.label,
            color: preset.color,
          }
          onChange({ ...d, fixtures: [...d.fixtures, newFixture] })
        }
      })

      fc.on("mouse:move", (opt) => {
        if ((fc as any).__panning) {
          const rawEvt = opt.e as MouseEvent | TouchEvent
          const mx = "clientX" in rawEvt ? rawEvt.clientX : rawEvt.touches?.[0]?.clientX ?? 0
          const my = "clientY" in rawEvt ? rawEvt.clientY : rawEvt.touches?.[0]?.clientY ?? 0
          const start = (fc as any).__panStart
          const vpt = fc.viewportTransform!
          vpt[4] += mx - start.x
          vpt[5] += my - start.y
          ;(fc as any).__panStart = { x: mx, y: my }
          fc.requestRenderAll()
        }
      })

      fc.on("mouse:up", () => {
        ;(fc as any).__panning = false
      })

      fc.on("object:modified", (opt) => {
        const target = opt.target
        if (!target) return
        const fpId = (target as any).__fpId
        const fpType = (target as any).__fpType
        if (!fpId) return

        const d = dataRef.current
        const gridSize = d.canvas.gridSize

        if (fpType === "fixture") {
          const scaleX = target.scaleX ?? 1
          const scaleY = target.scaleY ?? 1
          target.set({ scaleX: 1, scaleY: 1 })
          const newW = Math.max(10, (target.width ?? 10) * scaleX)
          const newH = Math.max(10, (target.height ?? 10) * scaleY)
          const sx = snapToGrid(target.left ?? 0, gridSize)
          const sy = snapToGrid(target.top ?? 0, gridSize)
          onChange({
            ...d,
            fixtures: d.fixtures.map((f) =>
              f.id === fpId
                ? { ...f, x: sx, y: sy, width: newW, height: newH, rotation: target.angle ?? 0 }
                : f,
            ),
          })
        }
      })

      return () => {
        ro.disconnect()
        fc.dispose()
        fcRef.current = null
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      renderCanvas()
    }, [data, activeTool, renderCanvas])

    useEffect(() => {
      if (!fcRef.current) return
      fcRef.current.defaultCursor =
        activeTool === "pan"
          ? "grab"
          : activeTool === "select"
            ? "default"
            : "crosshair"
      fcRef.current.selection = activeTool === "select"
    }, [activeTool])

    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const fixtureType = e.dataTransfer.getData("fixture-type")
        if (!fixtureType) return
        const preset = FIXTURE_PRESETS.find((p) => p.type === fixtureType)
        if (!preset) return

        const fc = fcRef.current
        if (!fc) return

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const pointer = fc.getScenePoint(e.nativeEvent)
        const gridSize = data.canvas.gridSize
        const sx = snapToGrid(pointer.x, gridSize)
        const sy = snapToGrid(pointer.y, gridSize)

        const newFixture: Fixture = {
          id: uid(),
          type: preset.type,
          x: sx - preset.width / 2,
          y: sy - preset.height / 2,
          width: preset.width,
          height: preset.height,
          rotation: 0,
          label: preset.label,
          color: preset.color,
        }
        onChange({ ...data, fixtures: [...data.fixtures, newFixture] })
      },
      [data, onChange],
    )

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    }, [])

    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ background: CANVAS_BG }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <canvas ref={canvasElRef} />
      </div>
    )
  },
)

const ZONE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
]
