# MCP Tooling Guide (2025-10-01)

Comprehensive reference for the MCP orchestration stack (start/stop scripts, schemas, tests, and CI). Use this document as the single source of truth when configuring, validating, or extending the system.

---

## 1. File Overview

| Path | Purpose |
| --- | --- |
| `mcp-startup.ps1` | Resilient server launcher with health probes, logging, retries, and duplicate detection. |
| `mcp-stop.ps1` | Structured shutdown script that respects `stopCommand`/process targets and ships logs. |
| `docs/MCP_SERVERS_SCHEMA.md` | Human-readable explanation of every `servers.json` field plus usage patterns. |
| `docs/servers.schema.json` | Machine-readable JSON Schema for IntelliSense and automated validation. |
| `servers.example.json` | Sanitized sample config referencing the schema, used by CI/test harnesses. |
| `scripts/test-mcp.ps1` | Local/CI runner that executes PSScriptAnalyzer, schema validation, and Pester tests. |
| `tests/McpStartup.Tests.ps1` | Pester specs mocking health probes/Start-Process to cover success/failure modes. |
| `.github/workflows/mcp-pwsh-lint.yml` | Windows CI workflow that installs ScriptAnalyzer, runs `test-mcp.ps1`, and grabs the sample config. |

---

## 2. Server Configuration Schema

### Key Fields
- `enabled` / `autostart`: soft toggles for orchestration.
- `command`, `args`, `env`, `processName`: local launch metadata (validated via `Get-Command`).
- `stopCommand`: optional graceful shutdown hook.
- Health suite: `healthCommand`, `healthCommandArgs`, `healthTcpHost`, `healthTcpPort`, `healthUrl`.
- Remote entries set `type: "http"` and must specify `url` or `healthUrl`.
- Optional `priority`, `restartOnDuplicate`, `restartDelayMs`, `environment` label.

### Schema Usage
1. Add `$schema` to every real config (e.g., `"$schema": "./docs/servers.schema.json"`).
2. Validate drafts with:
   ```powershell
   pwsh -File scripts/test-mcp.ps1 `
     -ConfigPath path/to/servers.json `
     -SchemaPath docs/servers.schema.json
   ```
3. Keep `servers.example.json` updated whenever the schema changes.

---

## 3. Startup Script (`mcp-startup.ps1`)

- **Parameters**: `MaxRetries`, `InitialBackoffSeconds`, `HealthCheckTimeoutSec`, `StopTimeoutSec`, `WhatIfStart`.
- **Logging**: Structured JSONL per run; optional shipping via `MCP_LOG_SHIP_COMMAND` / `MCP_LOG_SHIP_ENDPOINT`.
- **Env loading**: `env.json` schema validation or `MCP_ENV_SECRET_COMMAND` (e.g., 1Password, Doppler).
- **Health Probes**: HTTP, custom command, and TCP checks with exponential backoff; remote-only entries skip local processes.
- **Duplicate handling**: `Ensure-NoDuplicateProcess` kills or skips depending on `restartOnDuplicate`.
- **Testing hook**: set `MCP_STARTUP_IMPORT_ONLY=1` to load functions without executing the main routine (used by Pester).

---

## 4. Shutdown Script (`mcp-stop.ps1`)

- Parses the same config to find `stopCommand` or derive process names (`processName`, `command`, `--name` args).
- Supports `-WhatIfStop` dry runs and structured log shipping.
- Falls back to generic `node/npx` search if config missing.
- Future work: add dedicated Pester tests once scripted stop logic expands.

---

## 5. Validation & CI

### Local Lint/Test
```powershell
winget install Microsoft.PowerShell          # If pwsh unavailable
pwsh -File scripts/test-mcp.ps1 `
  -ConfigPath servers.example.json `
  -SchemaPath docs/servers.schema.json
```
This runs:
1. **PSScriptAnalyzer** on `mcp-startup.ps1`/`mcp-stop.ps1`.
2. **JSON Schema validation** (Test-Json).
3. **Pester tests** (`tests/McpStartup.Tests.ps1`).

### GitHub Actions
- Workflow: `.github/workflows/mcp-pwsh-lint.yml`
- Triggers: pushes/PRs touching MCP scripts/schema.
- Steps: checkout → install PSScriptAnalyzer → `pwsh -File scripts/test-mcp.ps1 -ConfigPath servers.example.json -SchemaPath docs/servers.schema.json`.

---

## 6. Pester Test Coverage

Current scenarios (`tests/McpStartup.Tests.ps1`):
1. Happy-path local process start with healthy probe.
2. Retry + forced stop when health fails repeatedly.
3. Remote-only entry (HTTP) without launching local processes.
4. Duplicate detection with `restartOnDuplicate=false`.
5. Remote health failure logging.
6. `WhatIfStart` mode (no processes spawned).

**Planned additions**: Stop-script coverage, restartDelay overrides, and logging assertions once the stop logic grows.

---

## 7. Operational Runbooks

1. **Startup**: `pwsh -File mcp-startup.ps1` (optionally set `MaxRetries`, etc.). Check logs under `$HOME/.config/mcp/logs/`.
2. **Shutdown**: `pwsh -File mcp-stop.ps1 [-WhatIfStop]` – review log shipping output to confirm all servers stopped.
3. **Config edits**:
   - Update `servers.json` (with `$schema`).
   - Re-run `scripts/test-mcp.ps1`.
   - Commit + push (CI gate ensures lint/test pass).
4. **Telemetry**: Forward `mcp-startup-*.jsonl` / `mcp-stop-*.jsonl` to Loki/Elastic via env vars.

---

## 8. Quick Reference Commands

| Goal | Command |
| --- | --- |
| Start servers | `pwsh -File mcp-startup.ps1` |
| Stop servers | `pwsh -File mcp-stop.ps1` |
| Lint & tests | `pwsh -File scripts/test-mcp.ps1 -ConfigPath servers.example.json -SchemaPath docs/servers.schema.json` |
| Validate real config | `pwsh -File scripts/test-mcp.ps1 -ConfigPath $HOME/.config/mcp/servers.json` |
| Run CI locally | `act -j lint` (if GitHub Actions runner emulation installed) |

---

## 9. Future Enhancements

- Stop-script Pester suite with mocks for `Get-Process` / `Stop-Process`.
- Additional schema-defined health types (`healthCommandTimeout`, `healthCommandEnv`, etc.).
- Structured log ingestion dashboard (Grafana/Loki panel).
- Automated config diff/approval workflow to catch risky changes.

Stay aligned with `docs/MCP_SERVERS_SCHEMA.md`, `docs/servers.schema.json`, and this guide whenever tooling evolves.
