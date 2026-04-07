import type { FixturePreset } from "./types"

export const FIXTURE_PRESETS: FixturePreset[] = [
  // Fixtures
  { type: "shelf", label: "Shelves", icon: "shelf", category: "fixture", width: 120, height: 40, color: "#4a7ab5" },
  { type: "counter", label: "Counters", icon: "counter", category: "fixture", width: 160, height: 60, color: "#4a9ab5" },
  { type: "display", label: "Displays", icon: "display", category: "fixture", width: 80, height: 80, color: "#b5884a" },
  { type: "island", label: "Island", icon: "island", category: "fixture", width: 100, height: 100, color: "#6a8ab5" },
  { type: "gondola", label: "Gondola", icon: "gondola", category: "fixture", width: 140, height: 50, color: "#5a7a9e" },
  { type: "table", label: "Table", icon: "table", category: "fixture", width: 80, height: 80, color: "#7a8a6e" },
  { type: "checkout-lane", label: "Checkout", icon: "checkout", category: "fixture", width: 100, height: 60, color: "#b55a5a" },

  // Structure
  { type: "door", label: "Door", icon: "door", category: "structure", width: 60, height: 10, color: "#5ab580" },
  { type: "entrance", label: "Entrance", icon: "entrance", category: "structure", width: 100, height: 10, color: "#5ab58a" },
  { type: "window", label: "Window", icon: "window", category: "structure", width: 80, height: 10, color: "#8ab5b5" },
  { type: "pillar", label: "Pillar", icon: "pillar", category: "structure", width: 30, height: 30, color: "#8a8a8a" },
]

export const ZONE_PRESETS: { type: string; label: string; color: string }[] = [
  { type: "high-value", label: "High Value", color: "#ef4444" },
  { type: "low-value", label: "Low Value", color: "#3b82f6" },
  { type: "checkout", label: "Checkout", color: "#f59e0b" },
  { type: "walkway", label: "Walkway", color: "#10b981" },
  { type: "custom", label: "Custom", color: "#8b5cf6" },
]
