import { defineField, defineType } from "sanity";

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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Starttid",
      description: "Format: HH:MM (f.eks. 19:00). Anbefalt, men ikke påkrevd.",
      type: "string",
      validation: (rule) =>
        rule
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
            name: "tid",
            invert: false,
          })
          .warning("Starttid bør angis i format HH:MM (f.eks. 19:00)"),
    }),
    defineField({
      name: "endTime",
      title: "Sluttid",
      description:
        "Format: HH:MM. Valgfritt — antas å slutte ved midnatt om ikke angitt.",
      type: "string",
      validation: (rule) =>
        rule
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
            name: "tid",
            invert: false,
          })
          .warning("Sluttid bør angis i format HH:MM (f.eks. 23:00)"),
    }),
  ],
  preview: {
    select: {
      startDate: "startDate",
      startTime: "startTime",
      endTime: "endTime",
    },
    prepare({ startDate, startTime, endTime }) {
      let timeRange = "";
      if (startTime) {
        timeRange = endTime ? `${startTime}–${endTime}` : startTime;
      }
      return {
        title: startDate ?? "Dato",
        subtitle: timeRange || undefined,
      };
    },
  },
});
