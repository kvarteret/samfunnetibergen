import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import type { Logger } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'

declare global {
  var __posthogLogger: Logger | undefined
}

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const exporter = new OTLPLogExporter({
      url: 'https://eu.i.posthog.com/otlp/v1/logs',
      headers: {
        Authorization: `Bearer ${process.env.POSTHOG_API_KEY}`,
      },
    })

    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        'service.name': 'samfunnetibergen',
      }),
      processors: [new SimpleLogRecordProcessor(exporter)],
    })

    globalThis.__posthogLogger = loggerProvider.getLogger('samfunnetibergen')
  }
}
