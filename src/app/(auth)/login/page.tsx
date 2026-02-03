import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Sign In</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your credentials to access your account
        </p>
      </div>

      {message && (
        <div className="rounded-md bg-muted p-3 text-center text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
          {error === "auth_callback_error"
            ? "There was an error with authentication. Please try again."
            : error}
        </div>
      )}

      <LoginForm />
    </div>
  )
}
