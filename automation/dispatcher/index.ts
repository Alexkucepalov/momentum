#!/usr/bin/env node
/**
 * Momentum Autonomous Sprint Dispatcher entrypoint.
 * Default: DRY_RUN=true — selects next issue, never launches paid agents.
 */
import { runDispatcher } from './run.js';
import type { DispatcherConfig } from './types.js';

function envFlag(name: string, defaultValue: boolean): boolean {
  const v = process.env[name];
  if (v == null || v === '') return defaultValue;
  return /^(1|true|yes|on)$/i.test(v);
}

async function main(): Promise<void> {
  const repo = process.env.GITHUB_REPOSITORY ?? 'Alexkucepalov/momentum';
  const config: DispatcherConfig = {
    repo,
    repoUrl: process.env.MOMENTUM_REPO_URL ?? `https://github.com/${repo}`,
    githubToken: process.env.GITHUB_TOKEN ?? '',
    cursorApiKey: process.env.CURSOR_API_KEY ?? null,
    dryRun: envFlag('DRY_RUN', true),
    dispatchEnabled: envFlag('DISPATCH_ENABLED', false),
    startingRef: process.env.MOMENTUM_STARTING_REF ?? 'main',
  };

  if (!config.githubToken) {
    console.error('GITHUB_TOKEN is required');
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      dryRun: config.dryRun,
      dispatchEnabled: config.dispatchEnabled,
      repo: config.repo,
    }),
  );

  const result = await runDispatcher(config);
  console.log(result.summary);
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
