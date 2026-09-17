"use client"

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as THREE from "three"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type SortingHatDemoProps = {
  children?: ReactNode
  onActiveChange?: (active: boolean) => void
  className?: string
}

export function SortingHatDemo({
  children,
  onActiveChange,
  className,
}: SortingHatDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const trackerRef = useRef<
    import("@mediapipe/tasks-vision").PoseLandmarker | null
  >(null)
  const trackAnimationRef = useRef<number | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100)
    camera.position.set(0, 0, 4)
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.5))
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
    directionalLight.position.set(2, 4, 3)
    scene.add(directionalLight)

    let model: THREE.Group | null = null
    let modelBounds: THREE.Box3 | null = null
    let modelWidth = 1
    const hatScaleFactor = 1.45
    const headOccluder = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 20),
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
        depthTest: true,
      }),
    )
    headOccluder.visible = false
    headOccluder.renderOrder = 0
    scene.add(headOccluder)
    let animationFrame = 0
    let lastVideoTime = -1
    let hasTrackingTarget = false
    const targetPosition = new THREE.Vector3()

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()
    window.addEventListener("resize", resize)

    new GLTFLoader().load("/sortinghatdemo/sortinghat.glb", gltf => {
      model = gltf.scene
      modelBounds = new THREE.Box3().setFromObject(model)
      const size = modelBounds.getSize(new THREE.Vector3())
      modelWidth = size.x
      model.position.z = -3
      model.renderOrder = 1
      model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        object.renderOrder = 1
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            material.side = THREE.FrontSide
          })
        } else {
          object.material.side = THREE.FrontSide
        }
      })
      scene.add(model)
      setModelReady(true)
    })

    const render = () => {
      animationFrame = requestAnimationFrame(render)
      renderer.render(scene, camera)
    }
    render()

    const track = () => {
      if (
        trackerRef.current &&
        model &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        video.currentTime !== lastVideoTime
      ) {
        lastVideoTime = video.currentTime
        let landmarks:
          | Awaited<
              ReturnType<typeof trackerRef.current.detectForVideo>
            >["landmarks"][number]
          | undefined
        try {
          const result = trackerRef.current.detectForVideo(
            video,
            performance.now(),
          )
          landmarks = result.landmarks?.[0]
        } catch (trackingError) {
          console.error("Pose tracking failed", trackingError)
        }
        if (landmarks) {
          const [nose, leftEar, rightEar] = [
            landmarks[0],
            landmarks[7],
            landmarks[8],
          ]
          const earSpan = Math.abs(leftEar.x - rightEar.x)
          if (
            earSpan < 0.03 ||
            (nose.visibility !== undefined && nose.visibility < 0.35) ||
            (leftEar.visibility !== undefined && leftEar.visibility < 0.35) ||
            (rightEar.visibility !== undefined && rightEar.visibility < 0.35)
          ) {
            trackAnimationRef.current = requestAnimationFrame(track)
            return
          }
          const { width, height } = canvas.getBoundingClientRect()
          const videoScale = Math.max(
            width / video.videoWidth,
            height / video.videoHeight,
          )
          const displayedWidth = video.videoWidth * videoScale
          const displayedHeight = video.videoHeight * videoScale
          const cropX = (displayedWidth - width) / 2
          const cropY = (displayedHeight - height) / 2
          // Anchor to the midpoint between the ears rather than the nose.
          // The ear midpoint moves much less when the person talks or looks around.
          const earMidX = (leftEar.x + rightEar.x) / 2
          const earMidY = (leftEar.y + rightEar.y) / 2
          const headX = (earMidX * displayedWidth - cropX) / width
          // Pose landmarks sit inside the head. Move the brim above the ear line
          // so the hat sits on the crown instead of covering the face.
          const crownY = earMidY - earSpan * 0.6
          const headY = (crownY * displayedHeight - cropY) / height
          const visibleHeight =
            2 *
            (camera.position.z - model.position.z) *
            Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
          const headWorldWidth =
            ((earSpan * displayedWidth) / width) * visibleHeight * camera.aspect
          // Size the hat from the detected head width. The modest multiplier
          // makes it slightly wider than the head without making it jump in size.
          const modelScale =
            (headWorldWidth * 1.15 * hatScaleFactor) / modelWidth
          const headPositionX =
            ((headX * 2 - 1) * visibleHeight * camera.aspect) / 2
          const headPositionY = (-(headY * 2 - 1) * visibleHeight) / 2
          targetPosition.set(
            headPositionX,
            headPositionY + (modelBounds ? -modelBounds.min.y * modelScale : 0),
            -3,
          )
          // A depth-only head shape hides the hat's inner hole and rear brim,
          // while leaving the real camera image visible underneath.
          const headWorldHeight =
            ((earSpan * displayedHeight) / height) * visibleHeight
          headOccluder.position.set(
            headPositionX,
            headPositionY + headWorldHeight * 0.55,
            -2.86,
          )
          headOccluder.scale.set(
            headWorldWidth * 0.85,
            headWorldHeight * 0.55,
            headWorldWidth * 0.8,
          )
          headOccluder.visible = true
          // Keep the hat steady while still following deliberate head movement.
          const positionSmoothing = hasTrackingTarget ? 0.14 : 1
          const scaleSmoothing = hasTrackingTarget ? 0.12 : 1
          model.position.lerp(targetPosition, positionSmoothing)
          model.scale.setScalar(
            THREE.MathUtils.lerp(model.scale.x, modelScale, scaleSmoothing),
          )
          model.visible = true
          hasTrackingTarget = true
        }
      }
      trackAnimationRef.current = requestAnimationFrame(track)
    }
    track()

    return () => {
      cancelAnimationFrame(animationFrame)
      if (trackAnimationRef.current)
        cancelAnimationFrame(trackAnimationRef.current)
      resizeObserver.disconnect()
      window.removeEventListener("resize", resize)
      streamRef.current?.getTracks().forEach(track => track.stop())
      trackerRef.current?.close()
      renderer.dispose()
    }
  }, [])

  const startCamera = async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Dette nettleservinduet støtter ikke kamera.")
      return
    }
    try {
      streamRef.current?.getTracks().forEach(track => track.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        if (video.videoWidth === 0) {
          await new Promise<void>(resolve => {
            video.addEventListener("loadedmetadata", () => resolve(), {
              once: true,
            })
          })
        }
      }
      const { FilesetResolver, PoseLandmarker } = await import(
        "@mediapipe/tasks-vision"
      )
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      )
      trackerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      setCameraStarted(true)
      onActiveChange?.(true)
    } catch (cameraError) {
      console.error("Camera or pose tracker failed", cameraError)
      onActiveChange?.(false)
      setError(
        "Kamera eller bevegelsessporing kunne ikke startes. Tillat kamera og prøv igjen.",
      )
    }
  }

  return (
    <div
      className={cn(
        "relative h-full min-h-96 w-full overflow-hidden rounded-lg bg-black",
        className,
      )}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-none"
      />
      {!modelReady ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/70">
          <div
            aria-label="Laster sorteringshatten"
            className="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
            role="status"
          />
        </div>
      ) : null}
      {!cameraStarted ? (
        <button
          className="absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-5 py-3 font-bold text-gray-900"
          onClick={() => void startCamera()}
          type="button"
        >
          📷 Start kamera
        </button>
      ) : null}
      {error ? (
        <p className="absolute inset-x-4 top-16 z-30 rounded-lg bg-red-950/90 p-4 text-white">
          {error}
        </p>
      ) : null}
      {children ? (
        <div className="absolute inset-x-0 bottom-0 z-20">{children}</div>
      ) : null}
    </div>
  )
}
