#!/usr/bin/env node
const sdk = await importSdk();
const { XiaohuaClient, toolDefinitions } = sdk;

if (process.argv.includes('--self-test')) {
  console.log(JSON.stringify({ ok: true, tools: toolDefinitions.length }, null, 2));
  process.exit(0);
}

const client = new XiaohuaClient();
let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  drainBuffer().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  });
});

process.stdin.on('end', () => process.exit(0));

async function drainBuffer() {
  while (buffer.length > 0) {
    const framed = readFramedMessage();
    if (framed === undefined) {
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex < 0) return;
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      await handleMessage(JSON.parse(line));
      continue;
    }
    if (framed === null) return;
    await handleMessage(JSON.parse(framed));
  }
}

function readFramedMessage() {
  if (!buffer.startsWith('Content-Length:')) return undefined;
  const headerEnd = buffer.indexOf('\r\n\r\n');
  if (headerEnd < 0) return null;
  const header = buffer.slice(0, headerEnd);
  const match = /Content-Length:\s*(\d+)/i.exec(header);
  if (!match) throw new Error('Invalid MCP frame: missing Content-Length');
  const length = Number(match[1]);
  const start = headerEnd + 4;
  if (buffer.length < start + length) return null;
  const message = buffer.slice(start, start + length);
  buffer = buffer.slice(start + length);
  return message;
}

async function handleMessage(message) {
  if (!message || typeof message !== 'object') return;
  if (message.id === undefined || message.id === null) return;
  try {
    const result = await dispatch(message.method, message.params ?? {});
    writeMessage({ jsonrpc: '2.0', id: message.id, result });
  } catch (error) {
    writeMessage({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: error?.status ? -32000 - Number(error.status) : -32603,
        message: error instanceof Error ? error.message : String(error),
        data: error?.payload
      }
    });
  }
}

async function dispatch(method, params) {
  if (method === 'initialize') {
    return {
      protocolVersion: params.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: {
        name: 'kai-xiaohua',
        version: '0.1.0'
      }
    };
  }
  if (method === 'ping') return {};
  if (method === 'tools/list') {
    return { tools: toolDefinitions };
  }
  if (method === 'tools/call') {
    const name = params.name;
    const args = params.arguments ?? {};
    const payload = await client.callTool(name, args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(redact(payload), null, 2)
        }
      ]
    };
  }
  if (method === 'resources/list') return { resources: [] };
  if (method === 'prompts/list') return { prompts: [] };
  throw new Error(`Unsupported MCP method: ${method}`);
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

function writeMessage(payload) {
  const body = JSON.stringify(payload);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
}

async function importSdk() {
  try {
    return await import('@kai-xiaohua/agent-sdk');
  } catch {
    return await import('../../sdk/src/index.js');
  }
}
