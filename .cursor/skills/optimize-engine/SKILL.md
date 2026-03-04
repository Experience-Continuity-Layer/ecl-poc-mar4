---
name: optimize-engine
description: Reviews project state and agent transcript history to propose or implement optimizations to rules and skills while keeping token usage minimal. Use when the user asks to review or optimize the engine, update rules based on history, or improve skills from past iterations.
---

# Optimize Engine

## When to use this skill

Use this skill when:
- The user says "review project", "optimize engine", "update rules based on history", or similar.
- The project has gone through many iterations and rules/skills may be drifting from reality.
- You want to mine the agent transcript history for patterns that justify new or updated rules/skills.

## Token-efficient review protocol

Always follow a **three-phase**, token-conscious process.

### Phase 1 — Lightweight scan (metadata only)

1. Locate the transcript directory for this project:
   - `~/.cursor/projects/<project-id>/agent-transcripts/`
2. For each **parent transcript** (ignore `subagents/` for now):
   - Read only the first **15–20 lines** of the `.jsonl` file.
   - Extract:
     - Date / timestamp
     - High-level topic (from the first user message)
     - Main goal or task for that session
3. Build a short internal table (in your reasoning) with one line per transcript.
4. Do **not** read full transcripts yet.

### Phase 2 — Pattern detection

From the metadata summaries, infer patterns:
- Recurring tasks (done 2+ times) → candidate for **new skills**.
- Recurring bugs or rework → candidate for **rule updates** or **skill tightening**.
- Controls/fields added but not wired → reinforce `modify-agent-context` and `agent-context-contract`.
- New primitives added without Design System Tool updates → reinforce `sync-design-system-tool`.
- Drift between rules and actual implementation (e.g., stack or architecture changed) → update rules.

Only if a specific pattern is unclear, selectively read more of the **few most relevant** transcripts.
Do not read more than **5–8 transcripts in detail** in a single run.

### Phase 3 — Propose changes

1. Draft a short change list (ideally **≤ 5 items**):
   - For each item, specify:
     - What to change (rule/skill file and section)
     - Why (pattern observed)
     - Evidence (which transcript UUID(s))
2. Present the list to the user in bullets, for example:
   - `Update .cursor/rules/experience-continuity-layer.mdc because dock behavior changed in [UUID].`
3. Ask the user how to proceed:
   - Implement all
   - Implement one by one
   - Defer changes
4. When implementing, re-use existing skills where possible:
   - `create-rule` for new or updated rules
   - `create-skill` for new skills or large refactors

## Token guardrails

- Prefer **recent transcripts** (last 7 days or latest N) over older ones.
- Never stream full transcript history into context unless absolutely necessary.
- Keep your written summary of patterns short and punchy.
- If many potential improvements exist, prefer a small, high-impact subset for this run and note others as \"next review\" items.

## Interaction pattern with the user

- Be explicit that you are running an engine optimization review.
- Show only the **proposed changes**, not all raw observations.
- Ask for confirmation before editing rules or skills.
- After changes, briefly restate how the engine is now better aligned with actual usage history.

