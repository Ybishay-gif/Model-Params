# Model Config Editor (Google Sheets, no Apps Script)

This app replicates your Apps Script behavior as a standalone web app:
- Password-gated UI
- Filter by `tactic`, `vertical`, `segment`
- Segment `ALL` loads `MCH`
- Update one segment or all segments
- Write detailed change logs to `ChangeLog`

## Local run

1. Copy env file:
```bash
cp .env.example .env
```

2. Fill `.env` values.

3. Run:
```bash
npm install
npm start
```

4. Open `http://localhost:3000`.

## Deploy to web (Render)

This repo includes `render.yaml` for quick deployment.

1. Push this folder to GitHub.
2. In Render: **New +** -> **Blueprint** -> select your repo.
3. Fill required env vars in Render:
- `APP_PASSWORD`
- `SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

### GOOGLE_SERVICE_ACCOUNT_JSON value
Use the full JSON credentials from your service-account key file as a single-line string, or base64-encode the JSON and paste that.

4. Deploy.

## Google setup (required)

1. Create a Google Cloud service account.
2. Enable **Google Sheets API**.
3. Generate a service-account JSON key.
4. Share your spreadsheet with the service account email as **Editor**.

## Notes

- `ChangeLog` is auto-created if missing.
- User in logs comes from the optional email field on login (fallback: `external-user`).
