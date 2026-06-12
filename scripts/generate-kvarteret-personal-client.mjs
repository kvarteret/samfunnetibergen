import { execSync } from "node:child_process"

const OPENAPI_SPEC = "./openapi/kvarteret-personal.json"
const OUTPUT_DIR = "src/lib/integrations/kvarteret-personal-api"

const args = [
  "--input",
  OPENAPI_SPEC,
  "--output",
  OUTPUT_DIR,
  "--client",
  "@hey-api/client-fetch",
]

console.log(`Generating client from ${OPENAPI_SPEC} → ${OUTPUT_DIR}`)
execSync(`npx @hey-api/openapi-ts ${args.join(" ")}`, {
  stdio: "inherit",
})

console.log("Done.")
