#!/usr/bin/env node
/**
 * Single DoD gate for local agents and humans.
 * Mirrors CI: typecheck → test → security → mobile typecheck (if present).
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, command, args, cwd = root) {
  console.log(`\n==> ${label}\n`);
  const r = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false });
  if (r.status !== 0) {
    console.error(`\nverify failed: ${label}`);
    process.exit(r.status ?? 1);
  }
}

run('typecheck', 'npm', ['run', 'typecheck']);
run('test', 'npm', ['test']);
run('security:scan', 'npm', ['run', 'security:scan']);

const mobilePkg = join(root, 'apps/mobile/package.json');
if (existsSync(mobilePkg)) {
  run('mobile install', 'npm', ['install', '--no-audit', '--no-fund'], join(root, 'apps/mobile'));
  run('mobile typecheck', 'npx', ['tsc', '--noEmit', '-p', 'apps/mobile']);
  run('mobile dependency compatibility', 'node', ['scripts/check-mobile-dependencies.mjs']);
}

console.log('\nverify OK\n');
