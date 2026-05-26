#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, [
  new URL('../../../packages/cli/bin/xiaohua-agent-kit.js', import.meta.url).pathname,
  'doctor',
  ...process.argv.slice(2)
], { stdio: 'inherit' });

process.exit(result.status ?? 1);
