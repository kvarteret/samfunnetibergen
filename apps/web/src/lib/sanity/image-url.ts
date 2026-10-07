import {
  cropFrame,
  type ImageFrame,
  imageDimensions,
  rectParam,
} from "@samfunnet/content-domain/image-frame"

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

/** Crops to `size`, honouring the editor's crop and hotspot when given. */
export function sanityImageUrl(
  src: string,
  size: SanityImageSize,
  frame?: ImageFrame | null,
) {
  if (!isSanityImageUrl(src)) return src

  const url = new URL(src)
  const dimensions = frame ? imageDimensions(url.pathname) : null
  if (dimensions) {
    url.searchParams.set(
      "rect",
      rectParam(
        dimensions,
        cropFrame(dimensions, frame, size.width / size.height),
      ),
    )
  }
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
