import Konva from "konva"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Circle, Group, Layer, Line, Rect, Stage, Transformer } from "react-konva"

import { FIXTURE_PRESETS } from "./fixtures"
import { snapPoint } from "./grid"
import type {
  EditorTool,
  Fixture,
  FloorPlanData,
  Wall,
  Zone,
} from "./types"
import { EMPTY_FLOOR_PLAN } from "./types"

type Props = {
  data: FloorPlanData
  onChange: (data: FloorPlanData) => void
  activeTool: EditorTool
  activeFixtureType: string | null
  selectedId: string | null
  onSelect: (id: string | null) => void
  stageRef: React.RefObject<Konva.Stage | null>
}

const MIN_SCALE = 0.2
const MAX_SCALE = 5

function uid(): string {
  return crypto.randomUUID()
}

function GridLines({
  width,
  height,
  gridSize,
}: {
  width: number
  height: number
  gridSize: number
}) {
  const lines = useMemo(() => {
    const result: { points: number[]; key: string }[] = []
    for (let x = 0; x <= width; x += gridSize) {
      result.push({ points: [x, 0, x, height], key: `v${x}` })
    }
    for (let y = 0; y <= height; y += gridSize) {
      result.push({ points: [0, y, width, y], key: `h${y}` })
    }
    return result
  }, [width, height, gridSize])

  return (
    <>
      {lines.map((l) => (
        <Line
          key={l.key}
          points={l.points}
          stroke="#e2e8f0"
          strokeWidth={0.5}
          listening={false}
        />
      ))}
    </>
  )
}

