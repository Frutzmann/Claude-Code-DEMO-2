"use client"

import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
}

interface PortraitSelectorProps {
  portraits: Portrait[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function PortraitSelector({
  portraits,
  value,
  onChange,
  disabled = false,
}: PortraitSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select a portrait" />
      </SelectTrigger>
      <SelectContent>
        {portraits.map((portrait) => (
          <SelectItem key={portrait.id} value={portrait.id}>
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={portrait.public_url}
                  alt={portrait.label || "Portrait"}
                  width={24}
                  height={24}
                  className="object-cover size-full"
                />
              </div>
              <span>{portrait.label || "Untitled"}</span>
              {portrait.is_active && (
                <span className="text-xs text-muted-foreground">(Active)</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
