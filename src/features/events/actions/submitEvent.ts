"use server"

import { createClient } from "@sanity/client"
import { nanoid } from "nanoid"
import {
  getHandledExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { err, ok, type Result } from "@/lib/result"
import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  formatEventImageMaxSize,
  isAcceptedEventImageType,
} from "../domain/imageUpload"
import { getEventValidationIssues } from "../domain/validation"

const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv"
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"

// User-facing copy. Internal error detail never crosses to the client; it is
// kept in the PostHog captures below for debugging.
const GENERIC_ERROR = "Noe gikk galt. Prøv igjen senere."
const RATE_LIMIT_ERROR = "For mange forsøk. Vent litt og prøv igjen."

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const SUBMIT_LIMIT = 5
const UPLOAD_LIMIT = 12

function getWriteClient() {
  if (!WRITE_TOKEN) {
    throw new Error("SANITY_WRITE_TOKEN is not configured")
  }
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2024-01-01",
    token: WRITE_TOKEN,
    useCdn: false,
  })
}

export type EventDate = {
  startDate: string
  startTime?: string
  endTime?: string
}

export type SubmitEventInput = {
  title: string
  description?: string
  dates: EventDate[]
  isRecurring?: boolean
  rrule?: string
  room?: string
  roomText?: string
  organizerGroup?: string
  organizerText?: string
  eventTypeId?: string
  imageAssetId?: string
  isInternalEvent?: boolean
  isFree?: boolean
  priceOrdinar?: number
  priceStudent?: number
  priceMedlem?: number
  ticketUrl?: string
  facebookUrl?: string
  submittedBy: string
  submittedByEmail: string
  submittedByOrganization?: string
  // Hidden anti-bot field; must stay empty for real submissions.
  honeypot?: string
}

export type UploadImageResult = Result<string>

export async function uploadEventImage(
  formData: FormData,
): Promise<UploadImageResult> {
  const ip = await getClientIp()
  if (
    !checkRateLimit({
      name: "uploadEventImage",
      ip,
      limit: UPLOAD_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })
  ) {
    return err(RATE_LIMIT_ERROR)
  }

  try {
    const file = formData.get("image")
    if (!(file instanceof File) || !file.size) {
      return err("Ingen fil mottatt")
    }
    if (!isAcceptedEventImageType(file.type)) {
      return err("Bildet må være JPEG, PNG eller WebP")
    }
    if (file.size > EVENT_IMAGE_MAX_SIZE_BYTES) {
      return err(`Bildet er for stort (maks ${formatEventImageMaxSize()})`)
    }
    const client = getWriteClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await client.assets.upload("image", buffer, {
      contentType: file.type,
      filename: file.name,
    })
    return ok(asset._id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil"
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: "anonymous",
      event: "event_image_upload_failed",
      properties: { error: message },
    })
    posthog.captureException(
      toPostHogException(error),
      "anonymous",
      getHandledExceptionProperties("event_image_upload", {
        source: "submit-event-image",
        failure_branch: "sanity_asset_upload_failed",
      }),
    )
    return err(GENERIC_ERROR)
  }
}

export type SubmitEventResult = Result<string>

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://"))
    return undefined
  return trimmed
}

