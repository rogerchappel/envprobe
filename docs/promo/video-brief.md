# EnvProbe Video Brief

## Angle

Show an agent handoff starting with machine facts instead of assumptions:
required tools, expected files, Git state, and presence-only env signals.

## 60-second Outline

1. Open a small demo project and explain that an agent is about to receive it.
2. Run `bash demo/run-agent-readiness.sh`.
3. Show the generated `ENVPROBE.md` path printed by the script.
4. Point to the safety model: local scan, no hidden network calls, secret values
   are not printed.
5. Show the match step against `requirements/oss-cli.json` and explain that
   gaps become explicit before dispatch.

## Social Hooks

- Before handing a repo to an agent, ask the local machine what it can actually
  do. EnvProbe turns that into JSON and Markdown.
- EnvProbe reports capability signals without dumping secret values: tools,
  files, Git state, and env names only.
- Agent dispatch gets less guessy when the handoff includes a local readiness
  report and a requirements match.

## Guardrails

- EnvProbe does not install missing tools.
- It is not a hosted service or telemetry agent.
- Review generated reports before sharing them outside the workspace.
