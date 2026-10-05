import {
  publicApiHeadResponse,
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"

export async function GET(): Promise<Response> {
  return publicApiJsonResponse(
    { deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null },
    200,
    { "Cache-Control": "no-store" },
  )
}

export async function HEAD(): Promise<Response> {
  return publicApiHeadResponse(await GET())
}

export function OPTIONS(): Response {
  return publicApiOptionsResponse()
}
