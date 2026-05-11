import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

export default createMiddleware(routing)

export const config = {
    matcher: [
        // Match all pathnames except Next.js internals, static files,
        // and locale-independent app sections
        "/((?!_next|_vercel|studio|api|ingest|linkibio|appen|.*\\..*).*)",
    ],
}
