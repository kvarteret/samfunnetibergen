import {
  eventImportOptions,
  handleEventImport,
} from "@/features/events/integrations/url-import/handler"

export const runtime = "nodejs"
// Luna may need a second pass to choose a room from Crescat bookings.
export const maxDuration = 300

export const OPTIONS = eventImportOptions

export function POST(request: Request) {
  return handleEventImport(request)
}
