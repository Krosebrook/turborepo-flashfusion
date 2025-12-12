# MCP Servers Configuration Schema (2025-10-01)

This document defines the supported fields inside `$HOME/.config/mcp/servers.json`, keeping configuration and the resilient start/stop scripts in sync. A machine-readable JSON schema lives at `docs/servers.schema.json`, and a sanitized sample config is available in `servers.example.json` for local linting/CI. Add the `$schema` pointer to every real config so editors gain IntelliSense:

```json
{
  "$schema": "./docs/servers.schema.json",
  "mcpServers": {
    ...
  }
}
```

Each top-level property under `mcpServers` is treated as a server entry:

```json
{
  "mcpServers": {
    "flashfusion-supabase": {
      "...": "see field reference below"
    }
  }
}
```

## Field Reference

| Field | Type | Required | Description / Behavior |
| --- | --- | --- | --- |
| `enabled` | boolean | No (default `true`) | Set `false` to ignore the entry entirely. |
| `autostart` | boolean | No (default `true`) | If `false`, entry is logged but not started unless invoked manually. |
| `priority` | integer | No | Lower numbers start first; missing priority sorts to the end (`999`). |
| `command` | string | Yes for local servers | Binary or script to execute; validated via `Get-Command` in `mcp-startup.ps1`. |
| `args` | string \| string[] | No | Arguments passed to the command (PowerShell array recommended). |
| `env` | object | No | Key-value pairs injected into the server process; `${VAR}` placeholders resolve from the current environment. |
| `processName` | string | No | Friendly process identifier for duplicate detection / shutdown. Defaults to `command` filename. |
| `restartOnDuplicate` | boolean | No (default `true`) | If `false`, `mcp-startup.ps1` will skip servers already running instead of stopping them. |
| `stopCommand` | string | No | Optional command executed by `mcp-stop.ps1` (takes precedence over process killing). |
| `type` | string | No | Set to `http` for remote health-only entries that do not run a local process. |
| `url` | string | No | Remote endpoint description; used as a fallback health URL when `type=http`. |
| `healthUrl` | string | No | Explicit HTTP/HTTPS endpoint for readiness checks. |
| `healthCommand` | string | No | Local binary/script to execute for health verification (exit code 0 = healthy). |
| `healthCommandArgs` | string[] | No | Optional arguments passed to `healthCommand`. |
| `healthTcpHost` | string | No (default `127.0.0.1`) | Target host for TCP port health checks. |
| `healthTcpPort` | integer | No | TCP port probed via `Test-NetConnection`. |
| `restartDelayMs` | integer | No | Optional delay (milliseconds) before retrying a failed start, overriding exponential default. |

### Example Entry

```jsonc
"workspace-qa": {
  "enabled": true,
  "priority": 10,
  "command": "node",
  "args": [
    "workspace-qa-interface.js",
    "--port",
    "4123"
  ],
  "env": {
    "SUPABASE_URL": "${SUPABASE_URL}",
    "SUPABASE_KEY": "${SUPABASE_SERVICE_KEY}"
  },
  "processName": "node",
  "healthUrl": "http://127.0.0.1:4123/healthz",
  "healthCommand": "curl",
  "healthCommandArgs": [
    "--fail",
    "http://127.0.0.1:4123/readyz"
  ],
  "healthTcpPort": 4123,
  "stopCommand": "node ./scripts/stop-workspace-qa.js"
}
```

## Validation Tips

1. **JSON Schema** – keep a copy of this document beside a machine-readable `servers.schema.json` to hook into editors or CI (future work).
2. **Config Smoke Test** – run `pwsh -File scripts/test-mcp.ps1 --validate-config` (see next section) to ensure new entries load before restarting servers.
3. **Secrets** – refer to `.env.example` or `MCP_ENV_SECRET_COMMAND` for environment variable expectations; never hardcode credentials.
