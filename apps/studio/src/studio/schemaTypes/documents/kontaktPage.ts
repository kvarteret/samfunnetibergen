import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

const contactPerson = defineType({
  name: "contactPerson",
  title: "Kontaktperson",
  type: "object",
  fields: [
    localizedArrayField(
      "localizedName",
      "Navn",
      "internationalizedArrayString",
      { required: true },
    ),
    localizedArrayField(
      "localizedRole",
      "Rolle",
      "internationalizedArrayString",
      {},
    ),
    defineField({ name: "email", title: "E-post", type: "string" }),
    defineField({ name: "phone", title: "Telefon", type: "string" }),
    defineField({
      name: "image",
      title: "Bilde",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: "localizedName", subtitle: "email" },
    prepare({ title, subtitle }) {
      return {
        title: Array.isArray(title)
          ? title.find(item => item?.language === "nb")?.value
          : title,
        subtitle,
      }
    },
  },
})

const contactGroup = defineType({
  name: "contactGroup",
  title: "Kontaktgruppe",
  type: "object",
  fields: [
    localizedArrayField(
      "localizedTitle",
      "Overskrift",
      "internationalizedArrayString",
      { required: true },
    ),
    defineField({
      name: "persons",
      title: "Kontaktpersoner",
      type: "array",
      of: [defineArrayMember({ type: "contactPerson" })],
    }),
  ],
  preview: {
    select: { title: "localizedTitle", persons: "persons" },
    prepare({ title, persons }) {
      return {
        title: Array.isArray(title)
          ? title.find(item => item?.language === "nb")?.value
          : title,
        subtitle: `${Array.isArray(persons) ? persons.length : 0} person(er)`,
      }
    },
  },
})

export const kontaktPage = defineType({
  name: "kontaktPage",
  // This document is both the /kontakt page and the canonical source of
  // organisation-wide contact data (consumed by footer, etc.).
  title: "Kontakt og organisasjon",
  type: "document",
  icon: icons.envelope,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – experimental API not yet in typedefs
  __experimental_actions: ["update", "publish"],
  groups: [
    { name: "org", title: "Organisasjon", default: true },
    { name: "page", title: "Kontaktside" },
  ],
  fields: [
    localizedArrayField(
      "localizedVisitAddress",
      "Besøksadresse",
      "internationalizedArrayText",
      {
        rows: 3,
        group: "org",
      },
    ),
    localizedArrayField(
      "localizedPostAddress",
      "Postadresse",
      "internationalizedArrayText",
      {
        rows: 3,
        group: "org",
      },
    ),
    localizedArrayField(
      "localizedInvoiceAddress",
      "Fakturaadresse",
      "internationalizedArrayText",
      {
        rows: 4,
        group: "org",
      },
    ),
    defineField({
      name: "invoiceEmail",
      title: "Faktura e-post",
      type: "string",
      group: "org",
    }),
    defineField({
      name: "ehf",
      title: "EHF / org.nr.",
      type: "string",
      group: "org",
    }),
    localizedArrayField(
      "localizedGeneralContact",
      "Generell kontakt (e-post / tlf)",
      "internationalizedArrayText",
      {
        rows: 2,
        group: "org",
      },
    ),
    localizedArrayField(
      "localizedPressContact",
      "Pressekontakt (e-post / tlf)",
      "internationalizedArrayText",
      {
        rows: 2,
        group: "org",
      },
    ),
    defineField({
      name: "contactGroups",
      title: "Kontaktgrupper",
      description: "F.eks. Hovedstyret, Administrasjon — vises på kontaktsiden",
      type: "array",
      of: [defineArrayMember({ type: "contactGroup" })],
      group: "page",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Kontakt og organisasjon" }
    },
  },
})

export const contactPersonSchema = contactPerson
export const contactGroupSchema = contactGroup
