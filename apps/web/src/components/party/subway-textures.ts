import * as THREE from "three"

function canvas(w: number, h: number) {
  const el = document.createElement("canvas")
  el.width = w
  el.height = h
  const ctx = el.getContext("2d")
  if (!ctx) throw new Error("2d canvas unavailable")
  return { el, ctx }
}

function texture(el: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 1
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const ORANGE = "#e8522a"

// Bybanen head-on: orange cap, big dark windscreen, grey skirt, headlights.
export function trainFront() {
  const { el, ctx } = canvas(256, 384)
  ctx.fillStyle = "#e5e7eb"
  ctx.fillRect(0, 0, 256, 384)
  const cap = ctx.createLinearGradient(0, 0, 0, 384)
  cap.addColorStop(0, "#f26a3d")
  cap.addColorStop(1, "#c93d17")
  ctx.fillStyle = cap
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 300, [40, 40, 0, 0])
  ctx.fill()
  ctx.fillStyle = "#cbd5e1"
  ctx.fillRect(0, 300, 256, 84)
  ctx.fillStyle = "#0b1220"
  ctx.beginPath()
  ctx.roundRect(22, 44, 212, 150, 26)
  ctx.fill()
  const glass = ctx.createLinearGradient(0, 44, 256, 194)
  glass.addColorStop(0, "rgba(148,163,184,0.5)")
  glass.addColorStop(0.5, "rgba(148,163,184,0)")
  ctx.fillStyle = glass
  ctx.fill()
  ctx.fillStyle = "#111827"
  ctx.fillRect(66, 12, 124, 24)
  ctx.fillStyle = "#fbbf24"
  ctx.font = "bold 18px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("LAGUNEN", 128, 30)
  ctx.fillStyle = "#fff"
  ctx.font = "bold 22px sans-serif"
  ctx.fillText("bybanen", 128, 232)
  for (const x of [38, 218]) {
    ctx.fillStyle = "#fef9c3"
    ctx.beginPath()
    ctx.arc(x, 270, 12, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = "#475569"
  ctx.fillRect(0, 340, 256, 44)
  return texture(el)
}

// One car's worth of side: windows, doors, grey skirt. Tiled along the length.
export function trainSide() {
  const { el, ctx } = canvas(512, 128)
  ctx.fillStyle = "#f1f5f9"
  ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = "#94a3b8"
  ctx.fillRect(0, 96, 512, 32)
  ctx.fillStyle = ORANGE
  ctx.fillRect(0, 88, 512, 6)
  ctx.fillStyle = "#0b1220"
  for (const x of [14, 144, 274, 404]) {
    ctx.beginPath()
    ctx.roundRect(x, 18, x === 144 ? 100 : 118, 56, 6)
    ctx.fill()
  }
  // A glazed door between the windows, framed in white.
  ctx.fillStyle = "#e2e8f0"
  ctx.fillRect(254, 12, 4, 80)
  ctx.fillRect(262, 12, 4, 80)
  const t = texture(el, true)
  return t
}

export function wallBoards(color: string) {
  const { el, ctx } = canvas(128, 128)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 128, 128)
  // Bryggen is clad in horizontal weatherboard.
  for (let y = 0; y < 128; y += 12) {
    ctx.fillStyle = "rgba(0,0,0,0.18)"
    ctx.fillRect(0, y, 128, 2)
    ctx.fillStyle = "rgba(255,255,255,0.07)"
    ctx.fillRect(0, y + 2, 128, 2)
  }
  const t = texture(el, true)
  t.repeat.set(2, 3)
  return t
}

// Bryggen gable, drawn at 2x: horizontal boards, white-framed paned windows
// with shutters, loft doors and a warehouse door. The area outside the gable
// stays transparent. 3.4 wide by 9 tall.
export function facade(wall: string, double: boolean, seed: number) {
  const W = 256
  const H = 680
  const { el, ctx } = canvas(W * 2, H * 2)
  ctx.scale(2, 2)
  // Eaves sit at 6 of the 9 world units, matching the box behind.
  const eaves = 227
  const shutter = ["#1f4d3a", "#7f1d1d", "#1e3a5f"][seed % 3]
  const outline = () => {
    ctx.beginPath()
    if (double) {
      ctx.moveTo(0, eaves)
      ctx.lineTo(64, 20)
      ctx.lineTo(128, eaves - 50)
      ctx.lineTo(192, 20)
      ctx.lineTo(W, eaves)
    } else {
      ctx.moveTo(0, eaves)
      ctx.lineTo(128, 4)
      ctx.lineTo(W, eaves)
    }
  }
  ctx.fillStyle = wall
  outline()
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.closePath()
  ctx.fill()
  ctx.save()
  ctx.clip()
  for (let y = 10; y < H; y += 9) {
    ctx.fillStyle = "rgba(0,0,0,0.16)"
    ctx.fillRect(0, y, W, 1.6)
    ctx.fillStyle = "rgba(255,255,255,0.08)"
    ctx.fillRect(0, y + 1.6, W, 1.6)
  }
  const wear = ctx.createLinearGradient(0, 0, 0, H)
  wear.addColorStop(0, "rgba(255,255,255,0.08)")
  wear.addColorStop(1, "rgba(0,0,0,0.22)")
  ctx.fillStyle = wear
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
  ctx.strokeStyle = "#f8fafc"
  ctx.lineWidth = 9
  ctx.lineJoin = "round"
  outline()
  ctx.stroke()
  ctx.fillStyle = "#292524"
  for (const x of double ? [34, 170] : [100]) {
    ctx.fillRect(x, 96, 54, 76)
    ctx.fillStyle = "#57534e"
    ctx.fillRect(x + 26, 96, 3, 76)
    ctx.fillStyle = "#292524"
  }
  ctx.fillStyle = "#f8fafc"
  ctx.fillRect(0, eaves - 4, W, 12)

  const pane = (x: number, y: number, w: number, h: number, lit: boolean) => {
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(x - 5, y - 5, w + 10, h + 10)
    ctx.fillStyle = lit ? "#f2cf72" : "#1e293b"
    ctx.fillRect(x, y, w, h)
    const g = ctx.createLinearGradient(x, y, x + w, y + h)
    g.addColorStop(0, "rgba(255,255,255,0.35)")
    g.addColorStop(0.5, "rgba(255,255,255,0)")
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(x + w / 2 - 1.5, y, 3, h)
    for (const f of [1 / 3, 2 / 3]) ctx.fillRect(x, y + h * f - 1.5, w, 3)
    ctx.fillStyle = "#e2e8f0"
    ctx.fillRect(x - 8, y + h + 5, w + 16, 5)
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const x = 42 + col * 116
      const y = eaves + 34 + row * 134
      if (row === 2 && col === 0) {
        ctx.fillStyle = "#f8fafc"
        ctx.fillRect(x - 8, y - 6, 80, 120)
        ctx.fillStyle = "#3b2a1c"
        ctx.fillRect(x - 2, y, 68, 114)
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        for (let px = x + 10; px < x + 64; px += 11)
          ctx.fillRect(px, y, 1.5, 114)
        ctx.fillStyle = "#a16207"
        ctx.fillRect(x + 28, y + 56, 4, 10)
        continue
      }
      if ((row + col + seed) % 2 === 0) {
        ctx.fillStyle = shutter
        ctx.fillRect(x - 18, y - 2, 12, 64)
        ctx.fillRect(x + 58, y - 2, 12, 64)
        ctx.fillStyle = "rgba(0,0,0,0.3)"
        for (let sy = y + 4; sy < y + 60; sy += 6) {
          ctx.fillRect(x - 18, sy, 12, 1.4)
          ctx.fillRect(x + 58, sy, 12, 1.4)
        }
      }
      pane(x, y, 52, 62, (row * 3 + col * 5 + seed) % 3 === 0)
    }
  }
  ctx.fillStyle = "rgba(0,0,0,0.3)"
  for (const y of [eaves + 118, eaves + 252]) ctx.fillRect(0, y, W, 5)
  ctx.fillRect(0, H - 22, W, 22)
  return texture(el)
}

