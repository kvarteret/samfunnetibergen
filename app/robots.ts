import type { MetadataRoute } from "next"

import { resolveSiteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
    const siteUrl = resolveSiteUrl()

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/nb/arrangementer", "/en/arrangementer", "/arrangementer"],
        },
        host: siteUrl,
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
