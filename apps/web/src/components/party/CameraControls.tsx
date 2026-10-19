"use client"

import { useEffect, useRef, useState } from "react"
import {
  averagePose,
  cropRect,
  DEFAULT_VIEW,
  type Gestures,
  NO_GESTURES,
  type Pose,
  poseFromLandmarks,
  readGestures,
  SIDE_ON,
  VERTICAL_ON,
  type View,
} from "./camera-pose"
import type { PartyInput } from "./input"

const CALIBRATE_MS = 2000
// Self-hosted under public/mediapipe so the camera never needs a third party.
const MODEL_DIR = "/mediapipe"
// Skeleton segments between MediaPipe pose indices (shoulders, arms, torso).
const BONES = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
] as const

const stopTracks = (media: MediaStream) => {
  for (const track of media.getTracks()) track.stop()
}

type Status = "off" | "loading" | "calibrating" | "ready" | "error"

const LABELS: Record<Status, string> = {
  off: "Bruk kamera",
  loading: "Laster kamera …",
  calibrating: "Stå stille i bildet, hele overkroppen synlig …",
  ready: "Kamera på – steg til siden, hopp, huk deg",
  error: "Fikk ikke tilgang til kamera",
}

interface Landmark {
  x: number
  y: number
}

// Draws the skeleton plus the zones the player has to move into, in the
// camera's own (unmirrored) space; CSS mirrors the whole preview.
function drawTracking(
  el: HTMLCanvasElement,
  landmarks: Landmark[] | undefined,
  base: Pose | null,
) {
  const ctx = el.getContext("2d")
  if (!ctx) return
  const { width: w, height: h } = el
  ctx.clearRect(0, 0, w, h)
  if (base) {
    ctx.lineWidth = 2
    // Stepping to either side beyond these lines steers; the horizontal ones
    // are the jump and duck thresholds.
    ctx.strokeStyle = "rgba(250,204,21,0.9)"
    for (const dx of [-SIDE_ON, SIDE_ON]) {
      const x = (base.x + dx * base.scale) * w
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    ctx.strokeStyle = "rgba(34,211,238,0.9)"
    for (const dy of [-VERTICAL_ON, VERTICAL_ON]) {
      const y = (base.y + dy * base.scale) * h
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }
  if (!landmarks) return
  ctx.strokeStyle = "#4ade80"
  ctx.lineWidth = 3
  for (const [a, b] of BONES) {
    const p = landmarks[a]
    const q = landmarks[b]
    if (!p || !q) continue
    ctx.beginPath()
    ctx.moveTo(p.x * w, p.y * h)
    ctx.lineTo(q.x * w, q.y * h)
    ctx.stroke()
  }
  ctx.fillStyle = "#fff"
  for (const i of [0, 11, 12, 23, 24]) {
    const p = landmarks[i]
    if (!p) continue
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function CameraControls({ input }: { input: PartyInput }) {
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<Status>("off")
  const [shown, setShown] = useState<Gestures>(NO_GESTURES)
  const [calibration, setCalibration] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const overlay = useRef<HTMLCanvasElement>(null)
  const crop = useRef<HTMLCanvasElement>(null)
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const viewRef = useRef(view)
  const recalibrate = useRef(false)
  const changeView = (patch: Partial<View>) => {
    const next = { ...viewRef.current, ...patch }
    viewRef.current = next
    recalibrate.current = true
    setView(next)
  }

  // `calibration` restarts the effect so the player can reset their stance.
  // biome-ignore lint/correctness/useExhaustiveDependencies: calibration is a restart trigger
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let stream: MediaStream | undefined
    let landmarker: { close(): void } | undefined
    let frame = 0
    let gestures: Gestures = NO_GESTURES
    setStatus("loading")

    const apply = (next: Gestures) => {
      if (next.side !== gestures.side) {
        input.release("cam:left")
        input.release("cam:right")
        if (next.side === -1) input.press("cam:left", "left")
        if (next.side === 1) input.press("cam:right", "right")
      }
      if (next.jump && !gestures.jump) {
        input.press("cam:jump", "jump")
        input.release("cam:jump")
      }
      if (next.duck && !gestures.duck) {
        input.press("cam:drop", "drop")
        input.release("cam:drop")
      }
      if (
        next.side !== gestures.side ||
        next.jump !== gestures.jump ||
        next.duck !== gestures.duck
      )
        setShown(next)
      gestures = next
    }

    const start = async () => {
      try {
        const { FilesetResolver, PoseLandmarker } = await import(
          "@mediapipe/tasks-vision"
        )
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        })
        if (cancelled) return stopTracks(media)
        stream = media
        const el = video.current
        if (!el) return
        el.srcObject = media
        await el.play()
        const fileset = await FilesetResolver.forVisionTasks(MODEL_DIR)
        const create = (delegate: "GPU" | "CPU") =>
          PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: `${MODEL_DIR}/pose_landmarker_lite.task`,
              delegate,
            },
            runningMode: "VIDEO",
            numPoses: 1,
          })
        // Some phones refuse WebGL for the model; fall back to the CPU.
        const model = await create("GPU").catch(() => create("CPU"))
        if (cancelled) return model.close()
        landmarker = model

        const samples: Pose[] = []
        let base: Pose | null = null
        let calibrationStart = performance.now()
        let lastTime = -1
        setStatus("calibrating")
        const loop = () => {
          frame = requestAnimationFrame(loop)
          if (el.currentTime === lastTime) return
          lastTime = el.currentTime
          const now = performance.now()
          const c = crop.current
          const cx = c?.getContext("2d")
          if (!c || !cx) return
          // The model only sees the zoomed/panned window, so a far-away
          // player can be filled into the frame.
          const { sx, sy, sw, sh } = cropRect(
            el.videoWidth,
            el.videoHeight,
            viewRef.current,
          )
          cx.drawImage(el, sx, sy, sw, sh, 0, 0, c.width, c.height)
          if (recalibrate.current) {
            recalibrate.current = false
            base = null
            samples.length = 0
            calibrationStart = now
            apply(NO_GESTURES)
            setStatus("calibrating")
          }
          const landmarks = model.detectForVideo(c, now).landmarks[0]
          const pose = poseFromLandmarks(landmarks)
          if (overlay.current) drawTracking(overlay.current, landmarks, base)
          if (!base) {
            // Restart the countdown whenever the shoulders leave the frame.
            if (!pose) {
              samples.length = 0
              calibrationStart = now
            } else samples.push(pose)
            if (now - calibrationStart > CALIBRATE_MS) {
              base = averagePose(samples)
              if (base) setStatus("ready")
            }
            return
          }
          // Losing the player releases everything rather than leaving a lane held.
          apply(pose ? readGestures(pose, base, gestures) : NO_GESTURES)
        }
        loop()
      } catch {
        if (!cancelled) setStatus("error")
      }
    }
    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      apply(NO_GESTURES)
      landmarker?.close()
      if (stream) stopTracks(stream)
    }
  }, [enabled, input, calibration])

  const chip = (on: boolean, label: string) => (
    <span
      className={`rounded px-2 py-0.5 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-black/10"}`}
    >
      {label}
    </span>
  )

  return (
    <div data-party-controls className="flex flex-col items-center gap-2">
      <button
        type="button"
        className="rounded border px-3 py-1 font-heading"
        onClick={() => {
          setEnabled(on => !on)
          setStatus("off")
          setShown(NO_GESTURES)
        }}
      >
        {enabled ? "Slå av kamera" : LABELS.off}
      </button>
      {enabled && (
        <>
          <p role="status" className="text-center text-sm">
            {LABELS[status]}
          </p>
          <div className="flex gap-1" aria-hidden>
            {chip(shown.side === -1, "← venstre")}
            {chip(shown.jump, "↑ hopp")}
            {chip(shown.duck, "↓ huk")}
            {chip(shown.side === 1, "høyre →")}
          </div>
          <div className="flex w-48 flex-col gap-1 text-sm">
            {(
              [
                ["Zoom", "zoom", 1, 3, 0.1],
                ["Sideveis", "panX", 0, 1, 0.05],
                ["Høyde", "panY", 0, 1, 0.05],
              ] as const
            ).map(([label, key, min, max, stepBy]) => (
              <label key={key} className="flex items-center gap-2">
                <span className="w-16">{label}</span>
                <input
                  type="range"
                  className="flex-1"
                  min={min}
                  max={max}
                  step={stepBy}
                  value={view[key]}
                  onChange={e => changeView({ [key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
          {status === "ready" && (
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setCalibration(n => n + 1)}
            >
              Kalibrer på nytt
            </button>
          )}
        </>
      )}
      {/* Mirrored like a mirror; the video stays on this phone. */}
      <div className="relative w-48 -scale-x-100" hidden={!enabled}>
        <video ref={video} muted playsInline className="hidden" />
        <canvas
          ref={crop}
          width={320}
          height={240}
          className="w-full rounded"
        />
        <canvas
          ref={overlay}
          width={320}
          height={240}
          className="absolute inset-0 size-full"
        />
      </div>
    </div>
  )
}
