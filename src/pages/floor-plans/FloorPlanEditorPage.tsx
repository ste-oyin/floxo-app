import {
  ArrowLeftIcon,
  DownloadIcon,
  FileJsonIcon,
  ImageIcon,
  Redo2Icon,
  SaveIcon,
  Undo2Icon,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { EditorSidebar } from "@/components/floor-plan/EditorSidebar"
import { EditorToolbar } from "@/components/floor-plan/EditorToolbar"
import {
  FabricEditor,
  type FabricEditorHandle,
} from "@/components/floor-plan/FabricEditor"
import type { EditorTool, FloorPlanData, ZoneType } from "@/components/floor-plan/types"
import { EMPTY_FLOOR_PLAN } from "@/components/floor-plan/types"
import { useHistory } from "@/components/floor-plan/useHistory"
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
  const editorRef = useRef<FabricEditorHandle>(null)

  const isNew = !id || id === "new"

  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const { data, setData, undo, redo, canUndo, canRedo, resetHistory } =
    useHistory(EMPTY_FLOOR_PLAN)
  const [activeTool, setActiveTool] = useState<EditorTool>("select")
  const [activeFixtureType, setActiveFixtureType] = useState<string | null>(
    null,
  )
  const [activeZoneType, setActiveZoneType] = useState<ZoneType | null>(null)
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
          resetHistory(meta)
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
  }, [id, isNew, resetHistory])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return
      const key = e.key.toLowerCase()
      if (key === "v") setActiveTool("select")
      else if (key === "h") setActiveTool("pan")
      else if (key === "w") setActiveTool("wall")
      else if (key === "z" && !e.metaKey && !e.ctrlKey) setActiveTool("zone")
      else if (key === "f") setActiveTool("fixture")
      else if (key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        undo()
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId
      ) {
        e.preventDefault()
        setData({
          ...data,
          walls: data.walls.filter((w) => w.id !== selectedId),
          zones: data.zones.filter((z) => z.id !== selectedId),
          fixtures: data.fixtures.filter((f) => f.id !== selectedId),
        })
        setSelectedId(null)
      } else if (e.key === "Escape") {
        setSelectedId(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [data, selectedId, setData, undo, redo])

  const handleToolChange = useCallback((tool: EditorTool) => {
    setActiveTool(tool)
    setSelectedId(null)
  }, [])

  const handleFixtureTypeChange = useCallback((type: string) => {
    setActiveFixtureType(type)
    setActiveTool("fixture")
  }, [])

  const handleZoneTypeChange = useCallback((type: ZoneType) => {
    setActiveZoneType(type)
    setActiveTool("zone")
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

      let imagePath = floorPlan?.image_path ?? ""
      const dataUrl = editorRef.current?.toDataURL(2)
      if (dataUrl) {
        const bstr = atob(dataUrl.split(",")[1])
        const arr = new Uint8Array(bstr.length)
        for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i)
        const pngBlob = new Blob([arr], { type: "image/png" })
        const file = new File([pngBlob], `floor-plan-${Date.now()}.png`, {
          type: "image/png",
        })
        const uploadRes = await uploadFloorPlanImage(file)
        imagePath = uploadRes.image_path
      }

      const metadataJson = {
        ...data,
        width: data.canvas.width,
        height: data.canvas.height,
      } as unknown as Record<string, unknown>

      if (isNew) {
        const created = await createFloorPlan({
          location_id: locationId,
          name: planName,
          image_path: imagePath,
          metadata_json: metadataJson,
        })
        navigate(`/floor-plans/${created.id}/edit`, { replace: true })
        setFloorPlan(created)
      } else {
        const updated = await updateFloorPlan(floorPlan!.id, {
          location_id: locationId,
          name: planName,
          image_path: imagePath,
          metadata_json: metadataJson,
        })
        setFloorPlan(updated)
      }
    } catch (err) {
      console.error("Save failed:", err)
    } finally {
      setSaving(false)
    }
  }, [data, floorPlan, isNew, navigate, planName])

  const handleExportPng = useCallback(() => {
    const dataUrl = editorRef.current?.toDataURL(2)
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${planName.replace(/\s+/g, "_")}.png`
    a.click()
  }, [planName])

  const handleExportSvg = useCallback(() => {
    const svg = editorRef.current?.toSVG()
    if (!svg) return
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${planName.replace(/\s+/g, "_")}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [planName])

  const handleExportJson = useCallback(() => {
    const json = editorRef.current?.toJSON()
    if (!json) return
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${planName.replace(/\s+/g, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [planName])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading floor plan...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigate("/floor-plans")}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <input
          className="flex-1 border-none bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Floor plan name"
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2Icon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2Icon className="size-3.5" />
          </Button>
        </div>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={handleExportPng} title="Download PNG">
          <ImageIcon className="mr-1.5 size-3.5" />
          PNG
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportSvg} title="Download SVG">
          <DownloadIcon className="mr-1.5 size-3.5" />
          SVG
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportJson} title="Download JSON">
          <FileJsonIcon className="mr-1.5 size-3.5" />
          JSON
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <SaveIcon className="mr-1.5 size-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <EditorToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          activeFixtureType={activeFixtureType}
          onFixtureTypeChange={handleFixtureTypeChange}
          activeZoneType={activeZoneType}
          onZoneTypeChange={handleZoneTypeChange}
        />
        <FabricEditor
          ref={editorRef}
          data={data}
          onChange={setData}
          activeTool={activeTool}
          activeFixtureType={activeFixtureType}
          activeZoneType={activeZoneType}
          selectedId={selectedId}
          onSelect={setSelectedId}
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
