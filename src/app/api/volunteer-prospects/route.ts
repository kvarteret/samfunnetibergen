import { NextResponse } from "next/server"
import {
  getHandledExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const PERSONAL_APP_BASE_URL =
  process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const GENERIC_ERROR = "Kunne ikke registrere frivillig."
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const SUBMIT_LIMIT = 5

interface VolunteerProspectBody {
  full_name: string
  email: string
  phone: string
  study_institution: string
  first_choice_group_slug: string
  second_choice_group_slug?: string
  background_details?: string
  friend_emails?: string[]
}

const REQUIRED_FIELDS = [
  "full_name",
  "email",
  "phone",
  "study_institution",
  "first_choice_group_slug",
] as const

type RequiredField = (typeof REQUIRED_FIELDS)[number]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== ""
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /\d/

function fieldError(
  b: Record<string, unknown>,
  key: RequiredField,
): string | null {
  if (!isNonEmptyString(b[key])) return `${key} er påkrevd`
  if (key === "email" && !EMAIL_RE.test(b[key] as string))
    return "Ugyldig e-post"
  if (key === "phone" && !PHONE_RE.test(b[key] as string))
    return "Telefonnummer er påkrevd"
  return null
}

function validate(body: unknown): body is VolunteerProspectBody {
  if (!body || typeof body !== "object") return false
  const b = body as Record<string, unknown>
  for (const field of REQUIRED_FIELDS) {
    if (fieldError(b, field)) return false
  }
  if (
    b.friend_emails !== undefined &&
    (!Array.isArray(b.friend_emails) ||
      b.friend_emails.length > 2 ||
      b.friend_emails.some(
        email => !isNonEmptyString(email) || !EMAIL_RE.test(email),
      ))
  ) {
    return false
  }
  return true
}

function extractErrorDetail(err: unknown): string {
  if (typeof err !== "object" || err === null || !("detail" in err)) {
    return "Kunne ikke registrere frivillig."
  }
  const d = (err as { detail: unknown }).detail
  if (typeof d === "string") return d
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0]
    return typeof first === "object" && first !== null && "msg" in first
      ? String((first as { msg: unknown }).msg)
      : JSON.stringify(first)
  }
  return "Kunne ikke registrere frivillig."
}

export async function POST(request: Request) {
  const ip = await getClientIp()
  if (
    !checkRateLimit({
      name: "volunteer-prospects",
      ip,
      limit: SUBMIT_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })
  ) {
    return NextResponse.json(
      { detail: "For mange forsøk. Vent litt og prøv igjen." },
      { status: 429 },
    )
  }

  try {
    const body = await request.json().catch(() => null)

    // Silently accept honeypot hits.
    if (
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).honeypot &&
      String((body as Record<string, unknown>).honeypot).trim() !== ""
    ) {
      return NextResponse.json({ registrationId: "ignored" }, { status: 201 })
    }

    if (!validate(body)) {
      return NextResponse.json(
        { detail: "Ugyldig forespørsel — påkrevde felt mangler." },
        { status: 400 },
      )
    }

    const requestBody = {
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim().replace(/\D/g, ""),
      study_institution: body.study_institution.trim(),
      first_choice_group_slug: body.first_choice_group_slug.trim(),
      second_choice_group_slug:
        body.second_choice_group_slug?.trim() || undefined,
      background_details: body.background_details?.trim() || undefined,
      friend_emails: body.friend_emails?.map(email =>
        email.trim().toLowerCase(),
      ),
    }

    const response = await fetch(
      `${PERSONAL_APP_BASE_URL}/api/v1/volunteer-prospects`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const detail = extractErrorDetail(errorBody)
      const posthog = getPostHogClient()
      posthog.capture({
        distinctId: "anonymous",
        event: "volunteer_application_submit_failed",
        properties: {
          first_choice_group_slug: requestBody.first_choice_group_slug,
          has_second_choice: Boolean(requestBody.second_choice_group_slug),
          error: detail,
        },
      })
      posthog.captureException(
        new Error(
          `Volunteer prospect forwarding failed with ${response.status}`,
        ),
        "anonymous",
        getHandledExceptionProperties("volunteer_application", {
          source: "volunteer-prospects-route",
          failure_branch: "personal_backend_rejected",
          status: response.status,
          first_choice_group_slug: requestBody.first_choice_group_slug,
          has_second_choice: Boolean(requestBody.second_choice_group_slug),
        }),
      )
      return NextResponse.json({ detail }, { status: 422 })
    }

    const data = await response.json()
    getPostHogClient().capture({
      distinctId: "anonymous",
      event: "volunteer_application_submitted",
      properties: {
        first_choice_group_slug: requestBody.first_choice_group_slug,
        has_second_choice: Boolean(requestBody.second_choice_group_slug),
        has_friend_referrals: (requestBody.friend_emails?.length ?? 0) > 0,
      },
    })
    return NextResponse.json(
      { registrationId: (data as { registrationId?: string }).registrationId },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil"
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: "anonymous",
      event: "volunteer_application_submit_failed",
      properties: { error: message },
    })
    posthog.captureException(
      toPostHogException(error),
      "anonymous",
      getHandledExceptionProperties("volunteer_application", {
        source: "volunteer-prospects-route",
        failure_branch: "personal_backend_request_failed",
      }),
    )
    return NextResponse.json({ detail: GENERIC_ERROR }, { status: 500 })
  }
}
