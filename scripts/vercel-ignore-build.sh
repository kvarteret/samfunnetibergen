#!/usr/bin/env bash
# Vercel's convention is exit 0 to skip, exit 1 to build. Missing history
# must build so a first deployment or shallow clone cannot hide a change.
set -euo pipefail

app="${1:-}"
case "$app" in
  web|studio) ;;
  *) echo "Unknown application; build required"; exit 1 ;;
esac

repo_root="$(git rev-parse --show-toplevel)" || exit 1
cd "$repo_root"

previous_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [[ ! "$previous_sha" =~ ^[a-fA-F0-9]{40}$ ]] || ! git cat-file -e "${previous_sha}^{commit}" 2>/dev/null; then
  echo "Previous deployment commit unavailable; build required"
  exit 1
fi

if git diff --quiet "$previous_sha" HEAD -- \
  "apps/$app" \
  packages \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  .npmrc \
  scripts; then
  echo "No changes to $app or its build inputs; skipping build"
  exit 0
fi

echo "$app or its build inputs changed; build required"
exit 1
