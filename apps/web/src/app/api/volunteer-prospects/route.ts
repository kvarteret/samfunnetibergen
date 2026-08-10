import { NextResponse } from "next/server"
import { getPostHogClient } from "@/lib/posthog-server"
import {
  captureSubmitFailure,
  getValidationDiagnostics,
} from "@/lib/submission"
import {
  volunteerFormSchema,
  type VolunteerFormValues,
} from "@/features/grupper/domain/volunteerFormSchema"

const PERSONAL_APP_BASE_URL =
  process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const GENERIC_ERROR = "Kunne ikke registrere frivillig."

export async function POST(request: Request) {
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

  const parsed = volunteerFormSchema.safeParse(body)
  if (!parsed.success) {
    captureSubmitFailure(
      "volunteer_application",
      new Error("Volunteer form schema validation failed"),
      {
        source: "volunteer-prospects-route",
        validation_stage: "server",
        failure_branch: "schema_validation_failed",
        form_id: "volunteer_application",
        ...getValidationDiagnostics(parsed.error.issues),
      },
    )
    return NextResponse.json(
      { detail: "Ugyldig forespørsel — påkrevde felt mangler." },
      { status: 400 },
    )
  }

  // Volunteer retries are intentionally not rate-limited while Personal
  // intake failures are being stabilized.
  const values: VolunteerFormValues = parsed.data
  const requestBody = {
    full_name: `${values.firstName.trim()} ${values.lastName.trim()}`,
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim().replace(/\D/g, ""),
    study_institution: values.studyInstitution.trim(),
    first_choice_group_slug: values.firstChoiceGroupSlug.trim(),
    second_choice_group_slug: values.secondChoiceGroupSlug.trim() || undefined,
    background_details: values.backgroundDetails.trim() || undefined,
    friend_emails:
      values.friendEmails.length > 0
        ? values.friendEmails.map(email => email.trim().toLowerCase())
        : undefined,
  }

  try {
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
      if (response.status !== 409) {
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
      }
      return NextResponse.json(
        { detail },
        { status: response.status === 409 ? 409 : 422 },
      )
    }

    const data = (await response.json().catch(() => null)) as {
      registrationId?: string
    } | null
    try {
      getPostHogClient().capture({
        distinctId: "anonymous",
        event: "volunteer_application_submitted",
        properties: {
          first_choice_group_slug: requestBody.first_choice_group_slug,
          has_second_choice: Boolean(requestBody.second_choice_group_slug),
          has_friend_referrals: (requestBody.friend_emails?.length ?? 0) > 0,
        },
      })
    } catch {
      // A successful Personal registration remains successful if analytics fails.
    }
    return NextResponse.json(
      { registrationId: data?.registrationId },
      { status: 201 },
    )
  } catch {
    captureSubmitFailure(
      "volunteer_application",
      new Error("Personal volunteer prospect request failed"),
      {
        source: "volunteer-prospects-route",
        failure_branch: "personal_backend_request_failed",
        first_choice_group_slug: requestBody.first_choice_group_slug,
        has_second_choice: Boolean(requestBody.second_choice_group_slug),
      },
    )
    return NextResponse.json({ detail: GENERIC_ERROR }, { status: 500 })
  }
}
