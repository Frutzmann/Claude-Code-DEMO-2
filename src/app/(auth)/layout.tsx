export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display">YouTube Thumbnail Factory</h1>
          <p className="text-muted-foreground mt-2 font-body">
            Generate AI-powered thumbnails
          </p>
        </div>
        <div className="glass rounded-lg p-6 glow-border">{children}</div>
      </div>
    </div>
  )
}
