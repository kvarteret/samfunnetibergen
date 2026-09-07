import type { CaptureResult } from "posthog-js"

const SCRIPT_PATH_PATTERN = /\.[cm]?js$/

function parseAbsoluteUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isDocumentFrame(frame: unknown, documentOrigin: string): boolean {
  const filename = (frame as { filename?: unknown } | null)?.filename
  if (typeof filename !== "string") return false

  const url = parseAbsoluteUrl(filename)
  if (!url || url.origin !== documentOrigin) return false

  return !SCRIPT_PATH_PATTERN.test(url.pathname)
}

function hasOnlyDocumentFrames(
  exceptionList: unknown,
  documentOrigin: string,
): boolean {
  if (!Array.isArray(exceptionList) || exceptionList.length === 0) return false

  let frameCount = 0
  for (const exception of exceptionList) {
    const frames = (exception as { stacktrace?: { frames?: unknown } } | null)
      ?.stacktrace?.frames
    if (!Array.isArray(frames)) return false

    for (const frame of frames) {
      if (!isDocumentFrame(frame, documentOrigin)) return false
      frameCount += 1
    }
  }

  return frameCount > 0
}

/**
 * `before_send` filter for exceptions thrown by scripts the browser injected
 * into the page: in-app browser shims, on-device translation, content
 * blockers. Those run inline in the document, so every frame they produce is
 * attributed to the document URL. This app only ever serves its own code from
 * hashed `_next/static` bundles, so an exception whose frames all point at a
 * same-origin non-script URL did not come from code we control.
 *
 * The document URL is read at send time and may have moved on from the page
 * that threw, so frames are matched on origin rather than on the full URL.
 */
export function dropDocumentUrlExceptions(
  event: CaptureResult | null,
  documentUrl = typeof window === "undefined"
    ? undefined
    : window.location.href,
): CaptureResult | null {
  if (!event || event.event !== "$exception" || !documentUrl) return event

  const documentOrigin = parseAbsoluteUrl(documentUrl)?.origin
  if (!documentOrigin) return event

  return hasOnlyDocumentFrames(
    event.properties?.$exception_list,
    documentOrigin,
  )
    ? null
    : event
}
