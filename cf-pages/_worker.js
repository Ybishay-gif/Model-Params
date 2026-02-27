const TOKEN_CACHE = { accessToken: null, expiresAt: 0 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (url.pathname === '/api/login' && request.method === 'POST') {
        return withCors(await handleLogin(request, env));
      }

      if (url.pathname === '/api/initial-data' && request.method === 'GET') {
        const auth = await verifyAuth(request, env);
        if (!auth.ok) return withCors(json({ error: 'Unauthorized' }, 401));
        return withCors(await handleInitialData(env));
      }

      if (url.pathname === '/api/row-values' && request.method === 'GET') {
        const auth = await verifyAuth(request, env);
        if (!auth.ok) return withCors(json({ error: 'Unauthorized' }, 401));
        return withCors(await handleRowValues(url, env));
      }

      if (url.pathname === '/api/update' && request.method === 'POST') {
        const auth = await verifyAuth(request, env);
        if (!auth.ok) return withCors(json({ error: 'Unauthorized' }, 401));
        return withCors(await handleUpdate(request, env, auth.user));
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      return withCors(json({ error: err.message || 'Internal error' }, 500));
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };
}

function withCors(response) {
  Object.entries(corsHeaders()).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

async function handleLogin(request, env) {
  const body = await request.json();
  if ((body?.password || '') !== env.APP_PASSWORD) {
    return json({ error: 'Invalid password' }, 401);
  }
  const user = (body?.user || 'external-user').trim() || 'external-user';
  const token = await signToken({ user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }, env.SESSION_SECRET);
  return json({ token });
}

async function handleInitialData(env) {
  const data = await getSheetValues(env, env.DATA_SHEET_NAME || 'LM model configuration');
  if (!data.length) {
    return json({ filters: { tactics: [], verticals: [], segments: [] }, legend: {} });
  }

  const headers = data[0].map(normalizeHeader);
  const rows = data.slice(1);

  const tacticIdx = headers.indexOf('tactic');
  const verticalIdx = headers.indexOf('vertical');
  const segmentIdx = headers.indexOf('segment');

  const uniqueSorted = (idx) => {
    if (idx < 0) return [];
    return [...new Set(rows.map((r) => r[idx]).filter((v) => v !== '' && v != null))].sort();
  };

  const legend = {};
  const legendData = await getSheetValues(env, env.LEGEND_SHEET_NAME || 'legend').catch(() => []);
  legendData.slice(1).forEach((row) => {
    const key = row[0] ? String(row[0]).trim() : '';
    if (!key) return;
    legend[key] = {
      displayName: row[1] || row[0],
      description: row[2] || 'No details available.'
    };
  });

  return json({
    filters: {
      tactics: uniqueSorted(tacticIdx),
      verticals: uniqueSorted(verticalIdx),
      segments: uniqueSorted(segmentIdx)
    },
    legend
  });
}

async function handleRowValues(url, env) {
  const tactic = url.searchParams.get('tactic') || '';
  const vertical = url.searchParams.get('vertical') || '';
  const segment = url.searchParams.get('segment') || '';
  const searchSegment = segment === 'ALL' ? 'MCH' : segment;

  const data = await getSheetValues(env, env.DATA_SHEET_NAME || 'LM model configuration');
  if (!data.length) return json(null);

  const originalHeaders = data[0].map((h) => String(h || '').trim());
  const headers = originalHeaders.map(normalizeHeader);

  const tacticIdx = headers.indexOf('tactic');
  const verticalIdx = headers.indexOf('vertical');
  const segmentIdx = headers.indexOf('segment');

  const row = data.slice(1).find((r) =>
    String(r[tacticIdx] || '').trim() === tactic.trim() &&
    String(r[verticalIdx] || '').trim() === vertical.trim() &&
    String(r[segmentIdx] || '').trim() === searchSegment.trim()
  );

  if (!row) return json(null);

  const result = {};
  originalHeaders.forEach((h, i) => {
    result[h] = row[i] ?? '';
  });

  return json(result);
}

async function handleUpdate(request, env, user) {
  const body = await request.json();
  const payload = body?.payload;
  const isAllSegments = Boolean(body?.isAllSegments);

  if (!payload?.tactic || !payload?.vertical || !payload?.values) {
    return json({ error: 'Invalid payload' }, 400);
  }

  const sheetName = env.DATA_SHEET_NAME || 'LM model configuration';
  const logSheet = env.LOG_SHEET_NAME || 'ChangeLog';

  const data = await getSheetValues(env, sheetName);
  if (!data.length) return json({ rowsUpdated: 0 });

  const originalHeaders = data[0].map((h) => String(h || '').trim());
  const cleanHeaders = originalHeaders.map(normalizeHeader);

  const idxTactic = cleanHeaders.indexOf('tactic');
  const idxVertical = cleanHeaders.indexOf('vertical');
  const idxSegment = cleanHeaders.indexOf('segment');

  const timestamp = new Date().toISOString();
  let rowsUpdated = 0;
  const changeLogs = [];

  for (let i = 1; i < data.length; i += 1) {
    const row = data[i];

    const matchTactic = String(row[idxTactic] || '').trim() === String(payload.tactic).trim();
    const matchVertical = String(row[idxVertical] || '').trim() === String(payload.vertical).trim();
    const matchSegment = isAllSegments ? true : String(row[idxSegment] || '').trim() === String(payload.segment || '').trim();

    if (!matchTactic || !matchVertical || !matchSegment) continue;

    const currentRowSegment = row[idxSegment] || '';

    Object.entries(payload.values).forEach(([key, rawValue]) => {
      const colIdx = cleanHeaders.indexOf(String(key).toLowerCase());
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
    await updateValues(env, `${sheetName}!A1`, data, 'USER_ENTERED');

    await ensureSheetExists(env, logSheet);
    const existingLog = await getSheetValues(env, logSheet).catch(() => []);
    if (!existingLog.length) {
      await updateValues(env, `${logSheet}!A1`, [[
        'Timestamp',
        'User',
        'Tactic',
        'Vertical',
        'Segment',
        'Parameter',
        'Old Value',
        'New Value'
      ]], 'RAW');
    }

    await appendValues(env, `${logSheet}!A:H`, changeLogs, 'USER_ENTERED');
  }

  return json({ rowsUpdated });
}

function normalizeHeader(v) {
  return String(v || '').trim().toLowerCase();
}

function toNumberOrNull(value) {
  const cleaned = String(value).replace(/[$,]/g, '').trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function verifyAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { ok: false };

  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return { ok: false };

    const expected = await hmacSha256Base64Url(env.SESSION_SECRET, payloadB64);
    if (expected !== sigB64) return { ok: false };

    const payload = JSON.parse(atobUrl(payloadB64));
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return { ok: false };

    return { ok: true, user: payload.user || 'external-user' };
  } catch (_err) {
    return { ok: false };
  }
}

async function signToken(payload, secret) {
  const payloadB64 = btoaUrl(JSON.stringify(payload));
  const sig = await hmacSha256Base64Url(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

function btoaUrl(input) {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function atobUrl(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return atob(padded);
}

async function hmacSha256Base64Url(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return arrayBufferToBase64Url(sig);
}

async function getGoogleAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (TOKEN_CACHE.accessToken && TOKEN_CACHE.expiresAt - 60 > now) {
    return TOKEN_CACHE.accessToken;
  }

  const sa = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsigned = `${btoaUrl(JSON.stringify(header))}.${btoaUrl(JSON.stringify(claim))}`;
  const signature = await signRs256(unsigned, sa.private_key);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: `${unsigned}.${signature}`
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const jsonResp = await resp.json();
  if (!resp.ok) throw new Error(jsonResp.error_description || jsonResp.error || 'Failed to get Google token');

  TOKEN_CACHE.accessToken = jsonResp.access_token;
  TOKEN_CACHE.expiresAt = now + Number(jsonResp.expires_in || 3600);
  return TOKEN_CACHE.accessToken;
}

function parseServiceAccount(raw) {
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return JSON.parse(atobUrl(raw));
  }
}

async function signRs256(input, privateKeyPem) {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  return arrayBufferToBase64Url(sig);
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sheetsFetch(env, path, method = 'GET', body) {
  const token = await getGoogleAccessToken(env);
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error?.message || `Sheets API error ${resp.status}`);
  return data;
}

async function getSheetValues(env, sheetName) {
  const range = encodeURIComponent(`${sheetName}!A:ZZ`);
  const data = await sheetsFetch(env, `/values/${range}`);
  return data.values || [];
}

async function updateValues(env, range, values, valueInputOption) {
  const r = encodeURIComponent(range);
  await sheetsFetch(env, `/values/${r}?valueInputOption=${encodeURIComponent(valueInputOption)}`, 'PUT', { values });
}

async function appendValues(env, range, values, valueInputOption) {
  const r = encodeURIComponent(range);
  await sheetsFetch(env, `/values/${r}:append?valueInputOption=${encodeURIComponent(valueInputOption)}&insertDataOption=INSERT_ROWS`, 'POST', { values });
}

async function ensureSheetExists(env, sheetName) {
  const meta = await sheetsFetch(env, '');
  const exists = (meta.sheets || []).some((s) => String(s.properties?.title || '').trim() === sheetName);
  if (exists) return;
  await sheetsFetch(env, ':batchUpdate', 'POST', {
    requests: [{ addSheet: { properties: { title: sheetName } } }]
  });
}
