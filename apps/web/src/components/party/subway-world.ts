import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { LANES, type SubwayState } from "./subway"
import {
  cobbles,
  facade,
  floyen,
  kvarteretImage,
  sky,
  TRACK_TILE,
  track,
  trainFront,
  trainSide,
  ulriken,
  wallBoards,
  water,
  wharf,
} from "./subway-textures"

const LANE_W = 2
const FACADE_EVERY = 3.8
const LAMP_EVERY = 13
// The street opens onto a small square here, where Kvarteret stands.
const STREET_END = 44
const WALLS = [
  "#a8352b",
  "#d9a441",
  "#f1ece0",
  "#c4622d",
  "#e0b84f",
  "#8f2d26",
  "#e9dcc0",
]
const ROOFS = ["#7f1d1d", "#44403c", "#9a3412", "#334155"]
const FOG = 0xd7e3ea
const RUNNER_H = 1.4

export const laneX = (lane: number) => (lane - (LANES - 1) / 2) * LANE_W

const hash = (k: number, salt: number) =>
  Math.abs(Math.floor(Math.sin(k * 12.9898 + salt * 78.233) * 43758.5453))

// Builds the 3D scene and returns controls for the React wrapper.
export function createWorld(canvas: HTMLCanvasElement, low = false) {
  // No MSAA and a capped pixel ratio: fill-rate is the bottleneck on weak GPUs.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  })
  const maxRatio = low ? 0.5 : Math.min(window.devicePixelRatio, 1)
  let ratio = maxRatio
  renderer.setPixelRatio(ratio)
  const scene = new THREE.Scene()
  scene.background = sky()
  scene.fog = new THREE.Fog(FOG, 22, 58)
  const camera = new THREE.PerspectiveCamera(72, 9 / 16, 0.1, 120)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8378, 1.5)
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6)
  sun.position.set(-6, 14, 8)
  scene.add(hemi, sun)

  // The lights never move, so lighting is baked into vertex colours (same maths as
  // Lambert) and props use unlit Basic materials: no per-pixel lighting on weak GPUs.
  const sunDir = sun.position.clone().normalize()
  // `up`: a two-sided sheet, lit on whichever face points skyward (as Lambert does for the viewer).
  const shade = <T extends THREE.BufferGeometry>(g: T, up = false): T => {
    const nrm = g.getAttribute("normal")
    const count = g.getAttribute("position").count
    const prev = g.getAttribute("color")
    const out = new Float32Array(count * 3)
    const n = new THREE.Vector3()
    const amb = new THREE.Color()
    for (let i = 0; i < count; i++) {
      n.fromBufferAttribute(nrm, i)
      if (up && n.y < 0) n.negate()
      amb.lerpColors(hemi.groundColor, hemi.color, 0.5 * n.y + 0.5)
      const d = Math.max(n.dot(sunDir), 0)
      const rgb = [
        amb.r * hemi.intensity + sun.color.r * sun.intensity * d,
        amb.g * hemi.intensity + sun.color.g * sun.intensity * d,
        amb.b * hemi.intensity + sun.color.b * sun.intensity * d,
      ]
      for (let k = 0; k < 3; k++)
        out[i * 3 + k] =
          ((prev ? prev.getComponent(i, k) : 1) * rgb[k]) / Math.PI
    }
    g.setAttribute("color", new THREE.BufferAttribute(out, 3))
    return g
  }

  const shared = new Set<unknown>()
  const geo = <T extends THREE.BufferGeometry>(g: T) => {
    shared.add(g)
    return g
  }
  // Materials are cached per colour+options: fewer programs/uniform uploads, nothing to free per object.
  const matCache = new Map<string, THREE.Material>()
  const mat = (color: string | number, extra: object = {}) => {
    const k = `${color}${JSON.stringify(extra)}`
    let m = matCache.get(k)
    if (!m)
      matCache.set(
        k,
        (m = new THREE.MeshBasicMaterial({
          color,
          vertexColors: true,
          ...extra,
        })),
      )
    return m
  }
  // Lit props only exist for lamps and coins, which still use real lights.
  const lambert = (color: string) => new THREE.MeshLambertMaterial({ color })

  // Ground: cobbled quay, track bed with moving sleepers.
  const groundTex = cobbles()
  const ground = new THREE.Mesh(
    geo(shade(new THREE.PlaneGeometry(48, 140).rotateX(-Math.PI / 2))),
    new THREE.MeshBasicMaterial({ map: groundTex, vertexColors: true }),
  )
  groundTex.repeat.x = 6 // keeps the cobbles the same size on the narrower quay
  ground.position.set(16, 0, -50)
  scene.add(ground)
  // The sea fills the left-hand side where the wharf drops away from the quay.
  const seaTex = water()
  seaTex.repeat.set(6, 12)
  const sea = new THREE.Mesh(
    geo(shade(new THREE.PlaneGeometry(72, 140).rotateX(-Math.PI / 2))),
    new THREE.MeshBasicMaterial({ map: seaTex, vertexColors: true }),
  )
  sea.position.set(-44, -0.35, -50)
  scene.add(sea)
  const trackTex = track()
  const trackLen = 140
  trackTex.repeat.set(1, trackLen / TRACK_TILE)
  const bed = new THREE.Mesh(
    geo(
      shade(
        new THREE.PlaneGeometry(LANES * LANE_W, trackLen).rotateX(-Math.PI / 2),
      ),
    ),
    new THREE.MeshBasicMaterial({ map: trackTex, vertexColors: true }),
  )
  bed.position.set(0, 0.02, -trackLen / 2 + 12)
  scene.add(bed)

  // Horizon cut-outs ignore fog so the mountains stay readable.
  const backdrop = (
    tex: THREE.Texture,
    w: number,
    h: number,
    y: number,
    z: number,
  ) => {
    const m = new THREE.Mesh(
      geo(new THREE.PlaneGeometry(w, h)),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false }),
    )
    m.position.set(0, y, z)
    scene.add(m)
  }
  backdrop(ulriken(), 240, 60, 29, -110)
  backdrop(floyen(), 78, 39, 18.5, -92)
  backdrop(wharf(), 120, 11, 5.5, -80)

  // Det Akademiske Kvarter stands at the end of the street, in the runner's sights.
  let disposed = false
  kvarteretImage()
    .then(({ texture, aspect }) => {
      if (disposed) return texture.dispose()
      const width = 19
      backdrop(texture, width, width / aspect, width / aspect / 2, -58)
    })
    .catch(() => {})

  // Shared building blocks.
  const boxGeo = geo(new THREE.BoxGeometry(1, 1, 1))
  const litBox = geo(shade(new THREE.BoxGeometry(1, 1, 1)))
  const facadeMats = new Map<string, THREE.Material>()
  const wallMats = new Map<string, THREE.Material>()
  const roofGeo = geo(new THREE.PlaneGeometry(6.2, 3.45).rotateY(Math.PI / 2))
  const frontGeo = geo(new THREE.PlaneGeometry(3.4, 9))

  // Merges a static group into one mesh with one draw call per material. Built once per kind.
  const baked = new Map<
    string,
    { geo: THREE.BufferGeometry; mats: THREE.Material[] }
  >()
  const bake = (kind: string, build: () => THREE.Group) => {
    let b = baked.get(kind)
    if (!b) {
      const g = build()
      g.updateMatrixWorld(true)
      const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>()
      g.traverse(o => {
        if (!(o instanceof THREE.Mesh)) return
        const m = o.material as THREE.Material
        const list = byMat.get(m) ?? []
        const geo = o.geometry.clone().applyMatrix4(o.matrixWorld)
        shade(geo, o.userData.up === true) // also gives every part the same attributes, as mergeGeometries needs
        list.push(geo)
        byMat.set(m, list)
      })
      const mats = [...byMat.keys()]
      const parts = mats.map(m => mergeGeometries(byMat.get(m) ?? []))
      const geo = mergeGeometries(
        parts.filter(p => p !== null),
        true,
      )
      if (!geo) throw new Error("geometry merge failed")
      shared.add(geo)
      b = { geo, mats }
      baked.set(kind, b)
    }
    return new THREE.Mesh(b.geo, b.mats)
  }

  const facadeParts = (key: number) => {
    const wall = WALLS[hash(key, 1) % WALLS.length]
    const roof = ROOFS[hash(key, 2) % ROOFS.length]
    const double = hash(key, 3) % 2 === 1
    const variant = key % 6
    return {
      wall,
      roof,
      double,
      variant,
      tag: `${wall}${double}${variant}${roof}`,
    }
  }
  // Small details share one vertex-coloured material so a baked prop needs one draw call for them all.
  const vcMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  })
  const part = (
    g: THREE.BufferGeometry,
    color: string | number,
    up = false,
  ) => {
    const geo = g.clone()
    const c = new THREE.Color(color)
    const n = geo.getAttribute("position").count
    geo.setAttribute(
      "color",
      new THREE.BufferAttribute(
        Float32Array.from({ length: n * 3 }, (_, i) => [c.r, c.g, c.b][i % 3]),
        3,
      ),
    )
    const m = new THREE.Mesh(geo, vcMat)
    m.userData.up = up
    return m
  }
  const buildFacadeGroup = (key: number, side: number) => {
    const { wall, roof, double, variant } = facadeParts(key)
    const texTag = `${wall}${double}${variant}`
    let frontMat = facadeMats.get(texTag)
    if (!frontMat) {
      frontMat = new THREE.MeshBasicMaterial({
        map: facade(wall, double, variant),
        vertexColors: true,
        alphaTest: 0.4,
      })
      facadeMats.set(texTag, frontMat)
    }
    let wallMat = wallMats.get(wall)
    if (!wallMat) {
      wallMat = new THREE.MeshBasicMaterial({
        map: wallBoards(wall),
        vertexColors: true,
      })
      wallMats.set(wall, wallMat)
    }
    // Gables face the track, as along Bryggen's wharf.
    const g = new THREE.Group()
    g.rotation.y = (-side * Math.PI) / 2
    const body = new THREE.Mesh(boxGeo, wallMat)
    body.scale.set(3.4, 6, 5.5)
    body.position.y = 3
    g.add(body)
    const front = new THREE.Mesh(frontGeo, frontMat)
    front.position.set(0, 4.5, 2.76)
    g.add(front)
    // Projecting floor ledges and the hoist beam give the flat gable relief.
    for (const y of [2.66, 4.43]) {
      const ledge = part(boxGeo, "#f1ece0")
      ledge.scale.set(3.5, 0.1, 0.32)
      ledge.position.set(0, y, 2.9)
      g.add(ledge)
    }
    const beam = part(boxGeo, "#3b2a1c")
    beam.scale.set(0.07, 0.07, 0.9)
    beam.position.set(0.25, 7.2, 3.2)
    g.add(beam)
    const pulley = part(spotGeo, "#1c1917")
    pulley.scale.setScalar(1.1)
    pulley.position.set(0.25, 7.1, 3.65)
    g.add(pulley)
    for (const side of [-1, 1]) {
      const r = part(roofGeo, roof, true)
      r.rotation.z = side * Math.asin(1.7 / 3.45)
      // Overhangs the gable like Bryggen's deep eaves.
      r.position.set(side * 0.85, 7.5, 0.35)
      g.add(r)
    }
    return g
  }

  const buildFacade = (key: number, side: number) =>
    bake(`f${facadeParts(key).tag}${side}`, () => buildFacadeGroup(key, side))

  const lampPole = geo(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8))
  const lampHead = geo(new THREE.SphereGeometry(0.22, 12, 8))
  const lampMat = new THREE.MeshBasicMaterial({ color: "#fde68a" })
  const lampPoleMat = lambert("#1c1917")
  const buildLamp = () => {
    const g = new THREE.Group()
    const pole = new THREE.Mesh(lampPole, lampPoleMat)
    pole.position.y = 1.6
    const head = new THREE.Mesh(lampHead, lampMat)
    head.position.y = 3.3
    g.add(pole, head)
    return g
  }

  // Obstacles.
  const trainSideTex = trainSide()
  const trainFrontTex = trainFront()
  const trainSideMat = new Map<number, THREE.Material>()
  const frontMat = new THREE.MeshBasicMaterial({
    map: trainFrontTex,
    vertexColors: true,
  })
  const roofMat = mat("#e2e8f0")
  const bottomMat = mat("#334155")
  const buildTrain = (len: number) => {
    const g = new THREE.Group()
    const key = Math.round(len * 10)
    let side = trainSideMat.get(key)
    if (!side) {
      const t = trainSideTex.clone()
      t.repeat.set(len / 4, 1)
      t.needsUpdate = true
      side = new THREE.MeshBasicMaterial({ map: t, vertexColors: true })
      trainSideMat.set(key, side)
    }
    const body = new THREE.Mesh(litBox, [
      side,
      side,
      roofMat,
      bottomMat,
      frontMat,
      frontMat,
    ])
    body.scale.set(1.7, 2.5, len)
    body.position.y = 1.55
    g.add(body)
    // Roof equipment and skirts for a little relief.
    for (let z = -len / 2 + 2; z < len / 2 - 1; z += 4) {
      const ac = new THREE.Mesh(litBox, mat("#94a3b8"))
      ac.scale.set(1.0, 0.25, 1.6)
      ac.position.set(0, 2.92, z)
      g.add(ac)
    }
    const orange = new THREE.Mesh(litBox, mat("#e8522a"))
    orange.scale.set(1.72, 0.12, len)
    orange.position.y = 2.82
    g.add(orange)
    return g
  }

  const mushroomCap = geo(
    new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  )
  const mushroomStem = geo(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 12))
  const spotGeo = geo(new THREE.SphereGeometry(0.07, 8, 6))
  const buildBarrierGroup = () => {
    const g = new THREE.Group()
    for (const [x, s] of [
      [-0.45, 1],
      [0.45, 0.85],
    ] as const) {
      const m = new THREE.Group()
      const stem = part(mushroomStem, "#fdfaf3")
      stem.position.y = 0.25
      const cap = part(mushroomCap, "#e2231a")
      cap.position.y = 0.45
      cap.scale.set(1, 0.9, 1)
      m.add(stem, cap)
      for (const [sx, sy, sz] of [
        [0.2, 0.9, 0.15],
        [-0.25, 0.8, 0.1],
        [0, 0.93, -0.2],
        [0.05, 0.98, 0.3],
      ] as const) {
        const spot = part(spotGeo, "#ffffff")
        spot.position.set(sx, sy * 0.95, sz)
        m.add(spot)
      }
      m.scale.setScalar(s * 1.2)
      m.position.x = x
      g.add(m)
    }
    return g
  }

  const buildBarrier = () => bake("barrier", buildBarrierGroup)

  const stripeTex = (() => {
    const c = document.createElement("canvas")
    c.width = 128
    c.height = 32
    const x = c.getContext("2d")
    if (x) {
      x.fillStyle = "#facc15"
      x.fillRect(0, 0, 128, 32)
      x.fillStyle = "#1c1917"
      for (let i = -32; i < 128; i += 32) {
        x.beginPath()
        x.moveTo(i, 32)
        x.lineTo(i + 16, 32)
        x.lineTo(i + 32, 0)
        x.lineTo(i + 16, 0)
        x.fill()
      }
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const stripeMat = new THREE.MeshBasicMaterial({
    map: stripeTex,
    vertexColors: true,
  })
  const buildGantry = () => {
    const g = new THREE.Group()
    const beam = new THREE.Mesh(litBox, stripeMat)
    beam.scale.set(2, 0.9, 0.4)
    beam.position.y = 1.5
    g.add(beam)
    for (const x of [-0.9, 0.9]) {
      const post = new THREE.Mesh(litBox, mat("#44403c"))
      post.scale.set(0.18, 2, 0.18)
      post.position.set(x, 1, 0)
      g.add(post)
    }
    return g
  }

  const coinGeo = geo(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20))
  const coinMat = new THREE.MeshLambertMaterial({
    color: "#f59e0b",
    emissive: "#7c4a03",
  })
  const buildCoin = () => {
    const g = new THREE.Group()
    const m = new THREE.Mesh(coinGeo, coinMat)
    m.rotation.x = Math.PI / 2
    g.add(m)
    return g
  }

  // Everything that scrolls is pooled by key and rebuilt only on entry.
  const live = new Map<string, THREE.Object3D>()
  const pool = new Map<string, THREE.Object3D[]>()
  const seen = new Set<string>()
  const place = (
    key: string,
    kind: string,
    build: () => THREE.Object3D,
    x: number,
    z: number,
    y = 0,
  ) => {
    seen.add(key)
    let o = live.get(key)
    if (!o) {
      o = pool.get(kind)?.pop() ?? build()
      o.userData.kind = kind
      live.set(key, o)
      scene.add(o)
    }
    o.position.set(x, y, -z)
    return o
  }

  const size = { w: 1, h: 1 }
  const resize = () => {
    // The canvas fills a 9:16 stage, which may be letterboxed in the window.
    size.w = canvas.parentElement?.clientWidth || window.innerWidth
    size.h = canvas.parentElement?.clientHeight || window.innerHeight
    renderer.setSize(size.w, size.h, false)
    camera.aspect = size.w / size.h
    camera.updateProjectionMatrix()
  }
  resize()

  // Screen position of a point on the runner, for the mascot overlay.
  const vec = new THREE.Vector3()
  const toScreen = (x: number, y: number, z: number) => {
    const v = vec.set(x, y, z).project(camera)
    return { x: ((v.x + 1) / 2) * size.w, y: ((1 - v.y) / 2) * size.h }
  }

  // Adaptive resolution: drop the pixel ratio while frames stay slow.
  let avg = 16
  let prev = 0
  let slowSince = 0
  const adapt = (now: number) => {
    if (prev) avg += (Math.min(now - prev, 250) - avg) * 0.1
    prev = now
    if (avg > 33 && ratio > 0.4 && now - slowSince > 1000) {
      slowSince = now
      ratio = Math.max(0.4, ratio - 0.15)
      renderer.setPixelRatio(ratio)
      renderer.setSize(size.w, size.h, false)
    }
  }

  let camX = 0
  const update = (s: SubwayState, now: number) => {
    adapt(now)
    seen.clear()
    const d = s.distance
    groundTex.offset.y = (d / (140 / 12)) % 1
    seaTex.offset.y = groundTex.offset.y
    trackTex.offset.y = (d / TRACK_TILE) % 1

    const first = Math.ceil((d - 6) / FACADE_EVERY)
    for (let k = first; k * FACADE_EVERY - d < STREET_END; k++) {
      const z = k * FACADE_EVERY - d
      // Right-hand side only: the left is open sea.
      for (const side of [1]) {
        const key = k * 2 + (side + 1) / 2
        place(
          `f${key}`,
          `f${facadeParts(key).tag}${side}`,
          () => buildFacade(key, side),
          side * 6.95,
          z,
        )
      }
    }
    const firstLamp = Math.ceil((d - 6) / LAMP_EVERY)
    for (let k = firstLamp; k * LAMP_EVERY - d < STREET_END; k++) {
      const z = k * LAMP_EVERY - d + 3
      for (const side of [-1, 1])
        place(`l${k}${side}`, "lamp", buildLamp, side * 3.4, z)
    }
    for (const o of s.obstacles) {
      const x = laneX(o.lane)
      if (o.kind === "train")
        place(
          `o${o.id}`,
          `t${Math.round(o.len * 10)}`,
          () => buildTrain(o.len),
          x,
          o.z + o.len / 2,
        )
      else if (o.kind === "low")
        place(`o${o.id}`, "gantry", buildGantry, x, o.z)
      else place(`o${o.id}`, "barrier", buildBarrier, x, o.z)
    }
    for (const c of s.pickups) {
      const coin = place(`c${c.id}`, "coin", buildCoin, laneX(c.lane), c.z, 1)
      coin.rotation.y = now / 300
    }
    for (const [key, o] of live) {
      if (seen.has(key)) continue
      live.delete(key)
      scene.remove(o)
      const kind = o.userData.kind as string
      pool.set(kind, [...(pool.get(kind) ?? []), o])
    }

    camX += (laneX(s.lane) * 0.55 - camX) * 0.12
    camera.position.set(camX, 5, 9)
    camera.lookAt(camX * 0.6, 1, -12)
    renderer.render(scene, camera)
  }

  return {
    update,
    resize,
    // Where the runner's feet and head land on screen.
    runner(s: SubwayState) {
      const x = laneX(s.lane)
      const feet = toScreen(x, s.y, 0)
      const head = toScreen(x, s.y + RUNNER_H, 0)
      return { x: feet.x, y: feet.y, height: feet.y - head.y }
    },
    dispose() {
      disposed = true
      for (const o of live.values()) scene.remove(o)
      live.clear()
      for (const g of shared) (g as THREE.BufferGeometry).dispose()
      for (const m of matCache.values()) m.dispose()
      renderer.dispose()
    },
  }
}
