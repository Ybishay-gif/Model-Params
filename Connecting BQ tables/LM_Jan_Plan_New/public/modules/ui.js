export const DATE_RANGE_PRESETS = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_14_days", label: "Last 14 Days" },
  { key: "last_30_days", label: "Last 30 Days" }
];

function getPresetButtonsMarkup(presets = DATE_RANGE_PRESETS) {
  return presets
    .map(
      (preset) =>
        `<button type="button" class="date-preset-btn" data-preset="${preset.key}">${preset.label}</button>`
    )
    .join("");
}

export function renderDatePresetButtons(container, presets = DATE_RANGE_PRESETS) {
  if (!container) {
    return;
  }
  container.innerHTML = getPresetButtonsMarkup(presets);
}

export function renderDateRangeControl(container, config) {
  if (!container || !config) {
    return;
  }
  const {
    inputId,
    startInputId,
    endInputId,
    presetsId,
    labelText = "Date Range",
    labelClass = "",
    placeholder = "MM/DD/YYYY - MM/DD/YYYY",
    ariaLabel = ""
  } = config;
  if (!inputId || !startInputId || !endInputId || !presetsId) {
    return;
  }

  const labelClassAttr = String(labelClass || "").trim();
  const safeLabelClass = labelClassAttr ? ` class="${labelClassAttr}"` : "";
  const safeAriaLabel = String(ariaLabel || "").trim();
  const inputAria = safeAriaLabel ? ` aria-label="${safeAriaLabel}"` : "";
  const presetsMarkup = getPresetButtonsMarkup(DATE_RANGE_PRESETS);

  container.innerHTML = `
    <label${safeLabelClass} for="${inputId}">${labelText}</label>
    <div class="date-range-input-wrap">
      <input id="${inputId}" class="compact-date range-date-input" type="text" placeholder="${placeholder}"${inputAria} />
      <span class="date-range-input-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M7 3v3M17 3v3M4.75 8.25h14.5M6.75 5.25h10.5a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2v-9.5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 12.25h3M8 15.25h5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
      </span>
    </div>
    <input id="${startInputId}" type="hidden" />
    <input id="${endInputId}" type="hidden" />
    <div class="date-range-presets" id="${presetsId}">
      <button type="button" class="date-preset-trigger">Preset</button>
      <div class="date-preset-menu">${presetsMarkup}</div>
    </div>
  `;
}
