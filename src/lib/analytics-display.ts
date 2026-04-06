export function assetUrl(path: string): string | undefined {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "")
  if (!base) return undefined
  return `${base}/files/${encodeURIComponent(path)}`
}

export function metricsFromJson(metrics: Record<string, unknown>) {
  return Object.entries(metrics).map(([key, value]) => {
    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    const display =
      typeof value === "number"
        ? value.toLocaleString()
        : typeof value === "string"
          ? value
          : JSON.stringify(value)
    return {
      name: label,
      value: display,
      unit: "",
      description: `Value from analytics payload for ${key}.`,
      impact:
        "Use this metric with other signals to interpret layout performance.",
      action:
        "Compare runs over time and tie changes to campaigns or floor updates.",
    }
  })
}
