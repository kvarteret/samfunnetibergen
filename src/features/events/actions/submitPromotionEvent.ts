"use server"

import type { FormState as EventFormState } from "../domain/formState"
import { submitEvent, uploadEventImage } from "./submitEvent"

export async function submitPromotionEvent(
  event: EventFormState,
  imageFile: File | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let imageAssetId: string | undefined
  if (imageFile) {
    const formData = new FormData()
    formData.append("image", imageFile)
    const uploadResult = await uploadEventImage(formData)
    if (!uploadResult.ok) return uploadResult
    imageAssetId = uploadResult.value
  }

  const result = await submitEvent({
    title: event.title,
    description: event.description || undefined,
    dates: event.dates
      .filter(date => date.startDate)
      .map(date => ({
        startDate: date.startDate,
        startTime: date.startTime || undefined,
        endTime: date.endTime || undefined,
      })),
    room: event.room || undefined,
    roomText: event.roomText || undefined,
    organizerGroup: event.organizerGroup || undefined,
    organizerText: event.organizerText || undefined,
    submittedByOrganization: event.submittedByOrganization || undefined,
    eventTypeId: event.eventTypeId || undefined,
    imageAssetId,
    isInternalEvent: event.isInternalEvent || undefined,
    isFree: event.isFree,
    priceOrdinar: event.priceOrdinar ? Number(event.priceOrdinar) : undefined,
    priceStudent: event.priceStudent ? Number(event.priceStudent) : undefined,
    priceMedlem: event.priceMedlem ? Number(event.priceMedlem) : undefined,
    ticketUrl: event.ticketUrl || undefined,
    facebookUrl: event.facebookUrl || undefined,
    submittedBy: event.submittedBy,
    submittedByEmail: event.submittedByEmail,
  })
  if (!result.ok) return result
  return { ok: true }
}
