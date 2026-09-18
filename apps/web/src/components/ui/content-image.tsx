import Image from "next/image"
import type { ReactNode } from "react"

import {
  sanityImageAspectRatio,
  shouldLoadImageDirectly,
} from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"

/**
 * One place that decides how content imagery is loaded and framed.
 *
 * Editors upload event posters, press photos and group images in whatever
 * shape the source material happens to have. Cropping those to a fixed box
 * cuts off logos, captions and faces, and an image that only fills part of its
 * box can look shifted. So content images are fitted, never cropped:
 *
 * - `object-contain` keeps the whole image visible inside its frame.
 * - `aspectRatio="auto"` sizes the frame to the artwork (see
 *   `sanityImageAspectRatio`), clamped by `minAspectRatio`/`maxAspectRatio` so
 *   page rhythm stays intact.
 * - The frame carries no background of its own, so any letterboxing created by
 *   the clamp is invisible against the surrounding surface.
 *
 * Use `objectFit="cover"` only for decorative, full-bleed fills where the
 * imagery is a background treatment rather than something a reader reads.
 */

export const CONTENT_IMAGE_FALLBACK_ASPECT_RATIO = 16 / 9
export const DEFAULT_MIN_ASPECT_RATIO = 3 / 4
export const DEFAULT_MAX_ASPECT_RATIO = 21 / 9

export type ContentImageAspectRatio = number | string | "auto" | null

interface ContentImageProps {
  alt: string
  src?: string | null
  sizes: string
  /** `"auto"` follows the artwork, `null` leaves the frame unsized. */
  aspectRatio?: ContentImageAspectRatio
  className?: string
  fallback?: ReactNode
  imageClassName?: string
  maxAspectRatio?: number
  minAspectRatio?: number
  objectFit?: "contain" | "cover"
  priority?: boolean
  unoptimized?: boolean
}

/**
 * Resolves the aspect ratio a frame should use. Sanity asset URLs carry the
 * source dimensions, so the frame can match the artwork without extra data.
 */
export function resolveContentImageAspectRatio({
  aspectRatio = "auto",
  maxAspectRatio = DEFAULT_MAX_ASPECT_RATIO,
  minAspectRatio = DEFAULT_MIN_ASPECT_RATIO,
  src,
}: {
  aspectRatio?: ContentImageAspectRatio
  maxAspectRatio?: number
  minAspectRatio?: number
  src?: string | null
}): number | string | null {
  if (aspectRatio !== "auto") return aspectRatio ?? null

  const intrinsic = src ? sanityImageAspectRatio(src) : null
  if (intrinsic == null) return CONTENT_IMAGE_FALLBACK_ASPECT_RATIO

  return Math.min(Math.max(intrinsic, minAspectRatio), maxAspectRatio)
}

export function ContentImage({
  alt,
  src,
  sizes,
  aspectRatio = "auto",
  className,
  fallback,
  imageClassName,
  maxAspectRatio,
  minAspectRatio,
  objectFit = "contain",
  priority,
  unoptimized,
}: ContentImageProps) {
  const frameAspectRatio = resolveContentImageAspectRatio({
    aspectRatio,
    maxAspectRatio,
    minAspectRatio,
    src,
  })
  const frameStyle =
    frameAspectRatio == null ? undefined : { aspectRatio: frameAspectRatio }

  if (!src) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden",
          className,
        )}
        style={frameStyle}
      >
        {fallback}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={frameStyle}
    >
      <Image
        alt={alt}
        className={cn(
          objectFit === "cover" ? "object-cover" : "object-contain",
          imageClassName,
        )}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized={unoptimized ?? shouldLoadImageDirectly(src)}
      />
    </div>
  )
}
