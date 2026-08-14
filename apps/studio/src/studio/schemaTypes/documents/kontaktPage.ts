import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../shared/localizedFields"

const contactPerson = defineType({
  name: "contactPerson",
  title: "Kontaktperson",
  type: "object",
  fields: [
    deprecatedLegacyField("name", "Navn (legacy)", "string"),
    localizedArrayField(
      "localizedName",
      "Navn",
      "internationalizedArrayString",
      { required: true, legacyField: "name" },
    ),
    deprecatedLegacyField("rolle", "Rolle (legacy)", "string"),
    localizedArrayField(
      "localizedRole",
      "Rolle",
      "internationalizedArrayString",
      { legacyField: "rolle" },
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
    select: { title: "name", subtitle: "email" },
  },
})

const contactGroup = defineType({
  name: "contactGroup",
  title: "Kontaktgruppe",
  type: "object",
  fields: [
    deprecatedLegacyField("title", "Overskrift (legacy)", "string"),
    localizedArrayField(
      "localizedTitle",
      "Overskrift",
      "internationalizedArrayString",
      { required: true, legacyField: "title" },
    ),
    defineField({
      name: "persons",
      title: "Kontaktpersoner",
      type: "array",
      of: [defineArrayMember({ type: "contactPerson" })],
    }),
  ],
  preview: {
    select: { title: "title", persons: "persons" },
    prepare({ title, persons }) {
      return {
        title,
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
    deprecatedLegacyField("visitAddress", "Besøksadresse (legacy)", "text", {
      rows: 3,
      group: "org",
    }),
    localizedArrayField(
      "localizedVisitAddress",
      "Besøksadresse",
      "internationalizedArrayText",
      {
        legacyField: "visitAddress",
        rows: 3,
        group: "org",
      },
    ),
    deprecatedLegacyField("postAddress", "Postadresse (legacy)", "text", {
      rows: 3,
      group: "org",
    }),
    localizedArrayField(
      "localizedPostAddress",
      "Postadresse",
      "internationalizedArrayText",
      {
        legacyField: "postAddress",
        rows: 3,
        group: "org",
      },
    ),
    deprecatedLegacyField("invoiceAddress", "Fakturaadresse (legacy)", "text", {
      rows: 4,
      group: "org",
    }),
    localizedArrayField(
      "localizedInvoiceAddress",
      "Fakturaadresse",
      "internationalizedArrayText",
      {
        legacyField: "invoiceAddress",
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
    deprecatedLegacyField(
      "generalContact",
      "Generell kontakt (legacy)",
      "text",
      {
        rows: 2,
        group: "org",
      },
    ),
    localizedArrayField(
      "localizedGeneralContact",
      "Generell kontakt (e-post / tlf)",
      "internationalizedArrayText",
      {
        legacyField: "generalContact",
        rows: 2,
        group: "org",
      },
    ),
    deprecatedLegacyField("pressContact", "Pressekontakt (legacy)", "text", {
      rows: 2,
      group: "org",
    }),
    localizedArrayField(
      "localizedPressContact",
      "Pressekontakt (e-post / tlf)",
      "internationalizedArrayText",
      {
        legacyField: "pressContact",
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
