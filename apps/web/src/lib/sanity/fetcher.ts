import type { ClientReturn } from "@sanity/client"
import { defineLive } from "next-sanity/live"

import { sanityClient } from "./client"

const token = process.env.SANITY_API_READ_TOKEN

const live = defineLive({
  client: sanityClient,
  serverToken: token,
  browserToken: token,
})

export const SanityLive = live.SanityLive

type SanityFetchOptions<QueryString extends string> = {
  query: QueryString
  params?: Record<string, unknown>
  stega?: boolean
}

/**
 * `next-sanity` types the `data` of `sanityFetch` as stega-branded
 * (`StegaString<...>`) unless the call passes the literal `stega: false`. Draft
 * mode turns stega on by default here because the client configures
 * `stega.studioUrl`, and this app threads `stega` through as a plain boolean, so
 * every fetch would otherwise come back branded.
 *
 * The app treats stega as a runtime concern instead of a type-level one: values
 * that feed domain logic are cleaned with `stegaClean` in
 * `lib/sanity/fetch/shared.ts` and its neighbours, while display strings keep
 * their encoding for `VisualEditing`. The domain types in `lib/sanity/fetch/*`
 * are therefore written against clean `ClientReturn` types. This wrapper keeps
 * that boundary honest: it returns the clean type and leaves the runtime value,
 * encoding included, untouched.
 *
 * Only `data` is re-exported because that is all this app consumes; the
 * underlying `sanityFetch` additionally returns a `sourceMap` (used by
 * `VisualEditing`, which imports it directly) and cache `tags`.
 */
export async function sanityFetch<const QueryString extends string>(
  options: SanityFetchOptions<QueryString>,
): Promise<{ data: ClientReturn<QueryString> }> {
  const { data } = await live.sanityFetch(options as never)
  return { data: data as ClientReturn<QueryString> }
}
