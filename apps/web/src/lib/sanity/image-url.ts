import { buildSrc } from "sanity-image"

import { dataset, projectId } from "./env"

export const sanityImageBaseUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/`

/**
 * Absolute CDN URL for consumers that need a URL rather than an element:
 * Open Graph tags, structured data and the public events API. Rendering goes
 * through `<SanityImage>`, which builds its own `srcSet`.
 */
export function sanityImageUrl(
  id: string,
  {
    height,
    mode = "contain",
    width,
  }: { height?: number; mode?: "contain" | "cover"; width: number },
) {
  return buildSrc({ baseUrl: sanityImageBaseUrl, height, id, mode, width }).src
}
