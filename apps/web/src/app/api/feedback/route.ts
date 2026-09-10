import {
  emitOperationalEvent,
  injectActiveTraceContext,
} from "@/lib/observability"
import { getPostHogClient } from "@/lib/posthog-server"
import {
  captureSubmitFailure,
  isSubmissionRateLimited,
  RATE_LIMIT_ERROR,
} from "@/lib/submission"
import { remoteWritesDisabled } from "@/lib/runtime-mode"

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

  if (remoteWritesDisabled()) {
    return Response.json({ ok: true, local: true }, { status: 200 })
  }

  try {
    const outboundHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    }
    injectActiveTraceContext(outboundHeaders)
    const response = await fetch(`${PERSONAL_APP_BASE_URL}/api/v1/feedback`, {
      method: "POST",
      headers: outboundHeaders,
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

    if (!response.ok) {
      emitOperationalEvent("feedback.forward.failed", {
        outcome: "failure",
        failure_stage: "personal_backend_rejected",
        status_code: response.status,
      })
      captureSubmitFailure(
        "feedback",
        new Error(`Personal feedback endpoint returned ${response.status}`),
        {
          source: "feedback-route",
          failure_branch: "personal_backend_rejected",
          status_code: response.status,
          feedback_type: feedbackType,
        },
      )
      return Response.json(
        { detail: "Failed to submit feedback" },
        { status: 502 },
      )
    }
  } catch (error) {
    emitOperationalEvent("feedback.forward.failed", {
      outcome: "failure",
      failure_stage: "personal_backend_request_failed",
      error_category: error instanceof Error ? error.name : "unknown",
    })
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
  try {
    getPostHogClient().capture({
      distinctId: "anonymous",
      event: "feedback_submitted",
      properties: {
        feedback_type: feedbackType,
        page,
        contact_allowed: Boolean(contactEmail),
      },
    })
  } catch {
    // Analytics availability must not change a successful feedback response.
  }

  return Response.json({ ok: true }, { status: 200 })
}
