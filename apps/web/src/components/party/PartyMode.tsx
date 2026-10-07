"use client"

import { type ReactNode, useEffect, useRef } from "react"

import {
  type PartyMascot,
  type PartySettings,
  usePartySettings,
} from "@/lib/party-mode"

// Elements the critters can stand on. Anything with a visible top edge works,
// these just give a good spread of ledges across every page.
const PLATFORM_SELECTOR =
  "h1, h2, h3, h4, p, img, picture, button, a, li, article, figure, footer"

const GRAVITY = 1800
const MIN_PLATFORM_WIDTH = 40
const LEASH_LENGTH = 70
// Highest ledge above its feet a wandering critter will jump for.
const MAX_CLIMB = 300
const POST_HEIGHT = 18
const CONTROL_SPEED = 130
const CONTROL_JUMP = 760
const DOUBLE_JUMP = 700
// Holding jump on the way up softens gravity, so a long press climbs higher.
const HELD_JUMP_GRAVITY = 0.6

// Fluesopp: eating one makes a critter grow for a while, Mario style. They
// are a rare treat: one at a time, every few minutes.
const MUSHROOM_WIDTH = 16
const MUSHROOM_HEIGHT = 18
const MUSHROOM_LIFETIME = 30_000
const MAX_MUSHROOMS = 1
const MUSHROOM_INTERVAL: [number, number] = [60_000, 180_000]
const GROWN_SCALE = 1.6
const GROWN_DURATION = 20_000
// The critter freezes while it grows or shrinks, like in the games.
const GROW_FREEZE = 900

const LEFT_KEYS = new Set(["ArrowLeft", "a", "A"])
const RIGHT_KEYS = new Set(["ArrowRight", "d", "D"])
const JUMP_KEYS = new Set(["ArrowUp", "w", "W", " "])
const DROP_KEYS = new Set(["ArrowDown", "s", "S"])

// Leave keys alone while the visitor is typing or working a widget that
// uses arrows or space itself.
const KEY_OWNER_SELECTOR =
  "input, textarea, select, [contenteditable], [role='radio'], [role='slider'], [role='combobox'], [role='listbox'], [role='menu'], [role='menuitem'], [role='tab']"
const PRESSABLE_SELECTOR =
  "button, a, summary, [role='button'], [role='checkbox']"

type Pose = "idle" | "walk" | "air"

interface CritterSpec {
  name: PartyMascot
  width: number
  height: number
  walkSpeed: [number, number]
  jumpSpeed: [number, number]
  // Where the leash clips on, as a fraction of height from the feet.
  collar: number
  sprite: ReactNode
}

// A spot on the page, stored relative to the element it sits on (or the
// floor when there is none) so it follows the page as it scrolls.
interface Anchor {
  el: Element | null
  offset: number
}

interface Critter {
  spec: CritterSpec
  el: HTMLDivElement
  leash: SVGPathElement | null
  post: SVGRectElement | null
  // Where the critter is tied up while leashed.
  tether: Anchor | null
  x: number // horizontal centre, viewport px
  y: number // feet, viewport px
  vx: number
  vy: number
  grounded: boolean
  platform: Element | null
  // Platform the critter is dropping through, ignored until it is clear.
  dropping: Element | null
  facing: 1 | -1
  // Jumps left before landing again; keyboard control gets a double jump.
  airJumps: number
  pose: Pose
  nextActionAt: number
  growth: number
  grownUntil: number
  frozenUntil: number
}

interface Mushroom {
  node: HTMLDivElement
  anchor: Anchor
  bornAt: number
  x: number
  y: number
  visible: boolean
}

