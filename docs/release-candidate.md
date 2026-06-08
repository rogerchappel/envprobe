# Release candidate readiness

Generated: 2026-05-05T21:27:32Z
Branch: `release-candidate/readiness`
Base: `main`

## Verification

Status: PASS

Checks run:
- `npm ci`
- `npm run release:check`
- `bash scripts/validate.sh`
- `node releasebox check .`

## Check output summary

    ## npm ci
    ```
    npm ci
    ```
    ```text
    
    up to date, audited 1 package in 121ms
    
    found 0 vulnerabilities
    ```
    RESULT: 0 (1s)
    
    ## npm run release:check
    ```
    npm run release:check
    ```
    ```text
    
    > envprobe@0.1.0 release:check
    > npm run build && npm test && npm run smoke && npm run package:smoke
    
    
    > envprobe@0.1.0 build
    > node --check src/index.js && node --check src/cli.js
    
    
    > envprobe@0.1.0 test
    > node --test
    
    ✔ scan reports tools, files, and env signals without values (152.569292ms)
    ✔ scan can reuse an explicit cache until fresh is requested (41.073292ms)
    ✔ match identifies missing capabilities (0.20075ms)
    ✔ markdown report is stable and redacted (0.153333ms)
    ✔ cli scan and match run end-to-end (633.658416ms)
    ℹ tests 5
    ℹ suites 0
    ℹ pass 5
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 897.996708
    
    > envprobe@0.1.0 smoke
    > bash scripts/smoke.sh
    
    envprobe scan complete: ready
    PASS envprobe match
    
    npm notice
    npm notice package: envprobe@0.1.0
    npm notice Tarball Contents
    npm notice 1.1kB LICENSE
    npm notice 4.3kB README.md
    npm notice 287B docs/orchestration.json
    npm notice 1.5kB docs/ORCHESTRATION.md
    npm notice 3.9kB docs/PRD.md
    npm notice 297B docs/README.md
    npm notice 4.6kB docs/release-candidate.md
    npm notice 1.7kB docs/TASKS.md
    npm notice 408B examples/agent-handoff.md
    npm notice 850B package.json
    npm notice 63B requirements/oss-cli.json
    npm notice 578B scripts/smoke.sh
    npm notice 3.3kB scripts/validate.sh
    npm notice 3.6kB src/cli.js
    npm notice 10.7kB src/index.js
    npm notice Tarball Details
    npm notice name: envprobe
    npm notice version: 0.1.0
    npm notice filename: envprobe-0.1.0.tgz
    npm notice package size: 12.9 kB
    npm notice unpacked size: 37.1 kB
    npm notice shasum: 2a55883ac344208474260c16441724db083da81a
    npm notice integrity: sha512-9/Z7eoCMvqRSW[...]q4rs0UDAdrNZg==
    npm notice total files: 15
    npm notice
    envprobe-0.1.0.tgz
    ```
    RESULT: 0 (2s)
    
    ## bash scripts/validate.sh
    ```
    bash scripts/validate.sh
    ```
    ```text
    Checking envprobe required files...
    PASS: required file exists: README.md
    PASS: required file exists: AGENTS.md
    PASS: required file exists: CONTRIBUTING.md
    PASS: required file exists: SECURITY.md
    PASS: required file exists: .github/pull_request_template.md
    PASS: required file exists: scripts/validate.sh
    
    Checking envprobe required directories...
    PASS: required directory exists: .github
    PASS: required directory exists: docs
    PASS: required directory exists: scripts
    
    Running local project checks where present...
    NOTE: using package manager: npm
    
    > envprobe@0.1.0 check
    > node --check src/index.js && node --check src/cli.js
    
    PASS: package script: check
    
    > envprobe@0.1.0 test
    > node --test
    
    ✔ scan reports tools, files, and env signals without values (162.953125ms)
    ✔ scan can reuse an explicit cache until fresh is requested (49.702542ms)
    ✔ match identifies missing capabilities (0.234583ms)
    ✔ markdown report is stable and redacted (0.162709ms)
    ✔ cli scan and match run end-to-end (693.888125ms)
    ℹ tests 5
    ℹ suites 0
    ℹ pass 5
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 982.940792
    PASS: package script: test
    
    > envprobe@0.1.0 build
    > node --check src/index.js && node --check src/cli.js
    
    PASS: package script: build
    NOTE: agent-qc not installed; skipping optional agent check
    
    Validation passed.
    ```
    RESULT: 0 (2s)
    
    ## ReleaseBox check
    ```
    node '/Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js' check .
    ```
    ```text
    ✅ releasebox config: node-cli
    ✅ ci workflow: .github/workflows/ci.yml
    ✅ release dry run workflow: .github/workflows/release-dry-run.yml
    ✅ task breakdown: docs/TASKS.md
    ✅ orchestration plan: docs/ORCHESTRATION.md
    ✅ dependabot config: .github/dependabot.yml
    ✅ npm test script: node --test
    ✅ build script: node --check src/index.js && node --check src/cli.js
    ✅ smoke script: bash scripts/smoke.sh
    ✅ bin entry: {"envprobe":"./src/cli.js"}
    ```
    RESULT: 0 (0s)
    
