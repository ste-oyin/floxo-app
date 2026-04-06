import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"

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

export function SignupPage() {
  const { signUp } = useSupabaseAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    const { error } = await signUp(email, password, fullName)
    setSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Open it to verify your account, then sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/login"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-2xl">Create an account</CardTitle>
          <CardDescription>
            Start analyzing floor plans with Floxo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
              {submitting ? "Creating account…" : "Sign up"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
