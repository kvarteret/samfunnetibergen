import { describe, expect, it } from "vitest"
import {
  appPlaceId,
  BASE,
  createHttpApi,
  NotSignedInError,
  realSlot,
  SEATS,
  toBoard,
  type WireBoard,
} from "./http"
import { RefusedError } from "./types"

function wireBoard(): WireBoard {
  const assignment = {
    assignment_id: 9,
    volunteer_id: 1,
    cannot_attend: false,
    swap_requested: false,
    training: null,
    problems: [],
  }
  return {
    bar: { id: 7, name: "Stjerne" },
    week_start: "2026-11-02",
    week_number: 45,
    version: "abc",
    status: "open",
    deadline: null,
    rows: [{ position: 1, label: "Dagskift", time_label: "11:00–17:00" }],
    shifts: [
      {
        shift_id: 1,
        day: "2026-11-02",
        position: 1,
        title: "Dagskift",
        time_label: "11:00–17:00",
        starts_at: "2026-11-02T11:00:00+01:00",
        ends_at: "2026-11-02T17:00:00+01:00",
        duration_minutes: 360,
        closed: false,
        answers: {},
        places: [
          // One slot (81) with three seats: one filled, two open.
          {
            slot_id: 81,
            seat: 0,
            kind: "skjenker",
            assignment,
            suggestion: null,
            needed: false,
          },
          {
            slot_id: 81,
            seat: 1,
            kind: "skjenker",
            assignment: null,
            suggestion: null,
            needed: true,
          },
          {
            slot_id: 81,
            seat: 2,
            kind: "skjenker",
            assignment: null,
            suggestion: null,
            needed: true,
          },
          {
            slot_id: 80,
            seat: 0,
            kind: "skiftleder",
            assignment: null,
            suggestion: null,
            needed: true,
          },
        ],
      },
    ],
    people: [
      {
        volunteer_id: 4,
        name: "Di Delta",
        is_skiftleder: false,
        week_shifts: 0,
        month_shifts: 0,
        answer_status: "ikke_svart",
        busy_days: [],
        note: null,
        max_shifts: null,
        tags: [],
      },
    ],
    fit: {
      "4": {
        "81": { ok: true, warnings: [] },
        "80": {
          ok: true,
          warnings: [{ text: "Kun for godkjente skiftledere", level: "red" }],
          needs_confirmation: true,
        },
      },
    },
    strip: [{ week_start: "2026-11-02", number: 45, status: "open" }],
    last_changed: null,
  }
}

describe("toBoard", () => {
  it("gives every seat of a slot its own app id and maps it back", () => {
    const board = toBoard(wireBoard())
    const ids = board.shifts[0].places.map(place => place.slot_id)

    expect(ids).toEqual([8100, 8101, 8102, 8000])
    expect(new Set(ids).size).toBe(ids.length)
    expect(appPlaceId(81, 2)).toBe(81 * SEATS + 2)
    expect(ids.map(realSlot)).toEqual([81, 81, 81, 80])
  })

  it("copies a slot's fit to each of its open seats only", () => {
    const fit = toBoard(wireBoard()).fit["4"]

    expect(Object.keys(fit).sort()).toEqual(["8000", "8101", "8102"])
    expect(fit["8101"]).toEqual({ ok: true, warnings: [] })
    expect(fit["8102"]).toBe(fit["8101"])
    expect(fit["8000"]).toMatchObject({ ok: true, needs_confirmation: true })
  })

  it("passes on which places still have to be filled", () => {
    const places = toBoard(wireBoard()).shifts[0].places

    expect(places.map(place => place.needed)).toEqual([false, true, true, true])
  })

  it("keeps a person's hours and defaults a missing value to 0", () => {
    const wire = wireBoard()
    expect(toBoard(wire).people[0].week_minutes).toBe(0)
    wire.people[0].week_minutes = 420
    expect(toBoard(wire).people[0].week_minutes).toBe(420)
  })
})

