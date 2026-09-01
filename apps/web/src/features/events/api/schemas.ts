import { z } from "zod"

import {
  isValidPublicDate,
  PUBLIC_EVENT_KINDS,
  type PublicEventKind,
} from "../domain/public-events"

export const publicEventKindSchema = z.enum(
  PUBLIC_EVENT_KINDS as unknown as [PublicEventKind, ...PublicEventKind[]],
)
export const publicEventStatusSchema = z.enum(["scheduled", "cancelled"])
export const publicLocaleSchema = z.enum(["nb", "en"])

export const publicDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine(isValidPublicDate, "Expected a real calendar date")

const publicImageSchema = z
  .object({
    url: z.string().url(),
    caption: z.string().nullable(),
  })
  .strict()

const publicTaxonomySchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
  })
  .strict()

const publicEventTypeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
  })
  .strict()

const publicOrganizerSchema = z.union([
  z
    .object({
      kind: z.literal("group"),
      id: z.string().min(1),
      name: z.string(),
      slug: z.string(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("text"),
      name: z.string(),
    })
    .strict(),
])

const publicLocationSchema = z.union([
  z
    .object({
      kind: z.literal("room"),
      id: z.string().min(1),
      name: z.string(),
      slug: z.string(),
      floor: z.number().nullable(),
      imageUrl: z.string().url().nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("text"),
      name: z.string(),
    })
    .strict(),
])

const publicSummaryLinksSchema = z
  .object({
    self: z.string().url(),
    website: z.string().url(),
  })
  .strict()

const publicParentSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    kind: publicEventKindSchema,
    status: publicEventStatusSchema,
    title: z.string(),
    links: publicSummaryLinksSchema,
  })
  .strict()

export const publicScheduleSchema = z
  .object({
    startDate: publicDateSchema,
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}(?::\d{2})?$/)
      .nullable(),
    endDate: publicDateSchema.nullable(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}(?::\d{2})?$/)
      .nullable(),
    startsAt: z.string().datetime({ offset: true }).nullable(),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    timeZone: z.literal("Europe/Oslo"),
  })
  .strict()

export const publicEventSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    kind: publicEventKindSchema,
    status: publicEventStatusSchema,
    title: z.string(),
    image: publicImageSchema.nullable(),
    eventType: publicEventTypeSchema.nullable(),
    taxonomyGroup: publicTaxonomySchema.nullable(),
    organizer: publicOrganizerSchema.nullable(),
    location: publicLocationSchema.nullable(),
    parent: publicParentSummarySchema.nullable(),
    links: publicSummaryLinksSchema,
  })
  .strict()

export const publicOccurrenceSummarySchema = z
  .object({
    id: z.string().min(1),
    schedule: publicScheduleSchema,
    event: publicEventSummarySchema,
  })
  .strict()

const publicDetailLinksSchema = publicSummaryLinksSchema.extend({
  ticket: z.string().url().nullable(),
  facebook: z.string().url().nullable(),
})

const publicDescriptionSchema = z
  .object({
    blocks: z.array(z.unknown()),
    text: z.string(),
  })
  .strict()

const publicPricingSchema = z
  .object({
    currency: z.literal("NOK"),
    isFree: z.boolean(),
    ordinary: z.number().nullable(),
    student: z.number().nullable(),
    member: z.number().nullable(),
  })
  .strict()

export const publicEventDetailSchema = publicEventSummarySchema
  .extend({
    description: publicDescriptionSchema,
    pricing: publicPricingSchema,
    links: publicDetailLinksSchema,
    occurrences: z.array(publicOccurrenceSummarySchema),
  })
  .strict()

export const publicCollectionResponseSchema = z
  .object({
    data: z.array(publicOccurrenceSummarySchema),
    meta: z
      .object({
        locale: publicLocaleSchema,
        from: publicDateSchema,
        to: publicDateSchema.nullable(),
        count: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
        paginated: z.boolean(),
      })
      .strict(),
    links: z
      .object({
        self: z.string().url(),
        next: z.string().url().nullable(),
      })
      .strict(),
  })
  .strict()

export const publicDetailResponseSchema = z
  .object({
    data: publicEventDetailSchema,
    meta: z.object({ locale: publicLocaleSchema }).strict(),
    links: publicDetailLinksSchema,
  })
  .strict()

export const publicErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum(["invalid_request", "not_found", "internal_error"]),
        message: z.string(),
      })
      .strict(),
  })
  .strict()

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
