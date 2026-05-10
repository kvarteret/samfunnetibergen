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
                { title: "Overskrift 1 (h2)", value: "h2" },
                { title: "Overskrift 2 (h3)", value: "h3" },
                { title: "Overskrift 3 (h4)", value: "h4" },
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