interface Platform {
  el: Element
  top: number
  left: number
  right: number
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

// Restart a one-shot CSS animation keyed off a data attribute.
function replay(el: HTMLElement, attribute: string, value = "") {
  delete el.dataset[attribute]
  void el.offsetWidth
  el.dataset[attribute] = value
}

export function PartyMode() {
  const settings = usePartySettings()
  if (!settings.enabled) return null
  return <PartyCritters settings={settings} />
}

interface PartyCrittersProps {
  settings: PartySettings
  // Keep the critters inside this element instead of the whole window, and
  // size them to it. Used by the infoskjerm.
  stage?: string
  // "rare": one every few minutes. "once": a single one shortly after the
  // critters appear. "off": none.
  mushrooms?: "rare" | "once" | "off"
}

export function PartyCritters({
  settings,
  stage,
  mushrooms: mushroomMode = "rare",
}: PartyCrittersProps) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const leashRefs = useRef<(SVGPathElement | null)[]>([])
  const postRefs = useRef<(SVGRectElement | null)[]>([])
  const mushroomLayerRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    const stageEl = stage ? document.querySelector(stage) : null
    // On a big screen everything is drawn and moves proportionally larger.
    const k = stageEl ? Math.min(3, Math.max(1, stageEl.clientWidth / 420)) : 1
    const gravity = GRAVITY * k

