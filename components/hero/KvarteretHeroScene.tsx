"use client"

import { Center, Text, useGLTF } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import Image from "next/image"
import * as React from "react"
import type { Group, Material, Mesh } from "three"
import { DoubleSide, MathUtils, Vector3 } from "three"
import { cn } from "@/lib/utils"

const MODEL_URL = "/models/kvarteret-building.glb"
const FALLBACK_URL = "/kvarteret-logo.svg"

type KvarteretHeroSceneProps = {
    className?: string
}

type PointerTarget = {
    x: number
    y: number
    active: boolean
}

type ErrorBoundaryProps = {
    children: React.ReactNode
    onError: () => void
}

class SceneErrorBoundary extends React.Component<ErrorBoundaryProps, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch() {
        this.props.onError()
    }

    render() {
        if (this.state.failed) return null
        return this.props.children
    }
}

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

    React.useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReducedMotion(media.matches)
        update()
        media.addEventListener("change", update)
        return () => media.removeEventListener("change", update)
    }, [])

    return prefersReducedMotion
}

function supportsWebGL() {
    try {
        const canvas = document.createElement("canvas")
        return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
    } catch {
        return false
    }
}

export function KvarteretHeroScene({ className }: KvarteretHeroSceneProps) {
    const pointer = React.useRef<PointerTarget>({ x: 0, y: 0, active: false })
    const [mounted, setMounted] = React.useState(false)
    const [webglReady, setWebglReady] = React.useState(false)
    const [sceneReady, setSceneReady] = React.useState(false)
    const [sceneFailed, setSceneFailed] = React.useState(false)
    const prefersReducedMotion = usePrefersReducedMotion()

    React.useEffect(() => {
        setMounted(true)
        setWebglReady(supportsWebGL())
    }, [])

    const showCanvas = mounted && webglReady && !prefersReducedMotion && !sceneFailed

    return (
        <div
            aria-label="Interaktiv 3D-modell av Det Akademiske Kvarter"
            className={cn("relative aspect-[1595/986] overflow-hidden", className)}
            onPointerLeave={() => {
                pointer.current = { x: 0, y: 0, active: false }
            }}
            onPointerMove={event => {
                if (event.pointerType === "touch") return
                const rect = event.currentTarget.getBoundingClientRect()
                pointer.current = {
                    x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
                    y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
                    active: true,
                }
            }}
        >
            <Image
                alt="Illustrasjon av Det Akademiske Kvarter"
                className={cn(
                    "absolute inset-0 h-full w-full object-contain transition-opacity duration-300",
                    sceneReady ? "opacity-0" : "opacity-100",
                )}
                height={986}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                src={FALLBACK_URL}
                width={1595}
            />
            {showCanvas && (
                <SceneErrorBoundary onError={() => setSceneFailed(true)}>
                    <Canvas
                        camera={{ position: [3.8, 3.1, 12.5], fov: 30 }}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-300",
                            sceneReady ? "opacity-100" : "opacity-0",
                        )}
                        dpr={[1, 1.75]}
                        gl={{ alpha: true, antialias: true }}
                    >
                        <color args={["#fff7e4"]} attach="background" />
                        <ambientLight intensity={1.1} />
                        <directionalLight intensity={2.2} position={[4, 5, 5]} />
                        <directionalLight intensity={0.8} position={[-5, 3, 1]} />
                        <CameraTarget />
                        <React.Suspense fallback={null}>
                            <KvarteretBuilding
                                onReady={() => setSceneReady(true)}
                                pointer={pointer}
                            />
                        </React.Suspense>
                    </Canvas>
                </SceneErrorBoundary>
            )}
        </div>
    )
}

function CameraTarget() {
    useFrame(({ camera }) => {
        camera.lookAt(new Vector3(0, 1.55, 0))
    })
    return null
}

function KvarteretBuilding({
    onReady,
    pointer,
}: {
    onReady: () => void
    pointer: React.MutableRefObject<PointerTarget>
}) {
    const group = React.useRef<Group>(null)
    const gltf = useGLTF(MODEL_URL)

    React.useEffect(() => {
        gltf.scene.traverse(child => {
            const mesh = child as Mesh
            if (!mesh.isMesh) return

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            for (const material of materials.filter(Boolean) as Material[]) {
                material.side = DoubleSide
                material.needsUpdate = true
            }
        })
        onReady()
    }, [gltf.scene, onReady])

    useFrame(({ clock }, delta) => {
        if (!group.current) return
        const elapsed = clock.getElapsedTime()
        const targetY = pointer.current.active
            ? pointer.current.x * 0.35
            : Math.sin(elapsed * 0.32) * 0.16
        const targetX = pointer.current.active ? -pointer.current.y * 0.12 : -0.02

        group.current.rotation.y = MathUtils.damp(group.current.rotation.y, targetY, 4.8, delta)
        group.current.rotation.x = MathUtils.damp(group.current.rotation.x, targetX, 4.8, delta)
    })

    return (
        <group ref={group} rotation={[-0.02, -0.08, 0]}>
            <Center bottom>
                <primitive object={gltf.scene} scale={0.72} />
                <Text
                    anchorX="center"
                    anchorY="middle"
                    color="#fff7e4"
                    fontSize={0.18}
                    maxWidth={3}
                    position={[1.05, 2.16, 1.2]}
                    rotation={[0, 0, 0]}
                >
                    DET AKADEMISKE KVARTER
                </Text>
            </Center>
        </group>
    )
}

useGLTF.preload(MODEL_URL)
