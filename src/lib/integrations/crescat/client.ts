"use server"

import { err, ok } from "@/lib/result"
import type { CresatResult, EventRequestBody } from "./types"

const BASE_URL = "https://app.crescat.io"

// Fetch a fresh XSRF-TOKEN cookie from the public form page.
// Crescat uses Laravel's CSRF pattern: the cookie value (URL-decoded) is
// sent back as the x-xsrf-token header.
async function fetchXsrfSession(slug: string): Promise<{ cookie: string; token: string } | null> {
    const res = await fetch(`${BASE_URL}/event-requests/${slug}`, {
        headers: {
            "user-agent":
                "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)",
        },
    })

    if (!res.ok) return null

    const setCookie = res.headers.getSetCookie?.() ?? []
    const rawHeader = res.headers.get("set-cookie") ?? ""

    // Collect all Set-Cookie entries (Node fetch may return them combined)
    const cookieParts: string[] = setCookie.length > 0 ? setCookie : rawHeader.split(/,(?=[^ ])/g)

    let xsrfRaw: string | undefined
    let sessionRaw: string | undefined

    for (const part of cookieParts) {
        const [nameValue] = part.split(";")
        const eq = nameValue.indexOf("=")
        const name = nameValue.slice(0, eq).trim()
        const value = nameValue.slice(eq + 1).trim()
        if (name === "XSRF-TOKEN") xsrfRaw = value
        if (name === "crescat_session") sessionRaw = value
    }

    if (!xsrfRaw || !sessionRaw) return null

    const token = decodeURIComponent(xsrfRaw)
    const cookie = `XSRF-TOKEN=${xsrfRaw}; crescat_session=${sessionRaw}`

    return { cookie, token }
}

export async function postEventRequest(
    slug: string,
    body: EventRequestBody,
): Promise<CresatResult> {
    const session = await fetchXsrfSession(slug)
    if (!session) {
        return err("Klarte ikke å opprette sesjon mot bookingsystemet.")
    }

    const res = await fetch(`${BASE_URL}/event-requests/${slug}`, {
        method: "POST",
        headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
            "x-requested-with": "XMLHttpRequest",
            "x-xsrf-token": session.token,
            cookie: session.cookie,
            origin: BASE_URL,
            referer: `${BASE_URL}/event-requests/${slug}`,
        },
        body: JSON.stringify(body),
    })

    if (res.status === 201 || res.status === 200) {
        return ok(res.status)
    }

    let detail = ""
    try {
        const json = await res.json()
        detail = JSON.stringify(json)
    } catch {
        detail = await res.text().catch(() => "")
    }

    return err(`Bookingsystemet svarte med status ${res.status}${detail ? `: ${detail}` : ""}.`)
}
