import { z } from "zod"

import {
  isValidPublicDate,
  PUBLIC_EVENT_KINDS,
  type PublicEventKind,
} from "../domain/events"

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

const publicEventLinksSchema = z.strictObject({
  website: z.url().describe("Canonical website URL for this event."),
  ticket: z.url().nullable().describe("Purchase URL, when available."),
  facebook: z.url().nullable().describe("Facebook URL, when available."),
})

const publicParentSummarySchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: publicEventKindSchema,
  status: publicEventStatusSchema,
  title: z.string(),
  website: z.url().describe("Canonical website URL for the parent event."),
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

/** One complete public event representation used by every collection item. */
export const publicEventSchema = z.strictObject({
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
  links: publicEventLinksSchema,
})

export const publicOccurrenceSchema = z.strictObject({
  id: z.string().min(1),
  schedule: publicScheduleSchema,
  event: publicEventSchema,
})

export const publicCollectionResponseSchema = z.strictObject({
  data: z.array(publicOccurrenceSchema),
  meta: z.strictObject({
    locale: publicLocaleSchema,
    from: publicDateSchema,
    to: publicDateSchema.nullable(),
  }),
})

export const publicErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(["invalid_request", "internal_error"]),
    message: z.string(),
  }),
})

export type PublicApiEvent = z.infer<typeof publicEventSchema>
export type PublicApiOccurrence = z.infer<typeof publicOccurrenceSchema>
export type PublicCollectionResponse = z.infer<
  typeof publicCollectionResponseSchema
>
export type PublicErrorResponse = z.infer<typeof publicErrorResponseSchema>
