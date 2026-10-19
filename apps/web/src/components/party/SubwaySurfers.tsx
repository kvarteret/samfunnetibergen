"use client"

import { type RefObject, useEffect, useRef, useState } from "react"
import type { PartyMascot } from "@/lib/party-mode"
import { type ReceivedInput, readScreenControls } from "./input"
import { specFor } from "./PartyMode"
import { newGame, scoreOf, speedAt, step } from "./subway"
import { createWorld } from "./subway-world"

const RESTART_MS = 3000

interface Hud {
  score: number
  coins: number
  best: number
  speed: number
  dead: boolean
}

// Fullscreen 3D runner that takes over the infoscreen, driven by one player.
// three.js draws the world; the mascot is the real animated party sprite,
// overlaid at the projected position of the runner.
export function SubwaySurfers({
  playerId,
  mascot,
  inputs,
}: {
  playerId: string
  mascot: PartyMascot
  inputs: RefObject<Map<string, ReceivedInput>>
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const runner = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState<Hud>({
    score: 0,
    coins: 0,
    best: 0,
    speed: 7,
    dead: false,
  })
  const spec = specFor(mascot)

  useEffect(() => {
    const el = canvas.current
    const sprite = runner.current
    if (!el || !sprite) return
    const world = createWorld(el)
    let state = newGame()
    let best = 0
    let diedAt = 0
    let last = performance.now()
    let frame = 0
    let shown = ""
    const counters = { lastJump: 0, lastDrop: 0 }
    const held = { left: false, right: false }
    // Start from the player's current totals so earlier presses don't fire.
    const first = inputs.current.get(playerId)?.input
    if (first) {
      counters.lastJump = first.jump
      counters.lastDrop = first.drop
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const c = readScreenControls(inputs.current.get(playerId), counters, now)
      // Lane changes fire on the press, not while held.
      const controls = {
        left: c.left && !held.left,
        right: c.right && !held.right,
        jump: c.jumpQueued,
        drop: c.dropQueued,
      }
      held.left = c.left
      held.right = c.right
      if (state.dead) {
        if (now - diedAt > RESTART_MS) state = newGame()
      } else {
        state = step(state, controls, dt)
        if (state.dead) {
          diedAt = now
          best = Math.max(best, scoreOf(state))
        }
      }
      world.update(state, now)
      const at = world.runner(state)
      sprite.style.transform = `translate(${at.x}px, ${at.y}px) translate(-50%, -100%)`
      sprite.style.height = `${at.height}px`
      sprite.style.filter = state.dead ? "grayscale(1)" : ""
      sprite.dataset.facing = state.facing
      // Airborne or ducking on the ground rolls the hedgehog into a ball; on a
      // tram roof it just runs.
      const airborne = state.y > state.floor + 0.001
      const rolled =
        mascot === "pinnsvin" && state.slide > 0 && state.floor === 0
      sprite.dataset.pose = state.dead
        ? "idle"
        : airborne || rolled
          ? "air"
          : "walk"
      if (state.jumps === 2) sprite.dataset.flip = ""
      else delete sprite.dataset.flip
      sprite.style.setProperty(
        "--party-scale",
        state.slide > 0 && state.floor === 0 ? "0.55" : "1",
      )
      // The HUD only re-renders when something on it changes.
      const next = {
        score: scoreOf(state),
        coins: state.coins,
        best,
        speed: Math.round(speedAt(state.distance)),
        dead: state.dead,
      }
      const sig = `${next.score}|${next.coins}|${next.best}|${next.speed}|${next.dead}`
      if (sig !== shown) {
        shown = sig
        setHud(next)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    window.addEventListener("resize", world.resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", world.resize)
      world.dispose()
    }
  }, [playerId, mascot, inputs])

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black">
      {/* 9:16 stage: fills a portrait screen, letterboxed anywhere else. */}
      <div
        role="img"
        aria-label="Subway Surfers"
        className="relative overflow-hidden bg-sky-300 font-heading text-white [container-type:size]"
        style={{ aspectRatio: "9 / 16", height: "min(100vh, 100vw * 16 / 9)" }}
      >
        <canvas ref={canvas} className="absolute inset-0 size-full" />
        <div
          ref={runner}
          className="party-critter"
          data-critter={spec.name}
          style={{
            aspectRatio: `${spec.width} / ${spec.height}`,
            pointerEvents: "none",
          }}
        >
          <div className="party-critter-body">{spec.sprite}</div>
        </div>
        <div className="absolute top-[3cqh] left-[4cqw] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          <p className="text-[5cqh] leading-none">{hud.score} poeng</p>
          <p className="mt-[1cqh] text-[2.5cqh]">
            🪙 {hud.coins} · rekord {hud.best} · fart {hud.speed}
          </p>
        </div>
        <p className="absolute right-[4cqw] bottom-[2cqh] text-[2.2cqh] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          ← → bytt felt · ↑ hopp · ↓ gli
        </p>
        {hud.dead && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-center">
            <div>
              <p className="text-[8cqw]">Game over</p>
              <p className="text-[4cqw]">
                {hud.score} poeng – starter på nytt …
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
