import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SuggestionCardProps = {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  metric_source: string
  expected_impact: string
}

const priorityClass: Record<SuggestionCardProps["priority"], string> = {
  high: "",
  medium:
    "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-50",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50",
}

export function SuggestionCard({
  title,
  description,
  priority,
  metric_source,
  expected_impact,
}: SuggestionCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge
            variant={priority === "high" ? "destructive" : "outline"}
            className={cn(
              priority !== "high" && priorityClass[priority],
              "capitalize"
            )}
          >
            {priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
            Source: {metric_source}
          </span>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Expected impact
          </p>
          <p className="mt-1 text-foreground">{expected_impact}</p>
        </div>
      </CardContent>
    </Card>
  )
}
