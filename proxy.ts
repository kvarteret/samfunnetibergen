import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

const studioHosts = new Set(["studio.samfunnetibergen.no"])

export default function proxy(request: NextRequest) {
    const host = request.headers.get("host")?.split(":")[0]

    if (host && studioHosts.has(host) && request.nextUrl.pathname === "/") {
        const url = request.nextUrl.clone()
        url.pathname = "/studio"

        return NextResponse.redirect(url)
    }

    return intlMiddleware(request)
}

export const config = {
    matcher: "/((?!api|ingest|studio|_next|_vercel|.*\\..*).*)",
}
