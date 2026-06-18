/**
 * Crescat form/room introspection CLI.
 *
 * Crescat publishes no API spec. This tool reads the live, public Crescat
 * endpoints so a human or an LLM can reconstruct our integration when the venue
 * changes a form or its rooms.
 *
 * Usage:
 *   npm run crescat:introspect -- <slug>
 *       Print a form's normalized template as JSON.
 *
 *   npm run crescat:introspect -- --save <slug>
 *       Write a normalized fixture file to __fixtures__/forms/<slug>.json.
 *
 *   npm run crescat:introspect -- --diff <slug>
 *       Compare the live form template against our fields.ts registry.
 *       Print drift lines and exit 1 when differences exist.
 *
 *   npm run crescat:introspect -- --save-all
 *       Refresh all known slug fixtures in one pass.
 *
 *   npm run crescat:introspect -- --rooms <calendarSlug>
 *       Print a calendar's /resources (bookable room id→name list) as JSON.
 *
 *   npm run crescat:introspect -- --rooms-coverage
 *       For every calendar, list Crescat rooms and Sanity coverage.
 */

import { writeFileSync, mkdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import {
  fetchNormalizedTemplate,
  diffTemplateAgainstRegistry,
  type RegistryEntry,
} from "@/lib/integrations/crescat/form-template"

// ── Constants (kept literal so the script may also run standalone) ───────────

const BASE = "https://app.crescat.io/venue-access"
const UA =
  "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"

const ROOM_CALENDARS = {
  standard: "studentersamfunnet-i-bergen-bookingkalender",
  privat: "studentersamfunnet-i-bergen-bookingkalender-privat",
  karaoke: "studentersamfunnet-i-bergen-bookinkalender-karaoke",
} as const

const KNOWN_SLUGS = [
  "studentersamfunnet-i-bergen-bookingskjema-standard",
  "studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne",
  "studentersamfunnet-i-bergen-booking-av-karoke",
] as const

const FIXTURE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/lib/integrations/crescat/__fixtures__/forms",
)

// ── Registry (mirrors src/lib/integrations/crescat/fields.ts) ───────────────

// Parent IDs and their field IDs + section titles as modelled by our builders.
// When a live form gains a field we don't send, the --diff mode flags it.
const REGISTRY: RegistryEntry[] = [
  {
    parentId: 7896,
    sectionTitle: "Bestilling",
    fieldIds: [57056, 57057, 57058, 80461, 1329447], // FURNITURE, TECH_EQUIPMENT, AUDIENCE_COUNT, NEEDS_AMPHI, OPEN_OR_CLOSED
  },
  {
    parentId: 4989,
    sectionTitle: "Billettsalg / inngangspriser",
    fieldIds: [1443270, 1244809], // FREE_OR_PAID, TICKET_TYPES (external); intern uses only FREE_OR_PAID + TICKET_TYPES under "Billettsalg"
  },
  {
    parentId: 11068,
    sectionTitle: "Mat og drikke", // external form title; intern form uses "Catering/bar" — diff will flag title mismatch for intern
    fieldIds: [80447, 4365154, 4382234], // CATERING_WISHES, BAR_SELF, BAR_KVARTERET
  },
  {
    parentId: 419061,
    sectionTitle: "Er bookingen på vegne av en studentorganisasjon?",
    fieldIds: [3186172, 3186171], // ON_BEHALF_OF_STUDENT_ORG, STUDENT_ORG_NAME
  },
  {
    parentId: 4990,
    sectionTitle: "Fakturainformasjon",
    fieldIds: [54134, 54135, 54136, 54137, 1494616], // INVOICE_CONTACT, INVOICE_ADDRESS, INVOICE_EMAIL, INVOICE_PHONE, INVOICE_ORG_NUMBER
  },
]

// ── Rooms helpers ───────────────────────────────────────────────────────────

interface CrescatResource {
  id: number
  room_title: string | null
  title: string
}

async function fetchResources(
  calendarSlug: string,
): Promise<CrescatResource[]> {
  const res = await fetch(`${BASE}/${calendarSlug}/resources`, {
    headers: { accept: "application/json", "user-agent": UA },
  })
  if (!res.ok) {
    throw new Error(`GET ${calendarSlug}/resources -> HTTP ${res.status}`)
  }
  return (await res.json()) as CrescatResource[]
}

