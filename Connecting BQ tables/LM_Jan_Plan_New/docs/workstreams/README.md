# Workstreams

Use this folder for task-level context that needs to survive across chats.

## When To Create One
- Multi-step feature work
- Analytics investigations or parity checks
- Bug investigations with reproduction details
- Design explorations
- Deployment or environment incidents

## Naming
- One file per concrete topic.
- Use short kebab-case names, for example:
  - `targets-page.md`
  - `roe-cor-parity.md`
  - `price-exploration.md`
  - `deploy-proxy.md`

## How To Use
1. Start a topic by copying `TEMPLATE.md`.
2. Keep only the details needed to resume work in a new chat.
3. Update the file when decisions, findings, blockers, or next steps change.
4. In a new chat, point to the file directly:
   - `Continue docs/workstreams/roe-cor-parity.md`

## What Belongs Here
- Goal
- Current issue
- Reproduction details
- Source-of-truth screen(s), endpoint(s), SQL object(s), or files
- Constraints and assumptions
- Decisions made
- Open questions
- Next steps

## What Does Not Belong Here
- General repo setup or deployment policy
- Stable architecture facts already covered by `RUNBOOK.md` or `CURRENT_STATE.md`
- Long logs or raw dumps that make the file hard to scan
