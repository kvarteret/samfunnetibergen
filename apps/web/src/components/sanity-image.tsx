"use client"

import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
import Image, { type ImageProps } from "next/image"

import {
  isSanityImageUrl,
  sanityImageFocus,
  sanityImageUrl,
} from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"

type SanityImageProps = Omit<
  ImageProps,
  | "blurDataURL"
  | "fill"
  | "height"
  | "loader"
  | "placeholder"
  | "preload"
  | "priority"
  | "quality"
  | "src"
  | "unoptimized"
  | "width"
> & {
  src: string
  /**
   * Width / height of the box. The CDN then crops to exactly this ratio around
   * the editor's hotspot; omit it for boxes whose ratio varies.
   */
  aspectRatio?: number
  frame?: ImageFrame | null
  /** Load immediately with high priority, for images visible on arrival. */
  priority?: boolean
  /** CDN quality for Sanity images; card-sized images look the same at 75. */
  quality?: number
}

/**
 * A covering image that fills its positioned parent. Sanity images are served
 * from the Sanity CDN in the sizes the browser asks for, framed on the
 * editor's crop and hotspot, with the asset's blurred preview showing until
 * the image arrives. Other sources fall back to the default image loader.
 */
export function SanityImage({
  aspectRatio,
  className,
  fetchPriority,
  frame,
  loading,
  priority = false,
  quality = 75,
  src,
  style,
  ...props
}: SanityImageProps) {
  const loadingProps = {
    fetchPriority: priority ? ("high" as const) : fetchPriority,
    loading: priority ? ("eager" as const) : loading,
  }

  if (!isSanityImageUrl(src)) {
    return (
      <Image
        {...props}
        {...loadingProps}
        className={cn("object-cover", className)}
        fill
        src={src}
        style={style}
      />
    )
  }

  const focus = sanityImageFocus(src, frame, aspectRatio)

  return (
    <>
      {frame?.lqip ? (
        <span
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-no-repeat blur-lg"
          style={{
            backgroundImage: `url("${frame.lqip}")`,
            backgroundPosition: focus.preview,
          }}
        />
      ) : null}
      <Image
        {...props}
        {...loadingProps}
        className={cn("object-cover", className)}
        fill
        loader={({ width }) =>
          sanityImageUrl(
            src,
            {
              width,
              height: aspectRatio ? Math.round(width / aspectRatio) : undefined,
              quality,
            },
            frame,
          )
        }
        src={src}
        style={{ objectPosition: focus.image, ...style }}
      />
    </>
  )
}
