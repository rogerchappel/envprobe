import { access, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { accessSync, constants } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { platform, release, arch, cpus, freemem, totalmem } from 'node:os';

export const VERSION = '0.1.0';

const DEFAULT_TOOLS = [
  'node', 'npm', 'pnpm', 'yarn', 'bun', 'git', 'gh', 'docker', 'python3', 'python', 'pipx', 'go', 'rustc', 'cargo', 'make', 'google-chrome', 'chromium', 'firefox'
];
const DEFAULT_FILES = ['package.json', 'README.md', '.gitignore'];
const DEFAULT_ENV_SIGNALS = [
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'GH_TOKEN', 'NPM_TOKEN', 'DOCKER_HOST'
];
const PACKAGE_MANAGER_FILES = new Map([
  ['package-lock.json', 'npm'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun']
]);

export class EnvProbeError extends Error {
  constructor(message, code = 'ERR_ENVPROBE') {
    super(message);
    this.name = 'EnvProbeError';
    this.code = code;
  }
}

export async function scan(options = {}) {
  const cwd = resolve(options.cwd ?? process.cwd());
  const cached = await readCache(options.cache, options.ttlSeconds, options.fresh);
  if (cached) return cached;
  const tools = unique([...(options.tools ?? DEFAULT_TOOLS), ...(options.requireTools ?? [])]);
  const expectedFiles = unique([...(options.expectedFiles ?? DEFAULT_FILES), ...(options.requireFiles ?? [])]);
  const envSignals = unique([...(options.envSignals ?? DEFAULT_ENV_SIGNALS), ...(options.requireEnv ?? [])]);

  const [toolResults, files, project, git, disk] = await Promise.all([
    detectTools(tools, options.env),
    detectFiles(cwd, expectedFiles),
    detectProject(cwd),
    detectGit(cwd),
    detectDisk(cwd)
  ]);

  const profile = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cwd,
    safety: {
      localOnly: true,
      network: 'disabled-by-default',
      secrets: 'presence-only',
      redaction: 'env values are never read or emitted'
    },
    os: { platform: platform(), release: release(), arch: arch(), cpuCount: cpus().length, memory: { freeBytes: freemem(), totalBytes: totalmem() } },
    project,
    git,
    tools: toolResults,
    files,
    env: envSignals.map((name) => ({ name, present: Boolean((options.env ?? process.env)[name]) })),
    disk,
    summary: { ready: false, risks: [], nextSteps: [] }
  };
  profile.summary = summarize(profile, { requireTools: options.requireTools, requireFiles: options.requireFiles, requireEnv: options.requireEnv });
  if (options.cache) await writeCache(options.cache, profile);
  return profile;
}

export async function matchProfile(profile, requirements) {
  const requiredTools = requirements.tools ?? requirements.requireTools ?? [];
  const requiredFiles = requirements.files ?? requirements.requireFiles ?? [];
  const requiredEnv = requirements.env ?? requirements.requireEnv ?? [];
  const gaps = [];
  const toolsByName = new Map((profile.tools ?? []).map((tool) => [tool.name, tool]));
  for (const name of requiredTools) {
    if (!toolsByName.get(name)?.available) gaps.push({ type: 'tool', name, message: `Missing required tool: ${name}` });
  }
  const filesByPath = new Map((profile.files?.expected ?? []).map((file) => [file.path, file]));
  for (const path of requiredFiles) {
    if (!filesByPath.get(path)?.present) gaps.push({ type: 'file', name: path, message: `Missing required file: ${path}` });
  }
  const envByName = new Map((profile.env ?? []).map((item) => [item.name, item]));
  for (const name of requiredEnv) {
    if (!envByName.get(name)?.present) gaps.push({ type: 'env', name, message: `Missing required env signal: ${name}` });
  }
  return { ok: gaps.length === 0, gaps, checkedAt: new Date().toISOString(), requirements };
}

export function renderMarkdown(profile) {
  const risks = profile.summary.risks.length ? profile.summary.risks.map((risk) => `- ${risk}`).join('\n') : '- None detected';
  const nextSteps = profile.summary.nextSteps.length ? profile.summary.nextSteps.map((step) => `- ${step}`).join('\n') : '- Ready for local agent work';
  const tools = profile.tools.map((tool) => `| ${tool.name} | ${tool.available ? 'yes' : 'no'} | ${tool.version ?? ''} |`).join('\n');
  const files = profile.files.expected.map((file) => `| ${file.path} | ${file.present ? 'yes' : 'no'} |`).join('\n');
  const env = profile.env.map((item) => `| ${item.name} | ${item.present ? 'configured' : 'missing'} |`).join('\n');
  return `# EnvProbe Report\n\nGenerated: ${profile.generatedAt}\nProject: \`${profile.cwd}\`\nReady: **${profile.summary.ready ? 'yes' : 'no'}**\n\n## Safety\n\n- Local-only scan; no network calls.\n- Environment variables are reported by name and presence only. Values are never emitted.\n\n## Risks\n\n${risks}\n\n## Next steps\n\n${nextSteps}\n\n## Tools\n\n| Tool | Available | Version |\n|---|---:|---|\n${tools}\n\n## Expected files\n\n| File | Present |\n|---|---:|\n${files}\n\n## Env signals\n\n| Signal | Status |\n|---|---|\n${env}\n`;
}

export async function loadJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { throw new EnvProbeError(`Could not read JSON from ${path}: ${error.message}`, 'ERR_JSON'); }
}

