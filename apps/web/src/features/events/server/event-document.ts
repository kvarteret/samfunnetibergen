import { nanoid } from "nanoid"
import type { FormState } from "../domain/formState"

export type EventDocumentInput = FormState & { imageAssetId?: string }

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

export function buildEventDocument(input: EventDocumentInput) {
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
    initialSlug: slug,
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

  if (input.isSoldOut) doc.isSoldOut = true

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
