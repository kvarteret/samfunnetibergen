import { spawnSync } from "node:child_process"
import {
    existsSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const DEFAULT_OPENAPI_URL =
    "https://raw.githubusercontent.com/kvarteret/kvarteret-personal/develop/openapi.json"
const OUTPUT_DIR = "lib/kvarteret-personal-api"

const rootDir = fileURLToPath(new URL("..", import.meta.url))
const isCheck = process.argv.includes("--check")
const tempFiles = []

const resolveOpenApiInput = () => {
    const envInput = process.env.KVARTERET_PERSONAL_OPENAPI?.trim()
    if (envInput) {
        return envInput
    }

    const siblingFile = join(rootDir, "..", "kvarteret-personal", "openapi.json")
    if (existsSync(siblingFile)) {
        return siblingFile
    }

    const siblingRepo = join(rootDir, "..", "kvarteret-personal")
    if (existsSync(siblingRepo)) {
        const result = spawnSync(
            "git",
            ["-C", siblingRepo, "show", "origin/develop:openapi.json"],
            {
                encoding: "utf8",
            },
        )

        if (result.status === 0 && result.stdout.trim()) {
            const tempFile = join(
                mkdtempSync(join(tmpdir(), "kvarteret-personal-openapi-")),
                "openapi.json",
            )
            writeFileSync(tempFile, result.stdout)
            tempFiles.push(tempFile)
            return tempFile
        }
    }

    return DEFAULT_OPENAPI_URL
}

const runGenerator = outputDir => {
    rmSync(outputDir, { force: true, recursive: true })
    const input = resolveOpenApiInput()

    const result = spawnSync(
        "npx",
        ["openapi-ts", "-i", input, "-o", outputDir, "-c", "@hey-api/client-fetch"],
        {
            cwd: rootDir,
            stdio: "inherit",
        },
    )

    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }

    if (!existsSync(join(outputDir, "index.ts"))) {
        process.exit(1)
    }

    const formatResult = spawnSync("npx", ["biome", "check", "--write", outputDir], {
        cwd: rootDir,
        stdio: "inherit",
    })

    if (formatResult.status !== 0) {
        process.exit(formatResult.status ?? 1)
    }
}

const listFiles = dir => {
    if (!existsSync(dir)) {
        return []
    }

    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
            return listFiles(path)
        }

        return [path]
    })
}

const compareGenerated = (actualDir, expectedDir) => {
    const actualFiles = listFiles(actualDir)
        .map(path => relative(actualDir, path))
        .sort()
    const expectedFiles = listFiles(expectedDir)
        .map(path => relative(expectedDir, path))
        .sort()
    const allFiles = [...new Set([...actualFiles, ...expectedFiles])].sort()
    const changedFiles = allFiles.filter(file => {
        const actualPath = join(actualDir, file)
        const expectedPath = join(expectedDir, file)

        if (!existsSync(actualPath) || !existsSync(expectedPath)) {
            return true
        }

        if (statSync(actualPath).size !== statSync(expectedPath).size) {
            return true
        }

        return readFileSync(actualPath, "utf8") !== readFileSync(expectedPath, "utf8")
    })

    if (changedFiles.length > 0) {
        console.error("Generated Kvarteret Personal OpenAPI client is stale:")
        for (const file of changedFiles) {
            console.error(`- ${file}`)
        }
        console.error("Run npm run api:generate and commit the generated client.")
        process.exit(1)
    }
}

if (isCheck) {
    const tempDir = mkdtempSync(join(tmpdir(), "kvarteret-personal-client-"))
    try {
        const generatedDir = join(tempDir, "client")
        runGenerator(generatedDir)
        compareGenerated(join(rootDir, OUTPUT_DIR), generatedDir)
    } finally {
        rmSync(tempDir, { force: true, recursive: true })
    }
} else {
    runGenerator(join(rootDir, OUTPUT_DIR))
}

for (const tempFile of tempFiles) {
    rmSync(tempFile, { force: true })
}
