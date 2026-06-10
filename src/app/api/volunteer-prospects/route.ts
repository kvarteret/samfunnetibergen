import { NextResponse } from "next/server"
import {
  createClient,
  createConfig,
} from "@/lib/integrations/kvarteret-personal-api/client"
import { createPublicVolunteerProspect } from "@/lib/integrations/kvarteret-personal-api/sdk.gen"

const PERSONAL_APP_BASE_URL =
  process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

const personalClient = createClient(
  createConfig({ baseUrl: PERSONAL_APP_BASE_URL }),
)

interface VolunteerProspectBody {
  full_name: string
  email: string
  phone: string
  study_institution: string
  first_choice_group_slug: string
  second_choice_group_slug?: string
  background_details?: string
}

function validate(body: unknown): body is VolunteerProspectBody {
  if (!body || typeof body !== "object") return false
  const b = body as Record<string, unknown>
  if (typeof b.full_name !== "string" || !b.full_name.trim()) return false
  if (
    typeof b.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)
  )
    return false
  if (typeof b.phone !== "string" || !/\d/.test(b.phone)) return false
  if (typeof b.study_institution !== "string" || !b.study_institution.trim())
    return false
  if (
    typeof b.first_choice_group_slug !== "string" ||
    !b.first_choice_group_slug.trim()
  )
    return false
  return true
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!validate(body)) {
      return NextResponse.json(
        { detail: "Ugyldig forespørsel — påkrevde felt mangler." },
        { status: 400 },
      )
    }

    const result = await createPublicVolunteerProspect({
      client: personalClient,
      body: {
        full_name: body.full_name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim().replace(/\D/g, ""),
        study_institution: body.study_institution.trim(),
        first_choice_group_slug: body.first_choice_group_slug.trim(),
        second_choice_group_slug:
          body.second_choice_group_slug?.trim() || undefined,
        background_details: body.background_details?.trim() || undefined,
      },
    })

    if (result.error) {
      let detail = "Kunne ikke registrere frivillig."
      if (
        typeof result.error === "object" &&
        result.error !== null &&
        "detail" in result.error
      ) {
        const d = (result.error as { detail: unknown }).detail
        if (Array.isArray(d) && d.length > 0) {
          const first = d[0]
          detail =
            typeof first === "object" && first !== null && "msg" in first
              ? String((first as { msg: unknown }).msg)
              : JSON.stringify(first)
        } else if (typeof d === "string") {
          detail = d
        }
      }
      return NextResponse.json({ detail }, { status: 422 })
    }

    return NextResponse.json(
      { registrationId: result.data?.registrationId },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil"
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
