import "server-only"

import type { ClientReturn } from "@sanity/client"
import { stegaClean } from "@sanity/client/stega"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  barPreviewsQuery,
  bookableRoomsQuery,
  roomBySlugQuery,
  roomSlugsQuery,
  roomsPageQuery,
  roomsQuery,
} from "../queries"
import { compact, type FetchOptions, withRequiredKeys } from "./shared"

export type EditorialSection = NonNullable<
  NonNullable<ClientReturn<typeof roomsPageQuery>>["sections"]
>[number]

export type SourcedImage = NonNullable<
  NonNullable<ClientReturn<typeof roomBySlugQuery>>["images"]
>[number]

export type RoomsPageContent = NonNullable<ClientReturn<typeof roomsPageQuery>>

export type RoomSummary = ClientReturn<typeof roomsQuery>[number]

export type BookableRoom = ClientReturn<typeof bookableRoomsQuery>[number] & {
  slug: string
  crescatRoomId: number
}

export type RoomDetail = NonNullable<ClientReturn<typeof roomBySlugQuery>>

export type BarPreviewsContent = NonNullable<
  ClientReturn<typeof barPreviewsQuery>
>

export type BarPreviewRoom = NonNullable<BarPreviewsContent["rooms"]>[number]

export async function fetchRoomsPageContent(
  options: FetchOptions = {},
): Promise<RoomsPageContent | null> {
  const { data } = await sanityFetch({
    query: roomsPageQuery,
    stega: options.stega,
  })
  return data
}

// The booking route is already dynamic because room availability is fetched
// per request. Read its supporting content without the Live Content cache so
// newly published terms and help links cannot be shadowed by an older result.
export async function fetchPublishedRoomsPageContent(): Promise<RoomsPageContent | null> {
  return sanityClient.fetch(
    roomsPageQuery,
    {},
    {
      cache: "no-store",
      perspective: "published",
      stega: false,
    },
  )
}

export async function fetchRooms(): Promise<RoomSummary[]> {
  const { data: rooms } = await sanityFetch({
    query: roomsQuery,
  })
  return withRequiredKeys(rooms, "slug").map(room => ({
    ...room,
    slug: stegaClean(room.slug),
  }))
}

export async function fetchBookableRooms(): Promise<BookableRoom[]> {
  const { data: rooms } = await sanityFetch({
    query: bookableRoomsQuery,
  })
  return withRequiredKeys(rooms, "slug", "crescatRoomId").map(room => ({
    ...room,
    slug: stegaClean(room.slug),
  }))
}

export async function fetchBarPreviews(): Promise<BarPreviewsContent | null> {
  const { data } = await sanityFetch({
    query: barPreviewsQuery,
  })
  return data
}

export async function fetchRoomSlugs(): Promise<string[]> {
  const rooms = await sanityClient.fetch(
    roomSlugsQuery,
    {},
    {
      perspective: "published",
      stega: false,
    },
  )
  return compact(rooms.map(room => room.slug))
}

export async function fetchRoomBySlug(
  slug: string,
  options: FetchOptions = {},
): Promise<RoomDetail | null> {
  const { data } = await sanityFetch({
    query: roomBySlugQuery,
    params: { slug },
    stega: options.stega,
  })
  return data
}
