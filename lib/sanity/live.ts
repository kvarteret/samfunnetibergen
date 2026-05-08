import "server-only"

import { defineLive } from "next-sanity/live"
import { sanityClient } from "./client"

const token = process.env.SANITY_API_READ_TOKEN

export const { sanityFetch, SanityLive } = defineLive({
    client: sanityClient.withConfig({ apiVersion: "2024-01-01" }),
    serverToken: token,
    browserToken: token,
    fetchOptions: { revalidate: 300 },
})
