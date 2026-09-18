import { SanityImage as SanityImageBase, type WrapperProps } from "sanity-image"

import { sanityImageBaseUrl } from "@/lib/sanity/image-url"

/**
 * Project binding for `sanity-image`, the image component Sanity ships in its
 * own Next.js template (`sanity-io/sanity-template-nextjs-clean`).
 *
 * Content images render through it so URL building, `srcSet` widths, AVIF/WebP
 * negotiation, hotspot/crop handling and the `width`/`height` attributes that
 * avoid layout shift stay the library's job instead of ours.
 *
 * The default `mode="contain"` fits the whole artwork into the space it is
 * given without cropping, and without demanding a particular aspect ratio from
 * editors. Reserve `mode="cover"` for decorative, full-bleed fills.
 */
export function SanityImage<T extends React.ElementType = "img">(
  props: WrapperProps<T>,
) {
  return <SanityImageBase baseUrl={sanityImageBaseUrl} {...props} />
}
