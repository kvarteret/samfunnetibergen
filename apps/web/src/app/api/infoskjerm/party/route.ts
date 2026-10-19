import { NextResponse } from "next/server"

import { getPostHogClient } from "@/lib/posthog-server"

// PostHog flag that switches the infoskjerm mascots on and off without a
// deploy. Anything but a clear "on" keeps them away.
export const INFOSCREEN_PARTY_FLAG = "infoskjerm-maskoter"
export const INFOSCREEN_MULTIPLAYER_FLAG = "partymodus-spill-med-andre"
// Lets a phone at ?player=…&game=subwaysurfers take over the screen with the game.
export const INFOSCREEN_SUBWAY_FLAG = "infoskjerm-subway-surfers"
const OFF = { enabled: false, multiplayer: false, subwaysurfers: false }
const SCREEN_DISTINCT_ID = "infoskjerm"
const CACHE_MS = 30_000

let cached: (typeof OFF & { at: number }) | null = null

async function readFlag() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return OFF
  try {
    const flags = await getPostHogClient().evaluateFlags(SCREEN_DISTINCT_ID, {
      flagKeys: [
        INFOSCREEN_PARTY_FLAG,
        INFOSCREEN_MULTIPLAYER_FLAG,
        INFOSCREEN_SUBWAY_FLAG,
      ],
    })
    return {
      enabled: flags.isEnabled(INFOSCREEN_PARTY_FLAG) === true,
      multiplayer: flags.isEnabled(INFOSCREEN_MULTIPLAYER_FLAG) === true,
      subwaysurfers: flags.isEnabled(INFOSCREEN_SUBWAY_FLAG) === true,
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
    {
      enabled: cached.enabled,
      multiplayer: cached.multiplayer,
      subwaysurfers: cached.subwaysurfers,
    },
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
