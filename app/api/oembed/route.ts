import { NextResponse } from "next/server"
import {
    fetchArrangementBySlug,
    fetchEventsPageContent,
    fetchHomePageContent,
    fetchSiteMetadata,
} from "@/lib/sanity/fetch"
import { resolveSiteUrl } from "@/lib/site-url"

type OembedPayload = {
    version: "1.0"
    type: "link"
    provider_name: string
    provider_url: string
    title: string
    thumbnail_url?: string
}

function pathWithoutLocale(url: URL) {
    const parts = url.pathname.split("/").filter(Boolean)
    return parts[0] === "nb" ? parts.slice(1) : parts
}

function oembedJson(payload: OembedPayload) {
    return NextResponse.json(payload, {
        headers: {
            "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        },
    })
}

export async function GET(request: Request) {
    const siteUrl = resolveSiteUrl()
    const providerUrl = siteUrl
    const requestUrl = new URL(request.url)
    const embeddedUrlParam = requestUrl.searchParams.get("url")

    if (!embeddedUrlParam) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
    }

    let embeddedUrl: URL
    try {
        embeddedUrl = new URL(embeddedUrlParam, siteUrl)
    } catch {
        return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 })
    }
    const [firstSegment, secondSegment] = pathWithoutLocale(embeddedUrl)
    const siteMetadata = await fetchSiteMetadata("nb", { stega: false })
    const providerName = siteMetadata?.siteName ?? "Samfunnet i Bergen"

    if (!firstSegment) {
        const homePage = await fetchHomePageContent("nb", { stega: false })
        return oembedJson({
            version: "1.0",
            type: "link",
            provider_name: providerName,
            provider_url: providerUrl,
            title:
                homePage?.oembedTitle ??
                homePage?.openGraphTitle ??
                homePage?.title ??
                siteMetadata?.oembedTitle ??
                providerName,
            thumbnail_url:
                homePage?.oembedImageUrl ??
                homePage?.openGraphImageUrl ??
                siteMetadata?.oembedImageUrl ??
                siteMetadata?.defaultOpenGraphImageUrl ??
                undefined,
        })
    }

    if (firstSegment === "arrangementer" && secondSegment) {
        const arrangement = await fetchArrangementBySlug(secondSegment)
        if (!arrangement) {
            return NextResponse.json({ error: "Arrangement not found" }, { status: 404 })
        }

        return oembedJson({
            version: "1.0",
            type: "link",
            provider_name: providerName,
            provider_url: providerUrl,
            title:
                arrangement.oembedTitle ??
                arrangement.openGraphTitle ??
                arrangement.title ??
                providerName,
            thumbnail_url:
                arrangement.oembedImageUrl ??
                arrangement.openGraphImageUrl ??
                arrangement.imageUrl ??
                siteMetadata?.oembedImageUrl ??
                siteMetadata?.defaultOpenGraphImageUrl ??
                undefined,
        })
    }

    if (firstSegment === "arrangementer") {
        const eventsPage = await fetchEventsPageContent("nb", { stega: false })
        return oembedJson({
            version: "1.0",
            type: "link",
            provider_name: providerName,
            provider_url: providerUrl,
            title:
                eventsPage?.oembedTitle ??
                eventsPage?.openGraphTitle ??
                eventsPage?.title ??
                "Arrangementer",
            thumbnail_url:
                eventsPage?.oembedImageUrl ??
                eventsPage?.openGraphImageUrl ??
                siteMetadata?.oembedImageUrl ??
                siteMetadata?.defaultOpenGraphImageUrl ??
                undefined,
        })
    }

    return NextResponse.json({ error: "Unsupported oEmbed URL" }, { status: 404 })
}
