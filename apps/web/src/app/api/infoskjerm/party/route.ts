import { NextResponse } from "next/server"

import { getPostHogClient } from "@/lib/posthog-server"

// PostHog flag that switches the infoskjerm mascots on and off without a
// deploy. Anything but a clear "on" keeps them away.
export const INFOSCREEN_PARTY_FLAG = "infoskjerm-maskoter"
export const INFOSCREEN_MULTIPLAYER_FLAG = "partymodus-spill-med-andre"
const OFF = { enabled: false, multiplayer: false }
const SCREEN_DISTINCT_ID = "infoskjerm"
const CACHE_MS = 30_000

let cached: { enabled: boolean; multiplayer: boolean; at: number } | null = null

async function readFlag() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return OFF
  try {
    const flags = await getPostHogClient().evaluateFlags(SCREEN_DISTINCT_ID, {
      flagKeys: [INFOSCREEN_PARTY_FLAG, INFOSCREEN_MULTIPLAYER_FLAG],
    })
    return {
      enabled: flags.isEnabled(INFOSCREEN_PARTY_FLAG) === true,
      multiplayer: flags.isEnabled(INFOSCREEN_MULTIPLAYER_FLAG) === true,
    }
  } catch {
    return OFF
  }
}

export async function GET() {
  const now = Date.now()
  if (!cached || now - cached.at > CACHE_MS) {
    cached = { ...(await readFlag()), at: now }
  }

  return NextResponse.json(
    { enabled: cached.enabled, multiplayer: cached.multiplayer },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  )
}

export function resetInfoscreenPartyFlagCache() {
  cached = null
}
