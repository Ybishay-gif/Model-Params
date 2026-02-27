const SLIDERS = {
  'slider-roe': { keys: ['roe_poor', 'roe_minimal', 'roe_0', 'roe_good', 'roe_excellent', 'roe_amazing'], min: -50, max: 50, step: 0.1 },
  'slider-perf': { keys: ['per_poor', 'per_minimal', 'per_good', 'per_excellent', 'per_amazing'], min: 0, max: 300, step: 1 },
  'slider-wr': { keys: ['Poor_WR', 'Low_WR', 'OK_WR', 'High_WR', 'VHigh_WR'], min: 0, max: 100, step: 0.1 },
  'slider-quote': { keys: ['QuoteRate_poor', 'QuoteRate_minimal', 'QuoteRate_good', 'QuoteRate_excellent', 'QuoteRate_amazing'], min: 0, max: 100, step: 0.1 }
};

const GROUPS = {
  'sec-dates': ['early_funnel_start_days', 'early_funnel_end_days', 'early_cmp_funnel_start_days', 'early_cmp_funnel_end_days', 'perf_start_days', 'perf_end_days'],
  'sec-cost': ['QBC', 'minimal_cost', 'mid_cost', 'high_cost', 'vhigh_cost']
};

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let sliderInstances = {};
let legend = {};
let successModal;
let tokenClient;
let accessReady = false;
let unlocked = false;

document.getElementById('unlock-btn').addEventListener('click', unlock);
document.getElementById('google-btn').addEventListener('click', authorizeGoogle);
document.getElementById('save-btn').addEventListener('click', executeSave);
['tactic', 'vertical', 'segment'].forEach((id) => document.getElementById(id).addEventListener('change', fetchCurrentValues));

window.addEventListener('load', () => {
  bootstrapInit();
  waitForGoogleLibraries();
});

function bootstrapInit() {
  successModal = new bootstrap.Modal(document.getElementById('successModal'));

  Object.keys(SLIDERS).forEach((id) => {
    const config = SLIDERS[id];
    const el = document.getElementById(id);
    sliderInstances[id] = noUiSlider.create(el, {
      start: config.keys.map((_, i) => config.min + i * 10),
      connect: Array(config.keys.length + 1).fill(true),
      range: { min: config.min, max: config.max },
      step: config.step,
      tooltips: true,
      pips: {
        mode: 'values',
        values: [config.min, 0, config.max].filter((v, i, a) => a.indexOf(v) === i),
        density: 4
      }
    });

    const handles = el.querySelectorAll('.noUi-handle');
    config.keys.forEach((key, i) => {
      const lbl = document.createElement('div');
      lbl.className = 'handle-label';
      lbl.innerText = key.replace('roe_', '').replace('_WR', '').replace('QuoteRate_', '').replace('per_', '').toUpperCase();
      handles[i].appendChild(lbl);
    });
  });
}

function unlock() {
  const pass = document.getElementById('pass').value;
  if (pass !== APP_CONFIG.APP_PASSWORD) {
    alert('Invalid password');
    return;
  }
  unlocked = true;
  updateGoogleButtonState();
}

function waitForGoogleLibraries() {
  const start = Date.now();
  const interval = setInterval(async () => {
    if (window.gapi && window.google?.accounts?.oauth2) {
      clearInterval(interval);
      await initGoogleClient();
      return;
    }
    if (Date.now() - start > 15000) {
      clearInterval(interval);
      alert('Google libraries failed to load. Refresh and try again.');
    }
  }, 150);
}

async function initGoogleClient() {
  if (!APP_CONFIG.CLIENT_ID || !APP_CONFIG.API_KEY || !APP_CONFIG.SPREADSHEET_ID) {
    alert('Missing config. Update docs/config.js first.');
    return;
  }

  await new Promise((resolve, reject) => {
    window.gapi.load('client', {
      callback: resolve,
      onerror: reject
    });
  });

  await window.gapi.client.init({
    apiKey: APP_CONFIG.API_KEY,
    discoveryDocs: [DISCOVERY_DOC]
  });

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: APP_CONFIG.CLIENT_ID,
    scope: SCOPE,
    callback: () => {
      accessReady = true;
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      initAppData();
    }
  });

  updateGoogleButtonState();
}

