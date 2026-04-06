import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useSupabaseAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }
    void navigate("/", { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {message ? (
              <p className="text-sm text-destructive" role="alert">
                {message}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
