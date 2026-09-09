import { submitEvent } from "@/features/events/actions/submitEvent"
import { jsonPost } from "@/lib/route-helpers"

// Stable event-submission boundary. Image upload is handled by the sibling
// /api/events/image route. See ADR 010.

export async function POST(request: Request) {
  return jsonPost(request, submitEvent)
}
