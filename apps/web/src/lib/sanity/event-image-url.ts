import { createImageUrlBuilder } from "@sanity/image-url"
import type { EventImageSource } from "@/features/events/domain/eventImage"
import { isSanityImageUrl, sanityImageUrl } from "./image-url"

const builder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
})

export function eventImageUrl(
  imageUrl: string | null | undefined,
  image: EventImageSource | null | undefined,
  width: number,
): string | null {
  if (!imageUrl) return null
  const height = Math.round((width * 9) / 16)
  if (image?.asset?._ref && isSanityImageUrl(imageUrl)) {
    return builder
      .image({
        asset: image.asset,
        ...(image.crop ? { crop: image.crop } : {}),
        ...(image.hotspot ? { hotspot: image.hotspot } : {}),
      })
      .size(width, height)
      .withOptions({ fit: "crop" })
      .auto("format")
      .quality(82)
      .url()
  }
  return sanityImageUrl(imageUrl, { width, height, fit: "crop" })
}
