#!/usr/bin/env node
import { EnvProbeError, VERSION, loadJson, matchProfile, parseList, scan, writeReport } from './index.js';

const HELP = `envprobe ${VERSION}\n\nUsage:\n  envprobe scan [--cwd DIR] [--out FILE] [--markdown FILE] [--json] [--cache FILE] [--ttl SECONDS] [--fresh] [--require tool,...] [--expect-file file,...] [--env NAME,...]\n  envprobe match PROFILE REQUIREMENTS [--json]\n  envprobe doctor --require tool,... [--cwd DIR]\n  envprobe --help\n  envprobe --version\n\nLocal-first capability scanner. Secret values are never printed; env signals are presence-only.\n`;

export async function main(argv = process.argv.slice(2)) {
  try {
    const command = argv[0];
    if (!command || command === '--help' || command === '-h') return print(HELP);
    if (command === '--version' || command === '-v') return print(`${VERSION}\n`);
    const args = parseArgs(argv.slice(1));
    if (command === 'scan') return await runScan(args);
    if (command === 'match') return await runMatch(argv.slice(1), args);
    if (command === 'doctor') return await runDoctor(args);
    throw new EnvProbeError(`Unknown command: ${command}`, 'ERR_COMMAND');
  } catch (error) {
    const payload = { ok: false, error: { code: error.code ?? 'ERR_ENVPROBE', message: error.message } };
    console.error(JSON.stringify(payload, null, 2));
    return 1;
  }
}

async function runScan(args) {
  const profile = await scan({ cwd: args.cwd, cache: args.cache, ttlSeconds: args.ttl, fresh: args.fresh, requireTools: parseList(args.require), requireFiles: parseList(args['expect-file']), requireEnv: parseList(args.env) });
  await writeReport(profile, { out: args.out, markdown: args.markdown });
  if (args.json || (!args.out && !args.markdown)) print(`${JSON.stringify(profile, null, 2)}\n`);
  else print(`envprobe scan complete: ${profile.summary.ready ? 'ready' : 'gaps found'}\n`);
  return profile.summary.ready ? 0 : 0;
}

async function runMatch(raw, args) {
  const positional = raw.filter((item) => !item.startsWith('--'));
  if (positional.length < 2) throw new EnvProbeError('match requires PROFILE and REQUIREMENTS paths', 'ERR_USAGE');
  const profile = await loadJson(positional[0]);
  const requirements = await loadJson(positional[1]);
  const result = await matchProfile(profile, requirements);
  if (args.json) print(`${JSON.stringify(result, null, 2)}\n`);
  else print(`${result.ok ? 'PASS' : 'FAIL'} envprobe match\n${result.gaps.map((gap) => `- ${gap.message}`).join('\n')}\n`);
  return result.ok ? 0 : 2;
}

async function runDoctor(args) {
  const requireTools = parseList(args.require);
  if (!requireTools.length) throw new EnvProbeError('doctor requires --require tool,...', 'ERR_USAGE');
  const profile = await scan({ cwd: args.cwd, requireTools });
  const requirements = { tools: requireTools };
  const result = await matchProfile(profile, requirements);
  if (args.json) print(`${JSON.stringify(result, null, 2)}\n`);
  else print(`${result.ok ? 'PASS' : 'FAIL'} envprobe doctor\n${result.gaps.map((gap) => `- ${gap.message}`).join('\n')}\n`);
  return result.ok ? 0 : 2;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const [key, inline] = item.slice(2).split('=');
    if (['json', 'fresh'].includes(key)) args[key] = true;
    else args[key] = inline ?? argv[++i];
  }
  return args;
}
function print(text) { process.stdout.write(text); return 0; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const code = await main();
  process.exitCode = code;
}
