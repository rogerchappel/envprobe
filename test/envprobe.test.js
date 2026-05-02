import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { matchProfile, renderMarkdown, scan } from '../src/index.js';

const root = new URL('..', import.meta.url).pathname;

test('scan reports tools, files, and env signals without values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'envprobe-'));
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', scripts: { test: 'node --test' } }));
  await writeFile(join(dir, 'README.md'), '# fixture\n');
  const fakeBin = join(dir, 'bin');
  await mkdir(fakeBin);
  await writeFile(join(fakeBin, 'fake-tool'), '#!/usr/bin/env sh\necho fake-tool 1.2.3\n', { mode: 0o755 });

  const profile = await scan({ cwd: dir, tools: ['fake-tool'], requireFiles: ['README.md', 'missing.txt'], requireEnv: ['SECRET_TOKEN'], env: { PATH: fakeBin, SECRET_TOKEN: 'super-secret-value' } });
  assert.equal(profile.tools[0].available, true);
  const secretSignal = profile.env.find((item) => item.name === 'SECRET_TOKEN');
  assert.equal(secretSignal.present, true);
  assert.equal(JSON.stringify(profile).includes('super-secret-value'), false);
  assert.deepEqual(profile.files.missing, ['.gitignore', 'missing.txt']);
});

test('scan can reuse an explicit cache until fresh is requested', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'envprobe-cache-'));
  await writeFile(join(dir, 'README.md'), '# cache fixture\n');
  const cache = join(dir, '.envprobe', 'cache.json');
  const first = await scan({ cwd: dir, cache, tools: ['missing-tool-for-cache-test'] });
  const second = await scan({ cwd: dir, cache, ttlSeconds: 3600, tools: ['node'] });
  assert.equal(second.cache.hit, true);
  assert.deepEqual(second.tools, first.tools);
  const fresh = await scan({ cwd: dir, cache, fresh: true, tools: ['node'] });
  assert.equal(fresh.cache, undefined);
  assert.equal(fresh.tools[0].name, 'node');
});

test('match identifies missing capabilities', async () => {
  const result = await matchProfile({ tools: [{ name: 'node', available: true }], files: { expected: [] }, env: [] }, { tools: ['node', 'pnpm'], env: ['GITHUB_TOKEN'] });
  assert.equal(result.ok, false);
  assert.deepEqual(result.gaps.map((gap) => gap.name), ['pnpm', 'GITHUB_TOKEN']);
});

test('markdown report is stable and redacted', async () => {
  const markdown = renderMarkdown({ generatedAt: '2026-05-02T00:00:00.000Z', cwd: '/repo', summary: { ready: false, risks: ['Required tool missing: pnpm'], nextSteps: ['Install pnpm'] }, tools: [{ name: 'node', available: true, version: 'v1' }], files: { expected: [{ path: 'README.md', present: true }] }, env: [{ name: 'TOKEN', present: true }] });
  assert.match(markdown, /# EnvProbe Report/);
  assert.match(markdown, /TOKEN \| configured/);
  assert.equal(markdown.includes('secret'), false);
});

test('cli scan and match run end-to-end', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'envprobe-cli-'));
  await writeFile(join(dir, 'package.json'), '{"name":"cli-fixture"}\n');
  await writeFile(join(dir, 'README.md'), '# cli fixture\n');
  const profilePath = join(dir, 'envprobe.json');
  const reqPath = join(dir, 'requirements.json');
  await writeFile(reqPath, JSON.stringify({ tools: ['node'], files: ['README.md'] }));
  const scanResult = spawnSync(process.execPath, [join(root, 'src/cli.js'), 'scan', '--cwd', dir, '--out', profilePath, '--require', 'node', '--expect-file', 'README.md'], { encoding: 'utf8' });
  assert.equal(scanResult.status, 0, scanResult.stderr);
  const profile = JSON.parse(await readFile(profilePath, 'utf8'));
  assert.equal(profile.project.name, 'cli-fixture');
  const matchResult = spawnSync(process.execPath, [join(root, 'src/cli.js'), 'match', profilePath, reqPath], { encoding: 'utf8' });
  assert.equal(matchResult.status, 0, matchResult.stderr);
});
