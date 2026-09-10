import { submitKaraokeBooking } from "@/features/karaoke/actions/submit-karaoke-booking"
import { jsonPost } from "@/lib/route-helpers"

// Stable karaoke-booking submit boundary. See ADR 010.

export async function POST(request: Request) {
  return jsonPost(request, submitKaraokeBooking)
}
