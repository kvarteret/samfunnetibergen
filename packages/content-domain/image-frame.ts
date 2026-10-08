// Sanity image crop and hotspot, applied the same way in Studio and on the
// website so a focus set by an editor is what visitors see.

export type ImageCrop = {
  top: number
  bottom: number
  left: number
  right: number
}

export type ImageHotspot = {
  x: number
  y: number
  width: number
  height: number
}

export type ImageFrame = {
  crop?: ImageCrop | null
  hotspot?: ImageHotspot | null
  /** Sanity's blurred preview of the whole original image (`metadata.lqip`). */
  lqip?: string | null
}

/** A rectangle in fractions (0–1) of the original image. */
export type FrameRect = {
  left: number
  top: number
  width: number
  height: number
}

export type ImageSize = { width: number; height: number }

const FULL_CROP: ImageCrop = { top: 0, bottom: 0, left: 0, right: 0 }
const CENTER_HOTSPOT: ImageHotspot = { x: 0.5, y: 0.5, width: 1, height: 1 }

/** Reads dimensions from an asset reference or CDN URL (`…-1600x1200.jpg`). */
export function imageDimensions(
  refOrUrl: string | null | undefined,
): ImageSize | null {
  const match = /-(\d+)x(\d+)[.-][a-z0-9]+(?:$|\?)/i.exec(refOrUrl ?? "")
  if (!match) return null
  const width = Number(match[1])
  const height = Number(match[2])
  return width > 0 && height > 0 ? { width, height } : null
}

/**
 * Mirrors `fit("crop")` in @sanity/image-url: the largest rectangle of the
 * requested ratio inside the editor's crop, centred on the hotspot.
 */
export function cropFrame(
  size: ImageSize,
  frame: ImageFrame | null | undefined,
  aspectRatio: number,
): FrameRect {
  const crop = frame?.crop ?? FULL_CROP
  const hotspot = frame?.hotspot ?? CENTER_HOTSPOT
  const cropLeft = crop.left * size.width
  const cropTop = crop.top * size.height
  const cropWidth = size.width - crop.right * size.width - cropLeft
  const cropHeight = size.height - crop.bottom * size.height - cropTop
  const hotspotX = hotspot.x * size.width
  const hotspotY = hotspot.y * size.height

  let rect: FrameRect
  if (cropWidth / cropHeight > aspectRatio) {
    const width = cropHeight * aspectRatio
    const left = Math.min(
      Math.max(hotspotX - width / 2, cropLeft),
      cropLeft + cropWidth - width,
    )
    rect = { left, top: cropTop, width, height: cropHeight }
  } else {
    const height = cropWidth / aspectRatio
    const top = Math.min(
      Math.max(hotspotY - height / 2, cropTop),
      cropTop + cropHeight - height,
    )
    rect = { left: cropLeft, top, width: cropWidth, height }
  }
  return {
    left: rect.left / size.width,
    top: rect.top / size.height,
    width: rect.width / size.width,
    height: rect.height / size.height,
  }
}

/** The Sanity CDN `rect` parameter (pixels) for a frame. */
export function rectParam(size: ImageSize, rect: FrameRect): string {
  return [
    rect.left * size.width,
    rect.top * size.height,
    rect.width * size.width,
    rect.height * size.height,
  ]
    .map(Math.round)
    .join(",")
}
