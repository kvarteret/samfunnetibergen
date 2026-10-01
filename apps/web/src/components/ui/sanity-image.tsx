"use client"

import { SanityImage as SanityImageBase, type WrapperProps } from "sanity-image"

import { sanityImageBaseUrl } from "@/lib/sanity/image-url"

/**
 * The image data our queries project for every content image.
 */
export type ContentImageSource = {
  id?: string | null
  hotspot?: { x: number; y: number } | null
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  } | null
  lqip?: string | null
}

type SanityImageProps<T extends React.ElementType = "img"> = Omit<
  WrapperProps<T>,
  "crop" | "hotspot" | "id" | "mode" | "preview"
> & {
  image: ContentImageSource
  mode?: "contain" | "cover"
}

/**
 * Project binding for `sanity-image`, the image component Sanity ships in its
 * own Next.js template (`sanity-io/sanity-template-nextjs-clean`).
 *
 * Content images render through it so URL building, `srcSet` widths, AVIF/WebP
 * negotiation, hotspot/crop handling and the `width`/`height` attributes that
 * avoid layout shift stay the library's job instead of ours.
 *
 * Pass the projected image source as `image`; the hotspot, crop and LQIP blob
 * are wired up here once instead of at every call site.
 *
 * The default `mode="contain"` fits the whole artwork into the space it is
 * given without cropping, and without demanding a particular aspect ratio from
 * editors. Reserve `mode="cover"` for decorative, full-bleed fills.
 */
export function SanityImage<T extends React.ElementType = "img">({
  image,
  mode = "contain",
  ...props
}: SanityImageProps<T>) {
  if (!image.id) return null

  const resolved = {
    crop: image.crop ?? undefined,
    hotspot: image.hotspot ?? undefined,
    id: image.id,
    mode,
    preview: image.lqip ?? undefined,
    ...props,
  } as WrapperProps<T>

  return <SanityImageBase baseUrl={sanityImageBaseUrl} {...resolved} />
}
