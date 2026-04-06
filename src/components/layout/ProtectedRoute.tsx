import { Loader2 } from "lucide-react"
import { Navigate, Outlet } from "react-router-dom"

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export function ProtectedRoute() {
  const { user, loading } = useSupabaseAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2
          className="size-8 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
