import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { DurationInput } from "./DurationInput"

export const timeValue = defineType({
  name: "timeValue",
  title: "Tidspunkt",
  type: "string",
  options: {
    list: allowedTimes(),
  },
})

export const duration = defineType({
  name: "duration",
  title: "Varighet",
  type: "object",
  icon: icons.clock,
  fields: [
    defineField({
      name: "start",
      title: "Fra",
      type: "timeValue",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "end",
      title: "Til",
      type: "timeValue",
      validation: rule => rule.required(),
    }),
  ],
  options: { columns: 2 },
  components: { input: DurationInput },
  preview: {
    select: { start: "start", end: "end" },
    prepare({ start, end }) {
      return {
        title: start && end ? `${start} - ${end}` : "Varighet mangler",
      }
    },
  },
})

function allowedTimes() {
  const times = []
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      times.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      )
    }
  }
  return times
}
