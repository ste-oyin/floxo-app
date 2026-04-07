/**
 * Extract a single frame from a video file as a data URL.
 * Seeks to `seekSeconds` (default 1s) to avoid blank first frames.
 */
export function extractVideoFrame(
  file: File,
  seekSeconds = 1,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.muted = true
    video.playsInline = true

    const url = URL.createObjectURL(file)
    video.src = url

    const cleanup = () => URL.revokeObjectURL(url)

    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Math.min(seekSeconds, video.duration * 0.1)
    })

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        cleanup()
        reject(new Error("Could not get canvas context"))
        return
      }
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL("image/png")
      cleanup()
      resolve({ dataUrl, width: video.videoWidth, height: video.videoHeight })
    })

    video.addEventListener("error", () => {
      cleanup()
      reject(new Error("Failed to load video"))
    })
  })
}
