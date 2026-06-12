#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cp -R "$repo_root/examples/demo-project/." "$tmp/project/"
mkdir -p "$tmp/out"

node "$repo_root/src/cli.js" scan \
  --cwd "$tmp/project" \
  --out "$tmp/out/envprobe.json" \
  --markdown "$tmp/out/ENVPROBE.md" \
  --require node,git \
  --expect-file README.md,package.json

node "$repo_root/src/cli.js" match \
  "$tmp/out/envprobe.json" \
  "$repo_root/requirements/oss-cli.json"

grep -q "EnvProbe Report" "$tmp/out/ENVPROBE.md"
grep -q '"localOnly": true' "$tmp/out/envprobe.json"

echo "Demo output:"
echo "  $tmp/out/envprobe.json"
echo "  $tmp/out/ENVPROBE.md"

