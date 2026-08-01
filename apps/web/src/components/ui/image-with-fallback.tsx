import Image from "next/image"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  aspectRatio?: string
  fallback: ReactNode
  className?: string
  sizes?: string
  priority?: boolean
  unoptimized?: boolean
}

export function ImageWithFallback({
  src,
  alt,
  aspectRatio = "16/9",
  fallback,
  className,
  sizes,
  priority,
  unoptimized,
}: ImageWithFallbackProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-muted",
          className,
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {fallback}
      </div>
    )
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <Image
        alt={alt}
        className="object-cover"
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized={unoptimized}
      />
    </div>
  )
}
