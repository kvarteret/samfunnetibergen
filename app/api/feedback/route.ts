const PERSONAL_APP_BASE_URL =
    process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const ALLOWED_TYPES = new Set(["bug", "feature", "improvement"])

export async function POST(request: Request) {
    let body: unknown

    try {
        body = await request.json()
    } catch {
        return Response.json({ detail: "Invalid request body" }, { status: 400 })
    }

    if (
        typeof body !== "object" ||
        body === null ||
        typeof (body as Record<string, unknown>).message !== "string" ||
        !(body as Record<string, unknown>).message
    ) {
        return Response.json({ detail: "message is required" }, { status: 400 })
    }

    const raw = body as Record<string, unknown>
    const feedbackType = ALLOWED_TYPES.has(String(raw.type)) ? String(raw.type) : "improvement"
    const contactEmail = typeof raw.contactEmail === "string" ? raw.contactEmail.trim() : null

    // Fire-and-forget — always respond 200 so the form feels instant.
    fetch(`${PERSONAL_APP_BASE_URL}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source: "nettside",
            feedback_type: feedbackType,
            message: String(raw.message).trim(),
            page: typeof raw.page === "string" ? raw.page : "ukjent",
            platform: "web",
            contact_allowed: Boolean(contactEmail),
            contact_email: contactEmail || null,
        }),
    }).catch(error => {
        console.error("[feedback] Failed to forward to personal backend:", error)
    })

    return Response.json({ ok: true }, { status: 200 })
}