export function FloorPlanEditor({
  data,
  onChange,
  activeTool,
  activeFixtureType,
  selectedId,
  onSelect,
  stageRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const [wallDraft, setWallDraft] = useState<number[] | null>(null)
  const [zoneDraft, setZoneDraft] = useState<number[] | null>(null)

  const { canvas, walls, zones, fixtures } = data

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    const stage = tr.getStage()
    if (!stage) return
    if (!selectedId) {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
      return
    }
    const node = stage.findOne(`#${selectedId}`)
    if (node) {
      tr.nodes([node])
      tr.getLayer()?.batchDraw()
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedId])

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = e.target.getStage()
      if (!stage) return
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()!
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }
      const direction = e.evt.deltaY > 0 ? -1 : 1
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, oldScale * (1 + direction * 0.1))
      )
      setStageScale(newScale)
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      })
    },
    []
  )

  const toCanvas = useCallback(
    (px: number, py: number) => {
      const stage = stageRef.current
      if (!stage) return { x: 0, y: 0 }
      const transform = stage.getAbsoluteTransform().copy().invert()
      return transform.point({ x: px, y: py })
    },
    [stageRef]
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      if (!stage) return
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const pos = toCanvas(pointer.x, pointer.y)
      const snapped = snapPoint(pos.x, pos.y, canvas.gridSize)

      if (activeTool === "select") {
        if (e.target === stage || e.target.parent === stage) {
          onSelect(null)
        }
        return
      }

      if (activeTool === "wall") {
        if (!wallDraft) {
          setWallDraft([snapped.x, snapped.y])
        } else {
          const newWall: Wall = {
            id: uid(),
            points: [...wallDraft, snapped.x, snapped.y],
            thickness: 6,
          }
          onChange({
            ...data,
            walls: [...walls, newWall],
          })
          setWallDraft(null)
        }
        return
      }

      if (activeTool === "zone") {
        if (!zoneDraft) {
          setZoneDraft([snapped.x, snapped.y])
        } else {
          const pts = [...zoneDraft, snapped.x, snapped.y]
          if (pts.length >= 6) {
            const firstX = pts[0]
            const firstY = pts[1]
            const dist = Math.hypot(snapped.x - firstX, snapped.y - firstY)
            if (dist < canvas.gridSize) {
              const newZone: Zone = {
                id: uid(),
                name: `Zone ${zones.length + 1}`,
                color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
                points: zoneDraft,
              }
              onChange({
                ...data,
                zones: [...zones, newZone],
              })
              setZoneDraft(null)
              return
            }
          }
          setZoneDraft(pts)
        }
        return
      }

      if (activeTool === "fixture" && activeFixtureType) {
        const preset = FIXTURE_PRESETS.find((p) => p.type === activeFixtureType)
        if (!preset) return
        const newFixture: Fixture = {
          id: uid(),
          type: preset.type,
          x: snapped.x - preset.width / 2,
          y: snapped.y - preset.height / 2,
          width: preset.width,
          height: preset.height,
          rotation: 0,
          label: preset.label,
        }
        onChange({
          ...data,
          fixtures: [...fixtures, newFixture],
        })
        return
      }
    },
    [
      activeTool,
      activeFixtureType,
      canvas.gridSize,
      data,
      fixtures,
      onChange,
      onSelect,
      toCanvas,
      wallDraft,
      walls,
      zoneDraft,
      zones,
    ]
  )

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (activeTool === "pan") {
        setStagePos({ x: e.target.x(), y: e.target.y() })
      }
    },
    [activeTool]
  )

  const handleFixtureDragEnd = useCallback(
    (fixtureId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target
      const snapped = snapPoint(node.x(), node.y(), canvas.gridSize)
      onChange({
        ...data,
        fixtures: fixtures.map((f) =>
          f.id === fixtureId ? { ...f, x: snapped.x, y: snapped.y } : f
        ),
      })
    },
    [canvas.gridSize, data, fixtures, onChange]
  )

  const handleFixtureTransformEnd = useCallback(
    (fixtureId: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target as Konva.Rect
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      node.scaleX(1)
      node.scaleY(1)
      onChange({
        ...data,
        fixtures: fixtures.map((f) =>
          f.id === fixtureId
            ? {
                ...f,
                x: node.x(),
                y: node.y(),
                width: Math.max(10, node.width() * scaleX),
                height: Math.max(10, node.height() * scaleY),
                rotation: node.rotation(),
              }
            : f
        ),
      })
    },
    [data, fixtures, onChange]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        onChange({
          ...data,
          walls: walls.filter((w) => w.id !== selectedId),
          zones: zones.filter((z) => z.id !== selectedId),
          fixtures: fixtures.filter((f) => f.id !== selectedId),
        })
        onSelect(null)
      }
      if (e.key === "Escape") {
        setWallDraft(null)
        setZoneDraft(null)
        onSelect(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedId, data, walls, zones, fixtures, onChange, onSelect])

  const cursorStyle =
    activeTool === "pan"
      ? "grab"
      : activeTool === "select"
        ? "default"
        : "crosshair"

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-slate-50"
      style={{ cursor: cursorStyle }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={activeTool === "pan"}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onDragEnd={handleStageDragEnd}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={canvas.width}
            height={canvas.height}
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth={2}
          />
          <GridLines
            width={canvas.width}
            height={canvas.height}
            gridSize={canvas.gridSize}
          />

          {zones.map((zone) => (
            <Line
              key={zone.id}
              id={zone.id}
              points={zone.points}
              closed
              fill={zone.color + "40"}
              stroke={zone.color}
              strokeWidth={2}
              onClick={(e) => {
                e.cancelBubble = true
                if (activeTool === "select") onSelect(zone.id)
              }}
            />
          ))}

          {walls.map((wall) => (
            <Line
              key={wall.id}
              id={wall.id}
              points={wall.points}
              stroke="#1e293b"
              strokeWidth={wall.thickness}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={12}
              onClick={(e) => {
                e.cancelBubble = true
                if (activeTool === "select") onSelect(wall.id)
              }}
            />
          ))}

          {fixtures.map((fixture) => {
            const preset = FIXTURE_PRESETS.find((p) => p.type === fixture.type)
            const fill = preset?.color ?? "#94a3b8"
            return (
              <Group key={fixture.id}>
                <Rect
                  id={fixture.id}
                  x={fixture.x}
                  y={fixture.y}
                  width={fixture.width}
                  height={fixture.height}
                  rotation={fixture.rotation}
                  fill={fill + "CC"}
                  stroke={fill}
                  strokeWidth={1.5}
                  cornerRadius={4}
                  draggable={activeTool === "select"}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (activeTool === "select") onSelect(fixture.id)
                  }}
                  onDragEnd={(e) => handleFixtureDragEnd(fixture.id, e)}
                  onTransformEnd={(e) =>
                    handleFixtureTransformEnd(fixture.id, e)
                  }
                />
              </Group>
            )
          })}

          {wallDraft && wallDraft.length >= 2 && (
            <Circle
              x={wallDraft[0]}
              y={wallDraft[1]}
              radius={4}
              fill="#3b82f6"
              listening={false}
            />
          )}

          {zoneDraft && zoneDraft.length >= 4 && (
            <Line
              points={zoneDraft}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[6, 4]}
              listening={false}
            />
          )}
          {zoneDraft && zoneDraft.length >= 2 && (
            <Circle
              x={zoneDraft[0]}
              y={zoneDraft[1]}
              radius={6}
              fill="#3b82f680"
              stroke="#3b82f6"
              strokeWidth={2}
              listening={false}
            />
          )}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox
              return newBox
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
}

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
