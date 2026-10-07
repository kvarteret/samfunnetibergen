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
export type FrameSource = {
  asset?: { _ref?: string | null } | null
  crop?: ImageCrop | null
  hotspot?: ImageHotspot | null
}
/** A rectangle in fractions (0–1) of the original image. */
export type FrameRect = {
  left: number
  top: number
  width: number
  height: number
}

const FULL_CROP: ImageCrop = { top: 0, bottom: 0, left: 0, right: 0 }
const CENTER_HOTSPOT: ImageHotspot = { x: 0.5, y: 0.5, width: 1, height: 1 }

/** Reads `image-<hash>-<width>x<height>-<ext>` asset references. */
export function imageDimensions(
  ref: string | null | undefined,
): { width: number; height: number } | null {
  const match = /^image-[^-]+-(\d+)x(\d+)-[a-z0-9]+$/i.exec(ref ?? "")
  if (!match) return null
  const width = Number(match[1])
  const height = Number(match[2])
  return width > 0 && height > 0 ? { width, height } : null
}

/**
 * Mirrors `fit("crop")` in @sanity/image-url so the Studio can show where a
 * fixed-ratio rendition lands without requesting it.
 */
export function cropFrame(
  source: FrameSource,
  aspectRatio: number,
): FrameRect | null {
  const size = imageDimensions(source.asset?._ref)
  if (!size) return null
  const crop = source.crop ?? FULL_CROP
  const hotspot = source.hotspot ?? CENTER_HOTSPOT
  const cropLeft = crop.left * size.width
  const cropTop = crop.top * size.height
  const cropWidth = size.width - crop.right * size.width - cropLeft
  const cropHeight = size.height - crop.bottom * size.height - cropTop
  const hotspotX = hotspot.x * size.width
  const hotspotY = hotspot.y * size.height

  let rect: { left: number; top: number; width: number; height: number }
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

/** Expresses `inner` in fractions of `outer`, clipped to the outer frame. */
export function relativeFrame(inner: FrameRect, outer: FrameRect): FrameRect {
  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  const left = clamp((inner.left - outer.left) / outer.width)
  const top = clamp((inner.top - outer.top) / outer.height)
  const right = clamp((inner.left + inner.width - outer.left) / outer.width)
  const bottom = clamp((inner.top + inner.height - outer.top) / outer.height)
  return { left, top, width: right - left, height: bottom - top }
}
