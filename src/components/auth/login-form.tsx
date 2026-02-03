"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/actions/auth"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("email", data.email)
      formData.append("password", data.password)

      const result = await signIn(formData)
      if (result?.error) {
        toast.error(result.error)
      }
    } catch (error) {
      if (isRedirectError(error)) {
        throw error
      }
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          {...register("email")}
          id="email"
          type="email"
          placeholder="you@example.com"
          disabled={isLoading}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          {...register("password")}
          id="password"
          type="password"
          disabled={isLoading}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="space-y-2 text-center text-sm">
        <p>
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-foreground underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  )
}
