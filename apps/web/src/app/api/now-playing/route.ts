import { NextResponse } from "next/server"

import { fetchNowPlaying } from "@/lib/integrations/kvarteret-personal/now-playing"

export async function GET() {
  const nowPlaying = await fetchNowPlaying()

  return NextResponse.json(nowPlaying, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  })
}
