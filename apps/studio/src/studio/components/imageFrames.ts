import {
  type FrameRect,
  cropFrame as frameForSize,
  type ImageCrop,
  type ImageHotspot,
  imageDimensions,
} from "@samfunnet/content-domain/image-frame"

export type { FrameRect, ImageCrop, ImageHotspot }
export { imageDimensions }

export type FrameSource = {
  asset?: { _ref?: string | null } | null
  crop?: ImageCrop | null
  hotspot?: ImageHotspot | null
}

export function cropFrame(
  source: FrameSource,
  aspectRatio: number,
): FrameRect | null {
  const size = imageDimensions(source.asset?._ref)
  return size ? frameForSize(size, source, aspectRatio) : null
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

/** The editor's crop as a frame, with its aspect ratio in pixels. */
export function croppedArea(
  source: FrameSource,
): { rect: FrameRect; aspectRatio: number } | null {
  const size = imageDimensions(source.asset?._ref)
  if (!size) return null
  const crop = source.crop ?? { top: 0, bottom: 0, left: 0, right: 0 }
  const rect = {
    left: crop.left,
    top: crop.top,
    width: 1 - crop.left - crop.right,
    height: 1 - crop.top - crop.bottom,
  }
  return {
    rect,
    aspectRatio: (rect.width * size.width) / (rect.height * size.height),
  }
}
