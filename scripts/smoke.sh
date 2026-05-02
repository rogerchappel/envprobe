#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/package.json" <<'JSON'
{"name":"envprobe-smoke","scripts":{"test":"node --test"}}
JSON
cat > "$tmp/README.md" <<'MD'
# smoke
MD
node "$repo_root/src/cli.js" scan --cwd "$tmp" --out "$tmp/envprobe.json" --markdown "$tmp/ENVPROBE.md" --require node --expect-file README.md
node "$repo_root/src/cli.js" match "$tmp/envprobe.json" "$repo_root/requirements/oss-cli.json"
test -s "$tmp/envprobe.json"
test -s "$tmp/ENVPROBE.md"
