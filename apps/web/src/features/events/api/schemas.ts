import { z } from "zod"

import {
  isValidPublicDate,
  PUBLIC_EVENT_KINDS,
  type PublicEventKind,
} from "../domain/public-events"

const publicEventKindSchema = z.enum(
  PUBLIC_EVENT_KINDS as unknown as [PublicEventKind, ...PublicEventKind[]],
)
const publicEventStatusSchema = z.enum(["scheduled", "cancelled"])
export const publicLocaleSchema = z.enum(["nb", "en"])

export const publicDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine(isValidPublicDate, "Expected a real calendar date")

const publicImageSchema = z.strictObject({
  url: z.url().describe("Absolute image URL."),
  caption: z.string().nullable().describe("Optional image caption."),
})

const publicTaxonomySchema = z.strictObject({
  id: z.string().min(1),
  name: z.string(),
})

const publicEventTypeSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string(),
})

const publicOrganizerSchema = z.union([
  z.strictObject({
    kind: z.literal("group"),
    id: z.string().min(1),
    name: z.string(),
    slug: z.string(),
  }),
  z.strictObject({
    kind: z.literal("text"),
    name: z.string(),
  }),
])

const publicLocationSchema = z.union([
  z.strictObject({
    kind: z.literal("room"),
    id: z.string().min(1),
    name: z.string(),
    slug: z.string(),
    floor: z.number().nullable(),
    imageUrl: z.url().nullable(),
  }),
  z.strictObject({
    kind: z.literal("text"),
    name: z.string(),
  }),
  z.strictObject({
    kind: z.literal("venue"),
    name: z.literal("Det Akademiske Kvarter"),
  }),
])

const publicNavigationLinksSchema = z.strictObject({
  self: z.url().describe("Canonical API URL for this event."),
  website: z.url().describe("Canonical website URL for this event."),
})

const publicSummaryLinksSchema = publicNavigationLinksSchema.extend({
  ticket: z.url().nullable().describe("Purchase URL, when available."),
})

const publicParentSummarySchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: publicEventKindSchema,
  status: publicEventStatusSchema,
  title: z.string(),
  links: publicNavigationLinksSchema,
})

const publicTimedScheduleSchema = z.strictObject({
  kind: z
    .literal("timed")
    .describe("The occurrence has a concrete start time."),
  startsAt: z.iso
    .datetime({ offset: true })
    .describe("UTC start timestamp in ISO 8601 format."),
  endsAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("UTC end timestamp, or null when the end is unknown."),
  timeZone: z
    .literal("Europe/Oslo")
    .describe("Local time zone used by the editorial schedule."),
})

const publicDateOnlyScheduleSchema = z.strictObject({
  kind: z.literal("date").describe("The occurrence has no concrete time."),
  date: publicDateSchema.describe("Local calendar date in Europe/Oslo."),
  timeZone: z
    .literal("Europe/Oslo")
    .describe("Local time zone used by the editorial schedule."),
})

export const publicScheduleSchema = z.discriminatedUnion("kind", [
  publicTimedScheduleSchema,
  publicDateOnlyScheduleSchema,
])

const publicPricingSchema = z.strictObject({
  currency: z.literal("NOK"),
  isFree: z.boolean(),
  ordinary: z.number().nullable(),
  student: z.number().nullable(),
  member: z.number().nullable(),
})

const publicEventSummarySchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: publicEventKindSchema,
  status: publicEventStatusSchema,
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
  title: z.string().describe("Localized public event title."),
  description: z.strictObject({
    html: z
      .string()
      .describe("Sanitized HTML description using the supported subset."),
    text: z.string().describe("Plain-text description."),
  }),
  image: publicImageSchema.nullable(),
  eventType: publicEventTypeSchema.nullable(),
  taxonomyGroup: publicTaxonomySchema.nullable(),
  organizer: publicOrganizerSchema.nullable(),
  location: publicLocationSchema,
  pricing: publicPricingSchema,
  parent: publicParentSummarySchema.nullable(),
  links: publicSummaryLinksSchema,
})

const publicOccurrenceSummarySchema = z.strictObject({
  id: z.string().min(1),
  schedule: publicScheduleSchema,
  event: publicEventSummarySchema,
})

const publicDetailLinksSchema = publicSummaryLinksSchema.extend({
  facebook: z.url().nullable().describe("Facebook URL, when available."),
})

const publicOccurrenceScheduleSchema = z.strictObject({
  id: z.string().min(1),
  schedule: publicScheduleSchema,
})

const publicParentChildSummarySchema = publicEventSummarySchema.omit({
  parent: true,
})

const publicParentOccurrenceSchema = z.strictObject({
  id: z.string().min(1),
  schedule: publicScheduleSchema,
  event: publicParentChildSummarySchema,
})

const publicLeafEventDetailSchema = publicEventSummarySchema.extend({
  detailKind: z.literal("leaf"),
  links: publicDetailLinksSchema,
  occurrences: z.array(publicOccurrenceScheduleSchema),
})

const publicParentEventDetailSchema = publicEventSummarySchema.extend({
  detailKind: z.literal("parent"),
  links: publicDetailLinksSchema,
  occurrences: z.array(publicParentOccurrenceSchema),
})

const publicEventDetailSchema = z.discriminatedUnion("detailKind", [
  publicLeafEventDetailSchema,
  publicParentEventDetailSchema,
])

export const publicCollectionResponseSchema = z.strictObject({
  data: z.array(publicOccurrenceSummarySchema),
  meta: z.strictObject({
    locale: publicLocaleSchema,
    from: publicDateSchema,
    to: publicDateSchema.nullable(),
    count: z.number().int().nonnegative(),
  }),
})

export const publicDetailResponseSchema = z.strictObject({
  data: publicEventDetailSchema,
  meta: z.strictObject({ locale: publicLocaleSchema }),
})

export const publicErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(["invalid_request", "not_found", "internal_error"]),
    message: z.string(),
  }),
})

export type PublicEventSummary = z.infer<typeof publicEventSummarySchema>
export type PublicOccurrenceSummary = z.infer<
  typeof publicOccurrenceSummarySchema
>
export type PublicEventDetail = z.infer<typeof publicEventDetailSchema>
export type PublicCollectionResponse = z.infer<
  typeof publicCollectionResponseSchema
>
export type PublicDetailResponse = z.infer<typeof publicDetailResponseSchema>
export type PublicErrorResponse = z.infer<typeof publicErrorResponseSchema>
