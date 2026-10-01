import Image from "next/image"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { EventImageCrop } from "../domain/eventImage"

interface EventImageFrameProps {
  alt: string
  className?: string
  fallback?: ReactNode
  previewCrop?: EventImageCrop | null
  priority?: boolean
  sizes: string
  src: string | null
}

export function EventImageFrame({
  alt,
  className,
  fallback,
  previewCrop,
  priority,
  sizes,
  src,
}: EventImageFrameProps) {
  const isBlob = src?.startsWith("blob:") ?? false
  const cropWidth = previewCrop ? 1 - previewCrop.left - previewCrop.right : 1
  const cropHeight = previewCrop ? 1 - previewCrop.top - previewCrop.bottom : 1

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-muted",
        className,
      )}
    >
      {src ? (
        isBlob && previewCrop ? (
          // biome-ignore lint/performance/noImgElement: live blob preview must show the original Sanity crop
          <img
            alt={alt}
            className="absolute max-w-none"
            src={src}
            style={{
              width: `${100 / cropWidth}%`,
              height: `${100 / cropHeight}%`,
              left: `${(-previewCrop.left / cropWidth) * 100}%`,
              top: `${(-previewCrop.top / cropHeight) * 100}%`,
            }}
          />
        ) : (
          <Image
            alt={alt}
            className="object-cover"
            fill
            priority={priority}
            sizes={sizes}
            src={src}
            unoptimized={isBlob}
          />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {fallback}
        </div>
      )}
    </div>
  )
}
