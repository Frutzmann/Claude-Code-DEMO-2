import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">YouTube Thumbnail Factory</CardTitle>
          <CardDescription className="text-center">
            Generate AI-powered thumbnails for your YouTube videos
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Setup in progress...</p>
        </CardContent>
      </Card>
    </div>
  );
}
