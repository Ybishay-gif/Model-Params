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

let sliderInstances = {};
let legend = {};
let successModal;
let token = '';

document.getElementById('login-btn').addEventListener('click', verify);
document.getElementById('save-btn').addEventListener('click', executeSave);
['tactic', 'vertical', 'segment'].forEach((id) => document.getElementById(id).addEventListener('change', fetchCurrentValues));

async function api(path, options = {}) {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

async function verify() {
  try {
    const password = document.getElementById('pass').value;
    const user = document.getElementById('user').value.trim().toLowerCase();
    if (!isValidEmail(user)) {
      alert('Enter a valid email for logging.');
      return;
    }
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ password, user }) });
    token = data.token;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    init();
  } catch (error) {
    alert(error.message || 'Login failed');
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function init() {
  toggleLoader(true, 'Synchronizing...');
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

  try {
    const data = await api('/api/initial-data');
    legend = data.legend || {};
    fillSelect('tactic', data.filters?.tactics || []);
    fillSelect('vertical', data.filters?.verticals || []);
    fillSelect('segment', data.filters?.segments || [], true);
    renderSections();
    await fetchCurrentValues();
  } catch (error) {
    if (String(error.message).includes('Unauthorized')) {
      token = '';
      location.reload();
      return;
    }
    alert(error.message);
  } finally {
    toggleLoader(false);
  }
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
  const t = document.getElementById('tactic').value;
  const v = document.getElementById('vertical').value;
  const s = document.getElementById('segment').value;
  if (!t || !v) return;

  toggleLoader(true, 'Loading...');
  try {
    const params = new URLSearchParams({ tactic: t, vertical: v, segment: s });
    const vals = await api(`/api/row-values?${params.toString()}`);

    if (vals) {
      Object.keys(SLIDERS).forEach((id) => {
        sliderInstances[id].set(SLIDERS[id].keys.map((k) => (Number(vals[k]) || 0) * 100));
      });

      Object.keys(vals).forEach((k) => {
        const el = document.getElementById(`in-${k}`) || Array.from(document.querySelectorAll('.val-input')).find((input) => input.dataset.key.toLowerCase() === k.toLowerCase());
        if (el) el.value = vals[k];
      });
    }
  } catch (error) {
    alert(error.message);
  } finally {
    toggleLoader(false);
  }
}

async function executeSave() {
  toggleLoader(true, 'Saving...');

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

  try {
    const res = await api('/api/update', {
      method: 'POST',
      body: JSON.stringify({ payload, isAllSegments: payload.segment === 'ALL' })
    });

    document.getElementById('modal-message').innerText = `${res.rowsUpdated} row(s) updated successfully!`;
    successModal.show();
  } catch (error) {
    alert(error.message);
  } finally {
    toggleLoader(false);
  }
}

function toggleLoader(show, text) {
  document.getElementById('loader').style.display = show ? 'flex' : 'none';
  document.getElementById('loader-text').innerText = text;
}
