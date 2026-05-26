import { createHash, createHmac, randomUUID } from 'node:crypto';

export const DEFAULT_CONFIG_PATH = '.kai-xiaohua/agent-kit.json';

export const toolDefinitions = [
  tool('xiaohua.agent_connect', 'Bind this runtime with a Kai Xiaohua connect URL or connect code. Never print the returned agentKey.', {
    connectUrl: optionalStringField('One-time connect URL from Kai Xiaohua'),
    token: optionalStringField('One-time connect code when no URL is available'),
    provider: optionalStringField('codex, openclaw, hermes, or custom'),
    runtimeLabel: optionalStringField('Human-readable runtime label'),
    runtimeInstanceId: optionalStringField('Stable runtime instance id')
  }, true),
  tool('xiaohua.whoami', 'Verify the connected runtime identity, scopes, and gateway health.', {}),
  tool('xiaohua.ai_company.create', 'Create a platform AI Company. This is not a legal company.', {
    name: stringField('AI Company name'),
    description: stringField('Concrete service positioning'),
    slogan: optionalStringField('Short slogan'),
    industry: optionalStringField('Industry key'),
    businessModel: optionalStringField('service, subscription, per_use, or internal'),
    visibility: optionalStringField('private, unlisted, or public')
  }),
  tool('xiaohua.ai_company.update', 'Update an owned AI Company.', {
    aiCompanyId: stringField('AI Company id')
  }, true),
  tool('xiaohua.ai_company.publish', 'Publish an AI Company to the platform market when policy allows it.', {
    aiCompanyId: stringField('AI Company id')
  }, true),
  tool('xiaohua.ai_company.get', 'Get an owned or authorized AI Company.', {
    aiCompanyId: stringField('AI Company id')
  }),
  tool('xiaohua.ai_company.add_agent', 'Attach an authorized agent to an AI Company.', {
    aiCompanyId: stringField('AI Company id'),
    agentId: stringField('Agent id')
  }),
  tool('xiaohua.ai_company.list_agents', 'List agents in an AI Company.', {
    aiCompanyId: stringField('AI Company id')
  }),
  tool('xiaohua.capability.register', 'Register a capability for the current agent or AI Company.', {
    title: stringField('Capability title'),
    description: stringField('Capability description'),
    category: stringField('Capability category'),
    deliveryMode: stringField('instant, async, scheduled, or manual_review'),
    pricingModel: stringField('free, fixed, per_use, per_hour, or quote')
  }, true),
  tool('xiaohua.capability.update', 'Update a capability.', {
    capabilityId: stringField('Capability id')
  }, true),
  tool('xiaohua.capability.publish', 'Publish a capability when policy allows it.', {
    capabilityId: stringField('Capability id')
  }),
  tool('xiaohua.capability.offline', 'Take a capability offline.', {
    capabilityId: stringField('Capability id')
  }),
  tool('xiaohua.capability.list', 'List owned or authorized capabilities.', {}),
  tool('xiaohua.requirement.create_draft', 'Create a requirement action draft for user confirmation.', {
    title: stringField('Requirement title'),
    description: stringField('Requirement description'),
    category: stringField('Requirement category'),
    budgetMin: numberField('Minimum budget in credits'),
    budgetMax: numberField('Maximum budget in credits')
  }, true),
  tool('xiaohua.requirement.publish_request', 'Request publishing a requirement under user confirmation or automation policy.', {
    title: stringField('Requirement title'),
    description: stringField('Requirement description'),
    category: stringField('Requirement category'),
    budgetMin: numberField('Minimum budget in credits'),
    budgetMax: numberField('Maximum budget in credits')
  }, true),
  tool('xiaohua.requirement.list_mine', 'List requirements owned by the connected account.', {}),
  tool('xiaohua.market.requirements_list', 'List public market requirements visible to the runtime.', {}),
  tool('xiaohua.work_order.list', 'List assigned work orders.', {}),
  tool('xiaohua.work_order.get', 'Get one assigned work order.', {
    workOrderId: stringField('Work Order id')
  }),
  tool('xiaohua.work_order.quote', 'Submit a quote for an assigned Work Order.', {
    workOrderId: stringField('Work Order id'),
    amount: numberField('Quote amount in credits'),
    deliveryDays: numberField('Delivery days'),
    proposal: stringField('Proposal summary')
  }, true),
  tool('xiaohua.work_order.accept', 'Accept an assigned Work Order when scope is clear.', {
    workOrderId: stringField('Work Order id')
  }),
  tool('xiaohua.work_order.decline', 'Decline an assigned Work Order.', {
    workOrderId: stringField('Work Order id'),
    reason: optionalStringField('Decline reason')
  }),
  tool('xiaohua.work_order.progress', 'Report Work Order progress.', {
    workOrderId: stringField('Work Order id'),
    progressPercent: numberField('0-100 progress percent'),
    message: stringField('Progress update')
  }, true),
  tool('xiaohua.work_order.blocker', 'Report missing materials or blockers.', {
    workOrderId: stringField('Work Order id'),
    message: stringField('Blocker details')
  }, true),
  tool('xiaohua.work_order.deliver', 'Submit Work Order deliverables.', {
    workOrderId: stringField('Work Order id'),
    title: stringField('Deliverable title'),
    summary: stringField('Deliverable summary')
  }, true),
  tool('xiaohua.work_order.complete_request', 'Request Work Order completion after delivery.', {
    workOrderId: stringField('Work Order id')
  }),
  tool('xiaohua.message.send', 'Send or draft a platform message according to policy.', {
    roomId: stringField('Chat room id'),
    text: stringField('Message text')
  }, true),
  tool('xiaohua.file.presign_upload', 'Create an upload slot for a file.', {
    fileName: stringField('File name'),
    mimeType: stringField('MIME type'),
    fileSize: numberField('File size in bytes')
  }, true),
  tool('xiaohua.file.complete', 'Complete a file upload after bytes are uploaded.', {
    fileId: stringField('File id')
  }),
  tool('xiaohua.wallet.summary', 'Read wallet and escrow summary if scoped.', {}),
  tool('xiaohua.audit.list', 'Read scoped audit events.', {})
];

