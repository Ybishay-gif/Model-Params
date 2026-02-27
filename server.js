const path = require('path');
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const APP_PASSWORD = process.env.APP_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const DATA_SHEET_NAME = process.env.DATA_SHEET_NAME || 'LM model configuration';
const LEGEND_SHEET_NAME = process.env.LEGEND_SHEET_NAME || 'legend';
const LOG_SHEET_NAME = process.env.LOG_SHEET_NAME || 'ChangeLog';
const GOOGLE_SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const isProd = process.env.NODE_ENV === 'production';

if (
  !APP_PASSWORD ||
  !SESSION_SECRET ||
  !SPREADSHEET_ID ||
  (!GOOGLE_SERVICE_ACCOUNT_KEY_PATH && !GOOGLE_SERVICE_ACCOUNT_JSON)
) {
  // eslint-disable-next-line no-console
  console.error('Missing required env vars. Check .env.example');
  process.exit(1);
}

if (isProd) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd
    }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

async function getSheetsClient() {
  let authOptions;
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    const maybeB64 = String(GOOGLE_SERVICE_ACCOUNT_JSON).trim();
    let parsed;
    try {
      parsed = JSON.parse(maybeB64);
    } catch (_err) {
      parsed = JSON.parse(Buffer.from(maybeB64, 'base64').toString('utf8'));
    }
    authOptions = {
      credentials: parsed,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };
  } else {
    authOptions = {
      keyFile: GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };
  }

  const auth = new google.auth.GoogleAuth(authOptions);

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase();
}

function getIndex(headers, key) {
  return headers.indexOf(key.toLowerCase());
}

function toNumberOrNull(value) {
  const cleaned = String(value).replace(/[$,]/g, '').trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

async function getSheetValues(sheets, sheetName) {
  const range = `${sheetName}!A:ZZ`;
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range
  });
  return data.values || [];
}

async function ensureSheetExists(sheets, sheetName) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID
  });
  const exists = (meta.data.sheets || []).some(
    (s) => String(s.properties?.title || '').trim() === sheetName
  );

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: sheetName }
            }
          }
        ]
      }
    });
  }
}

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== APP_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  req.session.authenticated = true;
  req.session.user = req.body?.user || 'external-user';
  return res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/initial-data', requireAuth, async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const data = await getSheetValues(sheets, DATA_SHEET_NAME);

    if (!data.length) {
      return res.json({ filters: { tactics: [], verticals: [], segments: [] }, legend: {} });
    }

    const headers = data[0].map(normalizeHeader);

    const tacticIdx = getIndex(headers, 'tactic');
    const verticalIdx = getIndex(headers, 'vertical');
    const segmentIdx = getIndex(headers, 'segment');

    const rows = data.slice(1);
    const uniqueSorted = (idx) => {
      if (idx < 0) return [];
      return [...new Set(rows.map((r) => r[idx]).filter((v) => v !== '' && v != null))].sort();
    };

    const legend = {};
    const legendData = await getSheetValues(sheets, LEGEND_SHEET_NAME);
    legendData.slice(1).forEach((row) => {
      const key = row[0] ? String(row[0]).trim() : '';
      if (!key) return;
      legend[key] = {
        displayName: row[1] || row[0],
        description: row[2] || 'No details available.'
      };
    });

    return res.json({
      filters: {
        tactics: uniqueSorted(tacticIdx),
        verticals: uniqueSorted(verticalIdx),
        segments: uniqueSorted(segmentIdx)
      },
      legend
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/row-values', requireAuth, async (req, res) => {
  try {
    const { tactic, vertical, segment } = req.query;
    const searchSegment = segment === 'ALL' ? 'MCH' : segment;

    const sheets = await getSheetsClient();
    const data = await getSheetValues(sheets, DATA_SHEET_NAME);
    if (!data.length) return res.json(null);

    const originalHeaders = data[0].map((h) => String(h || '').trim());
    const headers = originalHeaders.map(normalizeHeader);

    const tacticIdx = getIndex(headers, 'tactic');
    const verticalIdx = getIndex(headers, 'vertical');
    const segmentIdx = getIndex(headers, 'segment');

    const row = data.slice(1).find((r) =>
      String(r[tacticIdx] || '').trim() === String(tactic || '').trim() &&
      String(r[verticalIdx] || '').trim() === String(vertical || '').trim() &&
      String(r[segmentIdx] || '').trim() === String(searchSegment || '').trim()
    );

    if (!row) return res.json(null);

    const result = {};
    originalHeaders.forEach((header, i) => {
      result[header] = row[i] ?? '';
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/update', requireAuth, async (req, res) => {
  try {
    const payload = req.body?.payload;
    const isAllSegments = Boolean(req.body?.isAllSegments);

    if (!payload?.tactic || !payload?.vertical || !payload?.values) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const sheets = await getSheetsClient();
    const data = await getSheetValues(sheets, DATA_SHEET_NAME);
    if (!data.length) return res.json({ rowsUpdated: 0 });

    const originalHeaders = data[0].map((h) => String(h || '').trim());
    const cleanHeaders = originalHeaders.map(normalizeHeader);

    const tacticIdx = getIndex(cleanHeaders, 'tactic');
    const verticalIdx = getIndex(cleanHeaders, 'vertical');
    const segmentIdx = getIndex(cleanHeaders, 'segment');

    const timestamp = new Date().toISOString();
    const user = req.session.user || 'external-user';

    let rowsUpdated = 0;
    const changeLogs = [];

    for (let i = 1; i < data.length; i += 1) {
      const row = data[i];

      const matchTactic = String(row[tacticIdx] || '').trim() === String(payload.tactic).trim();
      const matchVertical = String(row[verticalIdx] || '').trim() === String(payload.vertical).trim();
      const matchSegment = isAllSegments
        ? true
        : String(row[segmentIdx] || '').trim() === String(payload.segment || '').trim();

      if (!matchTactic || !matchVertical || !matchSegment) continue;

      const currentRowSegment = row[segmentIdx] || '';

      Object.entries(payload.values).forEach(([key, rawValue]) => {
        const colIdx = getIndex(cleanHeaders, String(key));
        if (colIdx < 0) return;

        const newValue = toNumberOrNull(rawValue);
        if (newValue === null) return;

        const oldValue = row[colIdx] === '' || row[colIdx] == null ? '' : Number(row[colIdx]);
        if (oldValue === newValue) return;

        changeLogs.push([
          timestamp,
          user,
          payload.tactic,
          payload.vertical,
          currentRowSegment,
          originalHeaders[colIdx],
          row[colIdx],
          newValue
        ]);

        row[colIdx] = newValue;
      });

      rowsUpdated += 1;
    }

    if (changeLogs.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${DATA_SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: data }
      });

      await ensureSheetExists(sheets, LOG_SHEET_NAME);
      const existingLog = await getSheetValues(sheets, LOG_SHEET_NAME).catch(() => []);
      if (!existingLog.length) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${LOG_SHEET_NAME}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Timestamp',
              'User',
              'Tactic',
              'Vertical',
              'Segment',
              'Parameter',
              'Old Value',
              'New Value'
            ]]
          }
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${LOG_SHEET_NAME}!A:H`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: changeLogs }
      });
    }

    return res.json({ rowsUpdated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Model Config app running on http://localhost:${PORT}`);
});
