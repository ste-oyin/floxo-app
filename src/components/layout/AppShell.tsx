import {
  FlameIcon,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings,
  Upload,
} from "lucide-react"
import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { cn } from "@/lib/utils"

const navLinkClass = ({
  isActive,
}: {
  isActive: boolean
}) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
  )

function userInitials(email: string | undefined) {
  if (!email) return "?"
  const local = email.split("@")[0] ?? ""
  const parts = local.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
  }
  return local.slice(0, 2).toUpperCase() || "?"
}

export function AppShell() {
  const { user, signOut } = useSupabaseAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  const sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-heading text-lg font-semibold tracking-tight text-sidebar-foreground">
          Floxo
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <NavLink
          to="/"
          end
          className={navLinkClass}
          onClick={closeMobile}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          Dashboard
        </NavLink>
        <NavLink to="/floor-plans" className={navLinkClass} onClick={closeMobile}>
          <Map className="size-4 shrink-0" />
          Floor Plans
        </NavLink>
        <NavLink
          to="/analysis/upload"
          className={navLinkClass}
          onClick={closeMobile}
        >
          <Upload className="size-4 shrink-0" />
          Upload Analysis
        </NavLink>
        <NavLink to="/heatmap" className={navLinkClass} onClick={closeMobile}>
          <FlameIcon className="size-4 shrink-0" />
          Heatmap
        </NavLink>
        <NavLink to="/settings" className={navLinkClass} onClick={closeMobile}>
          <Settings className="size-4 shrink-0" />
          Settings
        </NavLink>
      </nav>
    </aside>
  )

  return (
    <div className="flex min-h-svh w-full bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex flex-1 items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {userInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem
                  onClick={() => {
                    void navigate("/settings")
                  }}
                >
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    void signOut()
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
