import { z } from "zod"
import {
  publicApiHeadResponse,
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"
import {
  publicCollectionResponseSchema,
  publicDetailResponseSchema,
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
  return {
    openapi: "3.1.0",
    info: {
      title: "Samfunnet i Bergen public events API",
      version: "1.0.0",
      description:
        "An anonymous, read-only occurrence-first API for approved public arrangements. Event ids and occurrence ids are opaque. Dates and times use Europe/Oslo, with UTC timestamps when a time is known.",
    },
    servers: [{ url: siteUrl }],
    paths: {
      "/api/v1/events": {
        get: {
          operationId: "listEvents",
          summary: "List public event occurrences",
          parameters: [
            {
              name: "locale",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["nb", "en"], default: "nb" },
            },
            {
              name: "from",
              in: "query",
              required: false,
              schema: { type: "string", format: "date" },
            },
            {
              name: "to",
              in: "query",
              required: false,
              schema: { type: "string", format: "date" },
            },
            {
              name: "cursor",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Public event occurrences",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicEventsResponse" },
                },
              },
            },
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
      },
      "/api/v1/events/{slug}": {
        get: {
          operationId: "getEvent",
          summary: "Get one public event",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "locale",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["nb", "en"], default: "nb" },
            },
          ],
          responses: {
            "200": {
              description: "Public event detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicEventResponse" },
                },
              },
            },
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicErrorResponse" },
                },
              },
            },
            "404": {
              description: "Event not found",
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
      },
    },
    components: {
      schemas: {
        PublicEventsResponse: jsonSchema(publicCollectionResponseSchema),
        PublicEventResponse: jsonSchema(publicDetailResponseSchema),
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
