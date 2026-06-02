import { mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { Accessor, Document, NodeIO } from "@gltf-transform/core"

const OUT = resolve("public/models/kvarteret-building.glb")

const COLORS = {
    red: [0.99, 0.16, 0.13, 1],
    redDark: [0.86, 0.08, 0.07, 1],
    white: [0.98, 0.95, 0.94, 1],
    navy: [0.03, 0.08, 0.2, 1],
    glass: [0.08, 0.14, 0.3, 1],
    shadow: [0.1, 0.1, 0.1, 1],
}

const doc = new Document()
const buffer = doc.createBuffer("kvarteret-buffer")
const scene = doc.createScene("Kvarteret")
const root = doc.createNode("building-root")
scene.addChild(root)

const materials = Object.fromEntries(
    Object.entries(COLORS).map(([name, color]) => [
        name,
        doc
            .createMaterial(name)
            .setBaseColorFactor(color)
            .setRoughnessFactor(0.72)
            .setMetallicFactor(0),
    ]),
)

materials.glass.setAlphaMode("OPAQUE").setRoughnessFactor(0.38)

function quaternionY(radians) {
    return [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)]
}

function createBoxMesh(name, materialName) {
    const positions = new Float32Array([
        // front
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        // back
        0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
        // left
        -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
        // right
        0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
        // top
        -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
        // bottom
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    ])
    const normals = new Float32Array([
        // front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        // back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        // left
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        // right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        // top
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        // bottom
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    ])
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18,
        16, 18, 19, 20, 21, 22, 20, 22, 23,
    ])

    if (normals.length !== positions.length) {
        throw new Error(
            `Invalid ${name} normals: expected ${positions.length}, received ${normals.length}`,
        )
    }

    const position = doc
        .createAccessor(`${name}-position`, buffer)
        .setType(Accessor.Type.VEC3)
        .setArray(positions)
    const normal = doc
        .createAccessor(`${name}-normal`, buffer)
        .setType(Accessor.Type.VEC3)
        .setArray(normals)
    const index = doc
        .createAccessor(`${name}-indices`, buffer)
        .setType(Accessor.Type.SCALAR)
        .setArray(indices)

    const primitive = doc
        .createPrimitive()
        .setAttribute("POSITION", position)
        .setAttribute("NORMAL", normal)
        .setIndices(index)
        .setMaterial(materials[materialName])

    return doc.createMesh(name).addPrimitive(primitive)
}

const boxMeshes = new Map()

function box(name, material, translation, scale, rotationY = 0) {
    const key = `${material}:${scale.join(",")}`
    let mesh = boxMeshes.get(key)
    if (!mesh) {
        mesh = createBoxMesh(`${material}-${boxMeshes.size}`, material)
        boxMeshes.set(key, mesh)
    }
    const node = doc
        .createNode(name)
        .setMesh(mesh)
        .setTranslation(translation)
        .setScale(scale)
        .setRotation(quaternionY(rotationY))
    root.addChild(node)
    return node
}

function addWing({ name, x, z, width, depth, rotationY = 0 }) {
    const floors = 3
    const height = 3.4
    const facadeZ = z + depth / 2 + 0.025

    box(`${name}-mass`, "red", [x, height / 2, z], [width, height, depth], rotationY)
    box(
        `${name}-roof-cap`,
        "white",
        [x, height + 0.12, z],
        [width + 0.25, 0.22, depth + 0.22],
        rotationY,
    )

    for (let floor = 0; floor <= floors; floor += 1) {
        const y = 0.65 + floor * 0.9
        box(
            `${name}-floor-band-${floor}`,
            "white",
            [x, y, facadeZ],
            [width + 0.04, 0.1, 0.08],
            rotationY,
        )
    }

    const columnCount = Math.max(7, Math.round(width * 1.1))
    for (let i = 0; i <= columnCount; i += 1) {
        const localX = -width / 2 + (i / columnCount) * width
        box(
            `${name}-pilaster-${i}`,
            "white",
            [x + localX, 1.85, facadeZ + 0.01],
            [0.09, 2.85, 0.09],
            rotationY,
        )
    }

    for (let floor = 0; floor < floors; floor += 1) {
        const y = 1.05 + floor * 0.9
        for (let i = 0; i < columnCount; i += 1) {
            if (floor === 0 && i % 5 === 2) continue
            const localX = -width / 2 + 0.35 + i * ((width - 0.7) / columnCount)
            box(
                `${name}-window-${floor}-${i}`,
                "navy",
                [x + localX, y, facadeZ + 0.07],
                [0.18, 0.42, 0.07],
                rotationY,
            )
            box(
                `${name}-window-trim-${floor}-${i}`,
                "white",
                [x + localX, y, facadeZ + 0.04],
                [0.26, 0.52, 0.04],
                rotationY,
            )
        }
    }
}

addWing({ name: "front-wing", x: 0.55, z: 0, width: 7.8, depth: 1.45 })
addWing({ name: "left-wing", x: -3.65, z: -1.85, width: 4.8, depth: 1.25, rotationY: -0.72 })

box("corner-white-spine", "white", [-3.45, 1.75, 0.8], [0.22, 3.3, 1.55], -0.36)
box("entrance-cutout", "white", [1.15, 0.72, 0.78], [0.85, 1.25, 0.12])
box("entrance-door", "shadow", [1.15, 0.62, 0.86], [0.34, 1.12, 0.12])
box("entrance-side-glass-left", "glass", [0.9, 0.8, 0.91], [0.16, 0.88, 0.08])
box("entrance-side-glass-right", "glass", [1.43, 0.8, 0.91], [0.16, 0.88, 0.08])
box("entrance-canopy", "navy", [1.18, 1.35, 1.02], [0.98, 0.16, 0.32])
box("sign-plate", "redDark", [1.05, 2.15, 0.86], [3.05, 0.34, 0.08])

box("ground-shadow", "shadow", [-0.45, -0.03, -0.35], [8.8, 0.06, 3.4])

await mkdir(dirname(OUT), { recursive: true })
await new NodeIO().write(OUT, doc)

console.log(`Generated ${OUT}`)
