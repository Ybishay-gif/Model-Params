# Model Config Editor

You now have two deployment modes:

1. `server.js` app (Node backend)
2. `docs/` app (static GitHub Pages, no Render account needed)

## Deploy without Render (GitHub Pages)

This is the easiest path with your current setup.

### 1) Configure Google Cloud

1. In Google Cloud Console, create/select a project.
2. Enable **Google Sheets API**.
3. Create an **OAuth 2.0 Client ID** for **Web application**.
4. Add Authorized JavaScript origins:
- `https://ybishay-gif.github.io`
- `http://localhost:8000` (optional for local testing)
5. Create an API key.

### 2) Configure app

Edit `docs/config.js`:
- `APP_PASSWORD`
- `API_KEY`
- `CLIENT_ID`
- `SPREADSHEET_ID`
- sheet names if needed

### 3) Grant users sheet access

Because this is client-side OAuth, each user edits with their own Google account permissions.
Share the spreadsheet with users (or a Google Group) as **Editor**.

### 4) Publish on GitHub Pages

In GitHub repo settings:
- `Settings` -> `Pages`
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

Your app URL will be:
`https://ybishay-gif.github.io/Model-Params/`

## Notes

- `ChangeLog` is created automatically if missing.
- Logs use the email typed in the app; fallback is `external-user`.
- `APP_PASSWORD` in `docs/config.js` is visible client-side and is only a lightweight gate.
