# EnvProbe Social Hooks

Use these as draft starting points. They are grounded in the current README and
CLI behavior: local scans, no hidden network calls, presence-only env reporting,
and JSON plus Markdown output.

## Short posts

1. Before assigning an agent to a checkout, run `envprobe scan`. It records tool
   versions, expected files, Git state, and env signal names without printing
   secret values.
2. EnvProbe turns "can this machine build this repo?" into a local JSON and
   Markdown report. No API keys, no network calls, no credential values.
3. Agent handoffs get easier when the receiving agent starts with facts:
   available tools, missing files, dirty Git state, and explicit next steps.

## Demo angle

Show the fixture-backed demo:

```sh
bash demo/run-agent-readiness.sh
```

Then open the generated `ENVPROBE.md` path printed by the script and point out
the safety section, expected-file table, and match result.

