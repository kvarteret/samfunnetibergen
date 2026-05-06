import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "cdn.sanity.io" },
            { protocol: "https", hostname: "cms.kvarteret.no" },
            { protocol: "https", hostname: "personal.kvarteret.no" },
            { protocol: "https", hostname: "personaldatabasen.blob.core.windows.net" },
        ],
    },
    transpilePackages: ["sanity", "next-sanity", "@sanity/vision", "@sanity/ui", "@sanity/icons"],
    turbopack: {
        root: process.cwd(),
    },
    async rewrites() {
        return [
            {
                source: "/ingest/static/:path*",
                destination: "https://eu-assets.i.posthog.com/static/:path*",
            },
            {
                source: "/ingest/:path*",
                destination: "https://eu.i.posthog.com/:path*",
            },
        ]
    },
    skipTrailingSlashRedirect: true,
}

export default withNextIntl(nextConfig)
