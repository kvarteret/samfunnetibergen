import { MAX_PLAYER_NAME_LENGTH } from "@samfunnet/party/protocol"
import { type PartyMascot, partyMascots } from "@/lib/party-mode"

export interface NamedPlayer {
  name: string
  mascot: PartyMascot
}

export function playerFromSearch(search: string): NamedPlayer | null {
  const name = new URLSearchParams(search)
    .get("player")
    ?.split("")
    .filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
    .join("")
    .trim()
    .slice(0, MAX_PLAYER_NAME_LENGTH)
  if (!name) return null
  return {
    name,
    mascot: partyMascots[Math.floor(Math.random() * partyMascots.length)],
  }
}
