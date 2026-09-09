import type { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { waitUntil } from "@vercel/functions"

type ExportResult = Parameters<Parameters<OTLPLogExporter["export"]>[1]>[0]
type Exporter<T> = {
  export(items: T[], callback: (result: ExportResult) => void): void
  forceFlush(): Promise<void>
  shutdown(): Promise<void>
}

// Simple processors start asynchronous HTTP exports. Their forceFlush does not
// necessarily await those requests, so retain the actual exporter callback.
export function withExportLifetime<T>(
  exporter: Omit<Exporter<T>, "forceFlush">,
): Exporter<T> {
  const pending = new Set<Promise<void>>()
  let reportedFailure = false
  return {
    export(items, callback) {
      const completion = new Promise<void>(resolve => {
        try {
          exporter.export(items, result => {
            if (result.code !== 0 && !reportedFailure) {
              reportedFailure = true
              console.warn(
                JSON.stringify({
                  event: "telemetry.export.failed",
                  error_type: result.error?.name,
                  status_code: (result.error as { code?: number })?.code,
                }),
              )
            }
            try {
              callback(result)
            } finally {
              resolve()
            }
          })
        } catch (error) {
          try {
            callback({
              code: 1,
              error:
                error instanceof Error
                  ? error
                  : new Error("Telemetry export failed"),
            })
          } finally {
            resolve()
          }
        }
      })
      pending.add(completion)
      void completion.then(() => pending.delete(completion))
      waitUntil(completion)
    },
    forceFlush: async () => {
      await Promise.all([...pending])
    },
    shutdown: async () => {
      await Promise.all([...pending])
      await exporter.shutdown()
    },
  }
}
