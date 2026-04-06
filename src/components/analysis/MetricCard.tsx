import { InfoIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type MetricCardProps = {
  name: string
  value: string | number
  unit?: string
  description: string
  impact: string
  action: string
}

export function MetricCard({
  name,
  value,
  unit,
  description,
  impact,
  action,
}: MetricCardProps) {
  return (
    <Card size="sm" className="shadow-sm">
      <CardContent className="flex flex-col gap-2 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">{name}</p>
            <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight">
              {value}
              {unit ? (
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  {unit}
                </span>
              ) : null}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`About ${name}`}
            >
              <InfoIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="end"
              className="max-w-sm space-y-2 text-left"
            >
              <div>
                <p className="font-medium text-background">What it measures</p>
                <p className="text-background/90">{description}</p>
              </div>
              <div>
                <p className="font-medium text-background">Why it matters</p>
                <p className="text-background/90">{impact}</p>
              </div>
              <div>
                <p className="font-medium text-background">What to do</p>
                <p className="text-background/90">{action}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}
