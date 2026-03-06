## Goal
- Bring the Plan Outcome screen into alignment with the existing design system and make it readable without introducing one-off UI patterns.

## Current Status
- Status: implementing
- Last updated: 2026-03-06

## Current Issue
- The Plan Outcome screen renders as a thin header plus a dense overflow table, which does not match the stronger page composition used elsewhere in the app.

## Reproduction / Trigger
- Open Plan -> Plan Outcome.
- Select a plan with outcome rows, for example the plan shown in the current user report.
- Observe that the page does not use full available height, hides scroll inside the table container, and compresses grouped values into unreadable single-line cells.

## Source Of Truth
- Screen(s): Plan Outcome, Price Exploration Decisions, Strategy Analysis
- Endpoint(s): `/api/analytics/price-exploration`
- Service / SQL: `src/routes/api/analyticsRoutes.ts`, `src/services/analyticsService.ts`
- Reference file(s): `public/index.html`, `public/main.js`, `public/styles.css`, `DESIGN_SYSTEM.md`

## Constraints
- Reuse shared layout and table primitives before adding anything new.
- Keep validation on the testing site only.
- Avoid changing the broader visual language of the app.

## Decisions Made
- Use Price Exploration Decisions as the main structural reference because it already combines summary context, KPIs, and a detailed table within the same visual system.
- Keep the shared table system, but stop relying on it as the only presentation layer for grouped outcome data.

## Findings
- The current implementation uses shared classes only at the shell level and flattens one-to-many values into comma-joined strings.
- The table container owns scrolling via `.table-wrap`, which makes the page appear height-constrained.

## Next Steps
- Refactor Plan Outcome into a summary-plus-detail layout using shared cards/KPIs.
- Make the main card consume available height and keep scroll behavior obvious.
- Validate on the testing site after deploy.
