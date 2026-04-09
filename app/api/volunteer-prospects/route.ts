import enMessages from "@/messages/en.json"
import nbMessages from "@/messages/nb.json"
import { resolveRequestLocale } from "@/lib/request-locale"
import {
    buildVolunteerProspectPayload,
    validateVolunteerProspectValues,
    type VolunteerProspectValues,
} from "@/lib/volunteer-prospect"

const PERSONAL_APP_BASE_URL =
    process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const messagesByLocale = {
    nb: nbMessages,
    en: enMessages,
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
        return Response.json(
            { detail: messages.Api.invalidRequest },
            { status: 400 },
        )
    }

    const fieldErrors = validateVolunteerProspectValues(
        payload,
        messages.Validation,
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

        const responseBody = (await response.json().catch(() => null)) as
            | Record<string, unknown>
            | null

        if (!response.ok) {
            return Response.json(
                {
                    detail: extractErrorDetail(responseBody) ?? messages.Api.submitFailure,
                },
                { status: response.status },
            )
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
