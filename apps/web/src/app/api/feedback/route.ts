import { getPostHogClient } from "@/lib/posthog-server"
import {
  captureSubmitFailure,
  isSubmissionRateLimited,
  RATE_LIMIT_ERROR,
} from "@/lib/submission"

const PERSONAL_APP_BASE_URL =
  process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const ALLOWED_TYPES = new Set(["bug", "feature", "improvement"])

export async function POST(request: Request) {
  if (await isSubmissionRateLimited("feedback", 10)) {
    return Response.json({ detail: RATE_LIMIT_ERROR }, { status: 429 })
  }

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

  // Silently accept honeypot hits.
  if (raw.honeypot && String(raw.honeypot).trim() !== "") {
    return Response.json({ ok: true }, { status: 200 })
  }

  const feedbackType = ALLOWED_TYPES.has(String(raw.type))
    ? String(raw.type)
    : "improvement"
  const contactEmail =
    typeof raw.contactEmail === "string" ? raw.contactEmail.trim() : null

  try {
    await fetch(`${PERSONAL_APP_BASE_URL}/api/v1/feedback`, {
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
      signal: AbortSignal.timeout(5_000),
    })
  } catch (error) {
    console.error("[feedback] Failed to forward to personal backend:", error)
    captureSubmitFailure("feedback", error, {
      source: "feedback-route",
      failure_branch: "personal_backend_request_failed",
      feedback_type: feedbackType,
      has_page: typeof raw.page === "string" && raw.page.trim() !== "",
      contact_allowed: Boolean(contactEmail),
    })
    return Response.json(
      { detail: "Failed to submit feedback" },
      { status: 502 },
    )
  }

  const page = typeof raw.page === "string" ? raw.page : "ukjent"
  getPostHogClient().capture({
    distinctId: "anonymous",
    event: "feedback_submitted",
    properties: {
      feedback_type: feedbackType,
      page,
      contact_allowed: Boolean(contactEmail),
    },
  })

  return Response.json({ ok: true }, { status: 200 })
}
