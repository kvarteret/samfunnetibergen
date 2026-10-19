// Turns body position from the phone camera into the same actions the touch
// buttons send. Distances are in shoulder widths, so they don't depend on how
// far the player stands from the phone.
export interface Pose {
  x: number
  y: number
  scale: number
}

export interface Gestures {
  side: -1 | 0 | 1
  jump: boolean
  duck: boolean
}

export const NO_GESTURES: Gestures = { side: 0, jump: false, duck: false }

interface Landmark {
  x: number
  y: number
  visibility?: number
}

// MediaPipe pose indices 11 and 12 are the shoulders.
export function poseFromLandmarks(landmarks: Landmark[] | undefined) {
  const left = landmarks?.[11]
  const right = landmarks?.[12]
  if (!left || !right) return null
  if ((left.visibility ?? 1) < 0.5 || (right.visibility ?? 1) < 0.5) return null
  const scale = Math.hypot(left.x - right.x, left.y - right.y)
  if (scale < 0.05) return null
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2, scale }
}

export function averagePose(poses: Pose[]): Pose | null {
  if (poses.length === 0) return null
  const mean = (key: keyof Pose) =>
    poses.reduce((sum, pose) => sum + pose[key], 0) / poses.length
  return { x: mean("x"), y: mean("y"), scale: mean("scale") }
}

export const SIDE_ON = 0.6
const SIDE_OFF = 0.3
export const VERTICAL_ON = 0.4
const VERTICAL_OFF = 0.2

// Higher "on" than "off" thresholds keep a wobbling body from flickering.
export function readGestures(pose: Pose, base: Pose, prev: Gestures): Gestures {
  // The front camera is not mirrored: stepping to your right moves left in the image.
  const right = (base.x - pose.x) / base.scale
  const up = (base.y - pose.y) / base.scale
  let side = prev.side
  if (right > SIDE_ON) side = 1
  else if (right < -SIDE_ON) side = -1
  else if (Math.abs(right) < SIDE_OFF) side = 0
  return {
    side,
    jump: prev.jump ? up > VERTICAL_OFF : up > VERTICAL_ON,
    duck: prev.duck ? up < -VERTICAL_OFF : up < -VERTICAL_ON,
  }
}