describe("the http client", () => {
  const reply = (status: number, body: unknown) =>
    (async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch

  it("asks Personal for the week of a bar", async () => {
    const calls: string[] = []
    const api = createHttpApi((async (url: string) => {
      calls.push(url)
      return new Response(JSON.stringify(wireBoard()), { status: 200 })
    }) as typeof fetch)

    const board = await api.week(7, "2026-11-02")

    expect(calls).toEqual([`${BASE}/weeks/2026-11-02?group_id=7`])
    expect(board.bar.name).toBe("Stjerne")
  })

  it("says not signed in on 401", async () => {
    const api = createHttpApi(
      reply(401, { detail: "Authentication required." }),
    )
    await expect(api.me()).rejects.toBeInstanceOf(NotSignedInError)
  })

  it("passes Personal's Norwegian text on", async () => {
    const api = createHttpApi(
      reply(403, { detail: "Du har ikke tilgang til å se skiftplanen." }),
    )
    await expect(api.week(9, "2026-11-02")).rejects.toThrow(
      "Du har ikke tilgang til å se skiftplanen.",
    )
  })

  it("has a fallback text when the answer is not JSON", async () => {
    const api = createHttpApi(
      (async () =>
        new Response("<html>Bad gateway</html>", {
          status: 502,
        })) as typeof fetch,
    )
    await expect(api.me()).rejects.toThrow("Personal svarte 502")
  })
})

describe("writes", () => {
  interface Call {
    url: string
    init: RequestInit
  }

  /** An api whose fetch records every call and answers `status` with `body`. */
  async function setup(status = 200, body: unknown = null) {
    const calls: Call[] = []
    const api = createHttpApi((async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init })
      if (url.endsWith("/me"))
        return new Response(
          JSON.stringify({
            name: "Leder",
            role: "Admin",
            csrf_token: "tok",
            bars: [],
          }),
          { status: 200 },
        )
      return new Response(
        JSON.stringify(
          body ?? { message: "Gjort.", warnings: [], board: wireBoard() },
        ),
        { status },
      )
    }) as typeof fetch)
    await api.me()
    calls.length = 0
    return { api, calls, board: toBoard(wireBoard()) }
  }

  const headersOf = (call: Call) => call.init.headers as Record<string, string>
  const bodyOf = (call: Call) => JSON.parse(String(call.init.body))

  it("place: POST with the token, the version, the real slot id and confirmed", async () => {
    const { api, calls, board } = await setup()
    const result = await api.place(board, appPlaceId(81, 1), 4)

    expect(calls[0].url).toBe(
      `${BASE}/placements?group_id=7&week_start=2026-11-02`,
    )
    expect(calls[0].init.method).toBe("POST")
    expect(calls[0].init.credentials).toBe("same-origin")
    expect(headersOf(calls[0])).toMatchObject({
      "X-CSRF-Token": "tok",
      "If-Match": "abc",
    })
    expect(bodyOf(calls[0])).toEqual({
      slot_id: 81,
      volunteer_id: 4,
      confirmed: false,
    })
    // The answer is turned into the app's own place ids.
    expect(result.message).toBe("Gjort.")
    expect(result.board.shifts[0].places[0].slot_id).toBe(8100)
  })

  it("place: confirmed is sent when the leader accepted the warning", async () => {
    const { api, calls, board } = await setup()
    await api.place(board, appPlaceId(80, 0), 4, true)
    expect(bodyOf(calls[0]).confirmed).toBe(true)
  })

  it("replace: sends the slot of the assignment, not of the box", async () => {
    const { api, calls, board } = await setup()
    await api.replace(board, 9, 4, false)

    expect(calls[0].url).toContain(`${BASE}/placements/9?`)
    expect(calls[0].init.method).toBe("PUT")
    expect(bodyOf(calls[0])).toEqual({
      slot_id: 81,
      volunteer_id: 4,
      confirmed: false,
    })
  })

  it("move: sends the real target slot", async () => {
    const { api, calls, board } = await setup()
    await api.move(board, 9, appPlaceId(80, 0), true)

    expect(calls[0].url).toContain(`${BASE}/placements/9/move?`)
    expect(bodyOf(calls[0])).toEqual({ slot_id: 80, confirmed: true })
  })

  it("swap: sends both assignments and never confirms", async () => {
    const { api, calls, board } = await setup()
    await api.swap(board, 9, 10)

    expect(calls[0].url).toContain(`${BASE}/placements/swap?`)
    expect(bodyOf(calls[0])).toEqual({
      assignment_a: 9,
      assignment_b: 10,
      confirmed: false,
    })
  })

  it("remove: DELETE with the place the page showed", async () => {
    const { api, calls, board } = await setup()
    await api.remove(board, 9)

    expect(calls[0].init.method).toBe("DELETE")
    expect(calls[0].url).toBe(
      `${BASE}/placements/9?group_id=7&week_start=2026-11-02&slot_id=81`,
    )
    expect(calls[0].init.body).toBeUndefined()
  })

  it("addPlace: POST on the shift with the kind", async () => {
    const { api, calls, board } = await setup()
    await api.addPlace(board, 1, "skjenker")

    expect(calls[0].url).toBe(
      `${BASE}/shifts/1/places?group_id=7&week_start=2026-11-02`,
    )
    expect(calls[0].init.method).toBe("POST")
    expect(headersOf(calls[0])).toMatchObject({
      "X-CSRF-Token": "tok",
      "If-Match": "abc",
    })
    expect(bodyOf(calls[0])).toEqual({ kind: "skjenker" })
  })

  it("removePlace: DELETE on the real slot, not the box", async () => {
    const { api, calls, board } = await setup()
    await api.removePlace(board, appPlaceId(81, 1))

    expect(calls[0].init.method).toBe("DELETE")
    expect(calls[0].url).toBe(
      `${BASE}/slots/81/seat?group_id=7&week_start=2026-11-02`,
    )
    expect(calls[0].init.body).toBeUndefined()
  })

  it("setStatus: PUT on the week, the bar in the query", async () => {
    const { api, calls, board } = await setup()
    await api.setStatus(board, "published")

    expect(calls[0].url).toBe(`${BASE}/weeks/2026-11-02/status?group_id=7`)
    expect(calls[0].init.method).toBe("PUT")
    expect(bodyOf(calls[0])).toEqual({ status: "published" })
  })

  it("a refusal (409) shows Personal's own text", async () => {
    const { api, board } = await setup(409, {
      detail: "En annen leder har endret uka. Siden er oppdatert, prøv igjen.",
    })
    await expect(api.place(board, appPlaceId(81, 1), 4)).rejects.toThrow(
      "En annen leder har endret uka",
    )
  })

  it("a missing or expired token (403) says to reload", async () => {
    const { api, board } = await setup(403, {
      detail: "Sikkerhetskoden mangler eller er utløpt. Last siden på nytt.",
    })
    await expect(api.remove(board, 9)).rejects.toThrow("Last siden på nytt")
  })

  it("not signed in on a write is the sign-in error", async () => {
    const { api, board } = await setup(401, {
      detail: "Authentication required.",
    })
    await expect(api.place(board, appPlaceId(81, 1), 4)).rejects.toBeInstanceOf(
      NotSignedInError,
    )
  })

  it("replace or remove on a place that is gone is refused before any request", async () => {
    const { api, calls, board } = await setup()
    await expect(api.remove(board, 12345)).rejects.toBeInstanceOf(RefusedError)
    expect(calls).toHaveLength(0)
  })
})

