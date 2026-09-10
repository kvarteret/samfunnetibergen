import { postFormResultJson, postResultJson } from "@/lib/api-client"
import type { FormState } from "../domain/formState"

type SubmitEventInput = FormState & {
  imageAssetId?: string
  honeypot?: string
}

export function submitEventRequest(input: SubmitEventInput) {
  return postResultJson<string>("/api/events", input)
}

export function uploadEventImageRequest(file: File) {
  const formData = new FormData()
  formData.append("image", file)
  return postFormResultJson<string>("/api/events/image", formData)
}
