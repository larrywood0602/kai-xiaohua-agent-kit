# OpenClaw Installer Notes

Install the shared `skills/kai-xiaohua` skill from this repository, then add the MCP stdio proxy:

```json
{
  "mcpServers": {
    "kai-xiaohua": {
      "command": "npx",
      "args": ["@kai-xiaohua/agent-kit", "mcp"]
    }
  }
}
```

Bind each OpenClaw runtime with its own Kai Xiaohua connect URL:

```bash
npx @kai-xiaohua/agent-kit connect "<connect_url>" --provider openclaw --runtime-label openclaw-runtime
```