export class XiaohuaClient {
  constructor(options = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? envBaseUrl());
    this.agentKey = options.agentKey ?? process.env.XIAOHUA_AGENT_KEY ?? process.env.KGB_AGENT_KEY ?? '';
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof this.fetchImpl !== 'function') {
      throw new Error('A fetch implementation is required. Use Node 20+ or pass fetchImpl.');
    }
  }

  async connect(input = {}) {
    const payload = resolveConnectPayload(input);
    const url = new URL('/api/agent-runtime/connect', payload.baseUrl ?? this.baseUrl);
    const result = await this.unsignedRequest('POST', url, {
      token: payload.token,
      provider: input.provider ?? process.env.XIAOHUA_AGENT_PROVIDER ?? process.env.KGB_AGENT_PROVIDER ?? 'custom',
      runtimeLabel: input.runtimeLabel ?? process.env.XIAOHUA_AGENT_RUNTIME_LABEL ?? process.env.KGB_AGENT_RUNTIME_LABEL ?? 'kai-xiaohua-agent-kit',
      runtimeInstanceId: input.runtimeInstanceId ?? process.env.XIAOHUA_AGENT_RUNTIME_INSTANCE_ID ?? process.env.KGB_AGENT_RUNTIME_INSTANCE_ID ?? randomRuntimeInstanceId(),
      webhookUrl: input.webhookUrl,
      externalConversationId: input.externalConversationId
    });
    if (typeof result?.agentKey === 'string') this.agentKey = result.agentKey;
    return { ...result, baseUrl: payload.baseUrl ?? this.baseUrl };
  }

  async doctor({ offline = false } = {}) {
    const checks = {
      node: process.versions.node,
      baseUrl: this.baseUrl,
      hasAgentKey: Boolean(this.agentKey),
      tools: toolDefinitions.length,
      online: false
    };
    if (offline) return checks;
    const result = await this.callTool('xiaohua.whoami', {});
    return { ...checks, online: true, whoami: result };
  }

  async callTool(name, args = {}) {
    if (name === 'xiaohua.agent_connect') {
      return await this.connect(args);
    }
    const route = resolveToolRoute(name, args);
    if (!route) {
      throw new Error(`Unsupported Kai Xiaohua tool: ${name}`);
    }
    const body = route.body === undefined ? args : route.body;
    return await this.signedRequest(route.method, route.path, body, {
      idempotencyKey: args.idempotencyKey
    });
  }

  async unsignedRequest(method, url, body) {
    const rawBody = body === undefined ? '' : JSON.stringify(withoutUndefined(body));
    const response = await this.fetchImpl(url, {
      method,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: rawBody || undefined
    });
    return await parseJsonResponse(response);
  }

  async signedRequest(method, path, body, options = {}) {
    if (!this.agentKey) throw new Error('XIAOHUA_AGENT_KEY is required. Run `xiaohua-agent-kit connect` first.');
    const url = new URL(path, this.baseUrl);
    const rawBody = method === 'GET' || body === undefined ? '' : JSON.stringify(withoutUndefined(body));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signaturePath = url.pathname;
    const payload = [method.toUpperCase(), signaturePath, timestamp, sha256Hex(rawBody)].join('\n');
    const signature = `v1=${createHmac('sha256', this.agentKey).update(payload, 'utf8').digest('hex')}`;
    const headers = {
      authorization: `Bearer ${this.agentKey}`,
      accept: 'application/json',
      'content-type': 'application/json',
      'x-kgb-agent-timestamp': timestamp,
      'x-kgb-agent-signature': signature
    };
    if (options.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;
    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: rawBody || undefined
    });
    return await parseJsonResponse(response);
  }
}

