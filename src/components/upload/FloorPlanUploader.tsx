import { useCallback, useRef, useState } from "react"
import { ImageIcon, UploadCloudIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FloorPlanUploaderProps = {
  onUpload: (file: File) => void
  className?: string
}

export function FloorPlanUploader({
  onUpload,
  className,
}: FloorPlanUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    (next: File | null) => {
      if (!next) return
      if (!next.type.startsWith("image/")) return
      setFile(next)
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(next)
      })
      onUpload(next)
    },
    [onUpload]
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
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-foreground/10">
            <UploadCloudIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Drop a floor plan image</p>
            <p className="text-xs text-muted-foreground">
              PNG or JPG — keep lines crisp for best calibration
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
            Browse images
          </Button>
        </div>
      </div>

      {file && preview ? (
        <div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/10">
          <div className="size-24 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
            <img
              src={preview}
              alt=""
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              <p className="truncate text-sm font-medium">{file.name}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 px-0"
              onClick={() => {
                setFile(null)
                setPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev)
                  return null
                })
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
