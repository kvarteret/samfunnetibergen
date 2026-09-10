import { submitRoomBooking } from "@/features/booking/actions/submit-room-booking"
import { jsonPost } from "@/lib/route-helpers"

// Stable room-booking submit boundary. See ADR 010.

export async function POST(request: Request) {
  return jsonPost(request, submitRoomBooking)
}
