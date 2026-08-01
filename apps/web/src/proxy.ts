import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

const eventSubmissionHost = "event.kvarteret.no"
const eventSubmissionRedirectUrl =
  "https://samfunnetibergen.no/nb/arrangementer/ny"

export default function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]

  if (host === eventSubmissionHost) {
    return NextResponse.redirect(eventSubmissionRedirectUrl, 308)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher:
    "/((?!api|ingest|studio|appen|linkibio|opengraph-image|_next|_vercel|.*\\..*).*)",
}
