import { headers } from "next/headers"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""

  // Determine current step based on path
  const currentStep = pathname.includes("/welcome") ? 2 : 1

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">YouTube Thumbnail Factory</h1>
          <p className="text-muted-foreground mt-2">
            Get started with your account
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`
                size-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              `}
            >
              1
            </div>
            <span className={`text-sm ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
              Portrait
            </span>
          </div>

          <div className="w-8 h-px bg-border" />

          <div className="flex items-center gap-2">
            <div
              className={`
                size-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              `}
            >
              2
            </div>
            <span className={`text-sm ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
              Welcome
            </span>
          </div>
        </div>

        <div className="glass rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
