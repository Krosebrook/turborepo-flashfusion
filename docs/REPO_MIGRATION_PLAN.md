# Repository Migration & Backup Plan (2025-10-01)

This plan removes the accidental git root at `C:\Users\kyler\` (~35k tracked files) and rehomes the FlashFusion stack inside a purpose-built workspace while maintaining auditable backups. It assumes current branch `security-fixes-only` and PowerShell 7+ on Windows with WSL available.

## Objectives
- ✅ Stop tracking the entire Windows profile; keep only project assets under version control.
- ✅ Preserve a recoverable copy of today’s repo state (git bundle + file-system snapshot).
- ✅ Establish clean `~/workspaces/flashfusion` (WSL) and `C:\dev\flashfusion` (Windows) roots for multi-agent work.
- ✅ Feed the new structure into the multi-CLI orchestration (Tessa → Claude/Codex/Gemini) without touching personal folders.

## Phase 0 – Preflight & Risk Scan
1. Freeze automation: stop MCP servers (`.\mcp-stop.ps1`), background sync (OneDrive), and agent CLIs.
2. Capture current git metadata:
   - `git rev-parse --show-toplevel`
   - `git status --short | Measure-Object`
   - `git branch -vv`
3. Inventory large/untracked artifacts: `Get-ChildItem -Recurse -Filter *.log -File | Sort Length -Descending | Select -First 20`.
4. Export dependency manifests for verification: `npm ls --depth=0`, `pip freeze`, `pnpm list --depth 0` if applicable.

## Phase 1 – Backups (Outside Repo)
| Step | Command | Notes |
| --- | --- | --- |
| 1 | `New-Item C:\MIGRATION_BACKUP_2025_10_01 -ItemType Directory -Force` | Dedicated root outside git. |
| 2 | `git bundle create C:\MIGRATION_BACKUP_2025_10_01\home-profile.bundle --all` | Single-file git snapshot. |
| 3 | `robocopy C:\Users\kyler C:\MIGRATION_BACKUP_2025_10_01\full-profile /MIR /XD .git OneDrive AppData` | File-level mirror minus volatile dirs. |
| 4 | `tar -czf C:\MIGRATION_BACKUP_2025_10_01\supabase-artifacts.tgz supabase* SECURITY* Apply-SupabaseSecurity.ps1` | Critical DB + security scripts. |
| 5 | Hash verification: `Get-FileHash C:\MIGRATION_BACKUP_2025_10_01\*.bundle` | Store hashes in BACKUP.md. |

## Phase 2 – Define Target Layout
```
C:\dev\flashfusion\        # Windows workspace (git root)
└── apps/
└── packages/
└── supabase/
└── scripts/
└── docs/                  # symlinked or mirrored from /mnt/c

\\wsl$\Ubuntu\home\kyler\workspaces\flashfusion\   # Linux mirror (git worktree)
```
- Use `git worktree add` to keep WSL + Windows trees in sync without nested repos.
- Dotfiles (aliases, MCP configs) move to `~/dotfiles` tracked separately (chezmoi/justfiles).

## Phase 3 – Selective Migration
1. Build keep/drop manifest (CSV) listing every top-level folder with action (`keep`, `archive`, `ignore`). Example keepers: `FlashfusionRemote`, `turborepo-flashfusion`, `supabase`, `scripts`.
2. Use `robocopy` with exclusion list to copy only keepers:
   ```
   robocopy C:\Users\kyler C:\dev\flashfusion ^
     apps packages supabase scripts FlashFusion ^
     /E /XD .git node_modules .cache OneDrive Downloads
   ```
3. For NPM/PNPM projects, delete `node_modules` in destination to force clean `npm ci`.
4. Move documentation into `C:\dev\flashfusion\docs\` (CLAUDE.md, AGENTS.md, checkpoints) and update relative links.

## Phase 4 – Initialize Clean Repo
1. `cd C:\dev\flashfusion`
2. `git init --initial-branch=main`
3. Recreate `.gitignore` using combined language templates; ensure `*.log`, `AppData/`, `OneDrive/`, `C:/Users/kyler/**` are excluded.
4. Stage minimal seed commit:
   ```
   git add README.md docs/ CLAUDE.md AGENTS.md supabase/ scripts/
   git commit -m "chore: seed flashfusion workspace after migration"
   ```
5. Add remote once verified: `git remote add origin git@github.com:...`.

## Phase 5 – Verification & Cutover
1. Run automated checks per stack:
   - Node: `npm ci && npm run lint && npm test`.
   - Python: `pip install -r requirements.txt && pytest -q`.
   - Supabase: `supabase db lint`.
2. Rebuild MCP configs so `mcp-startup.ps1` points at new repo-rooted scripts (update `$configDir` if needed).
3. Update automation docs (`PROGRESS.md`, `CHECKPOINT.md`) with new paths.
4. Archive old repo: rename `C:\Users\kyler\.git` → `.git-legacy-2025-10-01` after validating all history lives in bundle.
5. Re-enable CLIs sequentially (Tessa → Claude → Codex → Gemini) pointing them to `C:\dev\flashfusion`.

## Tooling & Best Practices Checklist
- [ ] Structured logging for migration (`Start-Transcript` in PowerShell, `script` in WSL).
- [ ] Health checks post-move (Port availability, `git status` cleanliness).
- [ ] Secrets validation (`gitleaks detect`, `trufflehog`) before pushing new repo.
- [ ] Observability hook: emit `.session-context.json` with new paths for Tessa.
- [ ] Document rollback: `git clone --mirror home-profile.bundle` instructions stored alongside backup hashes.

Following this phased approach keeps backups verifiable, avoids parallel write hazards, and produces the clean workspace required for the multi-agent workflow.
