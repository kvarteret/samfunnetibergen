import type { Result } from "./result"
import { GENERIC_SUBMIT_ERROR } from "./submission-messages"

// Client-side fetch helpers for the /api route handlers. Submits return a
// Result and degrade to a generic retryable error on any transport failure;
// reads throw so React Query can surface and retry the error.

export async function postResultJson<T>(
  url: string,
  body: unknown,
): Promise<Result<T>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  if (!response.ok) {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  try {
    return (await response.json()) as Result<T>
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }
}

export async function postFormResultJson<T>(
  url: string,
  formData: FormData,
): Promise<Result<T>> {
  let response: Response
  try {
    response = await fetch(url, { method: "POST", body: formData })
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  if (!response.ok) {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  try {
    return (await response.json()) as Result<T>
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return (await response.json()) as T
}
