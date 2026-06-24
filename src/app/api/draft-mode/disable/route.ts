import { draftMode } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Only allow disable if the request carries a valid bypass token (same secret
  // that next-sanity uses for enable). Without this, anyone could disable draft
  // mode for all visitors.
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const expected = process.env.SANITY_API_READ_TOKEN
  if (!token || !expected || token !== expected) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const draft = await draftMode()
  draft.disable()

  return NextResponse.redirect(new URL("/nb", request.url))
}
