import {
  type SubmitEventInput,
  submitEvent,
} from "@/features/events/actions/submitEvent"
import { isSameOriginRequest } from "@/lib/csrf"

// Stable event-submission boundary. See ADR 010. Image upload is handled by
// the sibling /api/events/image route.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ detail: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  const result = await submitEvent(body as SubmitEventInput)
  return Response.json(result)
}
