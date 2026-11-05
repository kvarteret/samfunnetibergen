#!/usr/bin/env bash
# Sets up Sanity Context for Mime, one step at a time. Run from the repo root:
#
#   apps/mime/scripts/setup-sanity-context.sh schema      # redeploy the schema (Release Studio)
#   apps/mime/scripts/setup-sanity-context.sh embeddings  # turn on dataset embeddings
#   apps/mime/scripts/setup-sanity-context.sh endpoint    # copy instructions + filter, open the Context app
#   apps/mime/scripts/setup-sanity-context.sh token       # org token -> Infisical /mime (never printed)
#   apps/mime/scripts/setup-sanity-context.sh check       # list the endpoint's tools with that token
#
# Needs: gh, npx, jq, and the Infisical CLI pinned in mise.toml
# (mise install; infisical login --domain=https://secrets.samfunnetibergen.no).

set -euo pipefail

ORG_ID="ohrUT7FPF"
PROJECT_ID="mkjoahvv"
DATASET="production"
ENDPOINT_NAME="${ENDPOINT_NAME:-mime}"
MCP_URL="https://api.sanity.io/v2026-11-03/context/organizations/${ORG_ID}/mcp/${ENDPOINT_NAME}"

INFISICAL_DOMAIN="https://secrets.samfunnetibergen.no/api"
INFISICAL_PROJECT="cb100288-29b5-44a8-9bde-86815cdbb63d"
INFISICAL_ENV="prod"
INFISICAL_PATH="/mime"

# Works from any directory: paths are relative to this script.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIME="$ROOT/apps/mime"
STUDIO="$ROOT/apps/studio"

GROQ_FILTER='_type in ["arrangement", "room", "studentGroup", "eventType", "eventTaxonomyGroup", "page", "homePage", "roomsPage", "groupsPage", "usefulInfoPage", "kontaktPage", "sponsorsPage", "linkInBio", "navbar", "footer", "siteMetadata", "internbevisBenefit"]'

# What gets embedded per document: titles, names and descriptions in both
# languages. Sanity refuses dereferences (->) in this projection.
EMBEDDINGS_PROJECTION='{ _type, "title": coalesce(localizedTitle[language == "nb"][0].value, localizedName[language == "nb"][0].value, title, name), "titleEn": coalesce(localizedTitle[language == "en"][0].value, localizedName[language == "en"][0].value), "description": pt::text(coalesce(localizedDescription[language == "nb"][0].value, description)), "descriptionEn": pt::text(localizedDescription[language == "en"][0].value) }'

need() { command -v "$1" >/dev/null || { echo "Missing: $1. $2" >&2; exit 1; }; }

step_schema() {
  # Re-releases Studio from develop (what production already runs) and
  # registers the deployed schema with Sanity.
  need gh "Install the GitHub CLI."
  gh workflow run release-studio-production.yml \
    -f ref=develop \
    -f promote=true \
    -f register_external=true \
    -f "smoke_paths=/ /structure/arrangement /static/manifest.webmanifest"
  echo "Started Release Studio. Follow it with: gh run watch \$(gh run list --workflow release-studio-production.yml --limit 1 --json databaseId -q '.[0].databaseId')"
}

step_embeddings() {
  # Embeddings are billed per dataset; see sanity.io/manage → Usage.
  (cd "$STUDIO" && npx sanity datasets embeddings enable "$DATASET" --projection "$EMBEDDINGS_PROJECTION")
  (cd "$STUDIO" && npx sanity datasets embeddings status "$DATASET")
}

step_endpoint() {
  # The Context app has no CLI: create the endpoint by hand. This puts each
  # value on the clipboard in turn.
  cat <<EOF
In the Context app (opening the Sanity dashboard now), create an MCP:
  Title:        Mime
  Name:         ${ENDPOINT_NAME}   (immutable; the URL uses it)
  Source:       dataset ${PROJECT_ID}.${DATASET}, workspace default,
                perspective published, semantic search on
EOF
  open "https://www.sanity.io/@${ORG_ID}" 2>/dev/null || true
  # Without a UTF-8 locale pbcopy reads the file as Mac Roman (ø → √∏).
  LC_ALL=en_US.UTF-8 pbcopy < "$MIME/context-instructions.md"
  read -r -p "Instructions are on the clipboard: paste them into Instructions, then press Enter. "
  printf '%s' "$GROQ_FILTER" | LC_ALL=en_US.UTF-8 pbcopy
  read -r -p "GROQ filter is on the clipboard: paste it into GROQ filter, save, then press Enter. "
  echo "Endpoint URL: $MCP_URL"
}

infisical_set() {
  # Values go through a private temp file, never the command line.
  local file
  file="$(mktemp)"
  chmod 600 "$file"
  trap 'rm -f "$file"' RETURN
  cat > "$file"
  infisical secrets set --file="$file" \
    --domain="$INFISICAL_DOMAIN" \
    --projectId="$INFISICAL_PROJECT" \
    --env="$INFISICAL_ENV" \
    --path="$INFISICAL_PATH" >/dev/null
}

step_token() {
  need jq "brew install jq"
  need infisical "Run mise install (mise.toml pins it), then: infisical login --domain=https://secrets.samfunnetibergen.no"
  local json token
  # Organization tokens with grants need @sanity/cli 8.27 or later; Studio's
  # bundled CLI is older.
  json="$(npx --yes @sanity/cli@8.27.0 tokens create "Mime Context (Slack bot)" \
    --organization "$ORG_ID" --grant context=viewer --json)"
  token="$(jq -r '.key // .token // empty' <<<"$json")"
  if [[ -z "$token" ]]; then
    echo "Could not read the token from the CLI output; create it in Manage instead." >&2
    jq 'del(.key, .token)' <<<"$json" >&2
    exit 1
  fi
  printf 'SANITY_CONTEXT_TOKEN=%s\nSANITY_CONTEXT_MCP_URL=%s\n' "$token" "$MCP_URL" | infisical_set
  unset token json
  echo "Saved SANITY_CONTEXT_TOKEN and SANITY_CONTEXT_MCP_URL to Infisical ${INFISICAL_PATH} (${INFISICAL_ENV})."
  echo "Mime picks them up on its next deploy (Deploy Mime workflow)."
}

step_check() {
  need infisical "Run mise install (mise.toml pins it)."
  # Lists the endpoint's tools with the stored token; prints names only.
  infisical run --domain="$INFISICAL_DOMAIN" --projectId="$INFISICAL_PROJECT" \
    --env="$INFISICAL_ENV" --path="$INFISICAL_PATH" -- \
    bash -c 'curl -sS "$SANITY_CONTEXT_MCP_URL" \
      -H "Authorization: Bearer $SANITY_CONTEXT_TOKEN" \
      -H "content-type: application/json" \
      -H "accept: application/json, text/event-stream" \
      -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}"' |
    sed -n 's/^data: //p; /^{/p' | jq -r '.result.tools[]?.name // .error'
}

case "${1:-}" in
  schema) step_schema ;;
  embeddings) step_embeddings ;;
  endpoint) step_endpoint ;;
  token) step_token ;;
  check) step_check ;;
  *)
    sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