function updateGoogleButtonState() {
  document.getElementById('google-btn').disabled = !(unlocked && tokenClient);
}

function authorizeGoogle() {
  if (!tokenClient) return;
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

function normalizeHeader(v) {
  return String(v || '').trim().toLowerCase();
}

function findIndex(headers, key) {
  return headers.indexOf(String(key).toLowerCase());
}

async function getSheetValues(sheetName) {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: APP_CONFIG.SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`
  });
  return res.result.values || [];
}

async function initAppData() {
  toggleLoader(true, 'Synchronizing...');
  try {
    const data = await getSheetValues(APP_CONFIG.DATA_SHEET_NAME);
    if (!data.length) throw new Error('Main sheet is empty.');

    const headers = data[0].map(normalizeHeader);
    const rows = data.slice(1);

    const tactics = uniqueSorted(rows, findIndex(headers, 'tactic'));
    const verticals = uniqueSorted(rows, findIndex(headers, 'vertical'));
    const segments = uniqueSorted(rows, findIndex(headers, 'segment'));

    legend = {};
    try {
      const legendData = await getSheetValues(APP_CONFIG.LEGEND_SHEET_NAME);
      legendData.slice(1).forEach((row) => {
        if (row[0]) {
          const key = String(row[0]).trim();
          legend[key] = {
            displayName: row[1] || row[0],
            description: row[2] || 'No details available.'
          };
        }
      });
    } catch (_err) {
      legend = {};
    }

    fillSelect('tactic', tactics);
    fillSelect('vertical', verticals);
    fillSelect('segment', segments, true);
    renderSections();
    await fetchCurrentValues();
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    toggleLoader(false);
  }
}

function uniqueSorted(rows, idx) {
  if (idx < 0) return [];
  return [...new Set(rows.map((r) => r[idx]).filter((v) => v !== '' && v != null))].sort();
}

function renderSections() {
  Object.keys(GROUPS).forEach((id) => {
    document.getElementById(id).innerHTML = GROUPS[id]
      .map((key) => `
        <div class="col-md-4 mb-3">
          <label class="small fw-bold mb-1">${legend[key]?.displayName || key}${id === 'sec-cost' ? ' ($)' : ''}</label>
          <input type="text" class="form-control val-input" data-key="${key}" id="in-${key}">
        </div>
      `)
      .join('');
  });
}

function fillSelect(id, list, isSeg) {
  const s = document.getElementById(id);
  let html = isSeg ? '<option value="ALL">Apply to ALL (Load MCH)</option>' : '';
  list.forEach((v) => {
    html += `<option value="${v}">${v}</option>`;
  });
  s.innerHTML = html;
}

async function fetchCurrentValues() {
  const tactic = document.getElementById('tactic').value;
  const vertical = document.getElementById('vertical').value;
  const segment = document.getElementById('segment').value;
  if (!tactic || !vertical) return;

  toggleLoader(true, 'Loading...');
  try {
    const data = await getSheetValues(APP_CONFIG.DATA_SHEET_NAME);
    if (!data.length) return;

    const originalHeaders = data[0].map((h) => String(h || '').trim());
    const headers = originalHeaders.map(normalizeHeader);
    const rows = data.slice(1);

    const idxTactic = findIndex(headers, 'tactic');
    const idxVertical = findIndex(headers, 'vertical');
    const idxSegment = findIndex(headers, 'segment');

    const searchSegment = segment === 'ALL' ? 'MCH' : segment;
    const row = rows.find((r) =>
      String(r[idxTactic] || '').trim() === String(tactic).trim() &&
      String(r[idxVertical] || '').trim() === String(vertical).trim() &&
      String(r[idxSegment] || '').trim() === String(searchSegment).trim()
    );

    if (!row) return;

    const vals = {};
    originalHeaders.forEach((h, i) => {
      vals[h] = row[i] ?? '';
    });

    Object.keys(SLIDERS).forEach((id) => {
      sliderInstances[id].set(SLIDERS[id].keys.map((k) => (Number(vals[k]) || 0) * 100));
    });

    Object.keys(vals).forEach((k) => {
      const el = document.getElementById(`in-${k}`) || Array.from(document.querySelectorAll('.val-input')).find((i) => i.dataset.key.toLowerCase() === k.toLowerCase());
      if (el) el.value = vals[k];
    });
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    toggleLoader(false);
  }
}

function toNumberOrNull(v) {
  const cleaned = String(v).replace(/[$,]/g, '').trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

async function ensureSheetExists(sheetName) {
  const meta = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: APP_CONFIG.SPREADSHEET_ID
  });
  const exists = (meta.result.sheets || []).some((s) => String(s.properties?.title || '').trim() === sheetName);
  if (exists) return;

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: APP_CONFIG.SPREADSHEET_ID,
    resource: {
      requests: [{ addSheet: { properties: { title: sheetName } } }]
    }
  });
}

async function executeSave() {
  const payload = {
    tactic: document.getElementById('tactic').value,
    vertical: document.getElementById('vertical').value,
    segment: document.getElementById('segment').value,
    values: {}
  };

  Object.keys(SLIDERS).forEach((id) => {
    const sliderVals = sliderInstances[id].get();
    SLIDERS[id].keys.forEach((key, i) => {
      payload.values[key] = Number(sliderVals[i]) / 100;
    });
  });

  document.querySelectorAll('.val-input').forEach((i) => {
    if (i.value !== '') payload.values[i.dataset.key] = i.value;
  });

  toggleLoader(true, 'Saving...');
  try {
    const data = await getSheetValues(APP_CONFIG.DATA_SHEET_NAME);
    const originalHeaders = data[0].map((h) => String(h || '').trim());
    const cleanHeaders = originalHeaders.map(normalizeHeader);

    const idxTactic = findIndex(cleanHeaders, 'tactic');
    const idxVertical = findIndex(cleanHeaders, 'vertical');
    const idxSegment = findIndex(cleanHeaders, 'segment');

    const isAllSegments = payload.segment === 'ALL';
    const user = document.getElementById('user').value || 'external-user';
    const timestamp = new Date().toISOString();

    let rowsUpdated = 0;
    const changeLogs = [];

    for (let i = 1; i < data.length; i += 1) {
      const row = data[i];
      const matchTactic = String(row[idxTactic] || '').trim() === String(payload.tactic).trim();
      const matchVertical = String(row[idxVertical] || '').trim() === String(payload.vertical).trim();
      const matchSegment = isAllSegments ? true : String(row[idxSegment] || '').trim() === String(payload.segment).trim();

      if (!matchTactic || !matchVertical || !matchSegment) continue;

      const currentRowSegment = row[idxSegment] || '';

      Object.entries(payload.values).forEach(([key, rawValue]) => {
        const colIdx = findIndex(cleanHeaders, key);
        if (colIdx < 0) return;

        const newValue = toNumberOrNull(rawValue);
        if (newValue === null) return;

        const oldValue = row[colIdx] === '' || row[colIdx] == null ? '' : Number(row[colIdx]);
        if (oldValue === newValue) return;

        changeLogs.push([timestamp, user, payload.tactic, payload.vertical, currentRowSegment, originalHeaders[colIdx], row[colIdx], newValue]);
        row[colIdx] = newValue;
      });

      rowsUpdated += 1;
    }

    if (changeLogs.length > 0) {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: APP_CONFIG.SPREADSHEET_ID,
        range: `${APP_CONFIG.DATA_SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: data }
      });

      await ensureSheetExists(APP_CONFIG.LOG_SHEET_NAME);
      const existingLog = await getSheetValues(APP_CONFIG.LOG_SHEET_NAME);
      if (!existingLog.length) {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: APP_CONFIG.SPREADSHEET_ID,
          range: `${APP_CONFIG.LOG_SHEET_NAME}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: [['Timestamp', 'User', 'Tactic', 'Vertical', 'Segment', 'Parameter', 'Old Value', 'New Value']]
          }
        });
      }

      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: APP_CONFIG.SPREADSHEET_ID,
        range: `${APP_CONFIG.LOG_SHEET_NAME}!A:H`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: changeLogs }
      });
    }

    document.getElementById('modal-message').innerText = `${rowsUpdated} row(s) updated successfully!`;
    successModal.show();
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    toggleLoader(false);
  }
}

function toggleLoader(show, text) {
  document.getElementById('loader').style.display = show ? 'flex' : 'none';
  document.getElementById('loader-text').innerText = text;
}
