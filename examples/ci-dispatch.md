# CI Dispatch Readiness Example

Use EnvProbe before assigning a checkout to an automated test or release lane.
The scan produces local JSON for automation and Markdown for a human handoff.

## Command

```sh
node src/cli.js scan \
  --out /tmp/envprobe-ci/envprobe.json \
  --markdown /tmp/envprobe-ci/ENVPROBE.md \
  --require node,git \
  --expect-file README.md,package.json \
  --env GITHUB_TOKEN,NPM_TOKEN

node src/cli.js match /tmp/envprobe-ci/envprobe.json requirements/oss-cli.json
```

## What The Dispatcher Gets

- Tool availability and versions for required local commands.
- Whether expected files exist in the checkout.
- Git branch, commit, and dirty-worktree state.
- Presence-only env signals for named variables, without printing values.
- A match result that can stop dispatch when required capabilities are missing.

## Review Notes

Keep the JSON in machine logs and attach the Markdown report to handoff notes.
If an env signal is missing, ask for the capability by name instead of exposing
or copying a secret value.
