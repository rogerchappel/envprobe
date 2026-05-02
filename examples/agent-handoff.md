# Agent handoff example

Run EnvProbe before assigning local CLI work:

```sh
envprobe scan --out envprobe.json --markdown ENVPROBE.md --require node,git --expect-file README.md,package.json
envprobe match envprobe.json requirements/oss-cli.json
```

Attach `ENVPROBE.md` to the task brief so reviewers can see missing tools, missing expected files, and configured env signal names without exposing secrets.
