import type { Result } from "@/lib/result"
import { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"
import type { FormState } from "../domain/formState"

// Client-side submit for the public event form. It POSTs to the stable
// /api/events route handlers rather than calling Next.js server actions, so
// the endpoints survive redeploys while a tab stays open. See ADR 010.

const EVENTS_ENDPOINT = "/api/events"
const IMAGE_ENDPOINT = "/api/events/image"

type SubmitEventInput = FormState & {
  imageAssetId?: string
  honeypot?: string
}

export async function submitEventRequest(
  input: SubmitEventInput,
): Promise<Result<string>> {
  let response: Response
  try {
    response = await fetch(EVENTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  if (!response.ok) {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  try {
    return (await response.json()) as Result<string>
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }
}

export async function uploadEventImageRequest(
  file: File,
): Promise<Result<string>> {
  const formData = new FormData()
  formData.append("image", file)

  let response: Response
  try {
    response = await fetch(IMAGE_ENDPOINT, { method: "POST", body: formData })
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  if (!response.ok) {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  try {
    return (await response.json()) as Result<string>
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }
}
