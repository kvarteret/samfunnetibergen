import { NextResponse } from "next/server"
import {
  type VolunteerFormValues,
  volunteerFormSchema,
  volunteerHoneypotSchema,
} from "@/features/grupper/domain/volunteerFormSchema"
import {
  createVolunteerProspectAuthHeaders,
  createVolunteerProspectClientKey,
  resolveVolunteerProspectIdempotencyKey,
} from "@/lib/integrations/kvarteret-personal/volunteer-prospect-signing"
import {
  currentTraceFields,
  emitOperationalEvent,
  injectActiveTraceContext,
  withOperationalSpan,
} from "@/lib/observability"
import { getPostHogClient } from "@/lib/posthog-server"
import {
  captureSubmitFailure,
  getValidationDiagnostics,
} from "@/lib/submission"

const PERSONAL_APP_BASE_URL =
  process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const GENERIC_ERROR = "Kunne ikke registrere frivillig."
const REQUEST_BODY_LIMIT_BYTES = 16 * 1_024

class RequestBodyTooLargeError extends Error {}

class VolunteerProspectUpstreamError extends Error {
  constructor(status: number) {
    super(`Volunteer prospect forwarding failed with ${status}`)
    this.name = "VolunteerProspectUpstreamError"
  }
}

export async function POST(request: Request) {
  let body: unknown = null
  try {
    const rawBody = await readRequestBodyWithinLimit(request)
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBody))
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { detail: "Forespørselen er for stor." },
        { status: 413 },
      )
    }
  }

  const honeypotValue =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).honeypot
      : undefined
  const parsedHoneypot = volunteerHoneypotSchema.safeParse(honeypotValue ?? "")
  if (!parsedHoneypot.success) {
    return NextResponse.json(
      { detail: "Ugyldig forespørsel — påkrevde felt mangler." },
      { status: 400 },
    )
  }

  // Silently accept bounded honeypot hits.
  if (parsedHoneypot.data.trim() !== "") {
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
        ...currentTraceFields(),
        ...getValidationDiagnostics(parsed.error.issues),
      },
    )
    return NextResponse.json(
      { detail: "Ugyldig forespørsel — påkrevde felt mangler." },
      { status: 400 },
    )
  }

  // Personal owns the durable route and client-key counters. This
  // stateless proxy supplies the signed dimensions after local validation.
  const values: VolunteerFormValues = parsed.data
  let idempotencyKey: string
  try {
    idempotencyKey = resolveVolunteerProspectIdempotencyKey(
      request.headers.get("X-Kvarteret-Idempotency-Key"),
    )
  } catch {
    return NextResponse.json(
      { detail: "Ugyldig idempotensnøkkel." },
      { status: 400 },
    )
  }

  let clientKey: string
  try {
    clientKey = createVolunteerProspectClientKey(
      request.headers,
      process.env.VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET,
    )
  } catch (error) {
    captureSubmitFailure("volunteer_application", error, {
      source: "volunteer-prospects-route",
      failure_branch: "client_key_unavailable",
      ...currentTraceFields(),
    })
    return NextResponse.json({ detail: GENERIC_ERROR }, { status: 503 })
  }

  const requestBody = {
    full_name: `${values.firstName.trim()} ${values.lastName.trim()}`,
    email: values.email.trim().toLowerCase(),
    phone: values.phone,
    study_institution: values.studyInstitution.trim(),
    first_choice_group_slug: values.firstChoiceGroupSlug.trim(),
    second_choice_group_slug: values.secondChoiceGroupSlug.trim() || undefined,
    background_details: values.backgroundDetails.trim() || undefined,
    friend_emails:
      values.friendEmails.length > 0
        ? values.friendEmails.map(email => email.trim().toLowerCase())
        : undefined,
  }
  const serializedRequestBody = JSON.stringify(requestBody)

  let authenticationHeaders: Record<string, string>
  try {
    authenticationHeaders = createVolunteerProspectAuthHeaders(
      serializedRequestBody,
      process.env.VOLUNTEER_PROSPECT_HMAC_SECRET,
      { idempotencyKey, clientKey },
    )
  } catch (error) {
    captureSubmitFailure("volunteer_application", error, {
      source: "volunteer-prospects-route",
      failure_branch: "hmac_configuration_invalid",
      ...currentTraceFields(),
      first_choice_group_slug: requestBody.first_choice_group_slug,
      has_second_choice: Boolean(requestBody.second_choice_group_slug),
    })
    return NextResponse.json({ detail: GENERIC_ERROR }, { status: 503 })
  }

  try {
    const outboundHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...authenticationHeaders,
    }
    injectActiveTraceContext(outboundHeaders)
    return await withOperationalSpan(
      "volunteer.prospect.submit",
      async span => {
        const response = await fetch(
          `${PERSONAL_APP_BASE_URL}/api/v1/volunteer-prospects`,
          {
            method: "POST",
            headers: outboundHeaders,
            body: serializedRequestBody,
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
            typeof errorBody?.detail === "string"
              ? errorBody.detail
              : GENERIC_ERROR
          const retryAfterSeconds =
            response.status === 429
              ? Number(response.headers.get("retry-after")) || 60
              : undefined
          if (response.status !== 409) {
            captureSubmitFailure(
              "volunteer_application",
              new VolunteerProspectUpstreamError(response.status),
              {
                source: "volunteer-prospects-route",
                failure_branch: "personal_backend_rejected",
                ...currentTraceFields(),
                status: response.status,
                retry_after_seconds: retryAfterSeconds,
                first_choice_group_slug: requestBody.first_choice_group_slug,
                has_second_choice: Boolean(
                  requestBody.second_choice_group_slug,
                ),
              },
            )
          }
          return NextResponse.json(
            { detail },
            {
              status:
                response.status === 409 || response.status === 429
                  ? response.status
                  : 422,
              headers:
                retryAfterSeconds === undefined
                  ? undefined
                  : { "Retry-After": String(retryAfterSeconds) },
            },
          )
        }

        const data = (await response.json().catch(() => null)) as {
          registrationId?: number | string
        } | null
        const registrationId = data?.registrationId
        span.setAttribute("registration_id", registrationId ?? "")
        const traceFields = currentTraceFields()
        emitOperationalEvent("volunteer.application.submitted", {
          registration_id: registrationId,
          outcome: "accepted",
        })
        try {
          getPostHogClient().capture({
            distinctId: "anonymous",
            event: "volunteer_application_submitted",
            properties: {
              $process_person_profile: false,
              first_choice_group_slug: requestBody.first_choice_group_slug,
              has_second_choice: Boolean(requestBody.second_choice_group_slug),
              has_friend_referrals:
                (requestBody.friend_emails?.length ?? 0) > 0,
              registration_id: registrationId,
              trace_id: traceFields.trace_id,
            },
          })
        } catch {
          // A successful Personal registration remains successful if analytics fails.
        }
        return NextResponse.json({ registrationId }, { status: 201 })
      },
    )
  } catch (error) {
    captureSubmitFailure("volunteer_application", error, {
      source: "volunteer-prospects-route",
      failure_branch: "personal_backend_request_failed",
      ...currentTraceFields(),
      first_choice_group_slug: requestBody.first_choice_group_slug,
      has_second_choice: Boolean(requestBody.second_choice_group_slug),
    })
    return NextResponse.json({ detail: GENERIC_ERROR }, { status: 500 })
  }
}

async function readRequestBodyWithinLimit(
  request: Request,
): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length")
  if (
    contentLength &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > REQUEST_BODY_LIMIT_BYTES
  ) {
    await cancelRequestBody(request.body)
    throw new RequestBodyTooLargeError()
  }

  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let bytesRead = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytesRead += value.byteLength
      if (bytesRead > REQUEST_BODY_LIMIT_BYTES) {
        try {
          await reader.cancel()
        } catch {
          // The 413 response is still authoritative if upstream cancellation fails.
        }
        throw new RequestBodyTooLargeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(bytesRead)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

async function cancelRequestBody(
  body: ReadableStream<Uint8Array> | null,
): Promise<void> {
  try {
    await body?.cancel()
  } catch {
    // The declared byte length is already sufficient to reject this request.
  }
}
