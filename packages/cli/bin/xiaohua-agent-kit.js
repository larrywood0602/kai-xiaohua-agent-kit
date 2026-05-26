#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sdk = await importSdk();
const { XiaohuaClient, normalizeBaseUrl, toolDefinitions } = sdk;

const command = process.argv[2] ?? 'help';
const args = process.argv.slice(3);

try {
  if (command === 'connect') await connectCommand(args);
  else if (command === 'doctor') await doctorCommand(args);
  else if (command === 'mcp') await mcpCommand(args);
  else if (command === 'tools') await toolsCommand();
  else if (command === 'config-path') console.log(configPath());
  else help();
} catch (error) {
  console.error(formatError(error));
  process.exit(1);
}

async function connectCommand(argv) {
  const connectUrl = argv.find((item) => !item.startsWith('--')) ?? process.env.XIAOHUA_CONNECT_URL ?? process.env.KGB_AGENT_CONNECT_URL;
  if (!connectUrl) throw new Error('Usage: xiaohua-agent-kit connect "<connect_url>"');
  const existing = await readConfig();
  const client = new XiaohuaClient({
    baseUrl: optionValue(argv, '--base-url') ?? existing.baseUrl,
    agentKey: existing.agentKey
  });
  const result = await client.connect({
    connectUrl,
    provider: optionValue(argv, '--provider'),
    runtimeLabel: optionValue(argv, '--runtime-label'),
    runtimeInstanceId: optionValue(argv, '--runtime-instance-id')
  });
  await writeConfig({
    baseUrl: normalizeBaseUrl(result.baseUrl ?? client.baseUrl),
    agentId: result.agent?.id ?? result.agentId ?? existing.agentId,
    agentKey: result.agentKey,
    provider: optionValue(argv, '--provider') ?? process.env.XIAOHUA_AGENT_PROVIDER ?? existing.provider ?? 'custom',
    connectedAt: new Date().toISOString()
  });
  console.log('Kai Xiaohua connected. Agent key was saved locally and will not be printed.');
}

async function doctorCommand(argv) {
  const offline = argv.includes('--offline');
  const config = await readConfig();
  const client = new XiaohuaClient({
    baseUrl: optionValue(argv, '--base-url') ?? config.baseUrl,
    agentKey: optionValue(argv, '--agent-key') ?? config.agentKey
  });
  const result = await client.doctor({ offline });
  console.log(JSON.stringify(redact(result), null, 2));
}

async function mcpCommand(argv) {
  const serverPath = fileURLToPath(new URL('../../mcp-stdio-proxy/src/server.js', import.meta.url));
  const child = spawn(process.execPath, [serverPath, ...argv], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...await configEnv()
    }
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

async function toolsCommand() {
  console.log(JSON.stringify({ tools: toolDefinitions }, null, 2));
}

function help() {
  console.log(`Kai Xiaohua Agent Kit

Usage:
  xiaohua-agent-kit connect "<connect_url>"
  xiaohua-agent-kit doctor [--offline]
  xiaohua-agent-kit mcp
  xiaohua-agent-kit tools
  xiaohua-agent-kit config-path
`);
}

async function readConfig() {
  const path = configPath();
  if (!existsSync(path)) return {};
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeConfig(config) {
  const path = configPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

async function configEnv() {
  const config = await readConfig();
  return {
    XIAOHUA_API_BASE_URL: process.env.XIAOHUA_API_BASE_URL ?? config.baseUrl ?? '',
    XIAOHUA_AGENT_KEY: process.env.XIAOHUA_AGENT_KEY ?? config.agentKey ?? ''
  };
}

function configPath() {
  return process.env.XIAOHUA_AGENT_CONFIG ?? join(homedir(), '.kai-xiaohua', 'agent-kit.json');
}

function optionValue(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    isSecretKeyName(key) ? '[redacted]' : redact(item)
  ]));
}

function isSecretKeyName(key) {
  const normalized = key.toLowerCase();
  return normalized === 'agentkey' ||
    normalized === 'key' ||
    normalized === 'token' ||
    normalized.endsWith('token') ||
    normalized.includes('secret') ||
    normalized.includes('api_key');
}

function formatError(error) {
  if (error?.payload) return JSON.stringify(redact(error.payload), null, 2);
  return error instanceof Error ? error.message : String(error);
}

async function importSdk() {
  try {
    return await import('@kai-xiaohua/agent-sdk');
  } catch {
    return await import('../../sdk/src/index.js');
  }
}
