import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"
import { localeFromAcceptLanguage } from "./lib/browser-locale"

const intlMiddleware = createMiddleware(routing)

const eventSubmissionHost = "event.kvarteret.no"
const eventSubmissionRedirectUrl =
  "https://samfunnetibergen.no/nb/arrangementer/ny"

export default function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]

  if (host === eventSubmissionHost) {
    return NextResponse.redirect(eventSubmissionRedirectUrl, 308)
  }

  const { pathname } = request.nextUrl
  const hasLocalePrefix = routing.locales.some(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  const savedLocale = request.cookies.get("NEXT_LOCALE")?.value

  if (!hasLocalePrefix && savedLocale !== "nb" && savedLocale !== "en") {
    const locale = localeFromAcceptLanguage(
      request.headers.get("accept-language"),
    )
    const localizedUrl = request.nextUrl.clone()
    localizedUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`
    return NextResponse.redirect(localizedUrl)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher:
    "/((?!api|ingest|studio|appen|linkibio|opengraph-image|_next|_vercel|.*\\..*).*)",
}
