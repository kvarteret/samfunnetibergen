import { defineArrayMember, defineType } from "sanity"

import { MarkdownPortableTextInput } from "../../components/MarkdownPortableTextInput"

export const portableTextContent = defineType({
  name: "portableTextContent",
  title: "Tekstinnhold",
  type: "array",
  components: { input: MarkdownPortableTextInput },
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Brødtekst", value: "normal" },
        { title: "Overskrift", value: "h2" },
        { title: "Undertittel", value: "h3" },
        { title: "Mellomtittel", value: "h4" },
        { title: "Sitat", value: "blockquote" },
      ],
      lists: [
        { title: "Punktliste", value: "bullet" },
        { title: "Nummerert liste", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Uthevet", value: "strong" },
          { title: "Kursiv", value: "em" },
          { title: "Kode", value: "code" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Lenke",
            fields: [
              {
                name: "href",
                type: "string",
                title: "URL",
                validation: rule =>
                  rule.custom(value => {
                    if (typeof value !== "string" || value.length === 0) {
                      return "Skriv inn en URL"
                    }
                    if (value.startsWith("/")) return true
                    try {
                      const url = new URL(value)
                      return ["http:", "https:", "mailto:", "tel:"].includes(
                        url.protocol,
                      )
                        ? true
                        : "Bruk http, https, mailto, tel eller intern sti som starter med /"
                    } catch {
                      return "Bruk en gyldig URL eller intern sti som starter med /"
                    }
                  }),
              },
              {
                name: "style",
                type: "string",
                title: "Stil",
                initialValue: "inline",
                options: {
                  list: [
                    { title: "Inline", value: "inline" },
                    { title: "Fremhevet lenke", value: "cta" },
                  ],
                  layout: "radio",
                },
              },
              {
                name: "target",
                type: "string",
                title: "Åpning",
                initialValue: "self",
                options: {
                  list: [
                    { title: "Samme fane", value: "self" },
                    { title: "Ny fane", value: "blank" },
                  ],
                  layout: "radio",
                },
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alt-tekst",
          validation: rule => rule.required(),
        },
        {
          name: "caption",
          type: "string",
          title: "Bildetekst",
        },
      ],
    }),
  ],
})
