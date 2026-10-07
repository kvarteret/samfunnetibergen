"use client"

import { type ReactNode, useEffect, useRef } from "react"

import { usePartyMode } from "@/lib/party-mode"

// Elements the critters can stand on. Anything with a visible top edge works,
// these just give a good spread of ledges across every page.
const PLATFORM_SELECTOR =
  "h1, h2, h3, h4, p, img, picture, button, a, li, article, figure, header, footer"

const GRAVITY = 1800
const MIN_PLATFORM_WIDTH = 40

type Pose = "idle" | "walk" | "air"

interface CritterSpec {
  name: string
  width: number
  height: number
  walkSpeed: [number, number]
  jumpSpeed: [number, number]
  sprite: ReactNode
}

interface Critter {
  spec: CritterSpec
  el: HTMLDivElement
  x: number // horizontal centre, viewport px
  y: number // feet, viewport px
  vx: number
  vy: number
  grounded: boolean
  platform: Element | null
  facing: 1 | -1
  pose: Pose
  nextActionAt: number
}

interface Platform {
  el: Element
  top: number
  left: number
  right: number
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

export function PartyMode() {
  const enabled = usePartyMode()
  if (!enabled) return null
  return <PartyCritters />
}

function PartyCritters() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const critters: Critter[] = CRITTERS.flatMap((spec, index) => {
      const el = refs.current[index]
      if (!el) return []
      return [
        {
          spec,
          el,
          x: window.innerWidth * (index === 0 ? 0.25 : 0.75),
          y: -spec.height,
          vx: 0,
          vy: 0,
          grounded: false,
          platform: null,
          facing: index === 0 ? 1 : -1,
          pose: "air",
          nextActionAt: 0,
        },
      ]
    })

    let candidates: Element[] = []
    let candidatesAt = 0
    let platforms: Platform[] = []

    const collectPlatforms = (now: number) => {
      if (now - candidatesAt > 1500) {
        candidates = Array.from(document.querySelectorAll(PLATFORM_SELECTOR))
        candidatesAt = now
      }
      const height = window.innerHeight
      platforms = []
      for (const el of candidates) {
        if (el.closest("[data-party-critter]")) continue
        const rect = el.getBoundingClientRect()
        if (rect.width < MIN_PLATFORM_WIDTH || rect.height < 8) continue
        if (rect.top < 24 || rect.top > height - 8) continue
        platforms.push({
          el,
          top: rect.top,
          left: rect.left,
          right: rect.right,
        })
      }
    }

    const floor = () => window.innerHeight

    const jump = (critter: Critter) => {
      const { spec } = critter
      const reachable = platforms.filter(
        p =>
          p.el !== critter.platform &&
          p.top < critter.y - 30 &&
          p.top > critter.y - 260 &&
          Math.abs((p.left + p.right) / 2 - critter.x) < 320,
      )

      critter.grounded = false
      critter.platform = null

      const target =
        reachable.length > 0 && Math.random() < 0.7
          ? reachable[Math.floor(Math.random() * reachable.length)]
          : null

      if (!target) {
        critter.vy = -random(...spec.jumpSpeed)
        critter.vx = critter.facing * random(...spec.walkSpeed) * 1.6
        return
      }

      // Aim for a spot on the target's top edge: overshoot the ledge a bit so
      // the critter lands on it on the way down.
      const rise = critter.y - target.top + random(30, 70)
      const vy = -Math.sqrt(2 * GRAVITY * rise)
      const drop = target.top - critter.y
      const flight = (-vy + Math.sqrt(vy * vy + 2 * GRAVITY * drop)) / GRAVITY
      const inset = Math.min(20, (target.right - target.left) / 3)
      const targetX = random(target.left + inset, target.right - inset)

      critter.vy = vy
      critter.vx = Math.max(-500, Math.min(500, (targetX - critter.x) / flight))
      if (critter.vx !== 0) critter.facing = critter.vx > 0 ? 1 : -1
    }

    const decide = (critter: Critter, now: number) => {
      const roll = Math.random()
      if (roll < 0.35) {
        jump(critter)
      } else if (roll < 0.5) {
        critter.vx = 0
      } else {
        if (Math.random() < 0.4) critter.facing = critter.facing === 1 ? -1 : 1
        critter.vx = critter.facing * random(...critter.spec.walkSpeed)
      }
      critter.nextActionAt = now + random(700, 2600)
    }

    const fall = (critter: Critter) => {
      critter.grounded = false
      critter.platform = null
      critter.vy = Math.max(critter.vy, 0)
    }

