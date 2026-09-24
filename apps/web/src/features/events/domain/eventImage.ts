import { z } from "zod"

const fraction = z.number().finite().min(0).max(1)

export const eventImageSelectionSchema = z
  .object({
    crop: z.object({
      top: fraction,
      bottom: fraction,
      left: fraction,
      right: fraction,
    }),
    hotspot: z.object({
      x: fraction,
      y: fraction,
      width: fraction.positive(),
      height: fraction.positive(),
    }),
  })
  .refine(
    ({ crop, hotspot }) =>
      crop.left + crop.right < 1 &&
      crop.top + crop.bottom < 1 &&
      hotspot.x - hotspot.width / 2 >= crop.left - 0.0001 &&
      hotspot.x + hotspot.width / 2 <= 1 - crop.right + 0.0001 &&
      hotspot.y - hotspot.height / 2 >= crop.top - 0.0001 &&
      hotspot.y + hotspot.height / 2 <= 1 - crop.bottom + 0.0001,
    "Ugyldig bildeutsnitt.",
  )

export type EventImageSelection = z.infer<typeof eventImageSelectionSchema>
export type EventImageCrop = EventImageSelection["crop"]
export type EventImageSource = {
  asset: { _ref: string }
  crop?: EventImageCrop | null
  hotspot?: EventImageSelection["hotspot"] | null
}

export function cropFromPercent(area: {
  x: number
  y: number
  width: number
  height: number
}): EventImageCrop {
  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  return {
    left: clamp(area.x / 100),
    top: clamp(area.y / 100),
    right: clamp(1 - (area.x + area.width) / 100),
    bottom: clamp(1 - (area.y + area.height) / 100),
  }
}

export function selectionFromCrop(
  crop: EventImageCrop,
  focus: { x: number; y: number },
): EventImageSelection {
  const width = 1 - crop.left - crop.right
  const height = 1 - crop.top - crop.bottom
  const hotspotWidth = width * 0.04
  const hotspotHeight = height * 0.04
  const clamp = (value: number) => Math.min(0.98, Math.max(0.02, value))
  return {
    crop,
    hotspot: {
      x: crop.left + clamp(focus.x) * width,
      y: crop.top + clamp(focus.y) * height,
      width: hotspotWidth,
      height: hotspotHeight,
    },
  }
}
