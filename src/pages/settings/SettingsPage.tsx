import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export function SettingsPage() {
  const { user, signOut } = useSupabaseAuth()
  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and session.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Signed-in user details from your authentication provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{user?.email ?? "—"}</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Display name
            </p>
            <p className="text-sm">{fullName ?? "—"}</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              User ID
            </p>
            <p className="font-mono text-xs text-muted-foreground break-all">
              {user?.id ?? "—"}
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void signOut()
              }}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
