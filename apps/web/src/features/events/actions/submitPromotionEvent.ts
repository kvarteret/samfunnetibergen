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

  const result = await submitEvent({ ...event, imageAssetId })
  if (!result.ok) return result
  return { ok: true }
}
