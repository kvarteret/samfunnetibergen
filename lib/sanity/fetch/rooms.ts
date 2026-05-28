import "server-only"

import { stegaClean } from "@sanity/client/stega"
import type { ClientReturn } from "next-sanity"
import { sanityClient } from "../client"
import { sanityFetch } from "../live"
import { roomBySlugQuery, roomSlugsQuery, roomsPageQuery, roomsQuery } from "../queries"
import type { FetchOptions } from "./shared"

export type EditorialSection = NonNullable<
    NonNullable<ClientReturn<typeof roomsPageQuery>>["sections"]
>[number]

export type SourcedImage = NonNullable<
    NonNullable<ClientReturn<typeof roomBySlugQuery>>["images"]
>[number]

export type RoomsPageContent = NonNullable<ClientReturn<typeof roomsPageQuery>>

export type RoomSummary = ClientReturn<typeof roomsQuery>[number]

export type RoomDetail = NonNullable<ClientReturn<typeof roomBySlugQuery>>

export async function fetchRoomsPageContent(
    options: FetchOptions = {},
): Promise<RoomsPageContent | null> {
    const { data } = await sanityFetch({
        query: roomsPageQuery,
        tags: ["roomsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchRooms(): Promise<RoomSummary[]> {
    const { data: rooms } = await sanityFetch({ query: roomsQuery, tags: ["rooms"] })
    type R = ClientReturn<typeof roomsQuery>[number]
    return rooms.flatMap((room: R) =>
        room.slug ? [{ ...room, slug: stegaClean(room.slug) }] : [],
    )
}

export async function fetchRoomSlugs(): Promise<string[]> {
    const rooms = await sanityClient.fetch(
        roomSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
    return rooms.flatMap((room: { slug?: string | null }) => (room.slug ? [room.slug] : []))
}

export async function fetchRoomBySlug(
    slug: string,
    options: FetchOptions = {},
): Promise<RoomDetail | null> {
    const { data } = await sanityFetch({
        query: roomBySlugQuery,
        params: { slug },
        tags: ["rooms"],
        stega: options.stega,
    })
    return data
}
