import { createClient } from "next-sanity"

import { apiVersion, dataset, projectId } from "@/sanity/env"

const URL_FIELD_NAMES = new Set([
    "href",
    "url",
    "externalUrl",
    "src",
    "specsUrl",
    "panoramaUrl",
    "ticketUrl",
    "facebookUrl",
    "website",
    "email",
    "imageUrl",
    "assetUrl",
    "slug",
])

export const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    stega: {
        studioUrl: "/studio",
        filter: props => {
            const lastKey = props.sourcePath?.at(-1)
            if (typeof lastKey === "string" && URL_FIELD_NAMES.has(lastKey)) {
                return false
            }
            return true
        },
    },
})
