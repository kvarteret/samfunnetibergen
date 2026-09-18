type SanityImageSize = {
  height: number
  width: number
}

// Sanity asset filenames end in `-<width>x<height>` before the extension, e.g.
// `...-1200x628.png`. The numbers describe the source asset, so they stay
// readable even after we add transform parameters to the query string.
const SANITY_ASSET_DIMENSIONS = /-(\d+)x(\d+)(?:\.[a-z0-9]+)?$/i

export function isSanityImageUrl(src: string) {
  try {
    return new URL(src).hostname === "cdn.sanity.io"
  } catch {
    return false
  }
}

export function sanityImageUrl(src: string, size: SanityImageSize) {
  if (!isSanityImageUrl(src)) return src

  const url = new URL(src)
  url.searchParams.set("auto", "format")
  // `max` scales the asset down inside the requested box without cropping and
  // without upscaling it, so the whole source image survives the round trip.
  // `crop` (the previous value) trimmed whatever did not match the box, which
  // silently removed parts of posters, logos and photo edges.
  url.searchParams.set("fit", "max")
  url.searchParams.set("h", String(size.height))
  url.searchParams.set("q", "82")
  url.searchParams.set("w", String(size.width))
  return url.toString()
}

/**
 * Returns the source aspect ratio (`width / height`) of a Sanity image URL.
 *
 * The website needs this to size an image frame to the artwork it holds, so
 * editors are not forced to upload a particular aspect ratio.
 */
export function sanityImageAspectRatio(src: string): number | null {
  if (!isSanityImageUrl(src)) return null

  let pathname: string
  try {
    pathname = new URL(src).pathname
  } catch {
    return null
  }

  const match = SANITY_ASSET_DIMENSIONS.exec(pathname)
  if (!match) return null

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null

  return width / height
}

export function shouldLoadImageDirectly(src: string) {
  return src.startsWith("blob:") || isSanityImageUrl(src)
}