describe("an expired security code", () => {
  /** Personal hands out `tokens` one by one on GET /me and checks them on writes. */
  function server(tokens: string[], accepts: string, meStatus: number[] = []) {
    const writes: string[] = []
    let meCalls = 0
    const api = createHttpApi((async (url: string, init: RequestInit = {}) => {
      if (url.endsWith("/me")) {
        const status = meStatus[meCalls] ?? 200
        const token = tokens[Math.min(meCalls, tokens.length - 1)]
        meCalls += 1
        return new Response(
          JSON.stringify(
            status === 200
              ? { name: "Leder", role: "Admin", csrf_token: token, bars: [] }
              : { detail: "Authentication required." },
          ),
          { status },
        )
      }
      const sent = (init.headers as Record<string, string>)["X-CSRF-Token"]
      writes.push(sent)
      return sent === accepts
        ? new Response(
            JSON.stringify({
              message: "Gjort.",
              warnings: [],
              board: wireBoard(),
            }),
            { status: 200 },
          )
        : new Response(
            JSON.stringify({
              detail:
                "Sikkerhetskoden mangler eller er utløpt. Last siden på nytt.",
            }),
            { status: 403 },
          )
    }) as typeof fetch)
    return { api, writes }
  }

  it("asks for a new code and tries the write once more", async () => {
    const { api, writes } = server(["old", "new"], "new")
    await api.me()
    const result = await api.remove(toBoard(wireBoard()), 9)
    expect(result.message).toBe("Gjort.")
    expect(writes).toEqual(["old", "new"])
  })

  it("does not try again when the code is the same (a real refusal)", async () => {
    const { api, writes } = server(["same"], "something else")
    await api.me()
    await expect(api.remove(toBoard(wireBoard()), 9)).rejects.toThrow(
      "Last siden på nytt",
    )
    expect(writes).toEqual(["same"])
  })

  it("says not signed in when the session is gone while the code is refreshed", async () => {
    const { api, writes } = server(["old"], "new", [200, 401])
    await api.me()
    await expect(api.remove(toBoard(wireBoard()), 9)).rejects.toBeInstanceOf(
      NotSignedInError,
    )
    expect(writes).toEqual(["old"])
  })
})
