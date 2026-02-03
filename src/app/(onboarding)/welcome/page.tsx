import { WelcomeTutorial } from "@/components/onboarding/welcome-tutorial"

export default function WelcomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Welcome to YouTube Thumbnail Factory</h2>
        <p className="text-muted-foreground">
          Here is how it works
        </p>
      </div>

      <WelcomeTutorial />
    </div>
  )
}
