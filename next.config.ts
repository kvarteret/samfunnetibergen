import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { networkInterfaces } from "os"

const withNextIntl = createNextIntlPlugin()

function localNetworkOrigins(): string[] {
    return Object.values(networkInterfaces())
        .flat()
        .filter(iface => iface && iface.family === "IPv4" && !iface.internal)
        .map(iface => iface!.address)
}

const nextConfig: NextConfig = {
    allowedDevOrigins: localNetworkOrigins(),
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "cdn.sanity.io" },
            { protocol: "https", hostname: "cdn.prod.website-files.com" },
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
