// Wire format between the website's partymodus and the lekeplass server.
// Every visitor on the same page shares a room; each one can bring along the
// mascot they steer with the keyboard. Both ends parse what they receive, so
// a malformed or hostile message is dropped instead of trusted.

export const mascots = ["pingvin", "pinnsvin"] as const
export type Mascot = (typeof mascots)[number]

export const poses = ["idle", "walk", "air"] as const
export type Pose = (typeof poses)[number]

// Visitors have different screens, so a position is sent relative to an
// element both pages render: the nth platform candidate in document order.
// `ref` -1 means the bottom of the viewport, which is the floor for everyone.
export interface PlayerState {
  mascot: Mascot
  ref: number
  // Horizontal position as a fraction of the reference element's width.
  fx: number
  // Feet relative to the reference element's top edge, in CSS pixels.
  dy: number
  facing: 1 | -1
  pose: Pose
  // 1, or larger for a while after eating a fluesopp.
  growth: number
}

export interface Player {
  id: string
  state: PlayerState
}

// "rest" takes the player's mascot off the page for everyone else, while
// still watching the others.
export type ClientMessage =
  | { type: "move"; state: PlayerState }
  | { type: "rest" }

export type ServerMessage =
  | { type: "welcome"; players: Player[] }
  | { type: "move"; id: string; state: PlayerState }
  | { type: "leave"; id: string }

// Answers 200 for an allowed origin while the server is up.
export const HEALTH_PATH = "/health"

// Generous, but small enough that nobody can push large frames through.
export const MAX_MESSAGE_BYTES = 512
export const MAX_PLAYERS_PER_ROOM = 40
const MAX_REF = 5000
const MAX_DY = 4000
const MAX_ID_LENGTH = 64

type Fields = Record<string, unknown>

const isObject = (value: unknown): value is Fields =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isFiniteBetween = (value: unknown, min: number, max: number) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max

const isId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH

export function parsePlayerState(value: unknown): PlayerState | null {
  if (!isObject(value)) return null
  const { mascot, ref, fx, dy, facing, pose, growth } = value
  if (!mascots.some(m => m === mascot)) return null
  if (!poses.some(p => p === pose)) return null
  if (!Number.isInteger(ref) || !isFiniteBetween(ref, -1, MAX_REF)) return null
  if (!isFiniteBetween(fx, -1, 2)) return null
  if (!isFiniteBetween(dy, -MAX_DY, MAX_DY)) return null
  if (facing !== 1 && facing !== -1) return null
  if (!isFiniteBetween(growth, 0.5, 3)) return null
  return {
    mascot: mascot as Mascot,
    ref: ref as number,
    fx: fx as number,
    dy: dy as number,
    facing,
    pose: pose as Pose,
    growth: growth as number,
  }
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== "string" || raw.length > MAX_MESSAGE_BYTES * 64) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== "string" || raw.length > MAX_MESSAGE_BYTES) return null
  const message = parseJson(raw)
  if (!isObject(message)) return null
  if (message.type === "rest") return { type: "rest" }
  if (message.type !== "move") return null
  const state = parsePlayerState(message.state)
  return state ? { type: "move", state } : null
}

export function parseServerMessage(raw: unknown): ServerMessage | null {
  const message = parseJson(raw)
  if (!isObject(message)) return null
  switch (message.type) {
    case "welcome": {
      if (!Array.isArray(message.players)) return null
      const players = message.players.flatMap(player => {
        if (!isObject(player) || !isId(player.id)) return []
        const state = parsePlayerState(player.state)
        return state ? [{ id: player.id, state }] : []
      })
      return { type: "welcome", players }
    }
    case "move": {
      if (!isId(message.id)) return null
      const state = parsePlayerState(message.state)
      return state ? { type: "move", id: message.id, state } : null
    }
    case "leave":
      return isId(message.id) ? { type: "leave", id: message.id } : null
    default:
      return null
  }
}

// One room per page. Room names travel in the URL path, so the pathname is
// flattened to a short, URL-safe slug.
export function roomForPath(pathname: string) {
  const slug = pathname
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
  return slug || "forside"
}

// Origins allowed to connect, as a comma separated list. A leading "*."
// matches any subdomain, which covers preview deployments.
export function isAllowedOrigin(origin: string | null, allowed: string) {
  if (!origin) return false
  let host: string
  let protocol: string
  try {
    ;({ host, protocol } = new URL(origin))
  } catch {
    return false
  }
  return allowed
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean)
    .some(entry => {
      if (entry.startsWith("*.")) {
        return protocol === "https:" && host.endsWith(entry.slice(1))
      }
      return origin === entry
    })
}
