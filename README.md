# envprobe

envprobe snapshots what a machine can safely build, test, and publish before an orchestrator assigns work.

## Status

This repository is an early StackForge scaffold. The public contract is the PRD-driven V1 described in `docs/PRD.md`; implementation should stay local-first, deterministic, and reviewable.

## What it will do

- Detect runtimes, package managers, GitHub tooling, Docker, browsers, OS, and disk basics.
- Report credential presence only as configured/missing without exposing values.
- Emit deterministic JSON and Markdown capability profiles.
- Compare profiles against task requirements with actionable missing-capability hints.

## Install

```sh
npm install envprobe
```

For local development from this repository:

```sh
npm install
npm test
```

## CLI sketch

```sh
envprobe scan --out envprobe.json
envprobe scan --markdown ENVPROBE.md
envprobe match envprobe.json requirements/oss-cli.json
envprobe doctor --require pnpm,node,git,gh
```

These commands describe the intended V1 interface from the PRD. Keep implementation changes aligned with `docs/TASKS.md` and update this section as behavior lands.

## Local-first safety

- No hidden network calls in core flows.
- No credential exfiltration or secret value printing.
- No destructive filesystem or Git operations without explicit user intent.
- Prefer deterministic JSON/Markdown output that agents and humans can review.

## Verify

Run the local validation script before opening a pull request:

```sh
npm test
bash scripts/validate.sh
```

`scripts/validate.sh` checks required repo files and runs package scripts that exist. Missing optional `agent-qc` is treated as a skip, not a failure.

## Documentation

- [Product requirements](docs/PRD.md)
- [Task breakdown](docs/TASKS.md)
- [Orchestration plan](docs/ORCHESTRATION.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

MIT
