import { NextResponse } from "next/server"

import { getPostHogClient } from "@/lib/posthog-server"

// PostHog flag that switches the infoskjerm mascots on and off without a
// deploy. Anything but a clear "on" keeps them away.
export const INFOSCREEN_PARTY_FLAG = "infoskjerm-maskoter"
const SCREEN_DISTINCT_ID = "infoskjerm"
const CACHE_MS = 30_000

let cached: { enabled: boolean; at: number } | null = null

async function readFlag() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return false
  try {
    const flags = await getPostHogClient().evaluateFlags(SCREEN_DISTINCT_ID, {
      flagKeys: [INFOSCREEN_PARTY_FLAG],
    })
    return flags.isEnabled(INFOSCREEN_PARTY_FLAG) === true
  } catch {
    return false
  }
}

export async function GET() {
  const now = Date.now()
  if (!cached || now - cached.at > CACHE_MS) {
    cached = { enabled: await readFlag(), at: now }
  }

  return NextResponse.json(
    { enabled: cached.enabled },
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
