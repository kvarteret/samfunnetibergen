import "server-only"

import type { ClientReturn, QueryParams } from "@sanity/client"
import { sanityClient } from "./client"

type SanityFetchOptions<QueryString extends string> = {
    query: QueryString
    params?: QueryParams | Promise<QueryParams>
    tags?: string[]
    stega?: boolean
    revalidate?: number | false
}

export async function sanityFetch<const QueryString extends string>({
    query,
    params = {},
    tags = [],
    stega = false,
    revalidate = 300,
}: SanityFetchOptions<QueryString>): Promise<{ data: ClientReturn<QueryString> }> {
    const data = await sanityClient.fetch(query, await params, {
        next: { revalidate, tags },
        perspective: "published",
        stega,
    })

    return { data }
}
