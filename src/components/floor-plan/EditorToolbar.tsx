import {
  BoxIcon,
  HandIcon,
  MousePointerIcon,
  PentagonIcon,
  RulerIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { FIXTURE_PRESETS } from "./fixtures"
import type { EditorTool } from "./types"

type Props = {
  activeTool: EditorTool
  onToolChange: (tool: EditorTool) => void
  activeFixtureType: string | null
  onFixtureTypeChange: (type: string) => void
}

const TOOLS: { tool: EditorTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { tool: "select", label: "Select", icon: <MousePointerIcon className="size-4" />, shortcut: "V" },
  { tool: "pan", label: "Pan", icon: <HandIcon className="size-4" />, shortcut: "H" },
  { tool: "wall", label: "Wall", icon: <RulerIcon className="size-4" />, shortcut: "W" },
  { tool: "zone", label: "Zone", icon: <PentagonIcon className="size-4" />, shortcut: "Z" },
  { tool: "fixture", label: "Fixture", icon: <BoxIcon className="size-4" />, shortcut: "F" },
]

export function EditorToolbar({
  activeTool,
  onToolChange,
  activeFixtureType,
  onFixtureTypeChange,
}: Props) {
  return (
    <TooltipProvider delay={200}>
      <div className="flex w-14 flex-col items-center gap-1 border-r bg-background px-2 py-3">
        {TOOLS.map(({ tool, label, icon, shortcut }) => (
          <Tooltip key={tool}>
            <TooltipTrigger
              render={
                <Button
                  variant={activeTool === tool ? "default" : "ghost"}
                  size="icon"
                  className="size-10"
                  onClick={() => onToolChange(tool)}
                >
                  {icon}
                </Button>
              }
            />
            <TooltipContent side="right">
              {label} ({shortcut})
            </TooltipContent>
          </Tooltip>
        ))}

        {activeTool === "fixture" && (
          <>
            <div className="my-2 h-px w-full bg-border" />
            {FIXTURE_PRESETS.map((preset) => (
              <Tooltip key={preset.type}>
                <TooltipTrigger
                  render={
                    <button
                      className="flex size-10 items-center justify-center rounded-md border text-xs font-medium transition-colors"
                      style={{
                        backgroundColor:
                          activeFixtureType === preset.type
                            ? preset.color + "20"
                            : undefined,
                        borderColor:
                          activeFixtureType === preset.type
                            ? preset.color
                            : "transparent",
                        color: preset.color,
                      }}
                      onClick={() => onFixtureTypeChange(preset.type)}
                    >
                      <div
                        className="size-5 rounded-sm"
                        style={{ backgroundColor: preset.color + "CC" }}
                      />
                    </button>
                  }
                />
                <TooltipContent side="right">{preset.label}</TooltipContent>
              </Tooltip>
            ))}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
