# Model Config Editor

Public app URL (Cloudflare Pages):
- https://model-params-web.pages.dev/

## What this solves

- External users can access the app on the web.
- Users do **not** need Google OAuth in the UI.
- Users log in with one app password.
- Backend writes directly to Google Sheets and appends `ChangeLog`.

## Important final step (required)

Share your Google Sheet with this service account as **Editor**:
- `org-dashboard-bq-reader@crblx-beacon-prod.iam.gserviceaccount.com`

Spreadsheet:
- `1-9_cPiP6vcEYRTQ914DWPFqkJs39c64Txw1E3sfDOUQ`

Without this share, the app returns: `The caller does not have permission`.

## Deployment details

- Cloudflare Pages project: `model-params-web`
- App + API code deployed from local folder: `cf-pages/`
- Worker secrets configured in Cloudflare Pages project:
  - `APP_PASSWORD`
  - `SESSION_SECRET`
  - `SPREADSHEET_ID`
  - `GOOGLE_SERVICE_ACCOUNT_JSON`

## Local project structure

- `cf-pages/` Cloudflare Pages deployment package (frontend + `_worker.js` API)
- `cloudflare-worker/` standalone worker variant
- `server.js` Node backend variant
- `docs/` GitHub Pages variant
