import { after } from "next/server"

let flush: (() => Promise<void>) | undefined

export function registerTelemetryFlush(callback: () => Promise<void>): void {
  flush = callback
}

/** Keep exporter promises alive after serverless responses finish. */
export function scheduleTelemetryFlush(): void {
  if (!flush) return
  const callback = flush
  after(async () => {
    await callback()
  })
}
