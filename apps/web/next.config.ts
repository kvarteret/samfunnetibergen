import { withPostHogConfig } from "@posthog/nextjs-config"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { resolve } from "node:path"
import { networkInterfaces } from "os"

import { legacyStudioRedirects } from "./src/lib/studio-url"

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
    "@samfunnet/content-domain",
    "sanity",
    "next-sanity",
    "@sanity/vision",
    "@sanity/ui",
    "@sanity/icons",
  ],
  turbopack: {
    // The workspace package and temporary Studio adapter resolve source from
    // the repository root, one level above this Next app.
    root: resolve(process.cwd(), "../.."),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async redirects() {
    return [
      ...legacyStudioRedirects,
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?:www\\.)?blifrivillig\\.no",
          },
        ],
        destination: "https://www.samfunnetibergen.no/blifrivillig",
        permanent: true,
      },
      {
        source: "/program",
        destination: "/nb/arrangementer",
        permanent: true,
      },
      {
        source: "/program/:event",
        destination: "/nb/arrangementer/:event",
        permanent: true,
      },
      {
        source: "/komiteer",
        destination: "/nb/grupper",
        permanent: true,
      },
      {
        source: "/komiteer/:group",
        destination: "/nb/grupper/:group",
        permanent: true,
      },
      {
        source: "/bli-aktiv",
        destination: "/nb/blifrivillig",
        permanent: true,
      },
      {
        source: "/kontakt-oss",
        destination: "/nb/kontakt",
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
      sourcemaps: {
        releaseName: "samfunnetibergen",
        releaseVersion: process.env.POSTHOG_RELEASE_VERSION,
        build: process.env.POSTHOG_RELEASE_BUILD,
      },
    })
  : config
