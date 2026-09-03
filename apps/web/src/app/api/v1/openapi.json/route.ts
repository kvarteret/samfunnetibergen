import { z } from "zod"

import {
  publicApiHeadResponse,
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"
import {
  publicCollectionResponseSchema,
  publicErrorResponseSchema,
} from "@/features/events/api/schemas"
import { resolveSiteUrl } from "@/lib/site-url"

type OpenApiDocument = {
  openapi: "3.1.0"
  info: {
    title: string
    version: string
    description: string
  }
  servers: Array<{ url: string }>
  security: []
  paths: Record<string, unknown>
  components: {
    schemas: Record<string, unknown>
  }
}

function jsonSchema(schema: z.ZodType) {
  return schema.toJSONSchema()
}

export function buildPublicEventsOpenApi(
  siteUrl = resolveSiteUrl(),
): OpenApiDocument {
  const requestParameters = [
    {
      name: "locale",
      in: "query",
      required: false,
      description:
        "Localized response. Norwegian is the default and fallback locale.",
      schema: { type: "string", enum: ["nb", "en"], default: "nb" },
    },
    {
      name: "from",
      in: "query",
      required: false,
      description:
        "Inclusive local start date in Europe/Oslo. Defaults to today.",
      schema: { type: "string", format: "date", example: "2026-09-01" },
    },
    {
      name: "to",
      in: "query",
      required: false,
      description:
        "Inclusive local end date in Europe/Oslo. Omit for no upper bound.",
      schema: { type: "string", format: "date", example: "2027-02-28" },
    },
    {
      name: "If-None-Match",
      in: "header",
      required: false,
      description:
        "ETag from an earlier response. A match returns 304 without a body.",
      schema: { type: "string" },
    },
  ]
  const etagHeader = {
    description: "Representation validator for conditional requests.",
    schema: { type: "string" },
  }
  const notModifiedResponse = {
    description: "The representation has not changed.",
    headers: { ETag: etagHeader },
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Samfunnet i Bergen public events API",
      version: "1.0.0",
      description:
        "An anonymous, read-only occurrence-first API for approved public arrangements. Event ids and occurrence ids are opaque. Dates and times use Europe/Oslo, with UTC timestamps when a time is known.",
    },
    servers: [{ url: siteUrl }],
    security: [],
    paths: {
      "/api/v1/events": {
        get: {
          operationId: "listEvents",
          summary: "List complete public event occurrences",
          description:
            "Returns every occurrence matching the inclusive date filters. Each occurrence includes the complete public event record, including a sanitized HTML/plain-text description and website, ticket, and Facebook links. Unknown query parameters return 400.",
          security: [],
          parameters: requestParameters,
          responses: {
            "200": {
              description: "Public event occurrences",
              headers: { ETag: etagHeader },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicEventsResponse" },
                },
              },
            },
            "304": notModifiedResponse,
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicErrorResponse" },
                },
              },
            },
            "500": {
              description: "Temporary server failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicErrorResponse" },
                },
              },
            },
          },
        },
        head: {
          operationId: "headEvents",
          summary: "Check the public event snapshot",
          description:
            "Returns the same status, cache headers, and ETag as GET without a response body.",
          security: [],
          parameters: requestParameters,
          responses: {
            "200": {
              description: "Snapshot is available",
              headers: { ETag: etagHeader },
            },
            "304": notModifiedResponse,
            "400": { description: "Invalid request" },
            "500": { description: "Temporary server failure" },
          },
        },
        options: {
          operationId: "optionsEvents",
          summary: "Inspect event API CORS policy",
          security: [],
          responses: { "204": { description: "CORS preflight accepted" } },
        },
      },
    },
    components: {
      schemas: {
        PublicEventsResponse: jsonSchema(publicCollectionResponseSchema),
        PublicErrorResponse: jsonSchema(publicErrorResponseSchema),
      },
    },
  }
}

export async function GET(): Promise<Response> {
  return publicApiJsonResponse(buildPublicEventsOpenApi())
}

export async function HEAD(): Promise<Response> {
  return publicApiHeadResponse(await GET())
}

export function OPTIONS(): Response {
  return publicApiOptionsResponse()
}
