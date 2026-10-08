import {
  cropFrame,
  type FrameRect,
  type ImageFrame,
  imageDimensions,
  rectParam,
} from "@samfunnet/content-domain/image-frame"

type SanityImageSize = {
  width: number
  /** Omit to keep the editor's crop at its own ratio, for boxes that stretch. */
  height?: number
  /** CDN quality, 1–100. */
  quality?: number
}

export function isSanityImageUrl(src: string) {
  try {
    return new URL(src).hostname === "cdn.sanity.io"
  } catch {
    return false
  }
}

/** The editor's crop as a frame rect, without fitting it to a ratio. */
function editorCropRect(frame: ImageFrame): FrameRect | null {
  const crop = frame.crop
  if (!crop) return null
  return {
    left: crop.left,
    top: crop.top,
    width: 1 - crop.left - crop.right,
    height: 1 - crop.top - crop.bottom,
  }
}

/**
 * Sizes an image on the Sanity CDN, honouring the editor's crop and hotspot
 * when given. With a height the result is cropped to exactly that ratio;
 * without one only the editor's crop applies.
 */
export function sanityImageUrl(
  src: string,
  size: SanityImageSize,
  frame?: ImageFrame | null,
) {
  if (!isSanityImageUrl(src)) return src

  const url = new URL(src)
  const dimensions = frame ? imageDimensions(url.pathname) : null
  const rect =
    dimensions && frame
      ? size.height
        ? cropFrame(dimensions, frame, size.width / size.height)
        : editorCropRect(frame)
      : null
  if (dimensions && rect) {
    url.searchParams.set("rect", rectParam(dimensions, rect))
  }
  url.searchParams.set("auto", "format")
  if (size.height) {
    url.searchParams.set("fit", "crop")
    url.searchParams.set("h", String(size.height))
  }
  url.searchParams.set("q", String(size.quality ?? 82))
  url.searchParams.set("w", String(size.width))
  return url.toString()
}

const percent = (value: number) => `${Math.round(value * 1000) / 10}%`

/** `object-position` value that shows the region `rect` of a covering image. */
function coverPosition(rect: FrameRect) {
  const axis = (start: number, extent: number) =>
    extent < 1 ? start / (1 - extent) : 0.5
  return `${percent(axis(rect.left, rect.width))} ${percent(axis(rect.top, rect.height))}`
}

/**
 * Where to anchor a covering image and its blurred preview so both show the
 * editor's focus.
 *
 * With `aspectRatio` the CDN already crops the image itself, so only the
 * preview (the whole original) needs positioning on the same region. Without
 * one the image keeps the editor's crop and CSS places the hotspot.
 */
export function sanityImageFocus(
  src: string,
  frame: ImageFrame | null | undefined,
  aspectRatio?: number,
): { image?: string; preview: string } {
  const hotspot = frame?.hotspot
  const dimensions = isSanityImageUrl(src)
    ? imageDimensions(new URL(src).pathname)
    : null

  if (aspectRatio && dimensions) {
    return { preview: coverPosition(cropFrame(dimensions, frame, aspectRatio)) }
  }
  if (!hotspot) return { preview: "50% 50%" }

  const crop = frame ? editorCropRect(frame) : null
  const within = (point: number, start = 0, extent = 1) =>
    Math.min(Math.max((point - start) / extent, 0), 1)
  return {
    image: `${percent(within(hotspot.x, crop?.left, crop?.width))} ${percent(within(hotspot.y, crop?.top, crop?.height))}`,
    preview: `${percent(hotspot.x)} ${percent(hotspot.y)}`,
  }
}

export function shouldLoadImageDirectly(src: string) {
  return src.startsWith("blob:") || isSanityImageUrl(src)
}
