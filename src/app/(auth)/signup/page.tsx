import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Create Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign up to start generating thumbnails
        </p>
      </div>

      <SignupForm />
    </div>
  )
}