export async function submitEvent(
  input: SubmitEventInput,
): Promise<SubmitEventResult> {
  // Silently accept honeypot hits so bots get a success response and never
  // learn the field is a trap; nothing is written to Sanity.
  if (input.honeypot?.trim()) {
    return ok("ignored")
  }

  const ip = await getClientIp()
  if (
    !checkRateLimit({
      name: "submitEvent",
      ip,
      limit: SUBMIT_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })
  ) {
    return err(RATE_LIMIT_ERROR)
  }

  const issues = getEventValidationIssues({
    title: input.title ?? "",
    dates: input.dates ?? [],
    submittedBy: input.submittedBy ?? "",
    submittedByEmail: input.submittedByEmail ?? "",
    isRecurring: Boolean(input.isRecurring),
    rrule: input.rrule ?? "",
  })
  if (issues.length > 0) return err(issues[0].message)

  try {
    const doc = buildEventDocument(input)
    const created = await getWriteClient().create(doc)
    getPostHogClient().capture({
      distinctId: "anonymous",
      event: "event_submission_submitted",
      properties: {
        title: input.title,
        is_recurring: Boolean(input.isRecurring),
        is_internal: Boolean(input.isInternalEvent),
        is_free: Boolean(input.isFree),
        has_ticket_url: Boolean(input.ticketUrl),
        has_facebook_url: Boolean(input.facebookUrl),
        date_count: input.dates.length,
        sanity_document_id: created._id,
      },
    })
    return ok(created._id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil"
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: "anonymous",
      event: "event_submission_submit_failed",
      properties: { error: message },
    })
    posthog.captureException(
      toPostHogException(error),
      "anonymous",
      getHandledExceptionProperties("event_submission", {
        source: "submit-event",
        failure_branch: "sanity_document_create_failed",
        is_recurring: Boolean(input.isRecurring),
        is_internal: Boolean(input.isInternalEvent),
        is_free: Boolean(input.isFree),
        has_ticket_url: Boolean(input.ticketUrl),
        has_facebook_url: Boolean(input.facebookUrl),
        date_count: input.dates.length,
      }),
    )
    return err(GENERIC_ERROR)
  }
}

function buildEventDocument(input: SubmitEventInput) {
  const slug = `${toSlug(input.title)}-${Date.now()}`
  const doc: { _type: string; [key: string]: unknown } = {
    _type: "arrangement",
    title: input.title.trim(),
    slug: { _type: "slug", current: slug },
    approvalStatus: "pending",
    dates: input.dates.map(d => ({
      _key: nanoid(),
      _type: "arrangementDate",
      startDate: d.startDate,
      ...(d.startTime ? { startTime: d.startTime } : {}),
      ...(d.endTime ? { endTime: d.endTime } : {}),
    })),
    submittedBy: input.submittedBy.trim(),
    submittedByEmail: input.submittedByEmail.trim(),
  }

  if (input.description?.trim()) {
    doc.description = [
      {
        _key: nanoid(),
        _type: "block",
        style: "normal",
        children: [
          { _key: nanoid(), _type: "span", text: input.description.trim() },
        ],
        markDefs: [],
      },
    ]
  }

  if (input.isRecurring && input.rrule) {
    doc.isRecurring = true
    doc.rrule = input.rrule
  }

  setOpt(doc, "roomText", input.roomText?.trim())
  setOpt(doc, "organizerText", input.organizerText?.trim())
  setOpt(doc, "submittedByOrganization", input.submittedByOrganization?.trim())

  if (input.isInternalEvent) doc.isInternalEvent = true

  if (input.isFree) {
    doc.isFree = true
  } else {
    setNum(doc, "priceOrdinar", input.priceOrdinar)
    setNum(doc, "priceStudent", input.priceStudent)
    setNum(doc, "priceMedlem", input.priceMedlem)
  }

  const ticketUrl = sanitizeUrl(input.ticketUrl)
  if (ticketUrl) doc.ticketUrl = ticketUrl
  const facebookUrl = sanitizeUrl(input.facebookUrl)
  if (facebookUrl) doc.facebookUrl = facebookUrl

  setRef(doc, "eventType", input.eventTypeId)
  if (input.imageAssetId) {
    doc.image = {
      _type: "image",
      asset: { _type: "reference", _ref: input.imageAssetId },
    }
  }
  setRef(doc, "room", input.room)
  setRef(doc, "organizerGroup", input.organizerGroup)

  return doc
}

function setOpt(doc: Record<string, unknown>, key: string, value?: string) {
  if (value) doc[key] = value
}
function setNum(
  doc: Record<string, unknown>,
  key: string,
  value: number | undefined,
) {
  if (value !== undefined && value >= 0) doc[key] = value
}
function setRef(
  doc: Record<string, unknown>,
  key: string,
  ref?: string | null,
) {
  if (ref) doc[key] = { _type: "reference", _ref: ref }
}
