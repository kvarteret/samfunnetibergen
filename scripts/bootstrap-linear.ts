/**
 * Fetches all Linear IDs needed for the feedback integration and prints them
 * as environment variable assignments ready to paste into kvarteret-personal's .env.
 *
 * Usage:
 *   LINEAR_API_KEY=lin_api_xxx bun run scripts/bootstrap-linear.ts
 */

const GRAPHQL_ENDPOINT = "https://api.linear.app/graphql"

const BOOTSTRAP_QUERY = `
  query Bootstrap {
    teams {
      nodes {
        id
        name
        states {
          nodes { id name type }
        }
        projects {
          nodes { id name }
        }
      }
    }
  }
`

export type State = { id: string; name: string; type: string }
type Project = { id: string; name: string }
type Team = {
    id: string
    name: string
    states: { nodes: State[] }
    projects: { nodes: Project[] }
}
type BootstrapResult = { data?: { teams?: { nodes: Team[] } }; errors?: Array<{ message: string }> }

const apiKey = process.env.LINEAR_API_KEY
if (!apiKey) {
    console.error("ERROR: LINEAR_API_KEY is not set.")
    console.error("Usage: LINEAR_API_KEY=lin_api_xxx bun run scripts/bootstrap-linear.ts")
    process.exit(1)
}

const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: BOOTSTRAP_QUERY }),
})

const result = (await response.json()) as BootstrapResult

if (result.errors?.length) {
    console.error("GraphQL errors:", result.errors)
    process.exit(1)
}

const teams = result.data?.teams?.nodes ?? []

for (const team of teams) {
    console.log(`\n=== Team: ${team.name} (${team.id}) ===`)

    console.log("\n-- States --")
    for (const s of team.states.nodes) {
        console.log(`  ${s.name.padEnd(20)} ${s.id}  [${s.type}]`)
    }

    console.log("\n-- Projects --")
    for (const p of team.projects.nodes) {
        console.log(`  ${p.name.padEnd(30)} ${p.id}`)
    }
}

// Find E-Tjenesten team
const etjenesten = teams.find(t => t.name === "E-Tjenesten")
if (!etjenesten) {
    console.log("\n\nCould not find team named 'E-Tjenesten' — copy IDs manually from above.")
    process.exit(0)
}

const triage = etjenesten.states.nodes.find(s => s.name === "Triage")
const projects = etjenesten.projects.nodes
const nettside = projects.find(
    p => p.name.toLowerCase().includes("nettside") || p.name.toLowerCase().includes("kvarteret.no"),
)
const personal = projects.find(
    p => p.name.toLowerCase().includes("personal") || p.name.toLowerCase().includes("plattform"),
)
const internbevis = projects.find(
    p => p.name.toLowerCase().includes("internbevis") || p.name.toLowerCase().includes("bevis"),
)

console.log("\n\n# === Paste these into kvarteret-personal .env ===\n")
console.log(`LINEAR_API_KEY=${apiKey}`)
console.log(`LINEAR_TEAM_ID=${etjenesten.id}`)
console.log(`LINEAR_PROJECT_ID_PERSONAL=${personal?.id ?? "# NOT FOUND — set manually"}`)
console.log(`LINEAR_PROJECT_ID_INTERNBEVIS=${internbevis?.id ?? "# NOT FOUND — set manually"}`)
console.log(`LINEAR_PROJECT_ID_NETTSIDE=${nettside?.id ?? "# NOT FOUND — set manually"}`)
console.log(`LINEAR_STATE_ID_TRIAGE=${triage?.id ?? "# NOT FOUND — set manually"}`)