// Ulriken far back: broad blue-grey ridge with its radio mast.
export function ulriken() {
  const { el, ctx } = canvas(2048, 512)
  const g = ctx.createLinearGradient(0, 100, 0, 512)
  g.addColorStop(0, "#6f879b")
  g.addColorStop(1, "#9db3c2")
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, 512)
  const pts = [
    [0, 330],
    [160, 250],
    [340, 280],
    [520, 170],
    [700, 210],
    [880, 120],
    [1000, 90],
    [1120, 118],
    [1300, 200],
    [1480, 160],
    [1660, 250],
    [1840, 220],
    [2048, 300],
  ]
  for (const [x, y] of pts) ctx.lineTo(x, y)
  ctx.lineTo(2048, 512)
  ctx.fill()
  ctx.strokeStyle = "#475569"
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(1000, 90)
  ctx.lineTo(1000, 6)
  ctx.stroke()
  ctx.lineWidth = 2.5
  for (const y of [22, 44, 66]) {
    ctx.beginPath()
    ctx.moveTo(986, y + 10)
    ctx.lineTo(1014, y + 10)
    ctx.stroke()
  }
  ctx.fillStyle = "#ef4444"
  ctx.beginPath()
  ctx.arc(1000, 6, 5, 0, Math.PI * 2)
  ctx.fill()
  return texture(el)
}

