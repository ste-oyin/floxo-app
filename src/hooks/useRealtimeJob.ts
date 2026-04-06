import { useEffect, useState } from "react"

import { getJobStatus } from "@/lib/api"
import { supabase } from "@/lib/supabase"

type RealtimeJobState = {
  status: string | null
  progress_pct: number | null
  error_message: string | null
}

export function useRealtimeJob(jobId: string | undefined): RealtimeJobState {
  const [state, setState] = useState<RealtimeJobState>({
    status: null,
    progress_pct: null,
    error_message: null,
  })

  useEffect(() => {
    if (!jobId) return

    const resolvedId = jobId
    let cancelled = false

    function applyJob(job: {
      status: string
      progress_pct: number
      error_message: string | null
    }) {
      setState({
        status: job.status,
        progress_pct: job.progress_pct,
        error_message: job.error_message,
      })
    }

    void getJobStatus(resolvedId)
      .then((job) => {
        if (cancelled) return
        applyJob(job)
      })
      .catch(() => {
        if (cancelled) return
        setState({
          status: null,
          progress_pct: null,
          error_message: null,
        })
      })

    const poll = setInterval(() => {
      void getJobStatus(resolvedId)
        .then((job) => {
          if (cancelled) return
          applyJob(job)
        })
        .catch(() => {})
    }, 2000)

    const channel = supabase
      .channel(`job:${resolvedId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${resolvedId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null
          if (!row) return
          setState({
            status: typeof row.status === "string" ? row.status : null,
            progress_pct:
              typeof row.progress_pct === "number" ? row.progress_pct : null,
            error_message:
              row.error_message === null ||
              typeof row.error_message === "string"
                ? (row.error_message as string | null)
                : null,
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [jobId])

  if (!jobId) {
    return {
      status: null,
      progress_pct: null,
      error_message: null,
    }
  }

  return state
}
