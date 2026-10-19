// Pure game rules for the infoscreen Subway Surfers. Distances are in "rows":
// an obstacle at z <= 0 has reached the runner.
export type ObstacleKind = "barrier" | "low" | "train"

export interface Obstacle {
  id: number
  lane: number
  z: number
  kind: ObstacleKind
  // Rows the obstacle spans from `z` away from the runner; trains are long.
  len: number
}

export interface Coin {
  id: number
  lane: number
  z: number
}

export interface SubwayState {
  lane: number
  facing: "left" | "right"
  y: number
  // Height of the surface under the runner: 0, or a tram roof.
  floor: number
  vy: number
  jumps: number
  slide: number
  distance: number
  coins: number
  obstacles: Obstacle[]
  pickups: Coin[]
  dead: boolean
  nextSpawn: number
  nextId: number
}

export interface SubwayControls {
  left: boolean
  right: boolean
  jump: boolean
  drop: boolean
}

export const LANES = 3
export const SPAWN_Z = 50
const GRAVITY = 28
const JUMP_SPEED = 11.5
const DOUBLE_JUMP_SPEED = 11
const SLIDE_SECONDS = 0.7
const COIN_SCORE = 10
// Roof height of a Bybanen; only a double jump reaches it.
export const TRAIN_TOP = 2.8
const ROOF_CLEARANCE = 0.2
const BARRIER_CLEARANCE = 1.2

export const speedAt = (distance: number) => Math.min(14, 7 + distance / 120)
export const scoreOf = (s: SubwayState) =>
  Math.floor(s.distance) + s.coins * COIN_SCORE

export function newGame(): SubwayState {
  return {
    lane: 1,
    facing: "right",
    y: 0,
    floor: 0,
    vy: 0,
    jumps: 0,
    slide: 0,
    distance: 0,
    coins: 0,
    obstacles: [],
    pickups: [],
    dead: false,
    nextSpawn: 20,
    nextId: 1,
  }
}

const overlaps = (o: Obstacle) => o.z <= 0.4 && o.z + o.len > -0.6

// Controls are one-shot presses; the caller derives them from held keys.
export function step(
  state: SubwayState,
  controls: SubwayControls,
  dt: number,
  random: () => number = Math.random,
): SubwayState {
  if (state.dead) return state
  let { lane, facing, y, vy, jumps, slide, nextSpawn, nextId, coins } = state
  if (controls.left && lane > 0) {
    lane -= 1
    facing = "left"
  }
  if (controls.right && lane < LANES - 1) {
    lane += 1
    facing = "right"
  }

  const advance = speedAt(state.distance) * dt
  const distance = state.distance + advance
  let obstacles = state.obstacles
    .map(o => ({ ...o, z: o.z - advance }))
    .filter(o => o.z + o.len > -2)

  // A train under the runner is a floor to land on, if they got high enough.
  const roof = obstacles.some(
    o => o.kind === "train" && o.lane === lane && overlaps(o),
  )
    ? TRAIN_TOP
    : 0
  const grounded = y <= roof + 0.001
  if (controls.jump) {
    if (grounded) {
      vy = JUMP_SPEED
      jumps = 1
    } else if (jumps < 2) {
      vy = DOUBLE_JUMP_SPEED
      jumps = 2
    }
  }
  if (controls.drop) {
    slide = SLIDE_SECONDS
    if (!grounded) vy = -JUMP_SPEED * 2
  }
  vy -= GRAVITY * dt
  y += vy * dt
  if (y <= roof) {
    // Only land on a roof from above; from below the train front kills.
    if (roof === 0 || state.y >= TRAIN_TOP - ROOF_CLEARANCE) {
      y = roof
      vy = 0
      jumps = 0
    }
  }
  slide = Math.max(0, slide - dt)

  let pickups = state.pickups
    .map(c => ({ ...c, z: c.z - advance }))
    .filter(c => {
      if (c.lane === lane && Math.abs(c.z) < 0.6 && y < 4) {
        coins += 1
        return false
      }
      return c.z > -2
    })
  nextSpawn -= advance
  if (nextSpawn <= 0) {
    const kinds: ObstacleKind[] = ["barrier", "low", "train"]
    const free = Math.floor(random() * LANES)
    // Keep one lane clear so every row can be survived.
    let rowLen = 1
    for (let l = 0; l < LANES; l++) {
      if (l === free) {
        for (let i = 0; i < 4; i++)
          pickups = [
            ...pickups,
            { id: nextId++, lane: l, z: SPAWN_Z + i * 1.5 },
          ]
      } else if (random() < 0.7) {
        const kind = kinds[Math.floor(random() * kinds.length)]
        const len = kind === "train" ? 10 + random() * 8 : 1
        rowLen = Math.max(rowLen, len)
        obstacles = [
          ...obstacles,
          { id: nextId++, lane: l, z: SPAWN_Z, kind, len },
        ]
      }
    }
    // Wait for the longest train to clear before the next row appears.
    nextSpawn = rowLen + 6 + random() * 5
  }

  const dead = obstacles.some(
    o =>
      o.lane === lane &&
      overlaps(o) &&
      ((o.kind === "train" && y < TRAIN_TOP - ROOF_CLEARANCE) ||
        (o.kind === "barrier" && y < BARRIER_CLEARANCE) ||
        (o.kind === "low" && slide === 0 && y < 2)),
  )
  return {
    lane,
    facing,
    y,
    floor: roof,
    vy,
    jumps,
    slide,
    distance,
    coins,
    obstacles,
    pickups,
    dead,
    nextSpawn,
    nextId,
  }
}