// Fløyen: forested dome with the town's houses climbing its foot, the
// Fløibanen funicular and the station on top.
export function floyen() {
  const W = 1024
  const H = 512
  const { el, ctx } = canvas(W, H)
  const hill = () => {
    ctx.beginPath()
    ctx.moveTo(0, H)
    ctx.bezierCurveTo(60, 380, 180, 300, 300, 210)
    ctx.bezierCurveTo(400, 130, 470, 70, 570, 64)
    ctx.bezierCurveTo(690, 58, 800, 170, 900, 290)
    ctx.bezierCurveTo(960, 360, 1000, 400, W, 420)
    ctx.lineTo(W, H)
    ctx.closePath()
  }
  const g = ctx.createLinearGradient(0, 60, 0, H)
  g.addColorStop(0, "#2f6b3f")
  g.addColorStop(1, "#1d4a2c")
  ctx.fillStyle = g
  hill()
  ctx.fill()
  ctx.save()
  hill()
  ctx.clip()
  let r = 7
  const rand = () => {
    r = (r * 16807) % 2147483647
    return r / 2147483647
  }
  // Spruce forest: small triangles, bigger and darker towards the foot.
  for (let i = 0; i < 2600; i++) {
    const x = rand() * W
    const y = 60 + rand() * (H - 60)
    const size = 9 + (y / H) * 16
    const l = 18 + rand() * 14 + (1 - y / H) * 8
    ctx.fillStyle = `hsl(${128 + rand() * 18} 42% ${l}%)`
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size * 0.45, y)
    ctx.lineTo(x - size * 0.45, y)
    ctx.fill()
  }
  // Birch and autumn patches.
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = ["#b45309", "#ca8a04", "#a3a33a"][i % 3]
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    ctx.arc(rand() * W, 150 + rand() * 330, 6 + rand() * 9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.restore()
  const colors = [
    "#a8352b",
    "#d9a441",
    "#f1ece0",
    "#c4622d",
    "#e0b84f",
    "#8f2d26",
  ]
  for (let i = 0; i < 70; i++) {
    const x = 20 + rand() * (W - 40)
    const edge =
      x < 300 ? 330 - x * 0.35 : x > 760 ? 330 + (x - 760) * 0.7 : 400
    const y = Math.max(edge, 400) + rand() * 90
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(x, y, 14, 12)
    ctx.fillStyle = "#44403c"
    ctx.beginPath()
    ctx.moveTo(x - 1, y)
    ctx.lineTo(x + 7, y - 7)
    ctx.lineTo(x + 15, y)
    ctx.fill()
  }
  // Fløibanen: track up the slope, a red car, and the top station.
  ctx.strokeStyle = "#1c1917"
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(430, 440)
  ctx.lineTo(556, 96)
  ctx.stroke()
  ctx.save()
  ctx.translate(480, 303)
  ctx.rotate(0.35)
  ctx.fillStyle = "#dc2626"
  ctx.fillRect(-14, -9, 28, 18)
  ctx.fillStyle = "#fecaca"
  ctx.fillRect(-10, -5, 20, 6)
  ctx.restore()
  ctx.fillStyle = "#7f1d1d"
  ctx.fillRect(540, 76, 44, 26)
  ctx.fillStyle = "#44403c"
  ctx.beginPath()
  ctx.moveTo(534, 76)
  ctx.lineTo(562, 56)
  ctx.lineTo(590, 76)
  ctx.fill()
  ctx.fillStyle = "#fde68a"
  ctx.fillRect(548, 84, 8, 8)
  ctx.fillRect(566, 84, 8, 8)
  return texture(el)
}

// Far wharf: a row of coloured gables, hazed by distance.
export function wharf() {
  const { el, ctx } = canvas(1024, 96)
  const colors = [
    "#a8352b",
    "#d9a441",
    "#f1ece0",
    "#c4622d",
    "#e0b84f",
    "#8f2d26",
  ]
  for (let i = 0; i < 20; i++) {
    const x = i * 52
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(x, 40, 48, 56)
    ctx.beginPath()
    ctx.moveTo(x - 2, 42)
    ctx.lineTo(x + 24, 4)
    ctx.lineTo(x + 50, 42)
    ctx.fill()
    ctx.fillStyle = "#1e293b"
    for (const wx of [8, 28])
      for (const wy of [52, 72]) ctx.fillRect(x + wx, wy, 10, 12)
  }
  return texture(el)
}

