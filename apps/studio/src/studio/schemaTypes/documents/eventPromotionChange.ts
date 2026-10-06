import { defineField, defineType } from "sanity"

export const eventPromotionChange = defineType({
  name: "eventPromotionChange",
  title: "Promotion campaign history",
  type: "document",
  readOnly: true,
  fields: [
    ...["eventId", "revision", "campaignId", "kind", "slug", "title"].map(
      name => defineField({ name, type: "string" }),
    ),
    ...["changedAt", "observedAt"].map(name =>
      defineField({ name, type: "datetime" }),
    ),
    ...["beforePromoted", "afterPromoted", "startKnown"].map(name =>
      defineField({ name, type: "boolean" }),
    ),
    ...["beforePlacement", "afterPlacement"].map(name =>
      defineField({ name, type: "string" }),
    ),
    ...["beforeOrder", "afterOrder"].map(name =>
      defineField({ name, type: "number" }),
    ),
  ],
  preview: { select: { title: "title", subtitle: "changedAt" } },
  orderings: [
    {
      title: "Newest first",
      name: "newest",
      by: [{ field: "changedAt", direction: "desc" }],
    },
  ],
})