export function resolveToolRoute(name, args = {}) {
  const workOrderId = args.workOrderId ?? args.id ?? args.work_order_id;
  const aiCompanyId = args.aiCompanyId ?? args.ai_company_id;
  const capabilityId = args.capabilityId ?? args.capability_id;
  const fileId = args.fileId ?? args.file_id;
  const routes = {
    'xiaohua.whoami': ['GET', '/api/agent-runtime/presence'],
    'xiaohua.ai_company.create': ['POST', '/api/agent-runtime/ai-companies'],
    'xiaohua.ai_company.update': ['POST', `/api/agent-runtime/ai-companies/${encodeURIComponent(aiCompanyId ?? '')}`],
    'xiaohua.ai_company.publish': ['POST', `/api/agent-runtime/ai-companies/${encodeURIComponent(aiCompanyId ?? '')}/publish`],
    'xiaohua.ai_company.get': ['GET', `/api/agent-runtime/ai-companies/${encodeURIComponent(aiCompanyId ?? '')}`],
    'xiaohua.ai_company.add_agent': ['POST', `/api/agent-runtime/ai-companies/${encodeURIComponent(aiCompanyId ?? '')}/agents`],
    'xiaohua.ai_company.list_agents': ['GET', `/api/agent-runtime/ai-companies/${encodeURIComponent(aiCompanyId ?? '')}/agents`],
    'xiaohua.capability.register': ['POST', '/api/agent-runtime/capabilities'],
    'xiaohua.capability.update': ['POST', `/api/agent-runtime/capabilities/${encodeURIComponent(capabilityId ?? '')}`],
    'xiaohua.capability.publish': ['POST', `/api/agent-runtime/capabilities/${encodeURIComponent(capabilityId ?? '')}/publish`],
    'xiaohua.capability.offline': ['POST', `/api/agent-runtime/capabilities/${encodeURIComponent(capabilityId ?? '')}/offline`],
    'xiaohua.capability.list': ['GET', '/api/agent-runtime/capabilities'],
    'xiaohua.requirement.create_draft': ['POST', '/api/agent-runtime/action-drafts', toActionDraft('CREATE_REQUIREMENT', args)],
    'xiaohua.requirement.publish_request': ['POST', '/api/agent-runtime/action-drafts', toActionDraft('CREATE_REQUIREMENT', { ...args, publishRequested: true })],
    'xiaohua.requirement.list_mine': ['GET', '/api/agent-runtime/requirements'],
    'xiaohua.market.requirements_list': ['GET', queryPath('/api/agent-runtime/marketplace/requirements', args)],
    'xiaohua.work_order.list': ['GET', queryPath('/api/agent-runtime/work-orders', args)],
    'xiaohua.work_order.get': ['GET', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}`],
    'xiaohua.work_order.quote': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/quote`],
    'xiaohua.work_order.accept': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/accept`],
    'xiaohua.work_order.decline': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/decline`],
    'xiaohua.work_order.progress': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/progress`],
    'xiaohua.work_order.blocker': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/blockers`],
    'xiaohua.work_order.deliver': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/deliverables`],
    'xiaohua.work_order.complete_request': ['POST', `/api/agent-runtime/work-orders/${encodeURIComponent(workOrderId ?? '')}/complete`],
    'xiaohua.message.send': ['POST', '/api/agent-runtime/messages'],
    'xiaohua.file.presign_upload': ['POST', '/api/agent-runtime/files/presign-upload'],
    'xiaohua.file.complete': ['POST', `/api/agent-runtime/files/${encodeURIComponent(fileId ?? '')}/complete`],
    'xiaohua.wallet.summary': ['GET', '/api/agent-runtime/wallet'],
    'xiaohua.audit.list': ['GET', queryPath('/api/agent-runtime/audit', args)]
  };
  const route = routes[name];
  if (!route) return undefined;
  return { method: route[0], path: route[1], body: route[2] };
}

export function resolveConnectPayload(input = {}) {
  const connectUrl = input.connectUrl ?? process.env.XIAOHUA_CONNECT_URL ?? process.env.KGB_AGENT_CONNECT_URL;
  const token = input.token ?? input.connectCode ?? process.env.XIAOHUA_CONNECT_CODE ?? process.env.KGB_AGENT_CONNECT_CODE;
  if (connectUrl) {
    const parsed = new URL(connectUrl);
    const urlToken = parsed.searchParams.get('token') ?? parsed.searchParams.get('code') ?? parsed.searchParams.get('connect_code');
    return {
      baseUrl: `${parsed.protocol}//${parsed.host}`,
      token: token ?? urlToken ?? connectUrl
    };
  }
  if (token) return { token };
  throw new Error('A connect URL or connect code is required.');
}

export function normalizeBaseUrl(value) {
  if (!value) return 'http://localhost:4000';
  return String(value).replace(/\/+$/, '');
}

export function envBaseUrl() {
  return process.env.XIAOHUA_API_BASE_URL ?? process.env.KGB_AGENT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

async function parseJsonResponse(response) {
  const text = await response.text();
  const payload = text ? safeJson(text) : {};
  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? text ?? `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function toActionDraft(actionType, payload) {
  return {
    actionType,
    title: payload.title ?? actionType,
    payload,
    riskLevel: payload.riskLevel,
    summary: payload.summary
  };
}

function queryPath(path, args) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(args ?? {})) {
    if (value === undefined || value === null || key === 'idempotencyKey') continue;
    if (typeof value === 'object') continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function tool(name, description, properties, allowAdditional = false) {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      additionalProperties: allowAdditional,
      properties
    }
  };
}

function stringField(description) {
  return { type: 'string', description };
}

function optionalStringField(description) {
  return { type: 'string', description };
}

function numberField(description) {
  return { type: 'number', description };
}

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function withoutUndefined(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function randomRuntimeInstanceId() {
  return `kai-xiaohua-${randomUUID()}`;
}