export function sky() {
  const { el, ctx } = canvas(4, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, "#6f98b8")
  g.addColorStop(1, "#d7e3ea")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  return texture(el)
}

export function cobbles() {
  const { el, ctx } = canvas(256, 256)
  ctx.fillStyle = "#7d776d"
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 32)
    for (let x = (y / 32) % 2 ? 0 : 16; x < 288; x += 32) {
      ctx.fillStyle = `hsl(35 5% ${42 + ((x * 7 + y * 3) % 13)}%)`
      ctx.beginPath()
      ctx.roundRect(x + 2, y + 2, 28, 28, 6)
      ctx.fill()
    }
  const t = texture(el, true)
  t.repeat.set(10, 12)
  return t
}

// Three lanes of ballast, sleepers and rails; one tile is `TRACK_TILE` long.
export const TRACK_TILE = 4
export function track() {
  const { el, ctx } = canvas(384, 128)
  ctx.fillStyle = "#6b645b"
  ctx.fillRect(0, 0, 384, 128)
  ctx.fillStyle = "#3f3a34"
  for (const y of [8, 72]) ctx.fillRect(0, y, 384, 22)
  ctx.fillStyle = "#cbd5e1"
  for (let lane = 0; lane < 3; lane++)
    for (const off of [30, 98]) ctx.fillRect(lane * 128 + off - 3, 0, 6, 128)
  const t = texture(el, true)
  t.repeat.set(1, 1)
  return t
}

const KVARTERET_SRC = "/kvarteret-logo.svg"
const KVARTERET_W = 800
const KVARTERET_H = 494
const KVARTERET_MARGIN = 14

// Windowed "all set" test along one axis using prefix sums.
function windowAll(
  src: Uint8Array,
  w: number,
  h: number,
  r: number,
  vertical: boolean,
  any: boolean,
) {
  const out = new Uint8Array(src.length)
  const [lines, len, stride, step] = vertical ? [w, h, w, 1] : [h, w, 1, w]
  for (let line = 0; line < lines; line++) {
    const base = line * step
    const prefix = new Int32Array(len + 1)
    for (let i = 0; i < len; i++)
      prefix[i + 1] = prefix[i] + src[base + i * stride]
    for (let i = 0; i < len; i++) {
      const a = Math.max(0, i - r)
      const b = Math.min(len, i + r + 1)
      const count = prefix[b] - prefix[a]
      out[base + i * stride] = any
        ? count > 0
          ? 1
          : 0
        : count === b - a
          ? 1
          : 0
    }
  }
  return out
}

// The Kvarteret illustration with its paper-white background cut away. White
// window trim touches the outside, so a plain flood fill would eat the
// building: fill only through white that survives erosion, then grow back.
export async function kvarteretImage() {
  const svg = (await (await fetch(KVARTERET_SRC)).text()).replace(
    'width="100%"',
    'width="1595" height="986"',
  )
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
  const img = new Image()
  img.src = url
  await img.decode()
  URL.revokeObjectURL(url)
  const w = KVARTERET_W
  const h = KVARTERET_H
  const { el, ctx } = canvas(w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  const px = data.data
  const white = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++)
    white[i] =
      px[i * 4] > 238 && px[i * 4 + 1] > 235 && px[i * 4 + 2] > 235 ? 1 : 0
  const r = KVARTERET_MARGIN
  const core = windowAll(
    windowAll(white, w, h, r, false, false),
    w,
    h,
    r,
    true,
    false,
  )
  const reached = new Uint8Array(w * h)
  const stack: number[] = []
  const seed = (i: number) => {
    if (core[i] && !reached[i]) {
      reached[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }
  while (stack.length) {
    const i = stack.pop() as number
    const x = i % w
    if (x > 0) seed(i - 1)
    if (x < w - 1) seed(i + 1)
    if (i >= w) seed(i - w)
    if (i < w * (h - 1)) seed(i + w)
  }
  const grown = windowAll(
    windowAll(reached, w, h, r, false, true),
    w,
    h,
    r,
    true,
    true,
  )
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  for (let i = 0; i < w * h; i++) {
    if (grown[i] && white[i]) {
      px[i * 4 + 3] = 0
      continue
    }
    const x = i % w
    const y = (i - x) / w
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  ctx.putImageData(data, 0, 0)
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const out = canvas(cw, ch)
  out.ctx.drawImage(el, minX, minY, cw, ch, 0, 0, cw, ch)
  return { texture: texture(out.el), aspect: cw / ch }
}
