import { NextResponse } from "next/server"
import { z } from "zod"
import { getPostHogClient } from "@/lib/posthog-server"
import {
  captureSubmitFailure,
  isSubmissionRateLimited,
  RATE_LIMIT_ERROR,
} from "@/lib/submission"

const PERSONAL_APP_BASE_URL =
  process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const GENERIC_ERROR = "Kunne ikke registrere frivillig."

const payloadSchema = z.object({
  full_name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z
    .string()
    .trim()
    .regex(/\d/)
    .transform(value => value.replace(/\D/g, "")),
  study_institution: z.string().trim().min(1),
  first_choice_group_slug: z.string().trim().min(1),
  second_choice_group_slug: z
    .string()
    .trim()
    .optional()
    .transform(value => value || undefined),
  background_details: z
    .string()
    .trim()
    .optional()
    .transform(value => value || undefined),
  friend_emails: z
    .array(z.string().trim().toLowerCase().pipe(z.email()))
    .max(2)
    .optional(),
})

export async function POST(request: Request) {
  if (await isSubmissionRateLimited("volunteer-prospects")) {
    return NextResponse.json({ detail: RATE_LIMIT_ERROR }, { status: 429 })
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

    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { detail: "Ugyldig forespørsel — påkrevde felt mangler." },
        { status: 400 },
      )
    }
    const requestBody = parsed.data

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
      const errorBody = (await response.json().catch(() => null)) as {
        detail?: unknown
      } | null
      // Forward the Personal backend's own message (e.g. duplicate email)
      // when it is a plain string; anything structured stays server-side.
      const detail =
        typeof errorBody?.detail === "string" ? errorBody.detail : GENERIC_ERROR
      captureSubmitFailure(
        "volunteer_application",
        new Error(
          `Volunteer prospect forwarding failed with ${response.status}`,
        ),
        {
          source: "volunteer-prospects-route",
          failure_branch: "personal_backend_rejected",
          status: response.status,
          first_choice_group_slug: requestBody.first_choice_group_slug,
          has_second_choice: Boolean(requestBody.second_choice_group_slug),
        },
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
    captureSubmitFailure("volunteer_application", error, {
      source: "volunteer-prospects-route",
      failure_branch: "personal_backend_request_failed",
    })
    return NextResponse.json({ detail: GENERIC_ERROR }, { status: 500 })
  }
}
