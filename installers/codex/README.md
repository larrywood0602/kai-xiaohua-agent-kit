# Codex Installer Notes

Install or copy `skills/kai-xiaohua` into the Codex skills directory, then configure MCP:

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

Bind:

```bash
npx @kai-xiaohua/agent-kit connect "<connect_url>"
```

Verify:

```bash
npx @kai-xiaohua/agent-kit doctor
```
