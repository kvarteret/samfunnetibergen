import { ComponentIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const socialLinkSchema = defineType({
    name: "footerSocialLink",
    title: "Sosial lenke",
    type: "object",
    fields: [
        defineField({
            name: "platform",
            title: "Plattform",
            type: "string",
            options: {
                list: [
                    { title: "Instagram", value: "instagram" },
                    { title: "Facebook", value: "facebook" },
                    { title: "YouTube", value: "youtube" },
                    { title: "TikTok", value: "tiktok" },
                    { title: "Snapchat", value: "snapchat" },
                    { title: "Flickr", value: "flickr" },
                    { title: "Annet", value: "other" },
                ],
                layout: "dropdown",
            },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "label",
            title: "Visningsnavn",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "url",
            title: "URL",
            type: "url",
            validation: rule => rule.required(),
        }),
    ],
    preview: {
        select: { title: "label", subtitle: "platform" },
    },
})

export const footer = defineType({
    name: "footer",
    title: "Bunntekst",
    type: "document",
    icon: ComponentIcon,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – experimental API not yet in typedefs
    __experimental_actions: ["update", "publish"],
    fields: [
        defineField({
            name: "socialLinks",
            title: "Følg oss",
            description:
                "Sosiale medier-lenker. Besøksadresse og kontakt hentes fra Kontaktsiden; åpningstider fra rommene.",
            type: "array",
            of: [defineArrayMember({ type: "footerSocialLink" })],
        }),
    ],
    preview: {
        prepare() {
            return { title: "Bunntekst" }
        },
    },
})

export const footerSocialLinkSchema = socialLinkSchema
