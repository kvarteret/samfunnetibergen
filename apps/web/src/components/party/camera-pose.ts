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

export const SIDE_ON = 0.35
const SIDE_OFF = 0.18
export const VERTICAL_ON = 0.25
const VERTICAL_OFF = 0.12

export interface View {
  zoom: number
  panX: number
  panY: number
}

export const DEFAULT_VIEW: View = { zoom: 1, panX: 0.5, panY: 0.5 }

// Source rectangle of the video the model sees. panX is in mirrored (preview)
// space, so dragging right moves the window right on screen.
export function cropRect(vw: number, vh: number, view: View) {
  const sw = vw / view.zoom
  const sh = vh / view.zoom
  return {
    sx: (1 - view.panX) * (vw - sw),
    sy: view.panY * (vh - sh),
    sw,
    sh,
  }
}

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
