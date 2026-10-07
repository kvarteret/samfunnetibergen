import { resolveEventContent } from "@samfunnet/content-domain/resolve-event"
import type { ImageCrop, ImageHotspot } from "./imageFrames"

export type PreviewLocale = "nb" | "en"
type LocalizedValue = { language?: string; value?: unknown }
export type PreviewDocument = {
  _id?: string
  eventKind?: string | null
  eventStatus?: string | null
  approvalStatus?: string | null
  localizedTitle?: LocalizedValue[] | null
  localizedDescription?: LocalizedValue[] | null
  localizedOrganizerText?: LocalizedValue[] | null
  localizedRoomText?: LocalizedValue[] | null
  localizedImageCaption?: LocalizedValue[] | null
  image?: {
    asset?: { _ref?: string | null }
    caption?: string
    alt?: string | null
    crop?: ImageCrop | null
    hotspot?: ImageHotspot | null
  } | null
  room?: { _ref?: string | null } | null
  eventType?: { _ref?: string | null } | null
  organizerGroup?: { _ref?: string | null } | null
  parentEvent?: { _ref?: string | null } | null
  dates?:
    | {
        _key?: string
        startDate?: string | null
        startTime?: string | null
        endTime?: string | null
      }[]
    | null
  slug?: { current?: string } | null
  isFree?: boolean | null
  isSoldOut?: boolean | null
  priceOrdinar?: number | null
  priceStudent?: number | null
  priceMedlem?: number | null
  ticketUrl?: string | null
  facebookUrl?: string | null
  submittedBy?: string | null
  submittedByEmail?: string | null
}
export type PreviewReferences = {
  room: {
    _id: string
    localizedTitle?: LocalizedValue[]
    floor?: number | null
  } | null
  eventType: { _id: string; localizedName?: LocalizedValue[] } | null
  organizer: { _id: string; localizedName?: LocalizedValue[] } | null
  parent: PreviewDocument | null
  childDates: NonNullable<PreviewDocument["dates"]>
}
export const EMPTY_PREVIEW_REFERENCES: PreviewReferences = {
  room: null,
  eventType: null,
  organizer: null,
  parent: null,
  childDates: [],
}

