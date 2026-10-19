import { type Connection, routePartykitRequest, Server } from "partyserver"

import {
  HEALTH_PATH,
  INFOSCREEN_ROOM,
  isAllowedOrigin,
  MAX_PLAYERS_PER_ROOM,
  NEUTRAL_INPUT,
  type Player,
  type PlayerState,
  parseClientMessage,
  parseScreenClientMessage,
  type ScreenPlayer,
  type ScreenServerMessage,
  type ServerMessage,
} from "./protocol"

type ScreenConnectionState =
  | { role: "screen" }
  | { role: "controller"; name: string; player: ScreenPlayer }

interface Env {
  Lekeplass: DurableObjectNamespace<Lekeplass>
  // Comma separated, see isAllowedOrigin.
  ALLOWED_ORIGINS: string
}

// Clients send at most ~15 moves a second; anything far beyond that is
// dropped rather than relayed to everyone else in the room.
const MOVES_PER_SECOND = 30

// A room is a page on the website. The server keeps no history: each
// connection carries its player's latest state, which survives hibernation,
// and every move is relayed to the others in the room.
export class Lekeplass extends Server<Env> {
  static options = { hibernate: true }

  // Per connection rate window. Losing it to hibernation is harmless.
  #window = new Map<string, { startedAt: number; count: number }>()

  #send(connection: Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message))
  }

  #broadcast(message: ServerMessage, without: string[]) {
    this.broadcast(JSON.stringify(message), without)
  }

  onConnect(connection: Connection<PlayerState>) {
    if (this.name === INFOSCREEN_ROOM) {
      if (Array.from(this.getConnections()).length > MAX_PLAYERS_PER_ROOM)
        connection.close(1013, "Lekeplassen er full")
      return
    }
    const players: Player[] = []
    let count = 0
    for (const other of this.getConnections<PlayerState>()) {
      count += 1
      if (other.id !== connection.id && other.state) {
        players.push({ id: other.id, state: { ...other.state } })
      }
    }
    if (count > MAX_PLAYERS_PER_ROOM) {
      connection.close(1013, "Lekeplassen er full")
      return
    }
    this.#send(connection, { type: "welcome", players })
  }

  onMessage(connection: Connection<PlayerState>, raw: string | ArrayBuffer) {
    if (!this.#allow(connection.id)) return
    if (this.name === INFOSCREEN_ROOM) {
      this.#screenMessage(
        connection as unknown as Connection<ScreenConnectionState>,
        raw,
      )
      return
    }
    const message = parseClientMessage(raw)
    if (!message) return
    if (message.type === "rest") {
      if (!connection.state) return
      connection.setState(null)
      this.#broadcast({ type: "leave", id: connection.id }, [connection.id])
      return
    }
    connection.setState(message.state)
    this.#broadcast({ type: "move", id: connection.id, state: message.state }, [
      connection.id,
    ])
  }

  onClose(connection: Connection<PlayerState>) {
    this.#window.delete(connection.id)
    if (this.name === INFOSCREEN_ROOM) {
      this.#screenRoster(connection.id)
      return
    }
    if (connection.state) {
      this.#broadcast({ type: "leave", id: connection.id }, [connection.id])
    }
  }

  onError(connection: Connection<PlayerState>) {
    this.onClose(connection)
  }

  #screenSend(connection: Connection, message: ScreenServerMessage) {
    connection.send(JSON.stringify(message))
  }

  #screenRoster(exclude?: string) {
    const connections = Array.from(
      this.getConnections<ScreenConnectionState>(),
    ).filter(c => c.id !== exclude)
    const players = connections.flatMap(c =>
      c.state?.role === "controller" ? [c.state.player] : [],
    )
    const available = connections.some(c => c.state?.role === "screen")
    for (const connection of connections) {
      if (connection.state?.role === "screen")
        this.#screenSend(connection, { type: "players", players })
      if (connection.state?.role === "controller")
        this.#screenSend(connection, { type: "screen-status", available })
    }
  }

  #screenMessage(
    connection: Connection<ScreenConnectionState>,
    raw: string | ArrayBuffer,
  ) {
    const message = parseScreenClientMessage(raw)
    if (!message) return
    if (message.type === "screen" && !connection.state) {
      connection.setState({ role: "screen" })
      this.#screenRoster()
    } else if (message.type === "join" && !connection.state) {
      connection.setState({
        role: "controller",
        name: message.name,
        player: {
          id: connection.id,
          mascot: message.mascot,
          ...(message.game ? { game: message.game } : {}),
          ...(message.low ? { low: true as const } : {}),
          input: { ...NEUTRAL_INPUT },
        },
      })
      this.#screenSend(connection, { type: "joined" })
      this.#screenRoster()
    } else if (
      message.type === "input" &&
      connection.state?.role === "controller"
    ) {
      const state = connection.state
      // Counters may only advance; a replay cannot manufacture more jumps.
      if (
        message.input.jump < state.player.input.jump ||
        message.input.drop < state.player.input.drop
      )
        return
      connection.setState({
        ...state,
        player: { ...state.player, input: message.input },
      })
      for (const screen of this.getConnections<ScreenConnectionState>()) {
        if (screen.state?.role === "screen")
          this.#screenSend(screen, {
            type: "input",
            id: connection.id,
            input: message.input,
          })
      }
    }
  }

  #allow(id: string) {
    const now = Date.now()
    const window = this.#window.get(id)
    if (!window || now - window.startedAt >= 1000) {
      this.#window.set(id, { startedAt: now, count: 1 })
      return true
    }
    window.count += 1
    return window.count <= MOVES_PER_SECOND
  }
}

// The website only offers "Spill med andre" once this answers, so a broken
// or unreachable server hides the option instead of showing a dead one.
function health(request: Request, env: Env) {
  const origin = request.headers.get("Origin")
  if (!origin || !isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
    return new Response("Forbidden", { status: 403 })
  }
  return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Cache-Control": "no-store",
      Vary: "Origin",
    },
  })
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === HEALTH_PATH) {
      return health(request, env)
    }
    return (
      (await routePartykitRequest(request, env, {
        onBeforeConnect: req => {
          const origin = req.headers.get("Origin")
          if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
            return new Response("Forbidden", { status: 403 })
          }
        },
      })) ?? new Response("Not found", { status: 404 })
    )
  },
} satisfies ExportedHandler<Env>
