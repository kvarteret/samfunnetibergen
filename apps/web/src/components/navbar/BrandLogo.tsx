import Image from "next/image"

import type { SiteLogoContent } from "@/lib/sanity/fetch"

const FALLBACK_SRC = "/kvarteret-logo.svg"
const FALLBACK_WIDTH = 100
const FALLBACK_HEIGHT = 62

function isSvgUrl(src: string) {
  return /\.svg(\?|$)/i.test(src)
}

interface BrandLogoProps {
  logo?: SiteLogoContent | null
  className?: string
  /** Rendered height in px used to size the requested/attribute image. */
  targetHeight?: number
}

/**
 * Site logo shown in the navbar and mobile menu. Uses the logo configured in
 * Sanity (Innstillinger → Logo) when present, otherwise the bundled default
 * `/kvarteret-logo.svg`. Height is controlled by the caller's classes
 * (`w-auto` + an explicit height); the Sanity asset's intrinsic ratio is
 * preserved through the image width/height attributes.
 */
export function BrandLogo({
  logo,
  className,
  targetHeight = 48,
}: BrandLogoProps) {
  const src = logo?.assetUrl || FALLBACK_SRC
  const intrinsicWidth = logo?.width && logo.width > 0 ? logo.width : 0
  const intrinsicHeight = logo?.height && logo.height > 0 ? logo.height : 0
  const ratio =
    intrinsicWidth > 0 && intrinsicHeight > 0
      ? intrinsicWidth / intrinsicHeight
      : FALLBACK_WIDTH / FALLBACK_HEIGHT
  const width = Math.max(1, Math.round(targetHeight * ratio))
  const height = targetHeight

  return (
    <Image
      alt="Samfunnet i Bergen logo"
      className={className}
      height={height}
      priority
      sizes={`${width}px`}
      src={src}
      unoptimized={isSvgUrl(src)}
      width={width}
    />
  )
}
