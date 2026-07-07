import type { MetaDataSection } from "./types"

// Reverse-engineered from intern.har + ekstern.har. Crescat field IDs and the
// metaData `parent_id`s are venue-global: the same IDs appear across the
// venue's different event-request forms, so they are defined once here and
// reused by every booking builder.

type MetaField = MetaDataSection["content"]["fields"][number]

// Static descriptor for a Crescat metadata field. `value` is supplied per
// submission via `metaField()`.
interface FieldDef {
  id: number
  title: string
  component: MetaField["component"]
  class: string
  required: boolean
  options?: string[]
}

export function metaField(def: FieldDef, value: MetaField["value"]): MetaField {
  return {
    id: def.id,
    title: def.title,
    value,
    component: def.component,
    options: def.options ?? null,
    class: def.class,
    linebreak_after: false,
    required: def.required,
  }
}

// — parent 7896: "Bestilling" (shared by intern + ekstern) —
export const ORDER_PARENT_ID = 7896
export const FURNITURE = {
  id: 57056,
  title: "Ønsket møblement",
  component: "field-text",
  class: "col-md-6",
  required: true,
} satisfies FieldDef
export const TECH_EQUIPMENT = {
  id: 57057,
  title: "Nødvendig teknisk utstyr",
  component: "field-text",
  class: "col-md-6",
  required: true,
} satisfies FieldDef
export const AUDIENCE_COUNT = {
  id: 57058,
  title: "Estimert antall publikum",
  component: "field-number",
  class: "col-md-3",
  required: true,
} satisfies FieldDef
export const NEEDS_AMPHI = {
  id: 80461,
  title: "Behov for amfi? NB: gjelder KUN Tivoli",
  component: "field-toggle",
  class: "col-md-3",
  required: false,
} satisfies FieldDef
export const OPEN_OR_CLOSED = {
  id: 1329447,
  title: "Åpent / lukket arrangement",
  component: "field-list",
  class: "col-md-3",
  required: true,
  options: ["Åpent", "Lukket"],
} satisfies FieldDef

// — parent 4989: "Billettsalg" —
export const TICKETING_PARENT_ID = 4989
export const FREE_OR_PAID = {
  id: 1443270,
  title: "Gratis/betalt arrangement",
  component: "field-list",
  class: "col-md-3",
  required: true,
  options: ["Gratis", "Betalt"],
} satisfies FieldDef
export const TICKET_TYPES = {
  id: 1244809,
  title: "Billettyper og priser",
  component: "field-text",
  class: "col-md-6",
  required: true,
} satisfies FieldDef
// Payment-handling toggles (added 2026-06-26). The website models these as a
// single "Hvordan selges billettene?" choice, so for paid events exactly one is
// true; both are false for free events. Field 4451407 is labelled differently
// per form, hence the two descriptors below sharing one id.
export const KVARTERET_PAYMENT_TERMINAL = {
  id: 3511840,
  title: "Vi vil at Kvarteret setter opp en betalingsterminal",
  component: "field-toggle",
  class: "col-md-6",
  required: false,
} satisfies FieldDef
export const OWN_PAYMENT_TERMINAL = {
  id: 4451407,
  title: "Vi bruker egen betalingsterminal",
  component: "field-toggle",
  class: "col-md-6",
  required: false,
} satisfies FieldDef
// Same Crescat field id as OWN_PAYMENT_TERMINAL; the intern form labels it
// "Vi bruker eget billettsystem".
export const OWN_TICKET_SYSTEM = {
  id: 4451407,
  title: "Vi bruker eget billettsystem",
  component: "field-toggle",
  class: "col-md-6",
  required: false,
} satisfies FieldDef

// — parent 11068: "Catering/bar" —
export const CATERING_PARENT_ID = 11068
export const CATERING_WISHES = {
  id: 80447,
  title: "Skriv litt om hva du ønsker å spise og drikke",
  component: "field-text",
  class: "col-md-6",
  required: false,
} satisfies FieldDef

// — parent 419061: "Studentorganisasjon" (ekstern only) —
export const STUDENT_ORG_PARENT_ID = 419061
export const ON_BEHALF_OF_STUDENT_ORG = {
  id: 3186172,
  title: "Er bookingen på vegne av en studentorganisasjon?",
  component: "field-toggle",
  class: "col-md-6",
  required: false,
} satisfies FieldDef
export const STUDENT_ORG_NAME = {
  id: 3186171,
  title: "Hva er navnet på din studentorganisasjon?",
  component: "field-text",
  class: "col-md-6",
  required: false,
} satisfies FieldDef

// — parent 4990: "Fakturainformasjon" (ekstern only) —
export const INVOICE_PARENT_ID = 4990
export const INVOICE_CONTACT = {
  id: 54134,
  title: "Kontaktperson",
  component: "field-text",
  class: "col-md-6",
  required: true,
} satisfies FieldDef
export const INVOICE_ADDRESS = {
  id: 54135,
  title: "Fakturaadresse",
  component: "field-text",
  class: "col-md-6",
  required: true,
} satisfies FieldDef
export const INVOICE_EMAIL = {
  id: 54136,
  title: "Epost",
  component: "field-text",
  class: "col-md-3",
  required: true,
} satisfies FieldDef
export const INVOICE_PHONE = {
  id: 54137,
  title: "Telefon",
  component: "field-text",
  class: "col-md-3",
  required: true,
} satisfies FieldDef
export const INVOICE_ORG_NUMBER = {
  id: 1494616,
  title: "Org.nr.",
  component: "field-number",
  class: "col-md-3",
  required: false,
} satisfies FieldDef

// — parent 11068 toggles (ekstern only) —
export const BAR_SELF = {
  id: 4365154,
  title: "Jeg står i bar selv",
  component: "field-toggle",
  class: "col-md-3",
  required: false,
} satisfies FieldDef
export const BAR_KVARTERET = {
  id: 4382234,
  title: "Kvarteret står i bar",
  component: "field-toggle",
  class: "col-md-3",
  required: false,
} satisfies FieldDef

// — parent 10014: "Promotering" (ekstern only, no fields submitted) —
export const PROMOTION_PARENT_ID = 10014
