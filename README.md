# envprobe

envprobe is a local-first capability scanner for agentic development workflows. It snapshots whether a machine can safely build, test, and hand off a project before an orchestrator assigns work.

It reports tool versions, project signals, missing expected files, Git state, OS/disk basics, and environment **signal names only**. It never prints secret values and makes no network calls in core flows.

## 60-second demo

```sh
npm install
node src/cli.js scan --out envprobe.json --markdown ENVPROBE.md --require node,git --expect-file README.md,package.json
node src/cli.js match envprobe.json requirements/oss-cli.json
```

Open `ENVPROBE.md` for the human-readable report, or pass `--json` to inspect the machine-readable profile in stdout.

## Install

From npm once published:

```sh
npm install -g envprobe
```

For local development from this repository:

```sh
npm install
npm run check
npm test
bash scripts/validate.sh
```

## CLI reference

```sh
envprobe scan [--cwd DIR] [--out FILE] [--markdown FILE] [--json] \
  [--cache .envprobe/cache.json] [--ttl 300] [--fresh] \
  [--require node,git,pnpm] [--expect-file README.md,package.json] [--env GITHUB_TOKEN,NPM_TOKEN]

envprobe match PROFILE.json REQUIREMENTS.json [--json]

envprobe doctor --require node,git,pnpm [--cwd DIR] [--json]

envprobe --help
envprobe --version
```

### `scan`

Creates a capability profile for the current project or `--cwd`. Add `--cache FILE --ttl SECONDS` to reuse a recent scan, or `--fresh` to force a rescan and refresh that cache.

Detected signals include:

- OS, CPU count, memory, and disk free/capacity basics.
- Tool availability and versions for Node/package managers/Git/GitHub CLI/Docker/common runtimes.
- Node project metadata and package scripts when `package.json` exists.
- Git branch, commit, and dirty-worktree state.
- Expected files and missing files.
- Env signal names and configured/missing status only.

### `match`

Compares a profile against a requirements JSON file and exits non-zero when required capabilities are missing.

```json
{
  "tools": ["node", "git"],
  "files": ["README.md", "package.json"],
  "env": []
}
```

### `doctor`

Shortcut for checking required tools on the current machine:

```sh
envprobe doctor --require node,pnpm,git
```

## Output examples

JSON profile excerpt:

```json
{
  "schemaVersion": 1,
  "safety": {
    "localOnly": true,
    "network": "disabled-by-default",
    "secrets": "presence-only"
  },
  "env": [
    { "name": "GITHUB_TOKEN", "present": false }
  ]
}
```

Markdown reports include reviewer-oriented risks and next steps, then tables for tools, expected files, and env signals.

## Local-first safety model

- No hidden network calls in scan, match, or doctor.
- No credential exfiltration: environment values are never read into output; only requested/default signal names and presence booleans are reported.
- No destructive filesystem, Git, install, or mutation operations.
- Deterministic JSON/Markdown outputs that agents and humans can review.

## Non-goals for V1

- Installing missing tools automatically.
- Privileged system inspection.
- Hosted services, telemetry, or background daemons.
- Publishing, merging, or mutating remote repositories.
- Printing or validating actual secret values.

## Agent handoff workflow

Use EnvProbe before dispatching an agent to a local checkout:

```sh
envprobe scan --out envprobe.json --markdown ENVPROBE.md --require node,git --expect-file README.md,package.json
envprobe match envprobe.json requirements/oss-cli.json
```

Attach `ENVPROBE.md` to the task brief. The receiving agent gets capability facts and gaps without secret leakage.

See [examples/agent-handoff.md](examples/agent-handoff.md) for a compact handoff snippet.
See [examples/ci-dispatch.md](examples/ci-dispatch.md) for a CI dispatch
readiness example.

For a fixture-backed version of this flow, run:

```sh
bash demo/run-agent-readiness.sh
```

The script scans `examples/demo-project`, writes both JSON and Markdown output,
and checks the result against `requirements/oss-cli.json`.

Promotion drafts for this workflow live in
[docs/promo/social-hooks.md](docs/promo/social-hooks.md).

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

`scripts/validate.sh` checks required repo files and runs package scripts that exist. Missing optional `agent-qc` is treated as a skip, not a failure.

## Documentation

- [Product requirements](docs/PRD.md)
- [Task breakdown](docs/TASKS.md)
- [Orchestration plan](docs/ORCHESTRATION.md)
- [Machine orchestration manifest](docs/orchestration.json)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Development

Use Node.js 20 or newer. Run these checks before opening a PR:

```sh
npm run build
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## License

MIT
