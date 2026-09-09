import { uploadEventImage } from "@/features/events/actions/submitEvent"
import { isSameOriginRequest } from "@/lib/csrf"

// Stable event-image upload boundary. See ADR 010. The browser sends the file
// as multipart/form-data; validation, rate limiting, and the Sanity upload
// live in uploadEventImage.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ detail: "Forbidden" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  const result = await uploadEventImage(formData)
  return Response.json(result)
}