async function fetchSanityRoomIds(): Promise<Map<number, string>> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv"
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"
  const query =
    '*[_type == "room" && defined(crescatRoomId)]{crescatRoomId, "title": title}'
  const url =
    `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { accept: "application/json" } })
  if (!res.ok) {
    throw new Error(`Sanity query -> HTTP ${res.status}`)
  }
  const body = (await res.json()) as {
    result: { crescatRoomId: number; title: string | null }[]
  }
  return new Map(
    body.result.map(room => [room.crescatRoomId, room.title ?? "(uten navn)"]),
  )
}

// ── Form modes ──────────────────────────────────────────────────────────────

async function runPrint(slug: string): Promise<void> {
  const template = await fetchNormalizedTemplate(slug)
  process.stdout.write(`${JSON.stringify(template, null, 2)}\n`)
}

async function runSave(slug: string): Promise<void> {
  const template = await fetchNormalizedTemplate(slug)
  mkdirSync(FIXTURE_DIR, { recursive: true })
  const path = resolve(FIXTURE_DIR, `${slug}.json`)
  writeFileSync(path, `${JSON.stringify(template, null, 2)}\n`, "utf-8")
  process.stdout.write(`Saved: ${path}\n`)
}

async function runDiff(slug: string): Promise<void> {
  const template = await fetchNormalizedTemplate(slug)
  const diffs = diffTemplateAgainstRegistry(template, REGISTRY)
  if (diffs.length === 0) {
    process.stdout.write(`no drift detected for ${slug}\n`)
    return
  }
  for (const line of diffs) {
    process.stderr.write(`${line}\n`)
  }
  process.exit(1)
}

async function runSaveAll(): Promise<void> {
  for (const slug of KNOWN_SLUGS) {
    await runSave(slug)
  }
}

// ── Room modes ──────────────────────────────────────────────────────────────

async function runRooms(calendarSlug: string): Promise<void> {
  const resources = await fetchResources(calendarSlug)
  process.stdout.write(`${JSON.stringify(resources, null, 2)}\n`)
}

async function runCoverage(): Promise<void> {
  const sanityRooms = await fetchSanityRoomIds()
  for (const [label, slug] of Object.entries(ROOM_CALENDARS)) {
    process.stdout.write(`\n# ${label}  (${slug})\n`)
    let resources: CrescatResource[]
    try {
      resources = await fetchResources(slug)
    } catch (error) {
      process.stdout.write(`  ! ${(error as Error).message}\n`)
      continue
    }
    for (const room of resources) {
      const sanityTitle = sanityRooms.get(room.id)
      const mark = sanityTitle ? `in Sanity (${sanityTitle})` : "Crescat-only"
      process.stdout.write(
        `  ${String(room.id).padStart(5)}  ${room.title.padEnd(28)} ${mark}\n`,
      )
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const USAGE = `crescat:introspect — inspect Crescat form/room state

USAGE
  npm run crescat:introspect -- <slug>
  npm run crescat:introspect -- [mode] [arg…]

MODES
  <slug>                   Print normalized form template as JSON.
                           Known slugs:
                             ${KNOWN_SLUGS.join("\n                             ")}

  --diff <slug>            Compare live template against our fields.ts registry.
                           Prints drift lines to stderr. Exit 1 on differences.
                           Section-title mismatches are expected between forms
                           (e.g. intern uses "Billettsalg" vs ekstern "Billettsalg
                           / inngangspriser"); field-level drift is the real
                           concern.

  --save <slug>            Fetch live template and save as a fixture file under
                           src/lib/integrations/crescat/__fixtures__/forms/.

  --save-all               Refresh all known-slug fixtures in one pass.

  --rooms <calendarSlug>   Print a calendar's /resources as JSON (id → name).
                           Known calendars:
                             ${Object.entries(ROOM_CALENDARS)
                               .map(([k, v]) => `${k.padEnd(10)} ${v}`)
                               .join("\n                             ")}

  --rooms-coverage         For every calendar, list each Crescat room and whether
                           a Sanity room exists with that crescatRoomId.

  --completion <shell>     Print shell completion script for the given shell.
                           Supported: bash, zsh, fish.

  --help, -h               Print this help.

EXAMPLES
  npm run crescat:introspect -- studentersamfunnet-i-bergen-bookingskjema-standard
  npm run crescat:introspect -- --diff studentersamfunnet-i-bergen-bookingskjema-standard
  npm run crescat:introspect -- --rooms studentersamfunnet-i-bergen-bookingkalender-privat
  npm run crescat:introspect -- --save-all
  npm run crescat:introspect -- --rooms-coverage

  # Install shell autocomplete:
  source <(npm run crescat:introspect --silent -- --completion bash)   # bash
  source <(npm run crescat:introspect --silent -- --completion zsh)    # zsh
  npm run crescat:introspect --silent -- --completion fish | source    # fish
`

function printHelp(): void {
  process.stdout.write(`${USAGE}\n`)
}

function printCompletion(shell: string): void {
  if (shell === "bash") {
    process.stdout.write(`${BASH_COMPLETION}\n`)
  } else if (shell === "zsh") {
    process.stdout.write(`${ZSH_COMPLETION}\n`)
  } else if (shell === "fish") {
    process.stdout.write(`${FISH_COMPLETION}\n`)
  } else {
    process.stderr.write(
      `Unknown shell: ${shell}. Supported: bash, zsh, fish\n`,
    )
    process.exit(1)
  }
}

const BASH_COMPLETION = `# Crescat introspection autocomplete for bash.
# Usage: source <(npm run crescat:introspect --silent -- --completion bash)
_crescat_introspect() {
  local cur prev words cword
  _init_completion -s || return
  local modes="--diff --save --save-all --rooms --rooms-coverage --completion --help -h"
  local slugs="${KNOWN_SLUGS.join(" ")}"
  local calendars="${Object.values(ROOM_CALENDARS).join(" ")}"
  if [[ $cword -eq 1 ]]; then
    COMPREPLY=($(compgen -W "$modes $slugs" -- "$cur"))
  elif [[ $cword -gt 1 ]]; then
    case "$prev" in
      --diff|--save) COMPREPLY=($(compgen -W "$slugs" -- "$cur")) ;;
      --rooms)       COMPREPLY=($(compgen -W "$calendars" -- "$cur")) ;;
      --completion)  COMPREPLY=($(compgen -W "bash zsh" -- "$cur")) ;;
      *)             COMPREPLY=() ;;
    esac
  fi
}
complete -F _crescat_introspect npm run crescat:introspect --
`

const ZSH_COMPLETION = `# Crescat introspection autocomplete for zsh.
# Usage: source <(npm run crescat:introspect --silent -- --completion zsh)
# _crescat_introspect() {
  local -a modes slugs calendars
  modes=("--diff" "--save" "--save-all" "--rooms" "--rooms-coverage" "--completion" "--help" "-h")
  slugs=(${KNOWN_SLUGS.map(s => `"${s}"`).join(" ")})
  calendars=(${Object.values(ROOM_CALENDARS)
    .map(c => `"${c}"`)
    .join(" ")})

  _arguments \\
    "1: :->first" \\
    "*:: :->rest"

  case "$state" in
    first)
      _describe 'mode' modes
      _describe 'slug' slugs
      ;;
    rest)
      case "$words[1]" in
        --diff|--save) _describe 'slug' slugs ;;
        --rooms)       _describe 'calendar' calendars ;;
        --completion)  _values 'shell' 'bash' 'zsh' ;;
      esac
      ;;
  esac
}
compdef _crescat_introspect 'npm run crescat:introspect'
`

const FISH_COMPLETION = `# Crescat introspection autocomplete for fish.
# Usage: npm run crescat:introspect --silent -- --completion fish | source
function _crescat_slugs
  echo ${KNOWN_SLUGS.join(" ")}
end
function _crescat_calendars
  echo ${Object.values(ROOM_CALENDARS).join(" ")}
end
complete -c npm -n "__fish_seen_subcommand_from run crescat:introspect --; and test (count (commandline -opc)) -eq 4" -a "_crescat_slugs --diff --save --save-all --rooms --rooms-coverage --completion --help"
complete -c npm -n "__fish_seen_subcommand_from run crescat:introspect --; and test (count (commandline -opc)) -gt 4; and string match -q -- '--diff --save' (commandline -opc)[4]" -a "(_crescat_slugs)"
complete -c npm -n "__fish_seen_subcommand_from run crescat:introspect --; and test (count (commandline -opc)) -gt 4; and string match -q '--rooms' (commandline -opc)[4]" -a "(_crescat_calendars)"
complete -c npm -n "__fish_seen_subcommand_from run crescat:introspect --; and test (count (commandline -opc)) -gt 4; and string match -q '--completion' (commandline -opc)[4]" -a "bash zsh fish"
`

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const mode = args[0]

  if (mode === "--help" || mode === "-h") {
    printHelp()
    return
  }

  if (mode === "--completion") {
    const shell = args[1] ?? ""
    printCompletion(shell)
    return
  }

  if (mode === "--rooms") {
    const slug = args[1]
    if (!slug) {
      process.stderr.write("Usage: --rooms <calendarSlug>\n")
      process.exit(1)
    }
    await runRooms(slug)
    return
  }

  if (mode === "--rooms-coverage") {
    await runCoverage()
    return
  }

  if (mode === "--save") {
    const slug = args[1]
    if (!slug) {
      process.stderr.write("Usage: --save <slug>\n")
      process.exit(1)
    }
    await runSave(slug)
    return
  }

  if (mode === "--diff") {
    const slug = args[1]
    if (!slug) {
      process.stderr.write("Usage: --diff <slug>\n")
      process.exit(1)
    }
    await runDiff(slug)
    return
  }

  if (mode === "--save-all") {
    await runSaveAll()
    return
  }

  if (mode && !mode.startsWith("-")) {
    await runPrint(mode)
    return
  }

  printHelp()
  process.exit(1)
}

main().catch(error => {
  process.stderr.write(`${(error as Error).message}\n`)
  process.exit(1)
})
