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
import { forgotPassword } from "@/actions/auth"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth"

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true)
    try {
      const result = await forgotPassword(data.email)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setEmailSent(true)
        toast.success("Check your email for a reset link")
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

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-muted-foreground">
          We&apos;ve sent you a password reset link. Please check your inbox and
          follow the instructions.
        </p>
        <Link
          href="/login"
          className="text-sm text-foreground underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    )
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending email...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