function localized(
  values: LocalizedValue[] | null | undefined,
  locale: PreviewLocale,
) {
  return values?.find(value => value.language === locale)?.value
}
function text(
  values: LocalizedValue[] | null | undefined,
  locale: PreviewLocale,
): string {
  const value = localized(values, locale)
  return typeof value === "string" ? value.trim() : ""
}
function description(
  values: LocalizedValue[] | null | undefined,
  locale: PreviewLocale,
): string {
  const value = localized(values, locale)
  if (!Array.isArray(value)) return ""
  return value
    .flatMap(block =>
      Array.isArray(block?.children)
        ? block.children.map((child: { text?: string }) => child.text ?? "")
        : [],
    )
    .join(" ")
    .trim()
}
function content(doc: PreviewDocument, locale: PreviewLocale) {
  return {
    title: text(doc.localizedTitle, locale) || undefined,
    description: description(doc.localizedDescription, locale) || undefined,
    imageUrl: doc.image?.asset?._ref,
    organizerGroup: doc.organizerGroup,
    organizerText: text(doc.localizedOrganizerText, locale) || undefined,
    eventType: doc.eventType,
    isFree: doc.isFree,
    isSoldOut: doc.isSoldOut,
    priceOrdinar: doc.priceOrdinar,
    priceStudent: doc.priceStudent,
    priceMedlem: doc.priceMedlem,
    ticketUrl: doc.ticketUrl,
    facebookUrl: doc.facebookUrl,
  }
}
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
export function validPreviewDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}
export function previewDateLabel(
  date: NonNullable<PreviewDocument["dates"]>[number],
  locale: PreviewLocale,
): string {
  const label = validPreviewDate(date.startDate)
    ? new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/Oslo",
      }).format(new Date(`${date.startDate}T12:00:00Z`))
    : locale === "nb"
      ? "Dato mangler"
      : "Date missing"
  const opening = timePattern.test(date.startTime ?? "")
    ? (date.startTime ?? "?")
    : "?"
  const closing = timePattern.test(date.endTime ?? "")
    ? (date.endTime ?? "?")
    : "?"
  const overnight = opening !== "?" && closing !== "?" && closing <= opening
  return `${label} · ${opening}–${closing}${overnight ? (locale === "nb" ? " (+1 dag)" : " (+1 day)") : ""}`
}
export type PreviewCheck = {
  id: string
  label: string
  done: boolean
  required: boolean
  /** Document field the editor should jump to when fixing this check. */
  path: string
  /** What the approver needs to verify, one line per value. */
  values: string[]
}
export function buildArrangementPreview(
  doc: PreviewDocument,
  refs: PreviewReferences,
  locale: PreviewLocale,
) {
  const child = ["seriesInstance", "festivalSession"].includes(
    doc.eventKind ?? "",
  )
  const resolved = resolveEventContent(
    content(doc, locale),
    child && refs.parent ? content(refs.parent, locale) : null,
  )
  const nb = resolveEventContent(
    content(doc, "nb"),
    child && refs.parent ? content(refs.parent, "nb") : null,
  )
  const en = resolveEventContent(
    content(doc, "en"),
    child && refs.parent ? content(refs.parent, "en") : null,
  )
  const festival = doc.eventKind === "festivalParent"
  const dates = festival ? refs.childDates : (doc.dates ?? [])
  const room = refs.room
    ? text(refs.room.localizedTitle, locale) ||
      text(refs.room.localizedTitle, "nb")
    : ""
  const roomText = text(doc.localizedRoomText, locale)
  const dateLabels = dates.map(d => previewDateLabel(d, locale))
  const excerpt = (value: string | undefined) =>
    value && value.length > 140 ? `${value.slice(0, 140).trimEnd()} …` : value
  const languageValues = (nbValue?: string, enValue?: string) => [
    `Norsk: ${nbValue || "mangler"}`,
    `English: ${enValue || "missing"}`,
  ]
  const type = refs.eventType
    ? text(refs.eventType.localizedName, locale) ||
      text(refs.eventType.localizedName, "nb")
    : ""
  const organizer = refs.organizer
    ? text(refs.organizer.localizedName, locale) ||
      text(refs.organizer.localizedName, "nb")
    : resolved.organizerText
  const hasPrices = [
    resolved.priceOrdinar,
    resolved.priceStudent,
    resolved.priceMedlem,
  ].some(
    price => typeof price === "number" && Number.isFinite(price) && price >= 0,
  )
  const priced = Boolean(resolved.isFree || resolved.isSoldOut || hasPrices)
  const pricing = resolved.isSoldOut
    ? locale === "nb"
      ? "Utsolgt"
      : "Sold out"
    : resolved.isFree
      ? locale === "nb"
        ? "Gratis"
        : "Free"
      : [
          [locale === "nb" ? "Ordinær" : "Regular", resolved.priceOrdinar],
          [locale === "nb" ? "Student" : "Student", resolved.priceStudent],
          [locale === "nb" ? "Medlem" : "Member", resolved.priceMedlem],
        ]
          .filter(
            ([, price]) => typeof price === "number" && Number.isFinite(price),
          )
          .map(([label, price]) => `${label}: ${price} kr`)
          .join(" · ")
  const checks: PreviewCheck[] = [
    {
      id: "title",
      label: "Tittel",
      done: Boolean(nb.title && en.title),
      required: true,
      path: "localizedTitle",
      values: languageValues(nb.title, en.title),
    },
    {
      id: "description",
      label: "Beskrivelse",
      done: Boolean(nb.description && en.description),
      required: false,
      path: "localizedDescription",
      values: languageValues(excerpt(nb.description), excerpt(en.description)),
    },
    {
      id: "dates",
      label: festival ? "Programdager og dørtider" : "Dato og dørtider",
      done:
        dates.length > 0 &&
        dates.every(
          d =>
            validPreviewDate(d.startDate) &&
            timePattern.test(d.startTime ?? "") &&
            timePattern.test(d.endTime ?? ""),
        ),
      required: true,
      path: "dates",
      values: dateLabels,
    },
    ...(festival
      ? []
      : [
          {
            id: "room",
            label: "Rom",
            done: Boolean(room),
            required: true,
            path: "room",
            values: room
              ? [
                  `${room}${refs.room?.floor != null ? ` · ${refs.room.floor}. etasje` : ""}`,
                ]
              : roomText
                ? [`Fritekst: ${roomText}`]
                : [],
          },
        ]),
    {
      id: "price",
      label: "Pris",
      done: priced,
      required: true,
      path: "isFree",
      values: pricing ? [pricing] : [],
    },
    {
      id: "image",
      label: "Bilde",
      done: Boolean(resolved.imageUrl),
      required: false,
      path: "image",
      values: resolved.imageUrl
        ? [
            doc.image?.alt
              ? `Alt-tekst: ${doc.image.alt}`
              : locale === "nb"
                ? "Alt-tekst mangler"
                : "Alt text missing",
            ...(text(doc.localizedImageCaption, locale)
              ? [`Bildetekst: ${text(doc.localizedImageCaption, locale)}`]
              : []),
          ]
        : [],
    },
    {
      id: "type",
      label: "Arrangementtype",
      done: Boolean(type),
      required: false,
      path: "eventType",
      values: type ? [type] : [],
    },
    {
      id: "organizer",
      label: "Arrangør",
      done: Boolean(organizer),
      required: false,
      path: "organizerGroup",
      values: organizer ? [organizer] : [],
    },
    {
      id: "slug",
      label: "Nettadresse",
      done: Boolean(doc.slug?.current),
      required: true,
      path: "slug",
      values: doc.slug?.current ? [`/arrangementer/${doc.slug.current}`] : [],
    },
  ]
  return {
    title:
      resolved.title ?? (locale === "nb" ? "Tittel mangler" : "Title missing"),
    description: resolved.description,
    room,
    floor: refs.room?.floor,
    type,
    organizer,
    imageRef: resolved.imageUrl,
    pricing,
    ticketUrl: resolved.ticketUrl,
    facebookUrl: resolved.facebookUrl,
    dates,
    dateLabels,
    checks,
    completed: checks.filter(c => c.done).length,
    total: checks.length,
    missingRequired: checks.filter(c => c.required && !c.done),
    status:
      doc.eventStatus === "cancelled"
        ? locale === "nb"
          ? "Kansellert"
          : "Cancelled"
        : resolved.isSoldOut
          ? locale === "nb"
            ? "Utsolgt"
            : "Sold out"
          : null,
  }
}
