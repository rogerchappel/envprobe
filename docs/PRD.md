# PRD: envprobe

Status: ready
Decision: build now

## Scorecard

Total: 87/100
Band: build now
Last scored: 2026-05-02
Scored by: Atlas

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 17/20 | Clear pain in high-throughput agentic development workflows. |
| Demand signal | 18/20 | Strong internal OSS sprint need plus adjacent public tooling demand. |
| V1 buildability | 19/20 | Feasible as a deterministic local-first CLI with fixtures and smoke tests. |
| Differentiation | 12/15 | Focused on agent handoff/review gaps rather than broad platform replacement. |
| Agentic workflow leverage | 15/15 | Directly improves agent dispatch, supervision, verification, or handoff quality. |
| Distribution potential | 6/10 | Easy to demo with real repo/PR workflows and build-in-public examples. |

## Pitch

A capability snapshot CLI that tells orchestrators exactly what a machine can safely build, test, and publish before assigning agent work.

## Why It Matters

Agents fail slowly when a node lacks pnpm, Python, Docker, browser deps, credentials, or disk. EnvProbe gives dispatchers a fast, non-secret inventory with confidence scores and missing capability hints.

## Qualification

### Pub Test

“A capability snapshot CLI that tells orchestrators exactly what a machine can safely build, test, and publish before assigning agent work.” is understandable in one sentence by a developer who has used coding agents, CI, or multi-branch OSS workflows.

### Competitors / Adjacent Tools

- `mise doctor`, `asdf`, `nvm`, `pyenv` — environment-specific checks, not orchestrator-ready capability manifests.
- CI runner labels — useful but static and not detailed enough for local agent machines.
- OpenClaw node capabilities — adjacent need; EnvProbe can produce a portable manifest.

### Star / Demand Signal

Agent coding workflows, CI-heavy repos, and local OSS factories repeatedly need better proof, isolation, reproducibility, and review affordances. The recent sprint pipeline already has `repoctx`, `taskbrief`, `branchbrief`, `qualitygate`, `prpack`, `tooltrace`, `stackforge`, and `crewcmd`; this idea fills a neighboring gap without replacing those projects.

### Real Problem

Roger's OSS sprint is pushing multiple agents, repos, branches, checks, and handoffs at once. This project removes one recurring source of ambiguity or failure from that pipeline while remaining useful to any developer team adopting coding agents.

### V1 Buildability

V1 can be implemented as a TypeScript CLI using deterministic filesystem/git/process operations, fixture repos, and Markdown/JSON output. It does not require a hosted backend, hidden LLM calls, or privileged credentials.

## V1 Scope

- `envprobe scan` detects language runtimes, package managers, git/gh, Docker, browsers, disk, OS, and selected CLIs.
- Redacted credential presence checks: report configured/missing without values.
- Capability profile JSON and human Markdown.
- Policy file for required capabilities per task template.
- `envprobe match <profile> <requirements>` exits non-zero on gaps.
- Cache with TTL and `--fresh` rescan option.

## Out of Scope

- No secret exfiltration.
- No installing tools automatically in V1.
- No privileged system inspection.

## CLI/API Sketch

```bash
envprobe scan --out envprobe.json
envprobe scan --markdown ENVPROBE.md
envprobe match envprobe.json requirements/oss-cli.json
envprobe doctor --require pnpm,node,git,gh
```

## Verification

- Unit tests for parser/detector outputs.
- Fixture PATH tests with fake binaries.
- Snapshot tests for redacted profile JSON.
- Smoke test on current host with no secret values printed.

## Agent Prompt

Build `envprobe`, a safe local capability scanner for agent orchestration. It should detect tools and versions, avoid exposing secrets, compare profiles against task requirements, and emit deterministic JSON/Markdown.
