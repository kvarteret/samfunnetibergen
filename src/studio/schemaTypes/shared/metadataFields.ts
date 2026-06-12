import { defineField } from "sanity"

type SeoFieldOptions = {
  group?: string
  titleDescription?: string
}

type SharingFieldOptions = {
  group?: string
  openGraphImageDescription?: string
}

const defaultSeoTitleDescription =
  "Overstyrer tittelen i søkemotorer. La stå tom for å bruke sidetittelen."

export function createSeoFields({
  group = "seo",
  titleDescription = defaultSeoTitleDescription,
}: SeoFieldOptions = {}) {
  return [
    defineField({
      name: "seoTitle",
      title: "SEO-tittel",
      description: titleDescription,
      type: "string",
      group,
    }),
    defineField({
      name: "seoDescription",
      title: "SEO-beskrivelse",
      type: "text",
      rows: 3,
      group,
      validation: rule =>
        rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Kanonisk URL (overstyring)",
      description:
        "La stå tom for å bruke sidens egen URL. Brukes bare når en annen URL er originalkilden.",
      type: "url",
      group,
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "noIndex",
      title: "Skjul fra søkemotorer",
      description: "Ber søkemotorer om ikke å indeksere denne siden.",
      type: "boolean",
      initialValue: false,
      group,
    }),
    defineField({
      name: "noFollow",
      title: "Ikke følg lenker",
      description: "Ber søkemotorer om ikke å følge lenker på denne siden.",
      type: "boolean",
      initialValue: false,
      group,
    }),
  ]
}

export function createSharingFields({
  group = "sharing",
  openGraphImageDescription,
}: SharingFieldOptions = {}) {
  return [
    defineField({
      name: "openGraphImage",
      title: "Open Graph-bilde",
      ...(openGraphImageDescription
        ? { description: openGraphImageDescription }
        : {}),
      type: "image",
      group,
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "openGraphImageAlt",
      title: "Alternativ tekst for delingsbilde",
      description:
        "Beskriv motivet kort for tilgjengelighet og bildebaserte søk.",
      type: "string",
      group,
    }),
    defineField({
      name: "openGraphTitle",
      title: "Open Graph-tittel",
      type: "string",
      group,
    }),
    defineField({
      name: "openGraphDescription",
      title: "Open Graph-beskrivelse",
      type: "text",
      rows: 3,
      group,
      validation: rule => rule.max(200).warning("Hold teksten kort for deling"),
    }),
  ]
}
