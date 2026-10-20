import { defineField, defineType } from "sanity"

// "Kun infoskjerm" arrangements are always today and need only a start time;
// ArrangementDatesInput fills in the date.
const isInfoScreenOnly = ({ document }: { document?: unknown }) =>
  (document as { infoScreenOnly?: boolean } | undefined)?.infoScreenOnly ===
  true

export const arrangementDate = defineType({
  name: "arrangementDate",
  title: "Dato",
  type: "object",
  fields: [
    defineField({
      name: "startDate",
      title: "Dato",
      description: "Hvilken dato arrangementet starter",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      hidden: isInfoScreenOnly,
      validation: rule => rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Dørene åpner",
      description: "Påkrevd. Format: HH:MM (f.eks. 19:00).",
      type: "string",
      validation: rule =>
        rule
          .required()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
            name: "tid",
            invert: false,
          })
          .error("Døråpning må angis i format HH:MM (f.eks. 19:00)"),
    }),
    defineField({
      name: "endTime",
      title: "Dørene stenger",
      description: "Påkrevd. Format: HH:MM. Tid før åpning betyr neste dag.",
      type: "string",
      hidden: isInfoScreenOnly,
      validation: rule =>
        rule
          .required()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
            name: "tid",
            invert: false,
          })
          .error("Dørstenging må angis i format HH:MM (f.eks. 23:00)"),
    }),
  ],
  preview: {
    select: {
      startDate: "startDate",
      startTime: "startTime",
      endTime: "endTime",
    },
    prepare({ startDate, startTime, endTime }) {
      let timeRange = ""
      if (startTime) {
        timeRange = endTime ? `${startTime}–${endTime}` : startTime
      }
      return {
        title: startDate ?? "Dato",
        subtitle: timeRange || undefined,
      }
    },
  },
})
