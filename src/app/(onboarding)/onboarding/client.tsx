"use client"

import { useRouter } from "next/navigation"
import { PortraitUpload } from "@/components/onboarding/portrait-upload"

interface PortraitUploadClientProps {
  userId: string
}

export function PortraitUploadClient({ userId }: PortraitUploadClientProps) {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/welcome")
  }

  return <PortraitUpload userId={userId} onComplete={handleComplete} />
}
