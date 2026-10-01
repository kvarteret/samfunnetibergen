import type { CaptureResult } from "posthog-js"
import { dropDocumentUrlExceptions } from "./exception-filter"

type PageContext = { readyState: string; elapsedMs: number }

/** Keep ambiguous errors and classify their sources without exporting raw stacks or URLs. */
export function prepareBrowserException(
  event: CaptureResult | null,
  documentUrl = typeof window === "undefined"
    ? undefined
    : window.location.href,
  pageContext: PageContext | undefined = typeof document === "undefined"
    ? undefined
    : {
        readyState: document.readyState,
        elapsedMs: performance.now(),
      },
): CaptureResult | null {
  const retained = dropDocumentUrlExceptions(event, documentUrl)
  if (retained?.event !== "$exception" || !documentUrl) return retained
  let page: URL
  try {
    page = new URL(documentUrl)
  } catch {
    return retained
  }
  const counts = {
    app_bundle: 0,
    same_origin: 0,
    external: 0,
    extension: 0,
    missing: 0,
  }
  const exceptions = retained.properties?.$exception_list
  if (Array.isArray(exceptions)) {
    for (const exception of exceptions) {
      const frames = exception?.stacktrace?.frames
      if (!Array.isArray(frames)) continue
      for (const frame of frames) {
        if (typeof frame?.filename !== "string") {
          counts.missing++
          continue
        }
        try {
          const source = new URL(frame.filename)
          if (
            [
              "chrome-extension:",
              "moz-extension:",
              "safari-web-extension:",
            ].includes(source.protocol)
          )
            counts.extension++
          else if (source.origin !== page.origin) counts.external++
          else if (source.pathname.startsWith("/_next/static/"))
            counts.app_bundle++
          else counts.same_origin++
        } catch {
          counts.missing++
        }
      }
    }
  }
  return {
    ...retained,
    properties: {
      ...retained.properties,
      error_source: counts.app_bundle
        ? "application_bundle"
        : counts.extension
          ? "browser_extension"
          : "unattributed",
      exception_frame_sources: Object.entries(counts)
        .map(([kind, count]) => `${kind}:${count}`)
        .join(","),
      ...(page.pathname === "/nb/rom/book" || page.pathname === "/en/rom/book"
        ? { workflow: "room_booking" }
        : {}),
      ...(pageContext
        ? {
            browser_page_phase: ["loading", "interactive", "complete"].includes(
              pageContext.readyState,
            )
              ? pageContext.readyState
              : "unknown",
            page_elapsed_ms: Number.isFinite(pageContext.elapsedMs)
              ? Math.max(0, Math.round(pageContext.elapsedMs))
              : undefined,
          }
        : {}),
    },
  }
}
