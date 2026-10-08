import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
import type { ReactNode } from "react"

import { SanityImage } from "@/components/sanity-image"
import { cn } from "@/lib/utils"

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  /** CSS ratio such as "16/9"; an empty string lets the box stretch. */
  aspectRatio?: string
  fallback: ReactNode
  className?: string
  frame?: ImageFrame | null
  sizes?: string
  priority?: boolean
}

function parseRatio(aspectRatio: string) {
  const [width, height = 1] = aspectRatio.split("/").map(Number)
  const ratio = width / height
  return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined
}

export function ImageWithFallback({
  src,
  alt,
  aspectRatio = "16/9",
  fallback,
  className,
  frame,
  sizes,
  priority,
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
      <SanityImage
        alt={alt}
        aspectRatio={aspectRatio ? parseRatio(aspectRatio) : undefined}
        frame={frame}
        priority={priority}
        sizes={sizes}
        src={src}
      />
    </div>
  )
}
