import { isSameOriginRequest } from "./csrf"

// Shared plumbing for the submit and read route handlers. Every POST route
// applies the same same-origin CSRF gate and body parsing; every GET route
// applies the same success/error response mapping. See ADR 010.

export async function jsonPost<TBody, TResult>(
  request: Request,
  handler: (body: TBody) => Promise<TResult>,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ detail: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  return Response.json(await handler(body as TBody))
}

export async function formPost<TResult>(
  request: Request,
  handler: (formData: FormData) => Promise<TResult>,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ detail: "Forbidden" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  return Response.json(await handler(formData))
}

export async function jsonGet<TResult>(
  load: () => Promise<TResult>,
  errorDetail: string,
): Promise<Response> {
  try {
    return Response.json(await load())
  } catch (error) {
    console.error("[api] read failed:", error)
    return Response.json({ detail: errorDetail }, { status: 500 })
  }
}
