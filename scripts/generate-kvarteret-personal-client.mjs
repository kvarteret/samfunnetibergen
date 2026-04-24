import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const DEFAULT_OPENAPI_URL =
    "https://raw.githubusercontent.com/kvarteret/kvarteret-personal/develop/openapi.json"
const OUTPUT_DIR = "lib/kvarteret-personal-api"
const SPEC_SNAPSHOT = "openapi/kvarteret-personal.json"

const rootDir = fileURLToPath(new URL("..", import.meta.url))
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

    // Copy spec snapshot so it's tracked in the repo
    const snapshotPath = join(rootDir, SPEC_SNAPSHOT)
    mkdirSync(join(rootDir, "openapi"), { recursive: true })
    if (input.startsWith("http")) {
        const fetchResult = spawnSync("curl", ["-fsSL", input, "-o", snapshotPath], {
            stdio: "inherit",
        })
        if (fetchResult.status !== 0) {
            console.warn("Warning: could not snapshot remote OpenAPI spec")
        }
    } else {
        copyFileSync(input, snapshotPath)
    }
}

runGenerator(join(rootDir, OUTPUT_DIR))

for (const tempFile of tempFiles) {
    rmSync(tempFile, { force: true })
}
