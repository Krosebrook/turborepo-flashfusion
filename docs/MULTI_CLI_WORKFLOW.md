# Multi-CLI Sequential Workflow Blueprint (2025-10-01)

This runbook enforces a safe, sequential orchestration model for Tessa → Claude → Codex → Gemini (and auxiliaries) so multiple CLIs never collide on the same filesystem while still sharing full context.

## Objectives
1. Keep every CLI read/write operation serialized with explicit handoffs.
2. Require verifiable checkpoints (`git status`, `tests`, `session-context`) between phases.
3. Ensure backups and repo migration plan gates are respected before any write occurs.
4. Produce artefacts (`CHECKPOINT*.md`, `.session-context.json`, `PROGRESS.md`) updated at each milestone.

## Tooling Prerequisites
- `scripts/launch-cli-with-context.sh` – loads AGENTS + CLAUDE + latest checkpoints.
- `docs/REPO_MIGRATION_PLAN.md` – authoritative on backup/move steps.
- `.session-context.json` – auto-generated for downstream CLIs.
- External backup location (`C:\MIGRATION_BACKUP_YYYY_MM_DD\`) verified via hashes.

## Phase 0 – Tessa Orchestration (Mode: Planning)
| Step | Command | Verification |
| --- | --- | --- |
| 0.1 | `scripts/launch-cli-with-context.sh tessa plan` | `.session-context.json` updated (check timestamp). |
| 0.2 | `git status --short | Measure-Object` | Confirms clean tree before delegation. |
| 0.3 | `Get-ChildItem CHECKPOINT*.md | Sort-Object LastWriteTime -Descending | Select -First 1` | Ensures latest checkpoint referenced. |
| 0.4 | Update `CHECKPOINT*.md` with next-step list + owners. | Sign-off from user before any CLI writes. |

**Gate A**: No CLI proceeds until Tessa logs Phase 0 completion in `PROGRESS.md`.

## Phase 1 – Read-Only Recon (Claude)
1. Launch: `scripts/launch-cli-with-context.sh claude analyze`.
2. Tasks: doc inventory refresh, dependency mapping, env audit (see `docs/FOUND.md` patterns).
3. Outputs: appended sections in `docs/FOUND.md`, optional diffs staged but not committed.
4. Verification:
   - `git status --short` returns no changes (read-only guarantee).
   - `wc -l docs/FOUND.md` logged in checkpoint to prove update.

**Gate B**: Tessa validates `docs/FOUND.md` + `CHECKPOINT` entries before Codex writes.

## Phase 2 – Implementation (Codex)
1. Launch sequentially: `scripts/launch-cli-with-context.sh codex <task>`.
2. Only one strand at a time:
   - `repo-migration`: follow `docs/REPO_MIGRATION_PLAN.md`.
   - `automation`: add scripts under `scripts/`.
3. After each strand:
   - `npm run lint` or relevant tests.
   - `git status --short` snapshot pasted into checkpoint.
   - `Check-Sum C:\MIGRATION_BACKUP_*/home-profile.bundle` (PowerShell) if touched backups.

**Gate C**: Manual review (Claude or human) diff before merge/commit.

## Phase 3 – Review & Validation (Claude/Gemini)
1. Claude: `scripts/launch-cli-with-context.sh claude review`.
   - Performs code review, updates `docs/PROGRESS.md`.
2. Gemini: run exploratory testing or doc generation (`scripts/launch-cli-with-context.sh gemini qa`).
3. Verification matrix:
   - Tests: `npm test`, `pytest -q`, `supabase db lint`.
   - Security: `npm audit --production`, `trivy fs .` for touched folders.

**Gate D**: All tests passing, checkpoint updated with ✅/⚠️ statuses.

## Phase 4 – Ops & Merge (OPS agent / user)
1. Confirm remote/backups in place before pushing:
   - `git remote -v`
   - `git push origin <branch>` (if allowed post-migration).
2. Update `PROGRESS.md` / `DECISIONS.md` with final resolution.
3. Archive superseded checkpoints (rename to `CHECKPOINT_<date>_ARCHIVED.md`).

## Communication Protocol
- Status emojis per AGENTS.md (✓, ⚡, ❌, 🔄, 🐛, 🚀).
- Each phase logs to `CHECKPOINT_YYYY_MM_DD*.md`:
  - `State`
  - `Blockers`
  - `Next 5 tasks`
  - `Verification evidence` (commands + summaries).

## Safety Checklist Before Each Hand-off
- [ ] `.session-context.json` timestamp < 5 minutes old.
- [ ] `git status --short` pasted into checkpoint.
- [ ] Tests relevant to touched stack executed and linked.
- [ ] `scripts/launch-cli-with-context.sh` used (no direct CLI launch).
- [ ] Backups untouched? If no, log hash verification.
- [ ] Mode switch announced (Planning → Implement → Validate → Optimize).

## Future Enhancements
- Automate Gate checks via a lightweight CLI (Python) that reads `.session-context.json` and ensures criteria before unlocking next phase.
- Integrate `FOUND.md` entries into a SQLite knowledge index for search (Gemini/GPT ingest).
- Wire structured logs into `logs/` for OPS ingestion (Grafana/Loki).
