import { uploadEventImage } from "@/features/events/actions/submitEvent"
import { formPost } from "@/lib/route-helpers"

// Stable event-image upload boundary (multipart/form-data). See ADR 010.

export async function POST(request: Request) {
  return formPost(request, uploadEventImage)
}
