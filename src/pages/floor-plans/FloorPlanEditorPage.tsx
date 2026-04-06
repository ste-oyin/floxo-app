import Konva from "konva"
import { ArrowLeftIcon, DownloadIcon, SaveIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { EditorSidebar } from "@/components/floor-plan/EditorSidebar"
import { EditorToolbar } from "@/components/floor-plan/EditorToolbar"
import { FloorPlanEditor } from "@/components/floor-plan/FloorPlanEditor"
import type { EditorTool, FloorPlanData } from "@/components/floor-plan/types"
import { EMPTY_FLOOR_PLAN } from "@/components/floor-plan/types"
import { Button } from "@/components/ui/button"
import {
  createFloorPlan,
  getFloorPlan,
  setupWorkspace,
  updateFloorPlan,
  uploadFloorPlanImage,
} from "@/lib/api"
import type { FloorPlan } from "@/types"

export function FloorPlanEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const stageRef = useRef<Konva.Stage | null>(null)

  const isNew = !id || id === "new"

  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [data, setData] = useState<FloorPlanData>(EMPTY_FLOOR_PLAN)
  const [activeTool, setActiveTool] = useState<EditorTool>("select")
  const [activeFixtureType, setActiveFixtureType] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [planName, setPlanName] = useState("Untitled Floor Plan")

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    ;(async () => {
      try {
        const fp = await getFloorPlan(id!)
        if (cancelled) return
        setFloorPlan(fp)
        setPlanName(fp.name)
        const meta = fp.metadata_json as FloorPlanData | undefined
        if (meta?.canvas) {
          setData(meta)
        }
      } catch {
        // failed to load
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toLowerCase()
      if (key === "v") setActiveTool("select")
      else if (key === "h") setActiveTool("pan")
      else if (key === "w") setActiveTool("wall")
      else if (key === "z" && !e.metaKey && !e.ctrlKey) setActiveTool("zone")
      else if (key === "f") setActiveTool("fixture")
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleToolChange = useCallback((tool: EditorTool) => {
    setActiveTool(tool)
    setSelectedId(null)
  }, [])

  const handleFixtureTypeChange = useCallback((type: string) => {
    setActiveFixtureType(type)
    setActiveTool("fixture")
  }, [])

  const exportPng = useCallback((): Blob | null => {
    const stage = stageRef.current
    if (!stage) return null
    const uri = stage.toDataURL({ pixelRatio: 2 })
    const bstr = atob(uri.split(",")[1])
    const arr = new Uint8Array(bstr.length)
    for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i)
    return new Blob([arr], { type: "image/png" })
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const workspace = await setupWorkspace()
      const locationId =
        floorPlan?.location_id ?? workspace.locations[0]?.id

      if (!locationId) {
        throw new Error("No location available")
      }

      const pngBlob = exportPng()
      let imagePath = floorPlan?.image_path ?? ""
      if (pngBlob) {
        const file = new File([pngBlob], `floor-plan-${Date.now()}.png`, {
          type: "image/png",
        })
        const uploadRes = await uploadFloorPlanImage(file)
        imagePath = uploadRes.image_path
      }

      if (isNew) {
        const created = await createFloorPlan({
          location_id: locationId,
          name: planName,
          image_path: imagePath,
          metadata_json: data as unknown as Record<string, unknown>,
        })
        navigate(`/floor-plans/${created.id}/edit`, { replace: true })
        setFloorPlan(created)
      } else {
        const updated = await updateFloorPlan(floorPlan!.id, {
          location_id: locationId,
          name: planName,
          image_path: imagePath,
          metadata_json: data as unknown as Record<string, unknown>,
        })
        setFloorPlan(updated)
      }
    } catch (err) {
      console.error("Save failed:", err)
    } finally {
      setSaving(false)
    }
  }, [data, exportPng, floorPlan, isNew, navigate, planName])

  const handleExportPng = useCallback(() => {
    const blob = exportPng()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${planName.replace(/\s+/g, "_")}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportPng, planName])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading floor plan...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/floor-plans")}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <input
          className="flex-1 border-none bg-transparent text-sm font-medium outline-none focus:ring-0"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Floor plan name"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPng}
        >
          <DownloadIcon className="mr-1.5 size-3.5" />
          Export PNG
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <SaveIcon className="mr-1.5 size-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        <EditorToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          activeFixtureType={activeFixtureType}
          onFixtureTypeChange={handleFixtureTypeChange}
        />
        <FloorPlanEditor
          data={data}
          onChange={setData}
          activeTool={activeTool}
          activeFixtureType={activeFixtureType}
          selectedId={selectedId}
          onSelect={setSelectedId}
          stageRef={stageRef}
        />
        <EditorSidebar
          data={data}
          selectedId={selectedId}
          onChange={setData}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  )
}
