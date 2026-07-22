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
        source: "/en/tivoli",
        destination: "/nb/rom/tivoli",
        permanent: true,
      },
      {
        source: "/nb/en/tivoli",
        destination: "/nb/rom/tivoli",
        permanent: true,
      },
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

const config = withNextIntl(nextConfig)

// PostHog source-map upload only runs when its CLI credentials are present.
// Since sourcemaps default to enabled, the plugin throws ("projectId is
// required when sourcemaps are enabled") in environments that don't set these
// vars (e.g. Vercel), which breaks the build. Fall back to the plain config
// there and only enable upload when both credentials exist.
const posthogApiKey = process.env.POSTHOG_CLI_API_KEY
const posthogProjectId = process.env.POSTHOG_CLI_PROJECT_ID

export default posthogApiKey && posthogProjectId
  ? withPostHogConfig(config, {
      personalApiKey: posthogApiKey,
      projectId: posthogProjectId,
      host: process.env.POSTHOG_CLI_HOST,
    })
  : config
