export const DEPLOYMENT_CHECK_INTERVAL_MS = 60 * 60 * 1_000
const REQUEST_TIMEOUT_MS = 10_000

/** Poll the current deployment without Next's deployment-pinned navigation. */
export function watchScreenDeployment(
  deploymentId: string | undefined,
  reload: () => void,
): () => void {
  if (!deploymentId) return () => {}

  let stopped = false
  let reloading = false
  let request: AbortController | undefined

  const check = async () => {
    if (stopped || reloading || request) return
    const controller = new AbortController()
    request = controller
    const timeout = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    )
    try {
      // Omit cookies as well as deployment headers so Vercel serves the
      // latest deployment even if another part of the site pins a session.
      const response = await fetch("/api/v1/infoskjerm/version", {
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      })
      if (!response.ok) return
      const data: unknown = await response.json()
      if (
        !stopped &&
        !controller.signal.aborted &&
        typeof data === "object" &&
        data !== null &&
        "deploymentId" in data &&
        typeof data.deploymentId === "string" &&
        data.deploymentId.trim().length > 0 &&
        data.deploymentId !== deploymentId
      ) {
        reloading = true
        reload()
      }
    } catch {
      // Keep the last working screen on network errors and retry next time.
    } finally {
      window.clearTimeout(timeout)
      request = undefined
    }
  }

  const onVisible = () => {
    if (document.visibilityState === "visible") void check()
  }
  const onOnline = () => void check()
  const interval = window.setInterval(
    () => void check(),
    DEPLOYMENT_CHECK_INTERVAL_MS,
  )
  document.addEventListener("visibilitychange", onVisible)
  window.addEventListener("online", onOnline)
  void check()

  return () => {
    stopped = true
    request?.abort()
    window.clearInterval(interval)
    document.removeEventListener("visibilitychange", onVisible)
    window.removeEventListener("online", onOnline)
  }
}
