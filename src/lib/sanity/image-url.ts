type SanityImageSize = {
  height: number
  width: number
}

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
  url.searchParams.set("fit", "crop")
  url.searchParams.set("h", String(size.height))
  url.searchParams.set("q", "82")
  url.searchParams.set("w", String(size.width))
  return url.toString()
}

export function shouldLoadImageDirectly(src: string) {
  return src.startsWith("blob:") || isSanityImageUrl(src)
}
