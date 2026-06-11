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
  try {
    const body = await request.json().catch(() => null)
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

    const result = await createPublicVolunteerProspect({
      client: personalClient,
      body: requestBody,
    })

    if (result.error) {
      return NextResponse.json(
        { detail: extractErrorDetail(result.error) },
        { status: 422 },
      )
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
