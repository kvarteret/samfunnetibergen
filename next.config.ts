import { withPostHogConfig } from "@posthog/nextjs-config"
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
      {
        protocol: "https",
        hostname: "personaldatabasen.blob.core.windows.net",
      },
    ],
  },
  transpilePackages: [
    "sanity",
    "next-sanity",
    "@sanity/vision",
    "@sanity/ui",
    "@sanity/icons",
  ],
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:locale/tilgjengelighet",
        destination: "/:locale/nyttig",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/studio/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://*.sanity.io",
          },
        ],
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

export default withPostHogConfig(withNextIntl(nextConfig), {
  personalApiKey: process.env.POSTHOG_CLI_API_KEY ?? "",
  projectId: process.env.POSTHOG_CLI_PROJECT_ID ?? "",
  host: process.env.POSTHOG_CLI_HOST ?? "",
})
