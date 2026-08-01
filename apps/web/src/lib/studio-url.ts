export const STUDIO_ORIGIN = "https://studio.samfunnetibergen.no"

/**
 * The website keeps these rules as a bookmark-compatible migration path. The
 * standalone Studio is rooted at `/`, so `/studio/foo` becomes `/foo` rather
 * than `/studio/foo` on the new origin.
 */
export const legacyStudioRedirects = [
  {
    source: "/studio",
    destination: `${STUDIO_ORIGIN}/`,
    permanent: true,
  },
  {
    source: "/studio/:path*",
    destination: `${STUDIO_ORIGIN}/:path*`,
    permanent: true,
  },
] as const

export function studioUrlFromLegacyPath(pathname: string, search = ""): string {
  if (pathname !== "/studio" && !pathname.startsWith("/studio/")) {
    throw new Error(`Expected a legacy Studio path, received ${pathname}`)
  }

  const suffix = pathname.slice("/studio".length)
  const url = new URL(`${STUDIO_ORIGIN}${suffix || "/"}`)
  url.search = search.startsWith("?") ? search.slice(1) : search
  return url.toString()
}
