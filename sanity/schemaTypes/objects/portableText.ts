import { defineArrayMember, defineType } from "sanity"

export const portableTextContent = defineType({
    name: "portableTextContent",
    title: "Tekstinnhold",
    type: "array",
    of: [
        defineArrayMember({
            type: "block",
            styles: [
                { title: "Normal", value: "normal" },
                { title: "Stor overskrift", value: "h2" },
                { title: "Mellom overskrift", value: "h3" },
                { title: "Liten overskrift", value: "h4" },
                { title: "Sitat", value: "blockquote" },
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
                                type: "url",
                                title: "URL",
                                validation: rule =>
                                    rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
                            },
                            {
                                name: "blank",
                                type: "boolean",
                                title: "Åpne i ny fane",
                                initialValue: false,
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
