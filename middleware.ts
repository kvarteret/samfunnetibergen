import createMiddleware from "next-intl/middleware"

import { routing } from "@/i18n/routing"

export default createMiddleware(routing)

export const config = {
    matcher: [
        // Run on all locale-prefixed paths and the bare root
        "/((?!_next|_vercel|studio|api|appen|linkibio|ingest|.*\\.).*)",
    ],
}
