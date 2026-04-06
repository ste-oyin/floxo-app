import { useCallback, useRef, useState } from "react"
import { FilmIcon, UploadCloudIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type VideoUploaderProps = {
  onUpload: (file: File) => void
  className?: string
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function VideoUploader({ onUpload, className }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)

  const resetProgressLater = useCallback(() => {
    setProgress(0)
  }, [])

  const simulateProgress = useCallback(() => {
    setProgress(8)
    const start = Date.now()
    const duration = 900
    const tick = () => {
      const t = (Date.now() - start) / duration
      const next = Math.min(100, Math.round(t * 100))
      setProgress(next)
      if (next < 100) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

  const handleFile = useCallback(
    (next: File | null) => {
      if (!next) return
      if (!next.type.startsWith("video/")) return
      setFile(next)
      simulateProgress()
      onUpload(next)
    },
    [onUpload, simulateProgress]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files?.[0]
      handleFile(f ?? null)
    },
    [handleFile]
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border border-dashed bg-muted/30 p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-foreground/20 hover:bg-muted/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-foreground/10">
            <UploadCloudIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Drop a video here</p>
            <p className="text-xs text-muted-foreground">
              MP4, MOV, or WebM — up to your plan limits
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
          >
            Browse files
          </Button>
        </div>
      </div>

      {file ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/10">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-muted">
              <FilmIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                resetProgressLater()
              }}
            >
              Remove
            </Button>
          </div>
            <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Upload progress</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="w-full flex-col gap-2 [&_[data-slot=progress-track]]:w-full"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
