"use server"

import { createClient } from "@sanity/client"
import { nanoid } from "nanoid"
import { getPostHogRequestDistinctId } from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import { err, ok, type Result } from "@/lib/result"
import {
  captureSubmitFailure,
  getValidationDiagnostics,
  GENERIC_SUBMIT_ERROR,
  isSubmissionRateLimited,
  INVALID_PAYLOAD_ERROR,
  RATE_LIMIT_ERROR,
} from "@/lib/submission"
import type { FormState } from "../domain/formState"
import { eventFormSchema } from "../domain/eventFormSchema"
import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  formatEventImageMaxSize,
  isAcceptedEventImageType,
} from "../domain/imageUpload"

const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv"
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"

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

export type SubmitEventInput = FormState & {
  imageAssetId?: string
  // Hidden anti-bot field; must stay empty for real submissions.
  honeypot?: string
}

export type UploadImageResult = Result<string>

export async function uploadEventImage(
  formData: FormData,
): Promise<UploadImageResult> {
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
    if (await isSubmissionRateLimited("uploadEventImage", UPLOAD_LIMIT)) {
      return err(RATE_LIMIT_ERROR)
    }
    const client = getWriteClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await client.assets.upload("image", buffer, {
      contentType: file.type,
      filename: file.name,
    })
    return ok(asset._id)
  } catch {
    captureSubmitFailure(
      "event_image_upload",
      new Error("Event image upload failed"),
      {
        source: "submit-event-image",
        failure_branch: "sanity_asset_upload_failed",
      },
    )
    return err(GENERIC_SUBMIT_ERROR)
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

  const formParsed = eventFormSchema.safeParse(input)
  if (!formParsed.success) {
    captureSubmitFailure(
      "event_submission",
      new Error("Event form schema validation failed"),
      {
        source: "submit-event",
        validation_stage: "server",
        failure_branch: "schema_validation_failed",
        form_id: "event_submission",
        ...getValidationDiagnostics(formParsed.error.issues),
      },
    )
    return err(INVALID_PAYLOAD_ERROR)
  }

  if (await isSubmissionRateLimited("submitEvent")) {
    return err(RATE_LIMIT_ERROR)
  }

  const validatedInput: SubmitEventInput = {
    ...formParsed.data,
    imageAssetId: input.imageAssetId,
  }

  try {
    const doc = buildEventDocument(validatedInput)
    const created = await getWriteClient().create(doc)
    try {
      getPostHogClient().capture({
        distinctId: await getPostHogRequestDistinctId(),
        event: "event_submission_submitted",
        properties: {
          title: validatedInput.title,
          is_recurring: validatedInput.isRecurring,
          is_internal: validatedInput.isInternalEvent,
          is_free: validatedInput.isFree,
          has_ticket_url: Boolean(validatedInput.ticketUrl),
          has_facebook_url: Boolean(validatedInput.facebookUrl),
          date_count: validatedInput.dates.filter(date => date.startDate)
            .length,
          sanity_document_id: created._id,
        },
      })
    } catch {
      // A successful Sanity write remains successful if analytics fails.
    }
    return ok(created._id)
  } catch {
    captureSubmitFailure(
      "event_submission",
      new Error("Sanity event document creation failed"),
      {
        source: "submit-event",
        failure_branch: "sanity_document_create_failed",
        is_recurring: validatedInput.isRecurring,
        is_internal: validatedInput.isInternalEvent,
        is_free: validatedInput.isFree,
        has_ticket_url: Boolean(validatedInput.ticketUrl),
        has_facebook_url: Boolean(validatedInput.facebookUrl),
        date_count: validatedInput.dates.filter(date => date.startDate).length,
      },
    )
    return err(GENERIC_SUBMIT_ERROR)
  }
}

function buildEventDocument(input: SubmitEventInput) {
  const slug = `${toSlug(input.title)}-${Date.now()}`
  // A recurring submission becomes a seriesParent (an editor approves it and
  // generates the concrete instances); everything else is a single event
  // (ADR 005, Decision D8). Both enter the editorial queue as pending.
  const isRecurringSeries = Boolean(input.isRecurring && input.rrule)
  const doc: { _type: string; [key: string]: unknown } = {
    _type: "arrangement",
    localizedTitle: localizedEntries(
      input.title.trim(),
      input.titleEnglish.trim(),
      "internationalizedArrayStringValue",
    ),
    slug: { _type: "slug", current: slug },
    eventKind: isRecurringSeries ? "seriesParent" : "single",
    eventStatus: "scheduled",
    approvalStatus: "pending",
    dates: input.dates
      .filter(date => date.startDate)
      .map(d => ({
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
    doc.localizedDescription = localizedEntries(
      portableTextValue(input.description.trim()),
      portableTextValue(input.descriptionEnglish.trim()),
      "internationalizedArrayPortableTextContentValue",
    )
  }

  if (isRecurringSeries) {
    doc.isRecurring = true
    doc.rrule = input.rrule
  }

  setLocalizedOpt(
    doc,
    "localizedRoomText",
    input.roomText?.trim(),
    input.roomTextEnglish?.trim(),
  )
  setLocalizedOpt(
    doc,
    "localizedOrganizerText",
    input.organizerText?.trim(),
    input.organizerTextEnglish?.trim(),
  )
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

function setLocalizedOpt(
  doc: Record<string, unknown>,
  key: string,
  value?: string,
  englishValue?: string,
) {
  if (value && englishValue)
    doc[key] = localizedEntries(
      value,
      englishValue,
      "internationalizedArrayStringValue",
    )
}

function localizedEntries<T>(
  norwegianValue: T,
  englishValue: T,
  type:
    | "internationalizedArrayStringValue"
    | "internationalizedArrayPortableTextContentValue",
) {
  return [
    {
      _key: nanoid(),
      _type: type,
      language: "nb",
      value: norwegianValue,
    },
    {
      _key: nanoid(),
      _type: type,
      language: "en",
      value: englishValue,
    },
  ]
}

function portableTextValue(value: string) {
  return [
    {
      _key: nanoid(),
      _type: "block",
      style: "normal",
      children: [{ _key: nanoid(), _type: "span", text: value }],
      markDefs: [],
    },
  ]
}
function setNum(
  doc: Record<string, unknown>,
  key: string,
  value: number | string | undefined,
) {
  if (value === undefined || (typeof value === "string" && !value.trim())) {
    return
  }
  const numericValue = typeof value === "number" ? value : Number(value)
  if (Number.isFinite(numericValue) && numericValue >= 0) {
    doc[key] = numericValue
  }
}
function setRef(
  doc: Record<string, unknown>,
  key: string,
  ref?: string | null,
) {
  if (ref) doc[key] = { _type: "reference", _ref: ref }
}
