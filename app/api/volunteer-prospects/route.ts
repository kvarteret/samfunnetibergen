import { getVolunteerGroups } from "@/features/blifrivillig/content"
import {
    buildVolunteerProspectPayload,
    type VolunteerProspectValues,
    validateVolunteerProspectValues,
} from "@/features/blifrivillig/prospect"
import { getPostHogClient } from "@/lib/posthog-server"
import { resolveRequestLocale } from "@/lib/request-locale"
import nbMessages from "@/messages/nb.json"

const PERSONAL_APP_BASE_URL =
    process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const messagesByLocale = {
    nb: nbMessages,
} as const

function extractErrorDetail(responseBody: Record<string, unknown> | null) {
    if (typeof responseBody?.detail === "string") {
        return responseBody.detail
    }

    if (Array.isArray(responseBody?.detail)) {
        const firstDetail = responseBody.detail[0]
        if (
            firstDetail &&
            typeof firstDetail === "object" &&
            "msg" in firstDetail &&
            typeof firstDetail.msg === "string"
        ) {
            return firstDetail.msg
        }
    }

    return null
}

export async function POST(request: Request) {
    const locale = resolveRequestLocale(request.headers.get("accept-language"))
    const messages = messagesByLocale[locale]

    let payload: VolunteerProspectValues

    try {
        payload = (await request.json()) as VolunteerProspectValues
    } catch {
        return Response.json({ detail: messages.Api.invalidRequest }, { status: 400 })
    }

    const groups = await getVolunteerGroups(locale)
    const fieldErrors = validateVolunteerProspectValues(
        payload,
        messages.Validation,
        groups.map(g => g.slug),
    )
    if (Object.keys(fieldErrors).length > 0) {
        return Response.json(
            {
                detail: messages.Api.formIncomplete,
                fieldErrors,
            },
            { status: 400 },
        )
    }

    try {
        const response = await fetch(`${PERSONAL_APP_BASE_URL}/api/v1/volunteer-prospects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify(buildVolunteerProspectPayload(payload)),
        })

        const responseBody = (await response.json().catch(() => null)) as Record<
            string,
            unknown
        > | null

        const distinctId = request.headers.get("x-posthog-distinct-id")?.trim()
        const sessionId = request.headers.get("x-posthog-session-id") || undefined

        if (!response.ok) {
            if (distinctId) {
                getPostHogClient().capture({
                    distinctId,
                    event: "volunteer_prospect_creation_failed",
                    properties: {
                        $session_id: sessionId,
                        first_choice_group: payload.firstChoiceGroupSlug,
                        second_choice_group: payload.secondChoiceGroupSlug || null,
                        status_code: response.status,
                    },
                })
            }
            return Response.json(
                {
                    detail: extractErrorDetail(responseBody) ?? messages.Api.submitFailure,
                },
                { status: response.status },
            )
        }

        if (distinctId) {
            getPostHogClient().capture({
                distinctId,
                event: "volunteer_prospect_created",
                properties: {
                    $session_id: sessionId,
                    first_choice_group: payload.firstChoiceGroupSlug,
                    second_choice_group: payload.secondChoiceGroupSlug || null,
                },
            })
        }

        return Response.json(responseBody, { status: 201 })
    } catch {
        return Response.json(
            {
                detail: messages.Api.serviceUnavailable,
            },
            { status: 503 },
        )
    }
}
