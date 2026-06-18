import { describe, expect, it } from "vitest"

import { initialState as eventInitialState } from "@/features/events/domain/formState"
import { initialBookingState } from "./formState"
import {
  buildPromotionDefaults,
  getPromotionValidationMessages,
  PROMO_IMAGE_FIELD,
  PROMO_TITLE_FIELD,
  PROMOTE_FIELD,
} from "./promotion"

const booking = {
  ...initialBookingState,
  eventName: "Vårkonsert",
  startDate: "2026-07-01",
  startTime: "19:00",
  doorsTime: "18:30",
  freeOrPaid: "Betalt" as const,
}

describe("buildPromotionDefaults", () => {
  it("seeds title from the booking event name", () => {
    const result = buildPromotionDefaults(booking, eventInitialState)
    expect(result.title).toBe("Vårkonsert")
  })

  it("prefers doorsTime over startTime for the first date start time", () => {
    const result = buildPromotionDefaults(booking, eventInitialState)
    expect(result.dates[0].startDate).toBe("2026-07-01")
    expect(result.dates[0].startTime).toBe("18:30")
  })

  it("falls back to booking start time when no doors time is set", () => {
    const result = buildPromotionDefaults(
      { ...booking, doorsTime: "" },
      eventInitialState,
    )
    expect(result.dates[0].startTime).toBe("19:00")
  })

  it("maps freeOrPaid 'Gratis' to isFree true and 'Betalt' to false", () => {
    expect(buildPromotionDefaults(booking, eventInitialState).isFree).toBe(
      false,
    )
    expect(
      buildPromotionDefaults(
        { ...booking, freeOrPaid: "Gratis" },
        eventInitialState,
      ).isFree,
    ).toBe(true)
  })

  it("does not mutate its inputs", () => {
    const baseSnapshot = structuredClone(eventInitialState)
    const bookingSnapshot = structuredClone(booking)
    buildPromotionDefaults(booking, eventInitialState)
    expect(eventInitialState).toEqual(baseSnapshot)
    expect(booking).toEqual(bookingSnapshot)
  })
})

describe("getPromotionValidationMessages", () => {
  const completeEvent = {
    ...eventInitialState,
    title: "Vårkonsert",
    dates: [{ id: "d1", startDate: "2026-07-01", startTime: "", endTime: "" }],
    submittedBy: "Kari",
    submittedByEmail: "kari@example.com",
  }

  it("requires a yes/no answer when promote is empty", () => {
    const messages = getPromotionValidationMessages({
      promote: "",
      event: eventInitialState,
      hasImageFile: false,
      uploadLater: false,
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].fieldId).toBe(PROMOTE_FIELD)
  })

  it("returns no errors when the guest declines promotion", () => {
    const messages = getPromotionValidationMessages({
      promote: "nei",
      event: eventInitialState,
      hasImageFile: false,
      uploadLater: false,
    })
    expect(messages).toEqual([])
  })

  it("reports a missing title when promoting", () => {
    const messages = getPromotionValidationMessages({
      promote: "ja",
      event: { ...completeEvent, title: "" },
      hasImageFile: true,
      uploadLater: false,
    })
    expect(messages.some(m => m.fieldId === PROMO_TITLE_FIELD)).toBe(true)
  })

  it("requires an image or the upload-later acknowledgement", () => {
    const messages = getPromotionValidationMessages({
      promote: "ja",
      event: completeEvent,
      hasImageFile: false,
      uploadLater: false,
    })
    expect(messages.some(m => m.fieldId === PROMO_IMAGE_FIELD)).toBe(true)
  })

  it("accepts the upload-later acknowledgement in place of an image", () => {
    const messages = getPromotionValidationMessages({
      promote: "ja",
      event: completeEvent,
      hasImageFile: false,
      uploadLater: true,
    })
    expect(messages).toEqual([])
  })
})
