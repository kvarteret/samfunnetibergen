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
  url: z.url(),
  caption: z.string().nullable(),
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
])

const publicSummaryLinksSchema = z.strictObject({
  self: z.url(),
  website: z.url(),
})

const publicParentSummarySchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: publicEventKindSchema,
  status: publicEventStatusSchema,
  title: z.string(),
  links: publicSummaryLinksSchema,
})

const publicScheduleSchema = z.strictObject({
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
  startsAt: z.iso.datetime({ offset: true }).nullable(),
  endsAt: z.iso.datetime({ offset: true }).nullable(),
  timeZone: z.literal("Europe/Oslo"),
})

const publicEventSummarySchema = z.strictObject({
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

const publicOccurrenceSummarySchema = z.strictObject({
  id: z.string().min(1),
  schedule: publicScheduleSchema,
  event: publicEventSummarySchema,
})

const publicDetailLinksSchema = publicSummaryLinksSchema.extend({
  ticket: z.url().nullable(),
  facebook: z.url().nullable(),
})

const publicDescriptionSchema = z.strictObject({
  blocks: z.array(z.unknown()),
  text: z.string(),
})

const publicPricingSchema = z.strictObject({
  currency: z.literal("NOK"),
  isFree: z.boolean(),
  ordinary: z.number().nullable(),
  student: z.number().nullable(),
  member: z.number().nullable(),
})

const publicEventDetailSchema = publicEventSummarySchema.extend({
  description: publicDescriptionSchema,
  pricing: publicPricingSchema,
  links: publicDetailLinksSchema,
  occurrences: z.array(publicOccurrenceSummarySchema),
})

export const publicCollectionResponseSchema = z.strictObject({
  data: z.array(publicOccurrenceSummarySchema),
  meta: z.strictObject({
    locale: publicLocaleSchema,
    from: publicDateSchema,
    to: publicDateSchema.nullable(),
    count: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    paginated: z.boolean(),
  }),
  links: z.strictObject({
    self: z.url(),
    next: z.url().nullable(),
  }),
})

export const publicDetailResponseSchema = z.strictObject({
  data: publicEventDetailSchema,
  meta: z.strictObject({ locale: publicLocaleSchema }),
  links: publicDetailLinksSchema,
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
