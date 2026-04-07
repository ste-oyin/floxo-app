import { useCallback, useRef, useState } from "react"
import type { FloorPlanData } from "./types"

const MAX_HISTORY = 50

export function useHistory(initial: FloorPlanData) {
  const [data, setDataInternal] = useState(initial)
  const pastRef = useRef<FloorPlanData[]>([])
  const futureRef = useRef<FloorPlanData[]>([])

  const setData = useCallback(
    (next: FloorPlanData) => {
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), data]
      futureRef.current = []
      setDataInternal(next)
    },
    [data],
  )

  const undo = useCallback(() => {
    const past = pastRef.current
    if (past.length === 0) return
    const previous = past[past.length - 1]
    pastRef.current = past.slice(0, -1)
    futureRef.current = [data, ...futureRef.current]
    setDataInternal(previous)
  }, [data])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (future.length === 0) return
    const next = future[0]
    futureRef.current = future.slice(1)
    pastRef.current = [...pastRef.current, data]
    setDataInternal(next)
  }, [data])

  const canUndo = pastRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  const resetHistory = useCallback((newData: FloorPlanData) => {
    pastRef.current = []
    futureRef.current = []
    setDataInternal(newData)
  }, [])

  return { data, setData, undo, redo, canUndo, canRedo, resetHistory }
}
