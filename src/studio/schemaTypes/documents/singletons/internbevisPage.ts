import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

function benefitTierField(
  name: "trinn1Benefits" | "trinn2Benefits" | "trinn3Benefits",
  title: string,
) {
  return defineField({
    name,
    title,
    type: "array",
    initialValue: [],
    of: [
      defineArrayMember({
        type: "reference",
        to: [{ type: "internbevisBenefit" }],
      }),
    ],
  })
}

export const internbevisPage = defineType({
  name: "internbevisPage",
  title: "Internbevis",
  type: "document",
  icon: icons["mobile-device"],
  fields: [
    benefitTierField("trinn1Benefits", "Trinn 1 – Brukerorganisasjon"),
    benefitTierField("trinn2Benefits", "Trinn 2 – Driftsorganisasjon"),
    benefitTierField("trinn3Benefits", "Trinn 3 – Arbeidsgruppe"),
  ],
  preview: {
    prepare() {
      return { title: "Internbevis" }
    },
  },
})