    const bounds = () =>
      stageEl?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        width: window.innerWidth,
      }
    const floor = () => bounds().bottom

    const critters: Critter[] = CRITTERS.flatMap((spec, index) => {
      const el = refs.current[index]
      if (!el) return []
      const { left, width, top } = bounds()
      el.style.setProperty("--party-base", String(k))
      el.style.setProperty("--party-scale", String(k))
      return [
        {
          spec,
          el,
          leash: leashRefs.current[index] ?? null,
          post: postRefs.current[index] ?? null,
          tether: null,
          x: left + width * (index === 0 ? 0.25 : 0.75),
          y: top - spec.height * k,
          vx: 0,
          vy: 0,
          grounded: false,
          platform: null,
          dropping: null,
          facing: index === 0 ? 1 : -1,
          airJumps: 0,
          pose: "air",
          nextActionAt: 0,
          growth: 1,
          grownUntil: 0,
          frozenUntil: 0,
        },
      ]
    })

    const size = (critter: Critter) => k * critter.growth
    const halfWidthOf = (critter: Critter) =>
      (critter.spec.width * size(critter)) / 2
    const heightOf = (critter: Critter) => critter.spec.height * size(critter)

    let candidates: Element[] = []
    let candidatesAt = 0
    let platforms: Platform[] = []
    // Ledges above this are hidden: behind the sticky navbar on the site, or
    // outside the stage.
    let ceiling = 24
    const keys = new Set<string>()
    let jumpQueued = false
    let dropQueued = false
    const mushrooms: Mushroom[] = []
    let nextMushroomAt =
      mushroomMode === "off"
        ? Number.POSITIVE_INFINITY
        : performance.now() +
          (mushroomMode === "once"
            ? random(10_000, 30_000)
            : random(30_000, 90_000))

    const collectPlatforms = (now: number) => {
      if (now - candidatesAt > 1500) {
        candidates = Array.from(
          (stageEl ?? document).querySelectorAll(PLATFORM_SELECTOR),
        )
        candidatesAt = now
      }
      const area = bounds()
      // On a stage, leave headroom so a critter on the top ledge stays inside.
      ceiling = stageEl
        ? area.top + 60 * k
        : Math.max(
            24,
            document.querySelector("header")?.getBoundingClientRect().bottom ??
              0,
          )
      // The site's navbar is excluded; it sits on top of the critters.
      const excluded = stageEl
        ? "[data-party-critter]"
        : "header, [data-party-critter]"
      platforms = []
      for (const el of candidates) {
        if (el.closest(excluded)) continue
        const rect = el.getBoundingClientRect()
        if (rect.width < MIN_PLATFORM_WIDTH * k || rect.height < 8) continue
        if (rect.top < ceiling || rect.top > area.bottom - 8) continue
        platforms.push({
          el,
          top: rect.top,
          left: Math.max(rect.left, area.left),
          right: Math.min(rect.right, area.right),
        })
      }
    }

    const anchorPosition = ({ el, offset }: Anchor) => {
      if (!el) return { x: bounds().left + offset, y: floor() }
      const rect = el.getBoundingClientRect()
      return { x: rect.left + offset, y: rect.top }
    }

    const anchorAt = (el: Element | null, x: number): Anchor => ({
      el,
      offset: x - (el?.getBoundingClientRect().left ?? bounds().left),
    })

    const leave = (critter: Critter) => {
      critter.grounded = false
      critter.platform = null
    }

    // Ledges a wandering critter will try to jump up to: anything not too
    // far above it, within a short hop sideways.
    const climbable = (critter: Critter) =>
      platforms.filter(p => {
        const gap = Math.max(p.left - critter.x, critter.x - p.right, 0)
        return (
          p.el !== critter.platform &&
          p.top < critter.y - 20 * k &&
          p.top > critter.y - MAX_CLIMB * k &&
          gap < 240 * k
        )
      })

    const jump = (critter: Critter) => {
      const { spec } = critter
      const reachable = climbable(critter)

      leave(critter)

      // Prefer the closer ledges, so climbing looks like hopping step by step.
      const target =
        reachable.length > 0 && Math.random() < 0.85
          ? reachable
              .map(p => ({ p, score: critter.y - p.top + random(0, 120 * k) }))
              .reduce((best, next) => (next.score < best.score ? next : best)).p
          : null

      if (!target) {
        critter.vy = -random(...spec.jumpSpeed) * k
        critter.vx = critter.facing * random(40, 90) * k
        return
      }

      // Aim for a spot on the target's top edge: overshoot the ledge a bit so
      // the critter lands on it on the way down.
      const rise = critter.y - target.top + random(20, 40) * k
      const vy = -Math.sqrt(2 * gravity * rise)
      const drop = target.top - critter.y
      const flight = (-vy + Math.sqrt(vy * vy + 2 * gravity * drop)) / gravity
      const inset = Math.min(20 * k, (target.right - target.left) / 3)
      const nearest = Math.min(
        Math.max(critter.x, target.left + inset),
        target.right - inset,
      )
      const targetX = nearest + random(-30, 30) * k
      const maxVx = 260 * k

      critter.vy = vy
      critter.vx = Math.max(
        -maxVx,
        Math.min(maxVx, (targetX - critter.x) / flight),
      )
    }

    const wander = (critter: Critter, now: number) => {
      if (now < critter.nextActionAt) return
      // Down on the floor they get restless and look for a way up.
      const onFloor = critter.platform === null
      const canClimb = climbable(critter).length > 0
      const jumpChance = onFloor ? 0.5 : canClimb ? 0.35 : 0.06
      const roll = Math.random()
      if (roll < jumpChance) {
        jump(critter)
      } else if (roll < jumpChance + 0.3) {
        critter.vx = 0
      } else {
        if (Math.random() < 0.4) critter.facing = critter.facing === 1 ? -1 : 1
        critter.vx = critter.facing * random(...critter.spec.walkSpeed) * k
      }
      critter.nextActionAt =
        now + (onFloor ? random(800, 2500) : random(1500, 4500))
    }

    // Tie the critter to a post just behind where it is standing.
    const tieUp = (critter: Critter) => {
      const postX = critter.x - critter.facing * (halfWidthOf(critter) + 6 * k)
      critter.tether = anchorAt(critter.platform, postX)
      critter.vx = 0
    }

    const steer = (critter: Critter) => {
      const direction = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0)
      if (critter.grounded) {
        critter.vx = direction * CONTROL_SPEED * k
        if (jumpQueued) {
          leave(critter)
          critter.vy = -CONTROL_JUMP * k
        } else if (dropQueued && critter.platform) {
          critter.dropping = critter.platform
          leave(critter)
          critter.vy = 60 * k
        }
      } else {
        if (direction !== 0) critter.vx = direction * CONTROL_SPEED * k
        if (jumpQueued && critter.airJumps > 0) {
          critter.airJumps -= 1
          critter.vy = -DOUBLE_JUMP * k
          replay(critter.el, "flip")
        }
      }
      jumpQueued = false
      dropQueued = false
    }

    // A taut leash keeps the critter within reach of its post.
    const restrain = (critter: Critter, post: { x: number; y: number }) => {
      const leashLength = LEASH_LENGTH * k
      const anchorY = post.y - POST_HEIGHT * k
      const collarOffset = heightOf(critter) * critter.spec.collar
      const dx = critter.x - post.x
      const dy = critter.y - collarOffset - anchorY
      const dist = Math.hypot(dx, dy)
      if (dist <= leashLength) return

      const ux = dx / dist
      const uy = dy / dist
      const nextY = anchorY + uy * leashLength + collarOffset
      critter.x = post.x + ux * leashLength
      if (critter.grounded && nextY < critter.y - 0.5) leave(critter)
      if (!critter.grounded) critter.y = Math.min(nextY, floor())

      const outward = critter.vx * ux + critter.vy * uy
      if (outward > 0) {
        critter.vx -= outward * ux
        critter.vy -= outward * uy
      }
    }

    const resize = (critter: Critter, growth: number, now: number) => {
      critter.growth = growth
      critter.frozenUntil = now + GROW_FREEZE
      critter.vx = 0
      critter.el.style.setProperty("--party-scale", String(size(critter)))
      replay(critter.el, "grow", growth > 1 ? "up" : "down")
    }

    const step = (critter: Critter, dt: number, now: number) => {
      const halfWidth = halfWidthOf(critter)
      const area = bounds()
      const { control, leash } = settingsRef.current
      const controlled = control === critter.spec.name
      const frozen = now < critter.frozenUntil

      if (!leash) critter.tether = null
      else if (!critter.tether && critter.grounded) tieUp(critter)
      const tied = critter.tether !== null

      if (critter.growth > 1 && now > critter.grownUntil && critter.grounded) {
        resize(critter, 1, now)
      }

      if (frozen) critter.vx = 0
      else if (controlled) steer(critter)
      else if (tied && critter.grounded) critter.vx = 0
      else if (critter.grounded) wander(critter, now)

      if (critter.grounded) {
        critter.x += critter.vx * dt

        if (critter.platform) {
          const rect = critter.platform.getBoundingClientRect()
          // A tied-up critter stays put, even as its ledge scrolls away.
          const scrolledAway =
            !tied && (rect.top < ceiling || rect.top > area.bottom)
          const walkedOff = critter.x < rect.left || critter.x > rect.right
          // Wandering critters usually turn back at the edge rather than
          // stepping off, so they keep the height they have climbed.
          if (walkedOff && !controlled && Math.random() < 0.8) {
            critter.x = Math.min(Math.max(critter.x, rect.left), rect.right)
            critter.vx = -critter.vx
            critter.y = rect.top
          } else if (
            !critter.platform.isConnected ||
            scrolledAway ||
            walkedOff
          ) {
            leave(critter)
            critter.vy = 0
          } else {
            critter.y = rect.top
          }
        } else {
          critter.y = area.bottom
        }
      } else {
        const previousY = critter.y
        const floaty = controlled && critter.vy < 0 && keys.has("jump")
        critter.vy += gravity * (floaty ? HELD_JUMP_GRAVITY : 1) * dt
        critter.x += critter.vx * dt
        critter.y += critter.vy * dt

        if (critter.dropping) {
          const rect = critter.dropping.getBoundingClientRect()
          if (critter.y - heightOf(critter) > rect.top) critter.dropping = null
        }

        if (critter.vy > 0) {
          const landing = platforms.find(
            p =>
              p.el !== critter.dropping &&
              p.top >= previousY &&
              p.top <= critter.y &&
              critter.x > p.left + 4 &&
              critter.x < p.right - 4,
          )
          if (landing) {
            critter.y = landing.top
            critter.platform = landing.el
          } else if (critter.y >= area.bottom) {
            critter.y = area.bottom
            critter.platform = null
          }
          if (landing || critter.y >= area.bottom) {
            critter.grounded = true
            critter.airJumps = 1
            critter.vy = 0
            critter.vx = controlled
              ? critter.vx
              : critter.facing * random(...critter.spec.walkSpeed) * k
            critter.nextActionAt = now + random(300, 1500)
          }
        }
      }

      const post = critter.tether ? anchorPosition(critter.tether) : null
      if (post) restrain(critter, post)

      // Keep them on stage: bounce off the side walls.
      if (critter.x < area.left + halfWidth) {
        critter.x = area.left + halfWidth
        critter.vx = Math.abs(critter.vx)
      } else if (critter.x > area.right - halfWidth) {
        critter.x = area.right - halfWidth
        critter.vx = -Math.abs(critter.vx)
      }
      if (critter.vx !== 0) critter.facing = critter.vx > 0 ? 1 : -1

      if (critter.grounded && !frozen) eatMushrooms(critter, now)

      const pose: Pose = !critter.grounded
        ? "air"
        : critter.vx === 0
          ? "idle"
          : "walk"
      if (pose !== critter.pose) {
        critter.pose = pose
        critter.el.dataset.pose = pose
      }

      // The element keeps its unscaled size; CSS scales the sprite up from
      // its feet, so position by the unscaled box.
      critter.el.style.transform = `translate3d(${
        critter.x - critter.spec.width / 2
      }px, ${critter.y - critter.spec.height}px, 0)`
      critter.el.dataset.facing = critter.facing === 1 ? "right" : "left"
      critter.el.dataset.controlled = String(controlled)
      drawLeash(critter, post)
    }

    const drawLeash = (
      critter: Critter,
      post: { x: number; y: number } | null,
    ) => {
      if (!critter.leash || !critter.post) return
      if (!post) {
        critter.leash.setAttribute("d", "")
        critter.post.style.display = "none"
        return
      }
      const postHeight = POST_HEIGHT * k
      critter.post.style.display = ""
      critter.post.setAttribute("x", String(post.x - 2 * k))
      critter.post.setAttribute("y", String(post.y - postHeight))
      critter.post.setAttribute("width", String(4 * k))
      critter.post.setAttribute("height", String(postHeight))

      const anchorY = post.y - postHeight + 3 * k
      const collarX = critter.x + critter.facing * halfWidthOf(critter) * 0.3
      const collarY = critter.y - heightOf(critter) * critter.spec.collar
      const dist = Math.hypot(collarX - post.x, collarY - anchorY)
      const sag = Math.max(0, LEASH_LENGTH * k - dist) * 0.5
      const midX = (collarX + post.x) / 2
      const midY = (collarY + anchorY) / 2 + sag
      critter.leash.setAttribute(
        "d",
        `M${post.x} ${anchorY} Q${midX} ${midY} ${collarX} ${collarY}`,
      )
    }

    // A mushroom sprouts now and then, often just ahead of a critter so it
    // has a fair chance of walking into it.
    const spawnMushroom = () => {
      const layer = mushroomLayerRef.current
      if (!layer) return
      const area = bounds()
      const margin = MUSHROOM_WIDTH * k
      const walker = critters.find(c => c.grounded && !c.tether)
      let anchor: Anchor
      if (walker && (mushroomMode === "once" || Math.random() < 0.7)) {
        const rect = walker.platform?.getBoundingClientRect()
        const left = (rect?.left ?? area.left) + margin
        const right = (rect?.right ?? area.right) - margin
        const ahead = walker.x + walker.facing * random(60, 160) * k
        if (right <= left) return
        anchor = anchorAt(
          walker.platform,
          Math.min(Math.max(ahead, left), right),
        )
      } else {
        const wide = platforms.filter(p => p.right - p.left > margin * 3)
        const spot = wide[Math.floor(Math.random() * wide.length)]
        anchor = spot
          ? anchorAt(spot.el, random(spot.left + margin, spot.right - margin))
          : anchorAt(null, random(area.left + margin, area.right - margin))
      }

      const node = document.createElement("div")
      node.className = "party-mushroom"
      node.style.width = `${MUSHROOM_WIDTH * k}px`
      node.style.height = `${MUSHROOM_HEIGHT * k}px`
      node.innerHTML = MUSHROOM_SVG
      layer.append(node)
      mushrooms.push({
        node,
        anchor,
        bornAt: performance.now(),
        x: 0,
        y: 0,
        visible: false,
      })
    }

    const removeMushroom = (mushroom: Mushroom) => {
      mushrooms.splice(mushrooms.indexOf(mushroom), 1)
      mushroom.node.dataset.leaving = ""
      window.setTimeout(() => mushroom.node.remove(), 300)
    }

    const updateMushrooms = (now: number) => {
      if (now >= nextMushroomAt) {
        if (mushrooms.length < MAX_MUSHROOMS) spawnMushroom()
        nextMushroomAt =
          mushroomMode === "once"
            ? Number.POSITIVE_INFINITY
            : now + random(...MUSHROOM_INTERVAL)
      }
      const area = bounds()
      for (const mushroom of [...mushrooms]) {
        const { el } = mushroom.anchor
        if (
          now - mushroom.bornAt > MUSHROOM_LIFETIME ||
          el?.isConnected === false
        ) {
          removeMushroom(mushroom)
          continue
        }
        const { x, y } = anchorPosition(mushroom.anchor)
        mushroom.x = x
        mushroom.y = y
        mushroom.visible = y >= ceiling && y <= area.bottom
        mushroom.node.style.display = mushroom.visible ? "" : "none"
        mushroom.node.style.transform = `translate3d(${
          x - (MUSHROOM_WIDTH * k) / 2
        }px, ${y - MUSHROOM_HEIGHT * k}px, 0)`
      }
    }

    const eatMushrooms = (critter: Critter, now: number) => {
      const reach = halfWidthOf(critter) * 0.6 + (MUSHROOM_WIDTH * k) / 2
      const mushroom = mushrooms.find(
        m =>
          m.visible &&
          Math.abs(m.x - critter.x) < reach &&
          Math.abs(m.y - critter.y) < 6 * k,
      )
      if (!mushroom) return
      removeMushroom(mushroom)
      critter.grownUntil = now + GROWN_DURATION
      if (critter.growth === 1) resize(critter, GROWN_SCALE, now)
    }

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      collectPlatforms(now)
      updateMushrooms(now)
      for (const critter of critters) step(critter, dt, now)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const keyFor = (key: string) => {
      if (LEFT_KEYS.has(key)) return "left"
      if (RIGHT_KEYS.has(key)) return "right"
      if (JUMP_KEYS.has(key)) return "jump"
      if (DROP_KEYS.has(key)) return "drop"
      return null
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!settingsRef.current.control) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const action = keyFor(event.key)
      if (!action) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(KEY_OWNER_SELECTOR)) return
      if (action === "jump" && event.key === " ") {
        if (target?.closest(PRESSABLE_SELECTOR)) return
      }

      event.preventDefault()
      if (event.repeat) return
      if (action === "jump") {
        jumpQueued = true
        keys.add("jump")
      } else if (action === "drop") dropQueued = true
      else keys.add(action)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const action = keyFor(event.key)
      if (action === "left" || action === "right" || action === "jump") {
        keys.delete(action)
      }
    }

    const onBlur = () => keys.clear()

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)

    // Poke a critter to make it hop; a tied-up one just hops on the spot.
    const cleanups = critters.map(critter => {
      const onPoke = () => {
        if (performance.now() < critter.frozenUntil) return
        if (critter.tether) {
          if (!critter.grounded) return
          leave(critter)
          critter.vy = -random(...critter.spec.jumpSpeed) * 0.7 * k
          critter.vx = 0
          return
        }
        critter.facing = Math.random() < 0.5 ? 1 : -1
        jump(critter)
      }
      critter.el.addEventListener("pointerdown", onPoke)
      return () => critter.el.removeEventListener("pointerdown", onPoke)
    })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
      for (const cleanup of cleanups) cleanup()
      for (const mushroom of mushrooms) mushroom.node.remove()
    }
  }, [stage, mushroomMode])

  return (
    <div aria-hidden className="party-critters">
      <svg aria-hidden className="party-leashes">
        {CRITTERS.map((critter, index) => (
          <g key={critter.name}>
            <rect
              className="party-post"
              ref={el => {
                postRefs.current[index] = el
              }}
              rx="1.5"
              style={{ display: "none" }}
            />
            <path
              className="party-leash"
              ref={el => {
                leashRefs.current[index] = el
              }}
            />
          </g>
        ))}
      </svg>
      <div ref={mushroomLayerRef} />
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

// Fluesopp: red cap with white spots on a white stem. Static markup, so it is
// set as a string on the imperatively created mushroom nodes.
const MUSHROOM_SVG = `<svg aria-hidden="true" viewBox="0 0 20 22" width="100%" height="100%">
<path d="M7.5 10 L7 20 Q7 21.5 10 21.5 Q13 21.5 13 20 L12.5 10 Z" fill="#fdfaf3" stroke="#3d2614" stroke-width="0.8"/>
<path d="M7.6 14.5 Q10 16 12.4 14.5" fill="none" stroke="#3d2614" stroke-width="0.6"/>
<path d="M1 11.5 Q1 2 10 1.5 Q19 2 19 11.5 Q10 13.5 1 11.5 Z" fill="#e2231a" stroke="#3d2614" stroke-width="0.8"/>
<circle cx="6" cy="6.5" r="1.6" fill="#fff"/>
<circle cx="11.5" cy="4.5" r="1.3" fill="#fff"/>
<circle cx="14.8" cy="8.5" r="1.5" fill="#fff"/>
<circle cx="9.5" cy="9.3" r="1.1" fill="#fff"/>
<circle cx="3.6" cy="10" r="0.8" fill="#fff"/>
</svg>`

function Penguin() {
  return (
    <svg aria-hidden className="size-full overflow-visible" viewBox="0 0 48 56">
      <g className="party-legs">
        <ellipse
          className="party-step-a"
          cx="18"
          cy="53.5"
          fill="#f59e0b"
          rx="5.5"
          ry="2.5"
        />
        <ellipse
          className="party-step-b"
          cx="30"
          cy="53.5"
          fill="#e08e0b"
          rx="5.5"
          ry="2.5"
        />
      </g>
      <g className="party-torso">
        <path
          className="party-wing party-wing-back"
          d="M10 26 Q2 38 6 46 Q12 40 13 30 Z"
          fill="#1f2433"
        />
        <ellipse cx="24" cy="30" fill="#1f2433" rx="15" ry="22" />
        <ellipse cx="25" cy="35" fill="#fdfaf3" rx="10" ry="15" />
        <ellipse cx="27" cy="18" fill="#fdfaf3" rx="8" ry="7" />
        <circle cx="30" cy="16" fill="#1f2433" r="2.2" />
        <circle cx="30.7" cy="15.3" fill="#fff" r="0.7" />
        <path d="M34 19 L43 21.5 L34 24 Z" fill="#f59e0b" />
        <circle cx="33" cy="24" fill="#f9a8b8" opacity="0.7" r="2" />
        <path
          className="party-wing party-wing-front"
          d="M30 27 Q40 37 36 46 Q30 40 28 31 Z"
          fill="#2c3346"
        />
        <path
          d="M14 8 L19 0 L22 8 Z"
          fill="#eb3b3b"
          stroke="#1f2433"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="0.5" fill="#f59e0b" r="1.8" />
      </g>
    </svg>
  )
}

function Hedgehog() {
  return (
    <svg aria-hidden className="size-full overflow-visible" viewBox="0 0 56 44">
      <g className="party-legs" fill="#5b3a21">
        <rect
          className="party-step-a"
          height="8"
          rx="2"
          width="5"
          x="11"
          y="35"
        />
        <rect
          className="party-step-b"
          height="8"
          rx="2"
          width="5"
          x="18"
          y="35"
        />
        <rect
          className="party-step-b"
          height="8"
          rx="2"
          width="5"
          x="31"
          y="35"
        />
        <rect
          className="party-step-a"
          height="8"
          rx="2"
          width="5"
          x="38"
          y="35"
        />
      </g>
      <g className="party-torso">
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
      </g>
    </svg>
  )
}

const CRITTERS: CritterSpec[] = [
  {
    name: "pingvin",
    width: 30,
    height: 35,
    walkSpeed: [14, 22],
    jumpSpeed: [380, 480],
    collar: 0.6,
    sprite: <Penguin />,
  },
  {
    name: "pinnsvin",
    width: 36,
    height: 28,
    walkSpeed: [18, 30],
    jumpSpeed: [400, 520],
    collar: 0.45,
    sprite: <Hedgehog />,
  },
]