    const step = (critter: Critter, dt: number, now: number) => {
      const halfWidth = critter.spec.width / 2
      const width = window.innerWidth

      if (critter.grounded) {
        critter.x += critter.vx * dt

        if (critter.platform) {
          const rect = critter.platform.getBoundingClientRect()
          const scrolledAway = rect.top < 0 || rect.top > floor()
          const walkedOff = critter.x < rect.left || critter.x > rect.right
          if (!critter.platform.isConnected || scrolledAway || walkedOff) {
            fall(critter)
          } else {
            critter.y = rect.top
          }
        } else {
          critter.y = floor()
        }

        if (now >= critter.nextActionAt) decide(critter, now)
      } else {
        const previousY = critter.y
        critter.vy += GRAVITY * dt
        critter.x += critter.vx * dt
        critter.y += critter.vy * dt

        if (critter.vy > 0) {
          const landing = platforms.find(
            p =>
              p.top >= previousY &&
              p.top <= critter.y &&
              critter.x > p.left + 4 &&
              critter.x < p.right - 4,
          )
          if (landing) {
            critter.y = landing.top
            critter.platform = landing.el
          } else if (critter.y >= floor()) {
            critter.y = floor()
            critter.platform = null
          }
          if (landing || critter.y >= floor()) {
            critter.grounded = true
            critter.vy = 0
            critter.vx = critter.facing * random(...critter.spec.walkSpeed)
            critter.nextActionAt = now + random(300, 1500)
          }
        }
      }

      // Keep them on screen: bounce off the side walls.
      if (critter.x < halfWidth) {
        critter.x = halfWidth
        critter.vx = Math.abs(critter.vx)
        critter.facing = 1
      } else if (critter.x > width - halfWidth) {
        critter.x = width - halfWidth
        critter.vx = -Math.abs(critter.vx)
        critter.facing = -1
      }
      if (critter.vx !== 0) critter.facing = critter.vx > 0 ? 1 : -1

      const pose: Pose = !critter.grounded
        ? "air"
        : critter.vx === 0
          ? "idle"
          : "walk"
      if (pose !== critter.pose) {
        critter.pose = pose
        critter.el.dataset.pose = pose
      }

      critter.el.style.transform = `translate3d(${critter.x - halfWidth}px, ${
        critter.y - critter.spec.height
      }px, 0)`
      critter.el.dataset.facing = critter.facing === 1 ? "right" : "left"
    }

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      collectPlatforms(now)
      for (const critter of critters) step(critter, dt, now)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // Poke a critter to make it hop.
    const cleanups = critters.map(critter => {
      const onPoke = () => {
        critter.facing = Math.random() < 0.5 ? 1 : -1
        jump(critter)
      }
      critter.el.addEventListener("pointerdown", onPoke)
      return () => critter.el.removeEventListener("pointerdown", onPoke)
    })

    return () => {
      cancelAnimationFrame(frame)
      for (const cleanup of cleanups) cleanup()
    }
  }, [])

  return (
    <div aria-hidden className="party-critters">
      {CRITTERS.map((critter, index) => (
        <div
          className="party-critter"
          data-critter={critter.name}
          data-party-critter
          data-pose="air"
          key={critter.name}
          ref={el => {
            refs.current[index] = el
          }}
          style={{ width: critter.width, height: critter.height }}
        >
          <div className="party-critter-body">{critter.sprite}</div>
        </div>
      ))}
    </div>
  )
}

function Penguin() {
  return (
    <svg aria-hidden className="size-full overflow-visible" viewBox="0 0 48 56">
      <ellipse cx="18" cy="54" fill="#f59e0b" rx="6" ry="2.5" />
      <ellipse cx="31" cy="54" fill="#f59e0b" rx="6" ry="2.5" />
      <path
        className="party-wing party-wing-back"
        d="M10 26 Q2 38 6 46 Q12 40 13 30 Z"
        fill="#1f2433"
      />
      <ellipse cx="24" cy="31" fill="#1f2433" rx="15" ry="22" />
      <ellipse cx="25" cy="36" fill="#fdfaf3" rx="10" ry="15" />
      <ellipse cx="27" cy="19" fill="#fdfaf3" rx="8" ry="7" />
      <circle cx="30" cy="17" fill="#1f2433" r="2.2" />
      <circle cx="30.7" cy="16.3" fill="#fff" r="0.7" />
      <path d="M34 20 L44 22.5 L34 25 Z" fill="#f59e0b" />
      <circle cx="33" cy="25" fill="#f9a8b8" opacity="0.7" r="2" />
      <path
        className="party-wing party-wing-front"
        d="M30 28 Q40 38 36 47 Q30 41 28 32 Z"
        fill="#2c3346"
      />
      <path
        d="M14 9 L19 1 L22 9 Z"
        fill="#eb3b3b"
        stroke="#1f2433"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="1.5" fill="#f59e0b" r="1.8" />
    </svg>
  )
}

function Hedgehog() {
  return (
    <svg aria-hidden className="size-full overflow-visible" viewBox="0 0 56 44">
      <g className="party-hedgehog-feet">
        <ellipse cx="18" cy="41" fill="#5b3a21" rx="4" ry="2.5" />
        <ellipse cx="36" cy="41" fill="#5b3a21" rx="4" ry="2.5" />
      </g>
      <path
        d="M4 34 L1 26 L7 25 L4 16 L11 17 L11 8 L18 12 L21 3 L26 10 L31 2 L34 10 L40 5 L41 13 L47 12 L44 20 L42 30 Q34 40 18 39 Q6 39 4 34 Z"
        fill="#6b4226"
        stroke="#3d2614"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14 12 L17 18 M24 9 L25 16 M33 9 L32 16 M9 22 L14 25 M39 15 L36 21"
        stroke="#3d2614"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M36 20 Q44 18 50 28 Q55 31 52 34 Q46 38 38 37 Q32 34 34 26 Z"
        fill="#e7c49a"
        stroke="#3d2614"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <circle cx="53" cy="32" fill="#1f2433" r="2.6" />
      <circle cx="43.5" cy="26" fill="#1f2433" r="2" />
      <circle cx="44.1" cy="25.4" fill="#fff" r="0.6" />
      <circle cx="44" cy="31.5" fill="#f9a8b8" opacity="0.8" r="2" />
      <ellipse cx="39" cy="21" fill="#e7c49a" rx="3" ry="2.5" />
    </svg>
  )
}

const CRITTERS: CritterSpec[] = [
  {
    name: "pingvin",
    width: 44,
    height: 52,
    walkSpeed: [45, 85],
    jumpSpeed: [520, 760],
    sprite: <Penguin />,
  },
  {
    name: "pinnsvin",
    width: 50,
    height: 40,
    walkSpeed: [70, 130],
    jumpSpeed: [560, 820],
    sprite: <Hedgehog />,
  },
]