export async function writeReport(profile, options = {}) {
  const written = [];
  if (options.out) {
    await ensureParent(options.out);
    await writeFile(options.out, `${JSON.stringify(profile, null, 2)}\n`);
    written.push(options.out);
  }
  if (options.markdown) {
    await ensureParent(options.markdown);
    await writeFile(options.markdown, renderMarkdown(profile));
    written.push(options.markdown);
  }
  return written;
}

export function parseList(value) {
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

async function detectTools(names, env = process.env) {
  return names.map((name) => {
    const found = which(name, env.PATH);
    if (!found) return { name, available: false };
    return { name, available: true, path: found, version: getVersion(found) };
  });
}

async function detectFiles(cwd, expected) {
  const results = [];
  for (const path of expected) {
    results.push({ path, present: await exists(join(cwd, path)) });
  }
  return { expected: results, missing: results.filter((file) => !file.present).map((file) => file.path) };
}

async function detectProject(cwd) {
  const entries = await safeReaddir(cwd);
  const packageJson = await readOptionalJson(join(cwd, 'package.json'));
  const packageManager = entries.find((entry) => PACKAGE_MANAGER_FILES.has(entry));
  return {
    name: packageJson?.name ?? basename(cwd),
    type: packageJson ? 'node' : 'unknown',
    packageManager: packageManager ? PACKAGE_MANAGER_FILES.get(packageManager) : null,
    packageScripts: packageJson?.scripts ? Object.keys(packageJson.scripts).sort() : [],
    expectedLockfile: packageJson ? packageManager ?? null : null
  };
}

async function detectGit(cwd) {
  const inside = run('git', ['-C', cwd, 'rev-parse', '--is-inside-work-tree']).stdout.trim() === 'true';
  if (!inside) return { available: false, insideWorkTree: false };
  const branch = run('git', ['-C', cwd, 'branch', '--show-current']).stdout.trim();
  const commit = run('git', ['-C', cwd, 'rev-parse', '--short', 'HEAD']).stdout.trim();
  const porcelain = run('git', ['-C', cwd, 'status', '--short']).stdout.trim();
  return { available: true, insideWorkTree: true, branch, commit, dirty: porcelain.length > 0 };
}

async function detectDisk(cwd) {
  const result = run('df', ['-k', cwd]);
  const lines = result.stdout.trim().split('\n');
  if (lines.length < 2) return { available: false };
  const parts = lines.at(-1).split(/\s+/);
  return { available: true, filesystem: parts[0], freeBytes: Number(parts[3]) * 1024, capacity: parts[4] };
}

function summarize(profile, requirements = {}) {
  const risks = [];
  for (const tool of profile.tools) if (!tool.available && (requirements.requireTools ?? []).includes(tool.name)) risks.push(`Required tool missing: ${tool.name}`);
  for (const file of profile.files.expected) if (!file.present && (requirements.requireFiles ?? DEFAULT_FILES).includes(file.path)) risks.push(`Expected file missing: ${file.path}`);
  for (const item of profile.env) if (!item.present && (requirements.requireEnv ?? []).includes(item.name)) risks.push(`Required env signal missing: ${item.name}`);
  if (profile.git.insideWorkTree && profile.git.dirty) risks.push('Git worktree has uncommitted changes');
  const nextSteps = risks.map((risk) => risk.startsWith('Required tool missing:') ? `Install or expose ${risk.split(': ')[1]} on PATH` : `Resolve: ${risk}`);
  return { ready: risks.length === 0, risks, nextSteps };
}

function getVersion(executablePath) {
  const result = run(executablePath, ['--version']);
  const output = (result.stdout ?? result.stderr ?? '').trim().split('\n')[0];
  return output || null;
}

function which(name, pathValue = process.env.PATH) {
  const paths = String(pathValue ?? '').split(':').filter(Boolean);
  for (const dir of paths) {
    const candidate = join(dir, name);
    try { accessSync(candidate, constants.X_OK); return candidate; } catch {}
  }
  return null;
}
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 5000 });
  return { ...result, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
async function readCache(path, ttlSeconds, fresh) {
  if (!path || fresh) return null;
  try {
    const cacheStat = await stat(path);
    const ageSeconds = (Date.now() - cacheStat.mtimeMs) / 1000;
    if (Number.isFinite(Number(ttlSeconds)) && ageSeconds > Number(ttlSeconds)) return null;
    const profile = JSON.parse(await readFile(path, 'utf8'));
    return { ...profile, cache: { hit: true, path, ageSeconds: Math.round(ageSeconds) } };
  } catch {
    return null;
  }
}
async function writeCache(path, profile) {
  await ensureParent(path);
  await writeFile(path, `${JSON.stringify({ ...profile, cache: { hit: false, path } }, null, 2)}\n`);
}
async function exists(path) { try { await access(path, constants.F_OK); return true; } catch { return false; } }
async function safeReaddir(path) { try { return await readdir(path); } catch { return []; } }
async function readOptionalJson(path) { try { return JSON.parse(await readFile(path, 'utf8')); } catch { return null; } }
async function ensureParent(path) { await import('node:fs/promises').then(({ mkdir }) => mkdir(dirname(resolve(path)), { recursive: true })); }
function unique(items) { return [...new Set(items.filter(Boolean))]; }
