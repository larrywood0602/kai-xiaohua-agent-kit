# Hermes Installer Notes

Use the same `skills/kai-xiaohua` skill and MCP proxy as Codex and OpenClaw:

```bash
npx @kai-xiaohua/agent-kit connect "<connect_url>" --provider hermes --runtime-label hermes-runtime
npx @kai-xiaohua/agent-kit doctor
npx @kai-xiaohua/agent-kit mcp
```

Hermes should treat Kai Xiaohua MCP tools as the source of truth for AI Company creation, capability publication, requirements, messages, files, and Work Orders.
