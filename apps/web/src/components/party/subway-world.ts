import * as THREE from "three"
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

function disposeTree(root: THREE.Object3D, shared: Set<unknown>) {
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return
    if (!shared.has(o.geometry)) o.geometry.dispose()
  })
}

// Builds the 3D scene and returns controls for the React wrapper.
export function createWorld(canvas: HTMLCanvasElement) {
  // No MSAA and a capped pixel ratio: fill-rate is the bottleneck on weak GPUs.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  })
  const low =
    new URLSearchParams(window.location.search).get("quality") === "low"
  const maxRatio = low ? 0.5 : Math.min(window.devicePixelRatio, 1)
  let ratio = maxRatio
  renderer.setPixelRatio(ratio)
  const scene = new THREE.Scene()
  scene.background = sky()
  scene.fog = new THREE.Fog(FOG, 22, 58)
  const camera = new THREE.PerspectiveCamera(72, 9 / 16, 0.1, 120)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8378, 1.5))
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6)
  sun.position.set(-6, 14, 8)
  scene.add(sun)

  const shared = new Set<unknown>()
  const geo = <T extends THREE.BufferGeometry>(g: T) => {
    shared.add(g)
    return g
  }
  const mat = (color: string | number, extra: object = {}) =>
    new THREE.MeshLambertMaterial({ color, ...extra })

  // Ground: cobbled quay, track bed with moving sleepers.
  const groundTex = cobbles()
  const ground = new THREE.Mesh(
    geo(new THREE.PlaneGeometry(80, 140)),
    new THREE.MeshLambertMaterial({ map: groundTex }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, 0, -50)
  scene.add(ground)
  const trackTex = track()
  const trackLen = 140
  trackTex.repeat.set(1, trackLen / TRACK_TILE)
  const bed = new THREE.Mesh(
    geo(new THREE.PlaneGeometry(LANES * LANE_W, trackLen)),
    new THREE.MeshLambertMaterial({ map: trackTex }),
  )
  bed.rotation.x = -Math.PI / 2
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
  const facadeMats = new Map<string, THREE.Material>()
  const wallMats = new Map<string, THREE.Material>()
  const roofGeo = geo(new THREE.PlaneGeometry(6.2, 3.45).rotateY(Math.PI / 2))
  const trimMat = mat("#f1ece0")
  const frontGeo = geo(new THREE.PlaneGeometry(3.4, 9))

  const buildFacade = (key: number) => {
    const wall = WALLS[hash(key, 1) % WALLS.length]
    const roof = ROOFS[hash(key, 2) % ROOFS.length]
    const double = hash(key, 3) % 2 === 1
    const variant = key % 6
    const tag = `${wall}${double}${variant}`
    let frontMat = facadeMats.get(tag)
    if (!frontMat) {
      frontMat = new THREE.MeshLambertMaterial({
        map: facade(wall, double, variant),
        transparent: true,
        alphaTest: 0.4,
      })
      facadeMats.set(tag, frontMat)
    }
    let wallMat = wallMats.get(wall)
    if (!wallMat) {
      wallMat = new THREE.MeshLambertMaterial({ map: wallBoards(wall) })
      wallMats.set(wall, wallMat)
    }
    const g = new THREE.Group()
    const body = new THREE.Mesh(boxGeo, wallMat)
    body.scale.set(3.4, 6, 5.5)
    body.position.y = 3
    g.add(body)
    const front = new THREE.Mesh(frontGeo, frontMat)
    front.position.set(0, 4.5, 2.76)
    g.add(front)
    const roofMat = mat(roof, { side: THREE.DoubleSide })
    // Projecting floor ledges and the hoist beam give the flat gable relief.
    for (const y of [2.66, 4.43]) {
      const ledge = new THREE.Mesh(boxGeo, trimMat)
      ledge.scale.set(3.5, 0.1, 0.32)
      ledge.position.set(0, y, 2.9)
      g.add(ledge)
    }
    const beam = new THREE.Mesh(boxGeo, mat("#3b2a1c"))
    beam.scale.set(0.07, 0.07, 0.9)
    beam.position.set(0.25, 7.2, 3.2)
    g.add(beam)
    const pulley = new THREE.Mesh(spotGeo, mat("#1c1917"))
    pulley.scale.setScalar(1.1)
    pulley.position.set(0.25, 7.1, 3.65)
    g.add(pulley)
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(roofGeo, roofMat)
      r.rotation.z = side * Math.asin(1.7 / 3.45)
      // Overhangs the gable like Bryggen's deep eaves.
      r.position.set(side * 0.85, 7.5, 0.35)
      g.add(r)
    }
    return g
  }

  const lampPole = geo(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8))
  const lampHead = geo(new THREE.SphereGeometry(0.22, 12, 8))
  const buildLamp = () => {
    const g = new THREE.Group()
    const pole = new THREE.Mesh(lampPole, mat("#1c1917"))
    pole.position.y = 1.6
    const head = new THREE.Mesh(
      lampHead,
      new THREE.MeshBasicMaterial({ color: "#fde68a" }),
    )
    head.position.y = 3.3
    g.add(pole, head)
    return g
  }

  // Obstacles.
  const trainSideTex = trainSide()
  const trainFrontTex = trainFront()
  const trainSideMat = new Map<number, THREE.Material>()
  const frontMat = new THREE.MeshLambertMaterial({ map: trainFrontTex })
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
      side = new THREE.MeshLambertMaterial({ map: t })
      trainSideMat.set(key, side)
    }
    const body = new THREE.Mesh(boxGeo, [
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
      const ac = new THREE.Mesh(boxGeo, mat("#94a3b8"))
      ac.scale.set(1.0, 0.25, 1.6)
      ac.position.set(0, 2.92, z)
      g.add(ac)
    }
    const orange = new THREE.Mesh(boxGeo, mat("#e8522a"))
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
  const buildBarrier = () => {
    const g = new THREE.Group()
    for (const [x, s] of [
      [-0.45, 1],
      [0.45, 0.85],
    ] as const) {
      const m = new THREE.Group()
      const stem = new THREE.Mesh(mushroomStem, mat("#fdfaf3"))
      stem.position.y = 0.25
      const cap = new THREE.Mesh(mushroomCap, mat("#e2231a"))
      cap.position.y = 0.45
      cap.scale.set(1, 0.9, 1)
      m.add(stem, cap)
      for (const [sx, sy, sz] of [
        [0.2, 0.9, 0.15],
        [-0.25, 0.8, 0.1],
        [0, 0.93, -0.2],
        [0.05, 0.98, 0.3],
      ] as const) {
        const spot = new THREE.Mesh(spotGeo, mat("#fff"))
        spot.position.set(sx, sy * 0.95, sz)
        m.add(spot)
      }
      m.scale.setScalar(s * 1.2)
      m.position.x = x
      g.add(m)
    }
    return g
  }

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
  const buildGantry = () => {
    const g = new THREE.Group()
    const beam = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ map: stripeTex }),
    )
    beam.scale.set(2, 0.9, 0.4)
    beam.position.y = 1.5
    g.add(beam)
    for (const x of [-0.9, 0.9]) {
      const post = new THREE.Mesh(boxGeo, mat("#44403c"))
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
  const seen = new Set<string>()
  const place = (
    key: string,
    build: () => THREE.Object3D,
    x: number,
    z: number,
    y = 0,
  ) => {
    seen.add(key)
    let o = live.get(key)
    if (!o) {
      o = build()
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
    trackTex.offset.y = (d / TRACK_TILE) % 1

    const first = Math.ceil((d - 6) / FACADE_EVERY)
    for (let k = first; k * FACADE_EVERY - d < STREET_END; k++) {
      const z = k * FACADE_EVERY - d
      for (const side of [-1, 1]) {
        const key = k * 2 + (side + 1) / 2
        // Gables face the track, as along Bryggen's wharf.
        place(`f${key}`, () => buildFacade(key), side * 6.95, z).rotation.y =
          (-side * Math.PI) / 2
      }
    }
    const firstLamp = Math.ceil((d - 6) / LAMP_EVERY)
    for (let k = firstLamp; k * LAMP_EVERY - d < STREET_END; k++) {
      const z = k * LAMP_EVERY - d + 3
      for (const side of [-1, 1])
        place(`l${k}${side}`, buildLamp, side * 3.4, z)
    }
    for (const o of s.obstacles) {
      const x = laneX(o.lane)
      if (o.kind === "train")
        place(`o${o.id}`, () => buildTrain(o.len), x, o.z + o.len / 2)
      else if (o.kind === "low") place(`o${o.id}`, buildGantry, x, o.z)
      else place(`o${o.id}`, buildBarrier, x, o.z)
    }
    for (const c of s.pickups) {
      const coin = place(`c${c.id}`, buildCoin, laneX(c.lane), c.z, 1)
      coin.rotation.y = now / 300
    }
    for (const [key, o] of live) {
      if (seen.has(key)) continue
      live.delete(key)
      scene.remove(o)
      disposeTree(o, shared)
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
      renderer.dispose()
    },
  }
}
