const state = {
  email: localStorage.getItem("planning_user_email") || "",
  role: localStorage.getItem("planning_user_role") || "",
  sessionToken: localStorage.getItem("planning_session_token") || "",
  activeSection: "plan",
  activePlanTab: "builder",
  activeAnalyticsTab: "state-segment",
  activeSettingsTab: "config",
  authEmailCandidate: "",
  activityLeadType: localStorage.getItem("planning_activity_lead_type") || "all",
  config: {
    perfFromDays: Number(localStorage.getItem("planning_perf_from_days") || 30),
    perfToDays: Number(localStorage.getItem("planning_perf_to_days") || 7),
    priceFromDays: Number(localStorage.getItem("planning_price_from_days") || 30),
    priceToDays: Number(localStorage.getItem("planning_price_to_days") || 7),
    targetsFromDays: Number(localStorage.getItem("planning_targets_from_days") || 30),
    targetsToDays: Number(localStorage.getItem("planning_targets_to_days") || 7),
    qbcClicks: Number(localStorage.getItem("planning_qbc_clicks") || 1),
    qbcLeadsCalls: Number(localStorage.getItem("planning_qbc_leads_calls") || 1)
  },
  multiSelectValues: {
    states: [],
    segments: [],
    stateSegmentChannels: [],
    priceStates: [],
    priceChannels: []
  },
  stateSegmentRawRows: [],
  stateSegmentDisplayRows: [],
  stateSegmentSort: {
    key: "state",
    direction: "asc"
  },
  targetsSort: {
    key: "state",
    direction: "asc"
  },
  targetsRows: [],
  targetsMode: "bq",
  uploadedTargetsFile: null,
  targetsDefaultLoaded: false,
  defaultTargetsFile: null,
  targetsGoalMode: "cpb",
  derivedTargetRules: [],
  derivedRuleIdCounter: 1,
  derivedTargetStateOptions: [],
  derivedTargetSegmentOptions: ["MCH", "MCR", "SCH", "SCR"],
  planStrategyRules: [],
  planStrategyRuleIdCounter: 1,
  planStrategyStateOptions: [],
  planStrategySegmentOptions: ["MCH", "MCR", "SCH", "SCR"],
  strategyAnalysisRows: []
};

const DEFAULT_TARGETS_FILE_URL = "/assets/Targets-default.xlsx";
const DEFAULT_TARGETS_FILE_STORAGE_KEY = "planning_default_targets_file";
const DEFAULT_TARGETS_FILE_DB_NAME = "planning_app_settings";
const DEFAULT_TARGETS_FILE_DB_STORE = "settings";
const DEFAULT_TARGETS_FILE_DB_KEY = "default_targets_file";
const PRICE_EXPLORATION_MAX_ROWS = 5000;
const DEFAULT_TARGETS_TABLE_COL_COUNT = 12;
const DERIVED_RULES_STORAGE_PREFIX = "planning_targets_rules_";
const PLAN_STRATEGY_PARAM_KEY = "plan_strategy_config";
const SELECTED_PLAN_ID_STORAGE_KEY = "planning_selected_plan_id";
const PLAN_STRATEGY_LOCAL_PREFIX = "planning_plan_strategy_local_";
const ALL_US_STATE_CODES = [
  "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL",
  "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA",
  "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE",
  "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"
];

const el = {
  appLayout: document.getElementById("appLayout"),
  loginScreen: document.getElementById("loginScreen"),
  authStatus: document.getElementById("authStatus"),
  adminAccessCode: document.getElementById("adminAccessCode"),
  adminLoginBtn: document.getElementById("adminLoginBtn"),
  authEmail: document.getElementById("authEmail"),
  userContinueBtn: document.getElementById("userContinueBtn"),
  userPasswordLoginWrap: document.getElementById("userPasswordLoginWrap"),
  userPasswordSetupWrap: document.getElementById("userPasswordSetupWrap"),
  authPassword: document.getElementById("authPassword"),
  userLoginBtn: document.getElementById("userLoginBtn"),
  authCreatePassword: document.getElementById("authCreatePassword"),
  authConfirmPassword: document.getElementById("authConfirmPassword"),
  userSetPasswordBtn: document.getElementById("userSetPasswordBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  meStatus: document.getElementById("meStatus"),
  planName: document.getElementById("planName"),
  planDesc: document.getElementById("planDesc"),
  createPlan: document.getElementById("createPlan"),
  createStatus: document.getElementById("createStatus"),
  refreshPlans: document.getElementById("refreshPlans"),
  plansList: document.getElementById("plansList"),
  selectedPlanId: document.getElementById("selectedPlanId"),
  paramKey: document.getElementById("paramKey"),
  paramValue: document.getElementById("paramValue"),
  paramType: document.getElementById("paramType"),
  saveParameter: document.getElementById("saveParameter"),
  decisionType: document.getElementById("decisionType"),
  decisionValue: document.getElementById("decisionValue"),
  decisionState: document.getElementById("decisionState"),
  decisionChannel: document.getElementById("decisionChannel"),
  addDecision: document.getElementById("addDecision"),
  runPlan: document.getElementById("runPlan"),
  actionStatus: document.getElementById("actionStatus"),
  activityLeadTypeFilter: document.getElementById("activityLeadTypeFilter"),
  menuItems: document.querySelectorAll(".menu-item[data-section]"),
  planSectionBtn: document.getElementById("planSectionBtn"),
  planMenuSubmenu: document.getElementById("planMenuSubmenu"),
  planTabBuilder: document.getElementById("planTabBuilder"),
  planTabTargets: document.getElementById("planTabTargets"),
  planTabStrategy: document.getElementById("planTabStrategy"),
  planBuilderPanel: document.getElementById("planBuilderPanel"),
  targetsPanel: document.getElementById("targetsPanel"),
  planStrategyPanel: document.getElementById("planStrategyPanel"),
  analyticsSectionBtn: document.getElementById("analyticsSectionBtn"),
  analyticsMenuSubmenu: document.getElementById("analyticsMenuSubmenu"),
  settingsMenuSubmenu: document.getElementById("settingsMenuSubmenu"),
  settingsSubConfig: document.getElementById("settingsSubConfig"),
  settingsSubUsers: document.getElementById("settingsSubUsers"),
  settingsConfigPanel: document.getElementById("settingsConfigPanel"),
  settingsUsersPanel: document.getElementById("settingsUsersPanel"),
  newUserEmail: document.getElementById("newUserEmail"),
  addUserBtn: document.getElementById("addUserBtn"),
  refreshUsersBtn: document.getElementById("refreshUsersBtn"),
  usersStatus: document.getElementById("usersStatus"),
  usersTableBody: document.getElementById("usersTableBody"),
  sectionPanels: document.querySelectorAll("[data-section-panel]"),
  analyticsTabStateSegment: document.getElementById("analyticsTabStateSegment"),
  analyticsTabPriceExploration: document.getElementById("analyticsTabPriceExploration"),
  analyticsTabStrategyAnalysis: document.getElementById("analyticsTabStrategyAnalysis"),
  stateSegmentPanel: document.getElementById("stateSegmentPanel"),
  priceExplorationPanel: document.getElementById("priceExplorationPanel"),
  strategyAnalysisPanel: document.getElementById("strategyAnalysisPanel"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  stateSegmentViewMode: document.getElementById("stateSegmentViewMode"),
  applyAnalyticsFilters: document.getElementById("applyAnalyticsFilters"),
  clearAnalyticsFilters: document.getElementById("clearAnalyticsFilters"),
  exportStateSegmentExcel: document.getElementById("exportStateSegmentExcel"),
  analyticsStatus: document.getElementById("analyticsStatus"),
  stateSegmentTableBody: document.getElementById("stateSegmentTableBody"),
  stateSegmentSortableHeaders: document.querySelectorAll("#stateSegmentTable th.sortable"),
  statesFilterToggle: document.getElementById("statesFilterToggle"),
  statesFilterMenu: document.getElementById("statesFilterMenu"),
  segmentsFilterToggle: document.getElementById("segmentsFilterToggle"),
  segmentsFilterMenu: document.getElementById("segmentsFilterMenu"),
  stateSegmentChannelsFilterToggle: document.getElementById("stateSegmentChannelsFilterToggle"),
  stateSegmentChannelsFilterMenu: document.getElementById("stateSegmentChannelsFilterMenu"),
  priceStartDate: document.getElementById("priceStartDate"),
  priceEndDate: document.getElementById("priceEndDate"),
  priceStatesFilterToggle: document.getElementById("priceStatesFilterToggle"),
  priceStatesFilterMenu: document.getElementById("priceStatesFilterMenu"),
  priceChannelGroupsFilterToggle: document.getElementById("priceChannelGroupsFilterToggle"),
  priceChannelGroupsFilterMenu: document.getElementById("priceChannelGroupsFilterMenu"),
  applyPriceExplorationFilters: document.getElementById("applyPriceExplorationFilters"),
  clearPriceExplorationFilters: document.getElementById("clearPriceExplorationFilters"),
  priceExplorationStatus: document.getElementById("priceExplorationStatus"),
  priceExplorationTableBody: document.getElementById("priceExplorationTableBody"),
  kpiOpps: document.getElementById("kpiOpps"),
  kpiBids: document.getElementById("kpiBids"),
  kpiWinRate: document.getElementById("kpiWinRate"),
  kpiSold: document.getElementById("kpiSold"),
  kpiCpc: document.getElementById("kpiCpc"),
  kpiAvgBid: document.getElementById("kpiAvgBid"),
  kpiWinRateUplift: document.getElementById("kpiWinRateUplift"),
  kpiCpcUplift: document.getElementById("kpiCpcUplift"),
  kpiAdditionalClicks: document.getElementById("kpiAdditionalClicks"),
  kpiAdditionalBudget: document.getElementById("kpiAdditionalBudget"),
  kpiStatSig: document.getElementById("kpiStatSig"),
  strategyAnalysisStartDate: document.getElementById("strategyAnalysisStartDate"),
  strategyAnalysisEndDate: document.getElementById("strategyAnalysisEndDate"),
  strategyAnalysisPlanId: document.getElementById("strategyAnalysisPlanId"),
  applyStrategyAnalysisFilters: document.getElementById("applyStrategyAnalysisFilters"),
  strategyAnalysisStatus: document.getElementById("strategyAnalysisStatus"),
  strategyAnalysisTableBody: document.getElementById("strategyAnalysisTableBody"),
  targetsStartDate: document.getElementById("targetsStartDate"),
  targetsEndDate: document.getElementById("targetsEndDate"),
  uploadTargetsFile: document.getElementById("uploadTargetsFile"),
  downloadTargetsFile: document.getElementById("downloadTargetsFile"),
  downloadDerivedTargetsFile: document.getElementById("downloadDerivedTargetsFile"),
  targetsFileInput: document.getElementById("targetsFileInput"),
  targetsStatus: document.getElementById("targetsStatus"),
  targetsTableBody: document.getElementById("targetsTableBody"),
  targetsSortableHeaders: document.querySelectorAll("#targetsTable th.sortable"),
  targetsModeCpb: document.getElementById("targetsModeCpb"),
  targetsModeRoe: document.getElementById("targetsModeRoe"),
  targetsModeCor: document.getElementById("targetsModeCor"),
  derivedTargetPanel: document.getElementById("derivedTargetPanel"),
  derivedTargetTitle: document.getElementById("derivedTargetTitle"),
  derivedTargetMetricHeader: document.getElementById("derivedTargetMetricHeader"),
  derivedTargetPreviewMetricHeader: document.getElementById("derivedTargetPreviewMetricHeader"),
  addDerivedTargetRule: document.getElementById("addDerivedTargetRule"),
  adjustDerivedTargetBtn: document.getElementById("adjustDerivedTargetBtn"),
  derivedTargetRulesBody: document.getElementById("derivedTargetRulesBody"),
  derivedTargetRulesStatus: document.getElementById("derivedTargetRulesStatus"),
  derivedTargetPreviewWrap: document.getElementById("derivedTargetPreviewWrap"),
  derivedTargetPreviewBody: document.getElementById("derivedTargetPreviewBody"),
  addPlanStrategyRule: document.getElementById("addPlanStrategyRule"),
  planStrategyRulesBody: document.getElementById("planStrategyRulesBody"),
  planStrategySettingsBody: document.getElementById("planStrategySettingsBody"),
  savePlanStrategyBtn: document.getElementById("savePlanStrategyBtn"),
  planStrategyStatus: document.getElementById("planStrategyStatus"),
  perfFromDays: document.getElementById("perfFromDays"),
  perfToDays: document.getElementById("perfToDays"),
  priceFromDays: document.getElementById("priceFromDays"),
  priceToDays: document.getElementById("priceToDays"),
  targetsFromDays: document.getElementById("targetsFromDays"),
  targetsToDays: document.getElementById("targetsToDays"),
  perfDateRangePreview: document.getElementById("perfDateRangePreview"),
  priceDateRangePreview: document.getElementById("priceDateRangePreview"),
  targetsDateRangePreview: document.getElementById("targetsDateRangePreview"),
  qbcClicks: document.getElementById("qbcClicks"),
  qbcLeadsCalls: document.getElementById("qbcLeadsCalls"),
  setDefaultTargetsFile: document.getElementById("setDefaultTargetsFile"),
  clearDefaultTargetsFile: document.getElementById("clearDefaultTargetsFile"),
  defaultTargetsFileInput: document.getElementById("defaultTargetsFileInput"),
  defaultTargetsFileStatus: document.getElementById("defaultTargetsFileStatus"),
  refreshChangeLog: document.getElementById("refreshChangeLog"),
  changeLogStatus: document.getElementById("changeLogStatus"),
  changeLogTableBody: document.getElementById("changeLogTableBody"),
  saveConfiguration: document.getElementById("saveConfiguration"),
  configurationStatus: document.getElementById("configurationStatus")
};

const multiSelectMeta = {
  states: {
    toggle: el.statesFilterToggle,
    menu: el.statesFilterMenu,
    allLabel: "All states"
  },
  segments: {
    toggle: el.segmentsFilterToggle,
    menu: el.segmentsFilterMenu,
    allLabel: "All segments"
  },
  stateSegmentChannels: {
    toggle: el.stateSegmentChannelsFilterToggle,
    menu: el.stateSegmentChannelsFilterMenu,
    allLabel: "All channel groups"
  },
  priceStates: {
    toggle: el.priceStatesFilterToggle,
    menu: el.priceStatesFilterMenu,
    allLabel: "All states"
  },
  priceChannels: {
    toggle: el.priceChannelGroupsFilterToggle,
    menu: el.priceChannelGroupsFilterMenu,
    allLabel: "All channels"
  }
};

el.activityLeadTypeFilter.value = state.activityLeadType;
el.perfFromDays.value = String(state.config.perfFromDays);
el.perfToDays.value = String(state.config.perfToDays);
el.priceFromDays.value = String(state.config.priceFromDays);
el.priceToDays.value = String(state.config.priceToDays);
el.targetsFromDays.value = String(state.config.targetsFromDays);
el.targetsToDays.value = String(state.config.targetsToDays);
el.qbcClicks.value = String(state.config.qbcClicks);
el.qbcLeadsCalls.value = String(state.config.qbcLeadsCalls);
if (el.selectedPlanId) {
  el.selectedPlanId.value = localStorage.getItem(SELECTED_PLAN_ID_STORAGE_KEY) || "";
}
if (el.strategyAnalysisPlanId && el.selectedPlanId?.value) {
  el.strategyAnalysisPlanId.value = el.selectedPlanId.value;
}

function setStatus(node, message, isError = false) {
  if (!node) {
    return;
  }
  node.textContent = message;
  node.style.color = isError ? "#b00020" : "";
}

function isAuthenticated() {
  return Boolean(state.sessionToken);
}

function showLoginScreen(message = "") {
  document.body.dataset.authenticated = "false";
  if (el.loginScreen) {
    el.loginScreen.hidden = false;
    el.loginScreen.style.display = "";
  }
  if (el.appLayout) {
    el.appLayout.hidden = true;
    el.appLayout.style.display = "none";
  }
  if (message) {
    setStatus(el.authStatus, message, false);
  }
}

function showAppLayout() {
  document.body.dataset.authenticated = "true";
  if (el.loginScreen) {
    el.loginScreen.hidden = true;
    el.loginScreen.style.display = "none";
  }
  if (el.appLayout) {
    el.appLayout.hidden = false;
    el.appLayout.style.display = "";
  }
}

function setSession(session) {
  state.sessionToken = session.token;
  state.email = session.user.email;
  state.role = session.user.role;
  localStorage.setItem("planning_session_token", state.sessionToken);
  localStorage.setItem("planning_user_email", state.email);
  localStorage.setItem("planning_user_role", state.role);
  showAppLayout();
  // Force UI swap even if browser keeps stale hidden state.
  requestAnimationFrame(() => {
    if (el.loginScreen) {
      el.loginScreen.style.display = "none";
    }
    if (el.appLayout) {
      el.appLayout.hidden = false;
      el.appLayout.style.display = "";
    }
  });
}

function clearSessionLocally() {
  state.sessionToken = "";
  state.email = "";
  state.role = "";
  state.authEmailCandidate = "";
  localStorage.removeItem("planning_session_token");
  localStorage.removeItem("planning_user_email");
  localStorage.removeItem("planning_user_role");
}

function setButtonBusy(button, busy, busyLabel) {
  if (!button) {
    return;
  }
  if (busy) {
    button.dataset.originalLabel = button.textContent || "";
    button.textContent = busyLabel;
    button.disabled = true;
    return;
  }
  button.textContent = button.dataset.originalLabel || button.textContent;
  button.disabled = false;
}

function applyRoleAccessUi() {
  const isAdmin = state.role === "admin";
  if (el.settingsSubUsers) {
    el.settingsSubUsers.hidden = !isAdmin;
  }
  if (!isAdmin && state.activeSettingsTab === "users") {
    setActiveSettingsTab("config");
  }
}

function safeLogPayload(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

async function logChange({ objectType, objectId = "", action, before, after, metadata } = {}) {
  if (!isAuthenticated()) {
    return;
  }
  try {
    await api("/api/change-log", {
      method: "POST",
      body: JSON.stringify({
        objectType,
        objectId: objectId || undefined,
        action,
        before: safeLogPayload(before),
        after: safeLogPayload(after),
        metadata: safeLogPayload(metadata)
      })
    });
  } catch (_err) {
    // Do not block primary action when audit logging fails.
  }
}

function summarizeJson(value, maxLength = 180) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const text = String(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

async function refreshChangeLogTable() {
  if (!isAuthenticated()) {
    return;
  }
  try {
    const data = await api("/api/change-log?limit=200");
    const rows = data.rows || [];
    el.changeLogTableBody.innerHTML = "";
    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "No change log entries.";
      tr.appendChild(td);
      el.changeLogTableBody.appendChild(tr);
      setStatus(el.changeLogStatus, "No entries.");
      return;
    }

    for (const row of rows) {
      const tr = document.createElement("tr");
      const cells = [
        row.changed_at || "-",
        row.changed_by_email || "-",
        row.object_type || "-",
        row.action || "-",
        summarizeJson(row.before_json),
        summarizeJson(row.after_json)
      ];
      for (const value of cells) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      }
      el.changeLogTableBody.appendChild(tr);
    }
    setStatus(el.changeLogStatus, `Loaded ${rows.length} entries.`);
  } catch (err) {
    setStatus(el.changeLogStatus, err.message || "Failed to load change log.", true);
  }
}

function getDerivedRulesStorageKey(mode) {
  return `${DERIVED_RULES_STORAGE_PREFIX}${mode}`;
}

function saveDerivedRulesToStorage(mode, rules) {
  if (mode !== "roe" && mode !== "cor") {
    return;
  }
  const payload = (rules || []).map((rule) => ({
    id: Number(rule.id) || Date.now(),
    name: String(rule.name || "").trim(),
    states: Array.isArray(rule.states) ? rule.states : [],
    segments: Array.isArray(rule.segments) ? rule.segments : [],
    targetValue: Number(rule.targetValue) || 0,
    isEditing: Boolean(rule.isEditing)
  }));
  localStorage.setItem(getDerivedRulesStorageKey(mode), JSON.stringify(payload));
}

function loadDerivedRulesFromStorage(mode) {
  if (mode !== "roe" && mode !== "cor") {
    return [];
  }
  const raw = localStorage.getItem(getDerivedRulesStorageKey(mode));
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((rule, index) => ({
      id: Number(rule.id) || index + 1,
      name: String(rule.name || "").trim(),
      states: Array.isArray(rule.states) ? rule.states.map((value) => String(value || "").toUpperCase()).filter(Boolean) : [],
      segments: Array.isArray(rule.segments)
        ? rule.segments.map((value) => String(value || "").toUpperCase()).filter(Boolean)
        : [],
      targetValue: Number(rule.targetValue) || 0,
      isEditing: Boolean(rule.isEditing)
    }));
  } catch {
    return [];
  }
}

function persistDerivedRulesForCurrentMode() {
  if (state.targetsGoalMode === "cpb") {
    return;
  }
  saveDerivedRulesToStorage(state.targetsGoalMode, state.derivedTargetRules);
}

function getSelectedPlanId() {
  return String(el.selectedPlanId?.value || "").trim();
}

function getPlanStrategyLocalKey(planId) {
  return `${PLAN_STRATEGY_LOCAL_PREFIX}${String(planId || "").trim()}`;
}

function readPlanStrategyLocalBackup(planId) {
  if (!planId) {
    return null;
  }
  try {
    const raw = localStorage.getItem(getPlanStrategyLocalKey(planId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rules)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePlanStrategyLocalBackup(planId, payload) {
  if (!planId || !payload || !Array.isArray(payload.rules)) {
    return;
  }
  localStorage.setItem(
    getPlanStrategyLocalKey(planId),
    JSON.stringify({
      ...payload,
      localSavedAt: new Date().toISOString()
    })
  );
}

function createChecklistPicker(options, selectedValues, onChange, withSelectAll = false) {
  const wrap = document.createElement("div");
  wrap.className = "rule-picker";

  const picked = document.createElement("input");
  picked.type = "text";
  picked.className = "rule-picker-selected";
  picked.readOnly = true;
  picked.value = selectedValues.length ? selectedValues.join(", ") : "";
  picked.placeholder = "Select...";
  wrap.appendChild(picked);

  const list = document.createElement("div");
  list.className = "rule-picker-list";
  const optionCheckboxes = [];

  let selectAllCheckbox = null;
  function isAllSelected() {
    return options.length > 0 && selectedValues.length === options.length;
  }
  function updateSelectAllState() {
    if (!selectAllCheckbox) {
      return;
    }
    selectAllCheckbox.checked = isAllSelected();
  }

  if (withSelectAll) {
    const selectAllLabel = document.createElement("label");
    selectAllLabel.className = "dropdown-option";
    selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.checked = isAllSelected();
    selectAllCheckbox.addEventListener("change", () => {
      const values = selectAllCheckbox.checked ? [...options] : [];
      selectedValues.splice(0, selectedValues.length, ...values);
      picked.value = selectedValues.join(", ");
      for (const optionCheckbox of optionCheckboxes) {
        optionCheckbox.checked = selectAllCheckbox.checked;
      }
      onChange(values);
    });
    const selectAllText = document.createElement("span");
    selectAllText.textContent = "Select All";
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(selectAllText);
    list.appendChild(selectAllLabel);
  }

  for (const value of options) {
    const label = document.createElement("label");
    label.className = "dropdown-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedValues.includes(value);
    optionCheckboxes.push(checkbox);
    checkbox.addEventListener("change", () => {
      const next = new Set(selectedValues);
      if (checkbox.checked) {
        next.add(value);
      } else {
        next.delete(value);
      }
      const values = Array.from(next);
      selectedValues.splice(0, selectedValues.length, ...values);
      picked.value = selectedValues.join(", ");
      updateSelectAllState();
      onChange(values);
    });
    const text = document.createElement("span");
    text.textContent = value;
    label.appendChild(checkbox);
    label.appendChild(text);
    list.appendChild(label);
  }
  updateSelectAllState();
  wrap.appendChild(list);
  return wrap;
}

function createPlanStrategyRule(seed = {}) {
  return {
    id: Number(seed.id) || state.planStrategyRuleIdCounter++,
    name: String(seed.name || "").trim(),
    states: Array.isArray(seed.states) ? seed.states.map((value) => String(value || "").toUpperCase()).filter(Boolean) : [],
    segments: Array.isArray(seed.segments) ? seed.segments.map((value) => String(value || "").toUpperCase()).filter(Boolean) : [],
    maxCpcUplift: Number(seed.maxCpcUplift) || 0,
    maxCpbUplift: Number(seed.maxCpbUplift) || 0,
    growthStrategy: String(seed.growthStrategy || "balanced"),
    isEditing: seed.isEditing !== undefined ? Boolean(seed.isEditing) : true
  };
}

function getGrowthStrategyOptions() {
  return [
    { value: "high_growth", label: "High Growth" },
    { value: "growth", label: "Growth" },
    { value: "balanced", label: "Balanced" },
    { value: "cost_focused", label: "Cost Focused" },
    { value: "cost_optimized", label: "Cost Optimized" }
  ];
}

function renderPlanStrategySettingsTable() {
  if (!el.planStrategySettingsBody) {
    return;
  }
  el.planStrategySettingsBody.innerHTML = "";

  const savedRules = state.planStrategyRules.filter((rule) => !rule.isEditing);
  if (!savedRules.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No saved rules yet. Save a row in \"States and Segment\" first.";
    tr.appendChild(td);
    el.planStrategySettingsBody.appendChild(tr);
    return;
  }

  for (const rule of savedRules) {
    const settingsTr = document.createElement("tr");
    const nameViewTd = document.createElement("td");
    nameViewTd.textContent = rule.name || "-";
    settingsTr.appendChild(nameViewTd);

    const statesViewTd = document.createElement("td");
    statesViewTd.textContent = rule.states.length ? rule.states.join(", ") : "-";
    settingsTr.appendChild(statesViewTd);

    const segmentsViewTd = document.createElement("td");
    segmentsViewTd.textContent = rule.segments.length ? rule.segments.join(", ") : "-";
    settingsTr.appendChild(segmentsViewTd);

    const maxCpcTd = document.createElement("td");
    const maxCpcInput = document.createElement("input");
    maxCpcInput.type = "number";
    maxCpcInput.step = "0.01";
    maxCpcInput.value = Number(rule.maxCpcUplift || 0).toString();
    maxCpcInput.addEventListener("input", () => {
      rule.maxCpcUplift = Number(maxCpcInput.value) || 0;
    });
    maxCpcTd.appendChild(maxCpcInput);
    settingsTr.appendChild(maxCpcTd);

    const maxCpbTd = document.createElement("td");
    const maxCpbInput = document.createElement("input");
    maxCpbInput.type = "number";
    maxCpbInput.step = "0.01";
    maxCpbInput.value = Number(rule.maxCpbUplift || 0).toString();
    maxCpbInput.addEventListener("input", () => {
      rule.maxCpbUplift = Number(maxCpbInput.value) || 0;
    });
    maxCpbTd.appendChild(maxCpbInput);
    settingsTr.appendChild(maxCpbTd);

    const growthTd = document.createElement("td");
    const growthSelect = document.createElement("select");
    for (const option of getGrowthStrategyOptions()) {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      growthSelect.appendChild(item);
    }
    growthSelect.value = rule.growthStrategy || "balanced";
    growthSelect.addEventListener("change", () => {
      rule.growthStrategy = growthSelect.value;
    });
    growthTd.appendChild(growthSelect);
    settingsTr.appendChild(growthTd);

    el.planStrategySettingsBody.appendChild(settingsTr);
  }
}

function renderPlanStrategyTables() {
  if (!el.planStrategyRulesBody || !el.planStrategySettingsBody) {
    return;
  }

  el.planStrategyRulesBody.innerHTML = "";
  if (!state.planStrategyRules.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "No rules yet. Click + to add one.";
    tr.appendChild(td);
    el.planStrategyRulesBody.appendChild(tr);
    renderPlanStrategySettingsTable();
    return;
  }

  for (const rule of state.planStrategyRules) {
    const ruleTr = document.createElement("tr");

    const nameTd = document.createElement("td");
    if (rule.isEditing) {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Strategy name";
      nameInput.value = rule.name || "";
      nameInput.addEventListener("input", () => {
        rule.name = nameInput.value.trim();
        renderPlanStrategySettingsTable();
      });
      nameTd.appendChild(nameInput);
    } else {
      nameTd.textContent = rule.name || "-";
    }
    ruleTr.appendChild(nameTd);

    const statesTd = document.createElement("td");
    if (rule.isEditing) {
      const statesValue = Array.isArray(rule.states) ? [...rule.states] : [];
      statesTd.appendChild(
        createChecklistPicker(state.planStrategyStateOptions, statesValue, (values) => {
          rule.states = values;
          renderPlanStrategySettingsTable();
        }, true)
      );
    } else {
      statesTd.className = "rule-view-wrap";
      statesTd.textContent = rule.states?.length ? rule.states.join(", ") : "-";
    }
    ruleTr.appendChild(statesTd);

    const segmentsTd = document.createElement("td");
    if (rule.isEditing) {
      const segmentsValue = Array.isArray(rule.segments) ? [...rule.segments] : [];
      segmentsTd.appendChild(
        createChecklistPicker(state.planStrategySegmentOptions, segmentsValue, (values) => {
          rule.segments = values;
          renderPlanStrategySettingsTable();
        })
      );
    } else {
      segmentsTd.className = "rule-view-wrap";
      segmentsTd.textContent = rule.segments?.length ? rule.segments.join(", ") : "-";
    }
    ruleTr.appendChild(segmentsTd);

    const actionTd = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "rule-actions";
    if (rule.isEditing) {
      const saveBtn = createSaveIconButton("Save Rule", async () => {
        const error = validatePlanStrategyRule(rule);
        if (error) {
          setStatus(el.planStrategyStatus, error, true);
          return;
        }
        const previousEditing = rule.isEditing;
        rule.isEditing = false;
        renderPlanStrategyTables();
        try {
          await persistPlanStrategySavedRules({
            requireSavedRules: true,
            successMessage: `Saved rule "${rule.name}".`
          });
        } catch (err) {
          rule.isEditing = previousEditing;
          renderPlanStrategyTables();
          setStatus(el.planStrategyStatus, err.message || "Failed to persist saved rule.", true);
        }
      });
      actions.appendChild(saveBtn);
    } else {
      const editBtn = createEditIconButton("Edit Rule", () => {
        rule.isEditing = true;
        renderPlanStrategyTables();
      });
      actions.appendChild(editBtn);
    }
    const removeBtn = createDeleteIconButton("Remove Strategy", async () => {
      state.planStrategyRules = state.planStrategyRules.filter((item) => item.id !== rule.id);
      renderPlanStrategyTables();
      try {
        await persistPlanStrategySavedRules({
          requireSavedRules: false,
          successMessage: "Strategy rules updated."
        });
      } catch (err) {
        setStatus(el.planStrategyStatus, err.message || "Failed to persist strategy after delete.", true);
      }
    });
    actions.appendChild(removeBtn);
    actionTd.appendChild(actions);
    ruleTr.appendChild(actionTd);
    el.planStrategyRulesBody.appendChild(ruleTr);
  }
  renderPlanStrategySettingsTable();
}

function validatePlanStrategyRule(rule) {
  if (!String(rule.name || "").trim()) {
    return "Strategy name is required.";
  }
  if (!Array.isArray(rule.states) || !rule.states.length) {
    return `Select at least one state for strategy "${rule.name || "-"}".`;
  }
  if (!Array.isArray(rule.segments) || !rule.segments.length) {
    return `Select at least one segment for strategy "${rule.name || "-"}".`;
  }
  return "";
}

function validatePlanStrategyRules() {
  const savedRules = state.planStrategyRules.filter((rule) => !rule.isEditing);
  if (!savedRules.length) {
    return "Save at least one rule before persisting strategy parameters.";
  }
  for (const rule of savedRules) {
    const baseValidation = validatePlanStrategyRule(rule);
    if (baseValidation) {
      return baseValidation;
    }
    if (!Number.isFinite(Number(rule.maxCpcUplift))) {
      return `Max CPC uplift must be numeric for "${rule.name || "-"}".`;
    }
    if (!Number.isFinite(Number(rule.maxCpbUplift))) {
      return `Max CPB uplift must be numeric for "${rule.name || "-"}".`;
    }
  }
  return "";
}

function buildSavedPlanStrategyPayload() {
  return {
    rules: state.planStrategyRules
      .filter((rule) => !rule.isEditing)
      .map((rule) => ({
        id: Number(rule.id) || 0,
        name: String(rule.name || "").trim(),
        states: Array.isArray(rule.states) ? rule.states : [],
        segments: Array.isArray(rule.segments) ? rule.segments : [],
        maxCpcUplift: Number(rule.maxCpcUplift) || 0,
        maxCpbUplift: Number(rule.maxCpbUplift) || 0,
        growthStrategy: String(rule.growthStrategy || "balanced")
      })),
    savedAt: new Date().toISOString()
  };
}

async function persistPlanStrategySavedRules({ requireSavedRules = true, successMessage } = {}) {
  let planId = getSelectedPlanId();
  if (!planId) {
    planId = await ensureSelectedPlanId();
  }
  if (!planId) {
    throw new Error("Enter plan ID first.");
  }

  const payload = buildSavedPlanStrategyPayload();
  if (requireSavedRules && payload.rules.length === 0) {
    throw new Error("Save at least one rule before persisting strategy parameters.");
  }

  await api(`/api/plans/${planId}/parameters`, {
    method: "PUT",
    body: JSON.stringify({
      parameters: [
        {
          key: PLAN_STRATEGY_PARAM_KEY,
          value: JSON.stringify(payload),
          valueType: "json"
        }
      ]
    })
  });
  writePlanStrategyLocalBackup(planId, payload);

  if (successMessage) {
    setStatus(el.planStrategyStatus, successMessage);
  } else {
    setStatus(el.planStrategyStatus, `Saved ${payload.rules.length} strategy row(s).`);
  }
}

async function refreshPlanStrategyOptions() {
  const segmentFallback = ["MCH", "MCR", "SCH", "SCR"];
  const params = new URLSearchParams();
  appendGlobalFilter(params);
  if (el.targetsStartDate.value) {
    params.set("startDate", el.targetsStartDate.value);
  }
  if (el.targetsEndDate.value) {
    params.set("endDate", el.targetsEndDate.value);
  }

  try {
    const data = await api(`/api/analytics/state-segment-performance/filters?${params.toString()}`);
    const states = mergeWithAllStateCodes(data.states || []);
    const segments = [...new Set((data.segments || []).map((value) => String(value || "").toUpperCase()).filter(Boolean))];
    state.planStrategyStateOptions = states;
    state.planStrategySegmentOptions = segments.length ? segments : segmentFallback;

    const stateSet = new Set(state.planStrategyStateOptions);
    const segmentSet = new Set(state.planStrategySegmentOptions);
    for (const rule of state.planStrategyRules) {
      rule.states = rule.states.filter((stateCode) => stateSet.has(stateCode));
      rule.segments = rule.segments.filter((segmentCode) => segmentSet.has(segmentCode));
    }
  } catch (_err) {
    state.planStrategyStateOptions = mergeWithAllStateCodes(
      state.targetsRows.map((row) => String(row.state || "").toUpperCase()).filter(Boolean)
    );
    state.planStrategySegmentOptions = segmentFallback;
  }

  renderPlanStrategyTables();
}

async function loadPlanStrategyForSelectedPlan() {
  let planId = getSelectedPlanId();
  if (!planId) {
    try {
      planId = await ensureSelectedPlanId();
    } catch (_err) {
      planId = "";
    }
  }
  if (!planId) {
    state.planStrategyRules = [];
    renderPlanStrategyTables();
    setStatus(el.planStrategyStatus, "Select a plan ID to load strategy.");
    return;
  }

  try {
    const data = await api(`/api/plans/${planId}/parameters`);
    const parameter = (data.parameters || []).find((item) => String(item.param_key || "") === PLAN_STRATEGY_PARAM_KEY);
    let parsedRules = [];
    let remoteSavedAt = "";
    if (parameter && typeof parameter.param_value === "string" && parameter.param_value.trim()) {
      const parsed = JSON.parse(parameter.param_value);
      if (Array.isArray(parsed?.rules)) {
        parsedRules = parsed.rules;
      }
      remoteSavedAt = String(parsed?.savedAt || "");
    }

    const localBackup = readPlanStrategyLocalBackup(planId);
    if (localBackup?.rules?.length) {
      const localTs = Date.parse(String(localBackup.localSavedAt || localBackup.savedAt || "")) || 0;
      const remoteTs = Date.parse(remoteSavedAt) || 0;
      if (localTs > remoteTs) {
        parsedRules = localBackup.rules;
      }
    }

    state.planStrategyRules = parsedRules.map((rule) =>
      createPlanStrategyRule({
        ...rule,
        isEditing: false
      })
    );
    const maxId = state.planStrategyRules.reduce((acc, rule) => Math.max(acc, Number(rule.id) || 0), 0);
    state.planStrategyRuleIdCounter = Math.max(maxId + 1, state.planStrategyRuleIdCounter, 1);
    await refreshPlanStrategyOptions();
    setStatus(el.planStrategyStatus, "Strategy loaded.");
  } catch (err) {
    setStatus(el.planStrategyStatus, err.message || "Failed to load strategy.", true);
  }
}

async function savePlanStrategyForSelectedPlan() {
  const validationError = validatePlanStrategyRules();
  if (validationError) {
    setStatus(el.planStrategyStatus, validationError, true);
    return;
  }

  try {
    await persistPlanStrategySavedRules({ requireSavedRules: true });
  } catch (err) {
    setStatus(el.planStrategyStatus, err.message || "Failed to save strategy.", true);
  }
}

function renderTargetsLoadingRow(message = "Loading targets...") {
  el.targetsTableBody.innerHTML = "";
  const tr = document.createElement("tr");
  tr.className = "loading-row";
  const td = document.createElement("td");
  const dynamicCount = getTargetsColumns(state.targetsRows || []).columns.length;
  td.colSpan = Math.max(dynamicCount, DEFAULT_TARGETS_TABLE_COL_COUNT);
  td.className = "loading-cell";

  const wrap = document.createElement("div");
  wrap.className = "table-loading";
  const spinner = document.createElement("span");
  spinner.className = "spinner";
  spinner.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = message;

  wrap.appendChild(spinner);
  wrap.appendChild(text);
  td.appendChild(wrap);
  tr.appendChild(td);
  el.targetsTableBody.appendChild(tr);
}

function addDerivedTargetRule(seed = {}) {
  state.derivedTargetRules.push({
    id: state.derivedRuleIdCounter++,
    name: String(seed.name || `Rule ${state.derivedRuleIdCounter - 1}`).trim(),
    states: Array.isArray(seed.states) ? [...seed.states] : [],
    segments: Array.isArray(seed.segments) ? [...seed.segments] : [],
    targetValue: Number(seed.targetValue) || 0,
    isEditing: seed.isEditing !== undefined ? Boolean(seed.isEditing) : true
  });
}

function ensureDerivedTargetRuleExists() {
  if (!state.derivedTargetRules.length) {
    addDerivedTargetRule();
  }
}

function setTargetsGoalMode(mode) {
  state.targetsGoalMode = mode;
  el.targetsModeCpb.classList.toggle("active", mode === "cpb");
  el.targetsModeRoe.classList.toggle("active", mode === "roe");
  el.targetsModeCor.classList.toggle("active", mode === "cor");
  el.derivedTargetPanel.hidden = mode === "cpb";

  if (mode === "roe") {
    el.derivedTargetTitle.textContent = "ROE Target Rules";
    el.derivedTargetMetricHeader.textContent = "Target ROE";
    el.derivedTargetPreviewMetricHeader.textContent = "Target ROE";
  } else if (mode === "cor") {
    el.derivedTargetTitle.textContent = "COR Target Rules";
    el.derivedTargetMetricHeader.textContent = "Target COR";
    el.derivedTargetPreviewMetricHeader.textContent = "Target COR";
  }

  if (mode !== "cpb") {
    state.derivedTargetRules = loadDerivedRulesFromStorage(mode);
    const maxId = state.derivedTargetRules.reduce((acc, rule) => Math.max(acc, Number(rule.id) || 0), 0);
    state.derivedRuleIdCounter = Math.max(maxId + 1, state.derivedRuleIdCounter);
    ensureDerivedTargetRuleExists();
    renderDerivedTargetRules();
  } else {
    el.derivedTargetPreviewWrap.hidden = true;
  }
  renderTargetsRows(state.targetsRows);
}

function renderDerivedTargetRules() {
  el.derivedTargetRulesBody.innerHTML = "";
  if (state.targetsGoalMode === "cpb") {
    return;
  }
  ensureDerivedTargetRuleExists();

  function validateRule(rule) {
    if (!String(rule.name || "").trim()) {
      return "Rule name is required.";
    }
    if (!Array.isArray(rule.states) || !rule.states.length) {
      return "Select at least one state.";
    }
    if (!Array.isArray(rule.segments) || !rule.segments.length) {
      return "Select at least one segment.";
    }
    if (!Number.isFinite(Number(rule.targetValue))) {
      return `Target ${state.targetsGoalMode === "roe" ? "ROE" : "COR"} must be a number.`;
    }
    return "";
  }

  for (const rule of state.derivedTargetRules) {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    if (rule.isEditing) {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Rule name";
      nameInput.value = rule.name || "";
      nameInput.addEventListener("input", () => {
        rule.name = nameInput.value.trim();
      });
      tdName.appendChild(nameInput);
    } else {
      tdName.textContent = rule.name || "-";
    }
    tr.appendChild(tdName);

    const tdStates = document.createElement("td");
    if (rule.isEditing) {
      const statesValue = Array.isArray(rule.states) ? [...rule.states] : [];
      tdStates.appendChild(
        createChecklistPicker(state.derivedTargetStateOptions, statesValue, (values) => {
          rule.states = values;
        }, true)
      );
    } else {
      tdStates.className = "rule-view-wrap";
      tdStates.textContent = rule.states?.length ? rule.states.join(", ") : "-";
    }
    tr.appendChild(tdStates);

    const tdSegments = document.createElement("td");
    if (rule.isEditing) {
      const segmentsValue = Array.isArray(rule.segments) ? [...rule.segments] : [];
      tdSegments.appendChild(
        createChecklistPicker(state.derivedTargetSegmentOptions, segmentsValue, (values) => {
          rule.segments = values;
        })
      );
    } else {
      tdSegments.className = "rule-view-wrap";
      tdSegments.textContent = rule.segments?.length ? rule.segments.join(", ") : "-";
    }
    tr.appendChild(tdSegments);

    const tdTarget = document.createElement("td");
    if (rule.isEditing) {
      const targetInput = document.createElement("input");
      targetInput.type = "number";
      targetInput.step = "0.01";
      targetInput.value = Number(rule.targetValue || 0).toString();
      targetInput.addEventListener("input", () => {
        rule.targetValue = Number(targetInput.value) || 0;
      });
      tdTarget.appendChild(targetInput);
    } else {
      tdTarget.textContent = `${formatDecimal(rule.targetValue, 2)}%`;
    }
    tr.appendChild(tdTarget);

    const tdAction = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "rule-actions";
    if (rule.isEditing) {
      const saveBtn = createSaveIconButton("Save Rule", async () => {
        const errorMessage = validateRule(rule);
        if (errorMessage) {
          setStatus(el.derivedTargetRulesStatus, errorMessage, true);
          return;
        }
        const before = safeLogPayload(rule);
        rule.isEditing = false;
        persistDerivedRulesForCurrentMode();
        await logChange({
          objectType: "targets_rule",
          objectId: String(rule.id),
          action: "save_rule",
          before,
          after: rule,
          metadata: { mode: state.targetsGoalMode }
        });
        setStatus(el.derivedTargetRulesStatus, `Saved rule "${rule.name}".`);
        renderDerivedTargetRules();
      });
      actions.appendChild(saveBtn);
    } else {
      const editBtn = createEditIconButton("Edit Rule", () => {
        const before = safeLogPayload(rule);
        rule.isEditing = true;
        persistDerivedRulesForCurrentMode();
        void logChange({
          objectType: "targets_rule",
          objectId: String(rule.id),
          action: "edit_rule",
          before,
          after: rule,
          metadata: { mode: state.targetsGoalMode }
        });
        renderDerivedTargetRules();
      });
      actions.appendChild(editBtn);
    }

    const removeBtn = createDeleteIconButton("Remove Rule", () => {
      const before = safeLogPayload(rule);
      state.derivedTargetRules = state.derivedTargetRules.filter((item) => item.id !== rule.id);
      ensureDerivedTargetRuleExists();
      persistDerivedRulesForCurrentMode();
      void logChange({
        objectType: "targets_rule",
        objectId: String(rule.id),
        action: "remove_rule",
        before,
        after: null,
        metadata: { mode: state.targetsGoalMode }
      });
      renderDerivedTargetRules();
    });
    actions.appendChild(removeBtn);
    tdAction.appendChild(actions);
    tr.appendChild(tdAction);

    el.derivedTargetRulesBody.appendChild(tr);
  }
}

function getValidDerivedTargetRules() {
  return state.derivedTargetRules
    .filter(
      (rule) =>
        !rule.isEditing &&
        String(rule.name || "").trim() &&
        rule.states.length &&
        Array.isArray(rule.segments) &&
        rule.segments.length &&
        Number.isFinite(Number(rule.targetValue))
    )
    .map((rule) => ({
      ...rule,
      name: String(rule.name || "").trim(),
      states: rule.states.map((stateCode) => String(stateCode || "").toUpperCase()).filter(Boolean),
      segments: rule.segments.map((segmentCode) => String(segmentCode || "").toUpperCase()).filter(Boolean),
      targetValue: Number(rule.targetValue) / 100
    }));
}

function calculateAdjustedCpbFromRoe(row, targetRoe, qbc) {
  const avgProfit = Number(row.avg_profit);
  const avgEquity = Number(row.avg_equity);
  if (!Number.isFinite(avgProfit) || !Number.isFinite(avgEquity) || avgEquity === 0) {
    return null;
  }
  const cpb = 0.81 * (((avgProfit - targetRoe * avgEquity) / 0.8) - qbc);
  if (!Number.isFinite(cpb)) {
    return null;
  }
  return Math.max(0, cpb);
}

function calculateAdjustedCpbFromCor(row, targetCor, qbc) {
  const avgPremium = Number(row.avg_lifetime_premium);
  const avgCost = Number(row.avg_lifetime_cost);
  if (!Number.isFinite(avgPremium) || !Number.isFinite(avgCost)) {
    return null;
  }
  const cpb = 0.81 * ((targetCor * avgPremium) - qbc - avgCost);
  if (!Number.isFinite(cpb)) {
    return null;
  }
  return Math.max(0, cpb);
}

function buildDerivedTargetAdjustments() {
  const rules = getValidDerivedTargetRules();
  const qbc = Number(getActiveQbcValue()) || 0;
  const adjustments = [];

  for (const row of state.targetsRows) {
    const matchedRule = rules.find(
      (rule) =>
        rule.segments.includes(String(row.segment || "").toUpperCase()) &&
        rule.states.includes(String(row.state || "").toUpperCase())
    );
    if (!matchedRule) {
      continue;
    }

    const adjusted =
      state.targetsGoalMode === "roe"
        ? calculateAdjustedCpbFromRoe(row, matchedRule.targetValue, qbc)
        : calculateAdjustedCpbFromCor(row, matchedRule.targetValue, qbc);

    if (!Number.isFinite(adjusted)) {
      continue;
    }

    adjustments.push({
      row,
      ruleName: matchedRule.name || "-",
      targetMetricValue: matchedRule.targetValue,
      adjustedTargetCpb: Number(adjusted)
    });
  }

  return adjustments;
}

function renderDerivedTargetPreview(adjustments) {
  el.derivedTargetPreviewBody.innerHTML = "";
  if (!adjustments.length) {
    el.derivedTargetPreviewWrap.hidden = true;
    return;
  }

  for (const item of adjustments) {
    const tr = document.createElement("tr");
    const cells = [
      item.ruleName,
      item.row.source || "-",
      item.row.segment || "-",
      item.row.state || "-",
      formatDecimal(item.row.cpb, 2),
      formatPercent(item.row.roe),
      formatPercent(item.row.combined_ratio),
      formatPercent(item.targetMetricValue),
      formatDecimal(item.adjustedTargetCpb, 2)
    ];
    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    el.derivedTargetPreviewBody.appendChild(tr);
  }
  el.derivedTargetPreviewWrap.hidden = false;
}

function parseDefaultTargetsFilePayload(raw) {
  if (!raw) {
    return null;
  }
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  if (!parsed.dataUrl || !parsed.fileName) {
    return null;
  }
  return {
    fileName: String(parsed.fileName),
    dataUrl: String(parsed.dataUrl),
    savedAt: parsed.savedAt ? String(parsed.savedAt) : null
  };
}

function readStoredDefaultTargetsFileFromLocalStorage() {
  const raw = localStorage.getItem(DEFAULT_TARGETS_FILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return parseDefaultTargetsFilePayload(raw);
  } catch {
    return null;
  }
}

function openDefaultTargetsDb() {
  if (!("indexedDB" in globalThis)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DEFAULT_TARGETS_FILE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DEFAULT_TARGETS_FILE_DB_STORE)) {
        db.createObjectStore(DEFAULT_TARGETS_FILE_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed."));
  });
}

async function readStoredDefaultTargetsFile() {
  const localFallback = readStoredDefaultTargetsFileFromLocalStorage();
  try {
    const db = await openDefaultTargetsDb();
    if (!db) {
      return localFallback;
    }
    const payload = await new Promise((resolve, reject) => {
      const tx = db.transaction(DEFAULT_TARGETS_FILE_DB_STORE, "readonly");
      const store = tx.objectStore(DEFAULT_TARGETS_FILE_DB_STORE);
      const request = store.get(DEFAULT_TARGETS_FILE_DB_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("IndexedDB read failed."));
    });
    db.close();
    const parsed = parseDefaultTargetsFilePayload(payload);
    return parsed || localFallback;
  } catch {
    return localFallback;
  }
}

async function writeStoredDefaultTargetsFile(payload) {
  const serialized = JSON.stringify(payload);
  let localStorageSaved = false;
  try {
    localStorage.setItem(DEFAULT_TARGETS_FILE_STORAGE_KEY, serialized);
    localStorageSaved = true;
  } catch {
    // Ignore; IndexedDB path may still succeed for large files.
  }

  try {
    const db = await openDefaultTargetsDb();
    if (!db) {
      if (!localStorageSaved) {
        throw new Error("No storage available for default file.");
      }
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DEFAULT_TARGETS_FILE_DB_STORE, "readwrite");
      const store = tx.objectStore(DEFAULT_TARGETS_FILE_DB_STORE);
      const request = store.put(payload, DEFAULT_TARGETS_FILE_DB_KEY);
      request.onsuccess = () => resolve(null);
      request.onerror = () => reject(request.error || new Error("IndexedDB write failed."));
    });
    db.close();
  } catch (error) {
    if (!localStorageSaved) {
      throw error;
    }
  }
}

async function clearStoredDefaultTargetsFile() {
  localStorage.removeItem(DEFAULT_TARGETS_FILE_STORAGE_KEY);
  try {
    const db = await openDefaultTargetsDb();
    if (!db) {
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DEFAULT_TARGETS_FILE_DB_STORE, "readwrite");
      const store = tx.objectStore(DEFAULT_TARGETS_FILE_DB_STORE);
      const request = store.delete(DEFAULT_TARGETS_FILE_DB_KEY);
      request.onsuccess = () => resolve(null);
      request.onerror = () => reject(request.error || new Error("IndexedDB delete failed."));
    });
    db.close();
  } catch {
    // Local storage already cleared; ignore secondary failure.
  }
}

function updateDefaultTargetsFileStatus() {
  if (state.defaultTargetsFile?.fileName) {
    setStatus(el.defaultTargetsFileStatus, `Default file: ${state.defaultTargetsFile.fileName}`);
    return;
  }
  setStatus(el.defaultTargetsFileStatus, "Default file: bundled Targets-default.xlsx");
}

function dataUrlToArrayBuffer(dataUrl) {
  const base64Part = String(dataUrl || "").split(",")[1] || "";
  if (!base64Part) {
    throw new Error("Invalid default targets file data.");
  }
  const binary = atob(base64Part);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed reading file."));
    reader.readAsDataURL(file);
  });
}

function formatInt(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDecimal(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return `${formatDecimal((Number(value) || 0) * 100, 2)}%`;
}

function formatPercentFixed(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return `${formatDecimal((Number(value) || 0) * 100, decimals)}%`;
}

function formatPercentOrDash(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return formatPercent(value);
}

function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return `$${formatDecimal(value, decimals)}`;
}

function clampDays(fromDays, toDays) {
  const normalizedFrom = Math.max(1, Math.floor(Number(fromDays) || 30));
  const normalizedTo = Math.max(0, Math.floor(Number(toDays) || 7));
  if (normalizedFrom <= normalizedTo) {
    return { fromDays: normalizedTo + 1, toDays: normalizedTo };
  }
  return { fromDays: normalizedFrom, toDays: normalizedTo };
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function computeRangeFromToday(fromDays, toDays) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  start.setDate(today.getDate() - fromDays);
  end.setDate(today.getDate() - toDays);
  return { startIso: toIsoDate(start), endIso: toIsoDate(end) };
}

function applyConfigDefaultsToInputs() {
  const perf = clampDays(state.config.perfFromDays, state.config.perfToDays);
  const price = clampDays(state.config.priceFromDays, state.config.priceToDays);
  const targets = clampDays(state.config.targetsFromDays, state.config.targetsToDays);
  state.config.perfFromDays = perf.fromDays;
  state.config.perfToDays = perf.toDays;
  state.config.priceFromDays = price.fromDays;
  state.config.priceToDays = price.toDays;
  state.config.targetsFromDays = targets.fromDays;
  state.config.targetsToDays = targets.toDays;

  const perfRange = computeRangeFromToday(perf.fromDays, perf.toDays);
  const priceRange = computeRangeFromToday(price.fromDays, price.toDays);
  const targetsRange = computeRangeFromToday(targets.fromDays, targets.toDays);

  el.startDate.value = perfRange.startIso;
  el.endDate.value = perfRange.endIso;
  el.priceStartDate.value = priceRange.startIso;
  el.priceEndDate.value = priceRange.endIso;
  if (el.strategyAnalysisStartDate) {
    el.strategyAnalysisStartDate.value = perfRange.startIso;
  }
  if (el.strategyAnalysisEndDate) {
    el.strategyAnalysisEndDate.value = perfRange.endIso;
  }
  el.targetsStartDate.value = targetsRange.startIso;
  el.targetsEndDate.value = targetsRange.endIso;
}

function updateConfigPreviewText() {
  const perf = clampDays(el.perfFromDays.value, el.perfToDays.value);
  const price = clampDays(el.priceFromDays.value, el.priceToDays.value);
  const targets = clampDays(el.targetsFromDays.value, el.targetsToDays.value);
  const perfRange = computeRangeFromToday(perf.fromDays, perf.toDays);
  const priceRange = computeRangeFromToday(price.fromDays, price.toDays);
  const targetsRange = computeRangeFromToday(targets.fromDays, targets.toDays);

  el.perfDateRangePreview.textContent = `${perf.fromDays} days prior to today to ${perf.toDays} days prior to today (${perfRange.startIso} to ${perfRange.endIso})`;
  el.priceDateRangePreview.textContent = `${price.fromDays} days prior to today to ${price.toDays} days prior to today (${priceRange.startIso} to ${priceRange.endIso})`;
  el.targetsDateRangePreview.textContent = `${targets.fromDays} days prior to today to ${targets.toDays} days prior to today (${targetsRange.startIso} to ${targetsRange.endIso})`;
}

function saveConfigurationLocally() {
  const perf = clampDays(el.perfFromDays.value, el.perfToDays.value);
  const price = clampDays(el.priceFromDays.value, el.priceToDays.value);
  const targets = clampDays(el.targetsFromDays.value, el.targetsToDays.value);
  const qbcClicks = Math.max(0, Number(el.qbcClicks.value) || 0);
  const qbcLeadsCalls = Math.max(0, Number(el.qbcLeadsCalls.value) || 0);

  state.config.perfFromDays = perf.fromDays;
  state.config.perfToDays = perf.toDays;
  state.config.priceFromDays = price.fromDays;
  state.config.priceToDays = price.toDays;
  state.config.targetsFromDays = targets.fromDays;
  state.config.targetsToDays = targets.toDays;
  state.config.qbcClicks = qbcClicks;
  state.config.qbcLeadsCalls = qbcLeadsCalls;

  el.perfFromDays.value = String(perf.fromDays);
  el.perfToDays.value = String(perf.toDays);
  el.priceFromDays.value = String(price.fromDays);
  el.priceToDays.value = String(price.toDays);
  el.targetsFromDays.value = String(targets.fromDays);
  el.targetsToDays.value = String(targets.toDays);
  el.qbcClicks.value = String(qbcClicks);
  el.qbcLeadsCalls.value = String(qbcLeadsCalls);

  localStorage.setItem("planning_perf_from_days", String(perf.fromDays));
  localStorage.setItem("planning_perf_to_days", String(perf.toDays));
  localStorage.setItem("planning_price_from_days", String(price.fromDays));
  localStorage.setItem("planning_price_to_days", String(price.toDays));
  localStorage.setItem("planning_targets_from_days", String(targets.fromDays));
  localStorage.setItem("planning_targets_to_days", String(targets.toDays));
  localStorage.setItem("planning_qbc_clicks", String(qbcClicks));
  localStorage.setItem("planning_qbc_leads_calls", String(qbcLeadsCalls));

  updateConfigPreviewText();
}

function saveTargetsRangeLocally() {
  const targets = clampDays(el.targetsFromDays.value, el.targetsToDays.value);
  state.config.targetsFromDays = targets.fromDays;
  state.config.targetsToDays = targets.toDays;
  el.targetsFromDays.value = String(targets.fromDays);
  el.targetsToDays.value = String(targets.toDays);
  localStorage.setItem("planning_targets_from_days", String(targets.fromDays));
  localStorage.setItem("planning_targets_to_days", String(targets.toDays));
  updateConfigPreviewText();
}

function getActiveQbcValue() {
  return state.activityLeadType.startsWith("clicks_") ? state.config.qbcClicks : state.config.qbcLeadsCalls;
}

function adjustRoeByQbc(roe) {
  if (roe === null || roe === undefined || Number.isNaN(Number(roe))) {
    return null;
  }
  return Number(roe);
}

function adjustCombineRatioByQbc(combinedRatio) {
  if (combinedRatio === null || combinedRatio === undefined || Number.isNaN(Number(combinedRatio))) {
    return null;
  }
  return Number(combinedRatio);
}

function setActiveSection(section) {
  state.activeSection = section;
  for (const item of el.menuItems) {
    item.classList.toggle("active", item.dataset.section === section);
  }
  if (el.analyticsMenuSubmenu) {
    el.analyticsMenuSubmenu.classList.toggle("open", section === "analytics");
  }
  if (el.planMenuSubmenu) {
    el.planMenuSubmenu.classList.toggle("open", section === "plan");
  }
  if (el.settingsMenuSubmenu) {
    el.settingsMenuSubmenu.classList.toggle("open", section === "settings");
  }
  for (const panel of el.sectionPanels) {
    panel.classList.toggle("active", panel.dataset.sectionPanel === section);
  }
}

function setActivePlanTab(tabName) {
  state.activePlanTab = tabName;
  const isBuilder = tabName === "builder";
  const isTargets = tabName === "targets";
  const isStrategy = tabName === "strategy";
  el.planTabBuilder.classList.toggle("active", isBuilder);
  el.planTabTargets.classList.toggle("active", isTargets);
  if (el.planTabStrategy) {
    el.planTabStrategy.classList.toggle("active", isStrategy);
  }
  el.planBuilderPanel.classList.toggle("active", isBuilder);
  el.targetsPanel.classList.toggle("active", isTargets);
  if (el.planStrategyPanel) {
    el.planStrategyPanel.classList.toggle("active", isStrategy);
  }
}

function setActiveAnalyticsTab(tabName) {
  state.activeAnalyticsTab = tabName;
  const isStateSegment = tabName === "state-segment";
  const isPriceExploration = tabName === "price-exploration";
  const isStrategyAnalysis = tabName === "strategy-analysis";
  el.analyticsTabStateSegment.classList.toggle("active", isStateSegment);
  el.analyticsTabPriceExploration.classList.toggle("active", isPriceExploration);
  if (el.analyticsTabStrategyAnalysis) {
    el.analyticsTabStrategyAnalysis.classList.toggle("active", isStrategyAnalysis);
  }
  el.stateSegmentPanel.classList.toggle("active", isStateSegment);
  el.priceExplorationPanel.classList.toggle("active", isPriceExploration);
  if (el.strategyAnalysisPanel) {
    el.strategyAnalysisPanel.classList.toggle("active", isStrategyAnalysis);
  }
}

function setActiveSettingsTab(tabName) {
  state.activeSettingsTab = tabName;
  const isConfig = tabName === "config";
  if (el.settingsSubConfig) {
    el.settingsSubConfig.classList.toggle("active", isConfig);
  }
  if (el.settingsSubUsers) {
    el.settingsSubUsers.classList.toggle("active", !isConfig);
  }
  if (el.settingsConfigPanel) {
    el.settingsConfigPanel.classList.toggle("active", isConfig);
  }
  if (el.settingsUsersPanel) {
    el.settingsUsersPanel.classList.toggle("active", !isConfig);
  }
}

async function api(path, options = {}) {
  if (!isAuthenticated()) {
    throw new Error("Please log in first.");
  }

  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 15000;
  const timeout = setTimeout(() => controller.abort(new Error("Request timeout")), timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    "x-session-token": state.sessionToken,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(path, { ...options, headers, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        clearSessionLocally();
        showLoginScreen("Session expired. Please log in again.");
      }
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function publicApi(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 15000;
  const timeout = setTimeout(() => controller.abort(new Error("Request timeout")), timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  try {
    const res = await fetch(path, { ...options, headers, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function appendGlobalFilter(params) {
  if (state.activityLeadType && state.activityLeadType !== "all") {
    params.set("activityLeadType", state.activityLeadType);
  }
  const activeQbc = getActiveQbcValue();
  if (Number.isFinite(Number(activeQbc))) {
    params.set("qbc", String(Number(activeQbc)));
  }
}

function getMultiValues(key) {
  return state.multiSelectValues[key] || [];
}

function mergeWithAllStateCodes(options) {
  const normalized = [...new Set((options || []).map((value) => String(value).trim().toUpperCase()).filter(Boolean))];
  return [...new Set([...ALL_US_STATE_CODES, ...normalized])].sort();
}

function setMultiOptions(key, options) {
  const normalized =
    key === "states" || key === "priceStates"
      ? mergeWithAllStateCodes(options)
      : [...new Set((options || []).map((value) => String(value).trim()).filter(Boolean))];
  const currentSelected = new Set(state.multiSelectValues[key] || []);
  state.multiSelectValues[key] = normalized.filter((value) => currentSelected.has(value));

  const { menu } = multiSelectMeta[key];
  menu.innerHTML = "";

  for (const value of normalized) {
    const label = document.createElement("label");
    label.className = "dropdown-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;
    checkbox.checked = state.multiSelectValues[key].includes(value);
    checkbox.addEventListener("change", () => {
      const selected = new Set(state.multiSelectValues[key] || []);
      if (checkbox.checked) {
        selected.add(value);
      } else {
        selected.delete(value);
      }
      state.multiSelectValues[key] = Array.from(selected);
      updateMultiToggleLabel(key);
    });
    const text = document.createElement("span");
    text.textContent = value;
    label.appendChild(checkbox);
    label.appendChild(text);
    menu.appendChild(label);
  }

  updateMultiToggleLabel(key);
}

function updateMultiToggleLabel(key) {
  const { toggle, allLabel } = multiSelectMeta[key];
  const selected = state.multiSelectValues[key] || [];
  if (!selected.length) {
    toggle.textContent = allLabel;
    return;
  }
  if (selected.length <= 2) {
    toggle.textContent = selected.join(", ");
    return;
  }
  toggle.textContent = `${selected.length} selected`;
}

function initializeMultiDropdowns() {
  for (const [key, meta] of Object.entries(multiSelectMeta)) {
    meta.toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const parent = meta.toggle.closest(".multi-dropdown");
      const open = parent.classList.contains("open");

      document.querySelectorAll(".multi-dropdown.open").forEach((node) => node.classList.remove("open"));
      if (!open) {
        parent.classList.add("open");
      }
    });
    state.multiSelectValues[key] = [];
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".multi-dropdown.open").forEach((node) => node.classList.remove("open"));
  });
}

function buildStateSegmentAnalyticsQuery() {
  const params = new URLSearchParams();
  appendGlobalFilter(params);
  if (el.startDate.value) {
    params.set("startDate", el.startDate.value);
  }
  if (el.endDate.value) {
    params.set("endDate", el.endDate.value);
  }
  const states = getMultiValues("states");
  const segments = getMultiValues("segments");
  const channelGroups = getMultiValues("stateSegmentChannels");
  if (states.length) {
    params.set("states", states.join(","));
  }
  if (segments.length) {
    params.set("segments", segments.join(","));
  }
  if (channelGroups.length) {
    params.set("channelGroups", channelGroups.join(","));
  }
  return params.toString();
}

function buildPriceExplorationQuery() {
  const params = new URLSearchParams();
  appendGlobalFilter(params);
  if (el.priceStartDate.value) {
    params.set("startDate", el.priceStartDate.value);
  }
  if (el.priceEndDate.value) {
    params.set("endDate", el.priceEndDate.value);
  }
  const states = getMultiValues("priceStates");
  const channels = getMultiValues("priceChannels");
  if (states.length) {
    params.set("states", states.join(","));
  }
  if (channels.length) {
    params.set("channelGroups", channels.join(","));
  }
  const perfRange = computeRangeFromToday(state.config.perfFromDays, state.config.perfToDays);
  params.set("q2bStartDate", perfRange.startIso);
  params.set("q2bEndDate", perfRange.endIso);
  params.set("limit", String(PRICE_EXPLORATION_MAX_ROWS));
  return params.toString();
}

function buildStrategyAnalysisQuery() {
  const params = new URLSearchParams();
  appendGlobalFilter(params);

  const planId =
    String(el.strategyAnalysisPlanId?.value || "").trim() || String(el.selectedPlanId?.value || "").trim();
  if (planId) {
    params.set("planId", planId);
  }
  if (el.strategyAnalysisStartDate?.value) {
    params.set("startDate", el.strategyAnalysisStartDate.value);
  }
  if (el.strategyAnalysisEndDate?.value) {
    params.set("endDate", el.strategyAnalysisEndDate.value);
  }

  return params.toString();
}

function buildTargetsQuery() {
  const params = new URLSearchParams();
  appendGlobalFilter(params);
  if (el.targetsStartDate.value) {
    params.set("startDate", el.targetsStartDate.value);
  }
  if (el.targetsEndDate.value) {
    params.set("endDate", el.targetsEndDate.value);
  }
  return params.toString();
}

function buildTargetsMetricsPath() {
  const queryString = buildTargetsQuery();
  return `/api/targets/metrics${queryString ? `?${queryString}` : ""}`;
}

function sanitizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function findColumnKey(columns, aliases) {
  const normalized = new Map(columns.map((key) => [sanitizeKey(key), key]));
  for (const alias of aliases) {
    const hit = normalized.get(sanitizeKey(alias));
    if (hit) {
      return hit;
    }
  }
  return null;
}

function parseSegmentState(segmentName) {
  const parts = String(segmentName || "").split("-");
  if (parts.length >= 2) {
    return {
      segment: String(parts[0] || "").trim().toUpperCase(),
      state: String(parts[1] || "").trim().toUpperCase()
    };
  }
  return { segment: "", state: "" };
}

function normalizeAccountId(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  return raw.replace(/\.0+$/, "");
}

function buildSegmentName(segment, stateCode) {
  const seg = String(segment || "").trim().toUpperCase();
  const st = String(stateCode || "").trim().toUpperCase();
  if (!seg && !st) {
    return "";
  }
  return `${seg}-${st}`;
}

function getXlsxLib() {
  const lib = globalThis.XLSX;
  if (!lib) {
    throw new Error("XLSX parser not loaded");
  }
  return lib;
}

function toFileTargetRows(fileMeta) {
  return fileMeta.rowsRaw.map((rawRow, index) => {
    const segmentName = rawRow[fileMeta.columnKeys.segmentName] || "";
    const parsed = parseSegmentState(segmentName);
    return {
      target_id: `file-${index}`,
      state: parsed.state,
      segment: parsed.segment,
      source: String(rawRow[fileMeta.columnKeys.accountName] || "").trim(),
      account_id: normalizeAccountId(rawRow[fileMeta.columnKeys.accountId]),
      target_value: Number(rawRow[fileMeta.columnKeys.value]) || 0,
      current_target: Number(rawRow[fileMeta.columnKeys.value]) || 0,
      sold: null,
      binds: null,
      scored_policies: null,
      cpb: null,
      target_cpb: null,
      performance: null,
      roe: null,
      combined_ratio: null,
      avg_profit: null,
      avg_equity: null,
      avg_lifetime_premium: null,
      avg_lifetime_cost: null,
      __fromFile: true,
      __fileIndex: index
    };
  });
}

async function importTargetsFile(file) {
  state.targetsDefaultLoaded = false;
  renderTargetsLoadingRow("Uploading target file...");
  const buffer = await file.arrayBuffer();
  await importTargetsWorkbook(buffer, file.name);
}

async function importTargetsWorkbook(buffer, fileName) {
  const xlsx = getXlsxLib();
  const workbook = xlsx.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("No sheet found in file");
  }

  const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0 });
  const headers = Array.isArray(headerRows[0]) ? headerRows[0].map((value) => String(value || "")) : [];
  const rowsRaw = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  if (!rowsRaw.length) {
    throw new Error("No data rows in uploaded file");
  }

  const columns = Object.keys(rowsRaw[0] || {});
  const columnKeys = {
    accountId: findColumnKey(columns, ["Account ID", "AccountId"]),
    accountName: findColumnKey(columns, ["Account Name", "Source"]),
    segmentName: findColumnKey(columns, ["Segment Name", "Segment"]),
    value: findColumnKey(columns, ["Value", "Target"]),
    attributes: findColumnKey(columns, ["Attributes"])
  };

  if (!columnKeys.accountId || !columnKeys.accountName || !columnKeys.segmentName || !columnKeys.value) {
    throw new Error("Missing required columns (Account ID, Account Name, Segment Name, Value)");
  }

  state.uploadedTargetsFile = {
    fileName,
    sheetName,
    headers,
    rowsRaw,
    columnKeys
  };
  state.targetsMode = "file";
  state.targetsRows = toFileTargetRows(state.uploadedTargetsFile);
  await enrichTargetsRowsFromBq(state.targetsRows);
  renderTargetsRows(state.targetsRows);
  setStatus(el.targetsStatus, `Loaded ${state.targetsRows.length} row(s) from ${fileName}`);
}

async function loadDefaultTargetsFile() {
  renderTargetsLoadingRow("Loading default target file...");
  if (state.defaultTargetsFile?.dataUrl) {
    try {
      const buffer = dataUrlToArrayBuffer(state.defaultTargetsFile.dataUrl);
      await importTargetsWorkbook(buffer, state.defaultTargetsFile.fileName);
      state.targetsDefaultLoaded = true;
      return;
    } catch (error) {
      setStatus(
        el.targetsStatus,
        `Saved default file failed to load (${state.defaultTargetsFile.fileName}). Falling back to bundled default.`,
        true
      );
    }
  }

  const res = await fetch(DEFAULT_TARGETS_FILE_URL);
  if (!res.ok) {
    throw new Error(`Default targets file not found (${res.status})`);
  }
  const buffer = await res.arrayBuffer();
  await importTargetsWorkbook(buffer, "Targets-default.xlsx");
  state.targetsDefaultLoaded = true;
}

async function ensureTargetsDefaultLoaded() {
  if (state.uploadedTargetsFile) {
    return;
  }
  await loadDefaultTargetsFile();
}

async function setDefaultTargetsFile(file) {
  const dataUrl = await fileToDataUrl(file);
  const payload = {
    fileName: file.name,
    dataUrl,
    savedAt: new Date().toISOString()
  };
  try {
    await writeStoredDefaultTargetsFile(payload);
  } catch {
    throw new Error("Could not save default file in browser storage.");
  }
  state.defaultTargetsFile = payload;
  updateDefaultTargetsFileStatus();
}

async function clearDefaultTargetsFile() {
  await clearStoredDefaultTargetsFile();
  state.defaultTargetsFile = null;
  updateDefaultTargetsFileStatus();
}

async function refreshTargetsFileMode() {
  if (state.targetsMode !== "file") {
    return;
  }
  renderTargetsLoadingRow("Refreshing targets...");
  await enrichTargetsRowsFromBq(state.targetsRows);
  renderTargetsRows(state.targetsRows);
  await refreshDerivedTargetOptions();
}

async function refreshTargetsCurrentMode() {
  if (state.targetsMode === "bq") {
    await refreshTargetsFromBq();
    return;
  }
  await refreshTargetsFileMode();
}

function syncFileRow(row) {
  const fileMeta = state.uploadedTargetsFile;
  if (!fileMeta || !row.__fromFile) {
    return;
  }
  const raw = fileMeta.rowsRaw[row.__fileIndex];
  if (!raw) {
    return;
  }
  const { accountName, segmentName, value, attributes } = fileMeta.columnKeys;
  raw[accountName] = row.source;
  raw[segmentName] = buildSegmentName(row.segment, row.state);
  raw[value] = Number(row.target_value) || 0;
  if (attributes) {
    raw[attributes] = `segment is ${row.segment}, state code is ${row.state}`;
  }
}

function downloadTargetsFile() {
  try {
    const fileMeta = state.uploadedTargetsFile;
    if (!fileMeta) {
      setStatus(el.targetsStatus, "Upload a target file first.", true);
      return;
    }
    const xlsx = getXlsxLib();
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(fileMeta.rowsRaw, {
      header: Object.keys(fileMeta.rowsRaw[0] || {})
    });
    xlsx.utils.book_append_sheet(workbook, worksheet, fileMeta.sheetName || "Targets");

    const nextFileName = fileMeta.fileName.replace(/\.(xlsx|xls|csv)$/i, "") + "-updated.xlsx";
    xlsx.writeFile(workbook, nextFileName);
    setStatus(el.targetsStatus, `Downloaded ${nextFileName}`);
  } catch (err) {
    setStatus(el.targetsStatus, err.message || "Failed to download file.", true);
  }
}

function targetMatchKey(row) {
  const accountId = normalizeAccountId(row.account_id);
  if (accountId) {
    return `${String(row.state || "").toUpperCase()}|${String(row.segment || "").toUpperCase()}|acct:${accountId}`;
  }
  return `${String(row.state || "").toUpperCase()}|${String(row.segment || "").toUpperCase()}|src:${sanitizeKey(row.source)}`;
}

async function enrichTargetsRowsFromBq(rows) {
  if (!rows.length) {
    return;
  }
  if (!isAuthenticated()) {
    return;
  }
  const requestRows = rows.map((row) => ({
    state: row.state || "",
    segment: row.segment || "",
    source: row.source || "",
    accountId: normalizeAccountId(row.account_id)
  }));

  const uniqueMap = new Map();
  for (const requestRow of requestRows) {
    uniqueMap.set(targetMatchKey({ ...requestRow, account_id: requestRow.accountId }), requestRow);
  }
  const uniqueRows = Array.from(uniqueMap.values());

  async function callChunkWithRetry(chunk, attempts = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await api(buildTargetsMetricsPath(), {
          method: "POST",
          body: JSON.stringify({ rows: chunk })
        });
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
      }
    }
    throw lastError;
  }

  const chunkSize = 100;
  const merged = [];
  let failedChunks = 0;

  for (let offset = 0; offset < uniqueRows.length; offset += chunkSize) {
    const chunk = uniqueRows.slice(offset, offset + chunkSize);
    try {
      const data = await callChunkWithRetry(chunk, 3);
      merged.push(...(data.rows || []));
    } catch (_err) {
      failedChunks += 1;
    }
  }

  const map = new Map(merged.map((row) => [targetMatchKey(row), row]));
  for (const row of rows) {
    const matched = map.get(targetMatchKey(row));
    if (!matched) {
      continue;
    }
    row.sold = matched.sold;
    row.binds = matched.binds;
    row.scored_policies = matched.scored_policies;
    row.cpb = matched.cpb;
    row.target_cpb = matched.target_cpb;
    row.performance = matched.performance;
    row.roe = matched.roe;
    row.combined_ratio = matched.combined_ratio;
    row.avg_profit = matched.avg_profit;
    row.avg_equity = matched.avg_equity;
    row.avg_lifetime_premium = matched.avg_lifetime_premium;
    row.avg_lifetime_cost = matched.avg_lifetime_cost;
    if (matched.current_target !== null && matched.current_target !== undefined) {
      row.current_target = matched.current_target;
    }
  }

  if (failedChunks > 0) {
    setStatus(
      el.targetsStatus,
      `Loaded file rows with partial BQ enrichment (${failedChunks} chunk(s) failed).`,
      true
    );
  }
}

function createSaveIconButton(title, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon-btn";
  btn.title = title;
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5h12l2 2v12H5zM8 5v6h8V5M8 19h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.addEventListener("click", onClick);
  return btn;
}

function createEditIconButton(title, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon-btn icon-btn-secondary";
  btn.title = title;
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4zM12 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.addEventListener("click", onClick);
  return btn;
}

function createDeleteIconButton(title, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon-btn icon-btn-danger";
  btn.title = title;
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12M10 11v5M14 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.addEventListener("click", onClick);
  return btn;
}

function editableCell({ value, type = "text", onSave }) {
  const wrap = document.createElement("div");
  wrap.className = "inline-edit";
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  if (type === "number") {
    input.step = "0.01";
  }
  const saveButton = createSaveIconButton("Save", async () => {
    await onSave(input.value);
  });
  wrap.appendChild(input);
  wrap.appendChild(saveButton);
  return wrap;
}

async function saveTargetField(row, field, rawValue) {
  const value = String(rawValue ?? "").trim();
  const payload = {};
  const beforeSnapshot = safeLogPayload({
    target_id: row.target_id,
    state: row.state,
    segment: row.segment,
    source: row.source,
    target_value: row.target_value
  });

  if (field === "targetValue") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setStatus(el.targetsStatus, "Target must be a number.", true);
      return;
    }
    payload.targetValue = parsed;
  } else {
    return;
  }

  if (row.__fromFile) {
    if (field === "targetValue") {
      row.target_value = payload.targetValue;
    }
    syncFileRow(row);
    renderTargetsRows(state.targetsRows);
    setStatus(el.targetsStatus, "File row updated.");
    await logChange({
      objectType: "target_row",
      objectId: row.target_id,
      action: "update_target_value_file",
      before: beforeSnapshot,
      after: safeLogPayload({
        target_id: row.target_id,
        state: row.state,
        segment: row.segment,
        source: row.source,
        target_value: row.target_value
      })
    });
    return;
  }

  await api(`/api/targets/${row.target_id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  await logChange({
    objectType: "target_row",
    objectId: row.target_id,
    action: "update_target_value_bq",
    before: beforeSnapshot,
    after: safeLogPayload({
      ...beforeSnapshot,
      target_value: payload.targetValue
    })
  });
  setStatus(el.targetsStatus, "BQ target updated.");
  await refreshTargetsFromBq();
}

function getTargetsDerivedValuesMap(rows) {
  const byKey = new Map();
  if (state.targetsGoalMode !== "roe" && state.targetsGoalMode !== "cor") {
    return byKey;
  }
  const qbc = Number(getActiveQbcValue()) || 0;
  const rules = getValidDerivedTargetRules();
  for (const row of rows) {
    const matchedRule = rules.find(
      (rule) =>
        rule.segments.includes(String(row.segment || "").toUpperCase()) &&
        rule.states.includes(String(row.state || "").toUpperCase())
    );
    if (!matchedRule) {
      byKey.set(targetMatchKey(row), { targetMetric: null, suggestedMaxCpb: null });
      continue;
    }
    const suggestedMaxCpb =
      state.targetsGoalMode === "roe"
        ? calculateAdjustedCpbFromRoe(row, matchedRule.targetValue, qbc)
        : calculateAdjustedCpbFromCor(row, matchedRule.targetValue, qbc);
    byKey.set(targetMatchKey(row), {
      targetMetric: matchedRule.targetValue,
      suggestedMaxCpb: Number.isFinite(Number(suggestedMaxCpb)) ? Number(suggestedMaxCpb) : null
    });
  }
  return byKey;
}

function getTargetsColumns(rows) {
  const derivedMap = getTargetsDerivedValuesMap(rows);
  const common = [
    { key: "state", label: "State", render: (row) => row.state || "-" },
    { key: "segment", label: "Segment", render: (row) => row.segment || "-" },
    { key: "source", label: "Source", render: (row) => row.source || "-" },
    { key: "current_target", label: "Current Target", render: (row) => formatDecimal(row.current_target, 2) },
    {
      key: "target_value",
      label: "Target",
      render: (row) =>
        editableCell({
          value: Number.isFinite(Number(row.target_value)) ? Number(row.target_value).toFixed(2) : "",
          type: "number",
          onSave: (nextValue) => saveTargetField(row, "targetValue", nextValue)
        })
    }
  ];

  if (state.targetsGoalMode === "roe") {
    return {
      columns: [
        ...common,
        { key: "binds", label: "Total Binds", render: (row) => formatInt(row.binds) },
        { key: "scored_policies", label: "Scored Policies", render: (row) => formatInt(row.scored_policies) },
        { key: "avg_profit", label: "Avg Profit", render: (row) => formatDecimal(row.avg_profit, 2) },
        { key: "avg_equity", label: "Avg Equity", render: (row) => formatDecimal(row.avg_equity, 2) },
        { key: "roe", label: "Current ROE", render: (row) => formatPercent(row.roe) },
        {
          key: "target_metric",
          label: "Target ROE",
          render: (row) => formatPercent(derivedMap.get(targetMatchKey(row))?.targetMetric)
        },
        {
          key: "suggested_max_cpb",
          label: "Suggested Max CPB",
          render: (row) => formatDecimal(derivedMap.get(targetMatchKey(row))?.suggestedMaxCpb, 2)
        }
      ],
      derivedMap
    };
  }

  if (state.targetsGoalMode === "cor") {
    return {
      columns: [
        ...common,
        { key: "binds", label: "Total Binds", render: (row) => formatInt(row.binds) },
        { key: "scored_policies", label: "Scored Policies", render: (row) => formatInt(row.scored_policies) },
        { key: "avg_profit", label: "Avg Profit", render: (row) => formatDecimal(row.avg_profit, 2) },
        { key: "avg_equity", label: "Avg Equity", render: (row) => formatDecimal(row.avg_equity, 2) },
        { key: "combined_ratio", label: "Current COR", render: (row) => formatPercent(row.combined_ratio) },
        {
          key: "target_metric",
          label: "Target COR",
          render: (row) => formatPercent(derivedMap.get(targetMatchKey(row))?.targetMetric)
        },
        {
          key: "suggested_max_cpb",
          label: "Suggested Max CPB",
          render: (row) => formatDecimal(derivedMap.get(targetMatchKey(row))?.suggestedMaxCpb, 2)
        }
      ],
      derivedMap
    };
  }

  return {
    columns: [
      ...common,
      { key: "sold", label: "Sold", render: (row) => formatInt(row.sold) },
      { key: "binds", label: "Binds", render: (row) => formatInt(row.binds) },
      { key: "cpb", label: "CPB", render: (row) => formatDecimal(row.cpb, 2) },
      { key: "target_cpb", label: "Target CPB", render: (row) => formatDecimal(row.target_cpb, 2) },
      { key: "performance", label: "Performance", render: (row) => formatPercent(row.performance) },
      { key: "roe", label: "ROE", render: (row) => formatPercent(row.roe) },
      { key: "combined_ratio", label: "COR", render: (row) => formatPercent(row.combined_ratio) }
    ],
    derivedMap
  };
}

function renderTargetsHeader(columns) {
  const headerRow = document.querySelector("#targetsTable thead tr");
  if (!headerRow) {
    return;
  }
  headerRow.innerHTML = "";
  for (const column of columns) {
    const th = document.createElement("th");
    th.textContent = column.label;
    th.dataset.sortKey = column.key;
    th.classList.add("sortable");
    th.addEventListener("click", () => {
      const key = column.key;
      if (!key) {
        return;
      }
      if (state.targetsSort.key === key) {
        state.targetsSort.direction = state.targetsSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.targetsSort.key = key;
        state.targetsSort.direction = "asc";
      }
      renderTargetsRows(state.targetsRows);
    });
    headerRow.appendChild(th);
  }
}

function updateTargetsSortHeaderUI() {
  const headers = document.querySelectorAll("#targetsTable th.sortable");
  for (const th of headers) {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sortKey === state.targetsSort.key) {
      th.classList.add(state.targetsSort.direction === "asc" ? "sorted-asc" : "sorted-desc");
    }
  }
}

function sortTargetsRows(rows, derivedMap) {
  const { key, direction } = state.targetsSort;
  const multiplier = direction === "asc" ? 1 : -1;
  const valueFor = (row) => {
    if (key === "target_metric") {
      return derivedMap.get(targetMatchKey(row))?.targetMetric;
    }
    if (key === "suggested_max_cpb") {
      return derivedMap.get(targetMatchKey(row))?.suggestedMaxCpb;
    }
    return row[key];
  };

  return [...rows].sort((a, b) => {
    const av = valueFor(a);
    const bv = valueFor(b);
    const aNum = Number(av);
    const bNum = Number(bv);
    const bothNumbers = !Number.isNaN(aNum) && !Number.isNaN(bNum);
    if (bothNumbers) {
      return (aNum - bNum) * multiplier;
    }
    return String(av || "").localeCompare(String(bv || "")) * multiplier;
  });
}

function renderTargetsRows(rows) {
  el.targetsTableBody.innerHTML = "";
  const { columns, derivedMap } = getTargetsColumns(rows);
  renderTargetsHeader(columns);

  if (!columns.some((column) => column.key === state.targetsSort.key)) {
    state.targetsSort.key = "state";
    state.targetsSort.direction = "asc";
  }

  const sortedRows = sortTargetsRows(rows, derivedMap);
  if (!sortedRows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Math.max(columns.length, DEFAULT_TARGETS_TABLE_COL_COUNT);
    td.textContent = "No targets found.";
    tr.appendChild(td);
    el.targetsTableBody.appendChild(tr);
    updateTargetsSortHeaderUI();
    return;
  }

  for (const row of sortedRows) {
    const tr = document.createElement("tr");
    for (const column of columns) {
      const td = document.createElement("td");
      const rendered = column.render(row);
      if (rendered instanceof Node) {
        td.appendChild(rendered);
      } else {
        td.textContent = rendered;
      }
      tr.appendChild(td);
    }
    el.targetsTableBody.appendChild(tr);
  }
  updateTargetsSortHeaderUI();
}

function getStateSegmentDimensionsForView(viewMode) {
  switch (viewMode) {
    case "state_segment_channel":
      return ["state", "segment", "channel_group_name"];
    case "state_segment":
      return ["state", "segment"];
    case "state_channel":
      return ["state", "channel_group_name"];
    case "segment_channel":
      return ["segment", "channel_group_name"];
    case "state":
      return ["state"];
    case "segment":
      return ["segment"];
    case "channel":
      return ["channel_group_name"];
    default:
      return ["state", "segment"];
  }
}

function getRowChannelGroup(row) {
  const value =
    row?.channel_group_name ??
    row?.channelGroupName ??
    row?.channelgroupname ??
    row?.channel_group ??
    row?.channelGroup ??
    row?.channel ??
    "";
  const text = String(value || "").trim();
  return text || "Unknown";
}

function syncStateSegmentDimensionHeaders(viewMode) {
  const dimensions = getStateSegmentDimensionsForView(viewMode);
  const showState = dimensions.includes("state");
  const showSegment = dimensions.includes("segment");
  const showChannel = dimensions.includes("channel_group_name");

  document.querySelectorAll("#stateSegmentTable .dim-state").forEach((node) => {
    node.style.display = showState ? "" : "none";
  });
  document.querySelectorAll("#stateSegmentTable .dim-segment").forEach((node) => {
    node.style.display = showSegment ? "" : "none";
  });
  document.querySelectorAll("#stateSegmentTable .dim-channel").forEach((node) => {
    node.style.display = showChannel ? "" : "none";
  });
}

function ensureStateSegmentSortKey(viewMode) {
  const dimensions = getStateSegmentDimensionsForView(viewMode);
  const allowed = new Set([
    ...dimensions,
    "bids",
    "sold",
    "total_cost",
    "quote_started",
    "quotes",
    "binds",
    "q2b_score",
    "scored_policies",
    "cpb",
    "target_cpb",
    "performance",
    "roe",
    "combined_ratio",
    "mrltv",
    "profit",
    "equity"
  ]);
  if (!allowed.has(state.stateSegmentSort.key)) {
    state.stateSegmentSort.key = dimensions[0] || "bids";
    state.stateSegmentSort.direction = "asc";
  }
}

function aggregateStateSegmentRows(rows, viewMode) {
  const dimensions = getStateSegmentDimensionsForView(viewMode);
  if (
    dimensions.length === 3 &&
    dimensions.includes("state") &&
    dimensions.includes("segment") &&
    dimensions.includes("channel_group_name")
  ) {
    return rows.map((row) => ({ ...row }));
  }

  const grouped = new Map();
  for (const row of rows) {
    const key = dimensions
      .map((field) => {
        if (field === "channel_group_name") {
          return getRowChannelGroup(row);
        }
        return String(row[field] || "");
      })
      .join("||");
    if (!grouped.has(key)) {
      grouped.set(key, {
        state: dimensions.includes("state") ? row.state : "All",
        segment: dimensions.includes("segment") ? row.segment : "All",
        channel_group_name: dimensions.includes("channel_group_name") ? getRowChannelGroup(row) : "All",
        bids: 0,
        sold: 0,
        total_cost: 0,
        quote_started: 0,
        quotes: 0,
        binds: 0,
        q2b_score: null,
        scored_policies: 0,
        cpb: null,
        target_cpb: null,
        performance: null,
        roe: null,
        combined_ratio: null,
        mrltv: null,
        profit: null,
        equity: null,
        _totalPrice: 0,
        _targetCpbWeighted: 0,
        _targetCpbWeight: 0,
        _performanceWeighted: 0,
        _performanceWeight: 0,
        _roeWeighted: 0,
        _roeWeight: 0,
        _combinedWeighted: 0,
        _combinedWeight: 0,
        _mrltvWeighted: 0,
        _mrltvWeight: 0,
        _profitWeighted: 0,
        _profitWeight: 0,
        _equityWeighted: 0,
        _equityWeight: 0
      });
    }

    const item = grouped.get(key);
    const bids = Number(row.bids) || 0;
    const sold = Number(row.sold) || 0;
    const quoteStarted = Number(row.quote_started) || 0;
    const quotes = Number(row.quotes) || 0;
    const binds = Number(row.binds) || 0;
    const totalCost = Number(row.total_cost) || 0;
    const scoredPolicies = Number(row.scored_policies) || 0;
    const cpb = Number(row.cpb);
    const targetCpb = Number(row.target_cpb);
    const performance = Number(row.performance);
    const roe = Number(row.roe);
    const combinedRatio = Number(row.combined_ratio);
    const mrltv = Number(row.mrltv);
    const profit = Number(row.profit);
    const equity = Number(row.equity);

    item.bids += bids;
    item.sold += sold;
    item.total_cost += totalCost;
    item.quote_started += quoteStarted;
    item.quotes += quotes;
    item.binds += binds;
    item.scored_policies += scoredPolicies;

    if (!Number.isNaN(cpb)) {
      item._totalPrice += cpb * binds;
    }
    if (!Number.isNaN(targetCpb)) {
      item._targetCpbWeighted += targetCpb * binds;
      item._targetCpbWeight += binds;
    }
    if (!Number.isNaN(performance)) {
      item._performanceWeighted += performance * binds;
      item._performanceWeight += binds;
    }
    const adjustedRoe = adjustRoeByQbc(roe);
    if (adjustedRoe !== null && !Number.isNaN(adjustedRoe)) {
      item._roeWeighted += adjustedRoe * scoredPolicies;
      item._roeWeight += scoredPolicies;
    }
    const adjustedCombine = adjustCombineRatioByQbc(combinedRatio);
    if (adjustedCombine !== null && !Number.isNaN(adjustedCombine)) {
      item._combinedWeighted += adjustedCombine * scoredPolicies;
      item._combinedWeight += scoredPolicies;
    }
    if (!Number.isNaN(mrltv)) {
      item._mrltvWeighted += mrltv * scoredPolicies;
      item._mrltvWeight += scoredPolicies;
    }
    if (!Number.isNaN(profit)) {
      item._profitWeighted += profit * scoredPolicies;
      item._profitWeight += scoredPolicies;
    }
    if (!Number.isNaN(equity)) {
      item._equityWeighted += equity * scoredPolicies;
      item._equityWeight += scoredPolicies;
    }
  }

  return Array.from(grouped.values()).map((item) => {
    item.q2b_score = item.quotes ? item.binds / item.quotes : null;
    item.cpb = item.binds ? item._totalPrice / item.binds : null;
    item.target_cpb = item._targetCpbWeight ? item._targetCpbWeighted / item._targetCpbWeight : null;
    item.performance = item._performanceWeight ? item._performanceWeighted / item._performanceWeight : null;
    item.roe = item._roeWeight ? item._roeWeighted / item._roeWeight : null;
    item.combined_ratio = item._combinedWeight ? item._combinedWeighted / item._combinedWeight : null;
    item.mrltv = item._mrltvWeight ? item._mrltvWeighted / item._mrltvWeight : null;
    item.profit = item._profitWeight ? item._profitWeighted / item._profitWeight : null;
    item.equity = item._equityWeight ? item._equityWeighted / item._equityWeight : null;
    return item;
  });
}

function sortStateSegmentRows(rows) {
  const { key, direction } = state.stateSegmentSort;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const aNum = Number(av);
    const bNum = Number(bv);
    const bothNumbers = !Number.isNaN(aNum) && !Number.isNaN(bNum);

    if (bothNumbers) {
      return (aNum - bNum) * multiplier;
    }
    return String(av || "").localeCompare(String(bv || "")) * multiplier;
  });
}

function updateSortHeaderUI() {
  for (const th of el.stateSegmentSortableHeaders) {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sortKey === state.stateSegmentSort.key) {
      th.classList.add(state.stateSegmentSort.direction === "asc" ? "sorted-asc" : "sorted-desc");
    }
  }
}

function renderStateSegmentRows(rows) {
  el.stateSegmentTableBody.innerHTML = "";
  const viewMode = el.stateSegmentViewMode.value;
  const dimensions = getStateSegmentDimensionsForView(viewMode);

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = dimensions.length + 16;
    td.textContent = "No data for selected filters.";
    tr.appendChild(td);
    el.stateSegmentTableBody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const roeAdjusted = adjustRoeByQbc(row.roe);
    const combineAdjusted = adjustCombineRatioByQbc(row.combined_ratio);
    const tr = document.createElement("tr");
    const dimensionCells = [];
    if (dimensions.includes("state")) {
      dimensionCells.push(row.state);
    }
    if (dimensions.includes("segment")) {
      dimensionCells.push(row.segment);
    }
    if (dimensions.includes("channel_group_name")) {
      dimensionCells.push(getRowChannelGroup(row));
    }

    const cells = [
      ...dimensionCells,
      formatInt(row.bids),
      formatInt(row.sold),
      formatDecimal(row.total_cost, 2),
      formatInt(row.quote_started),
      formatInt(row.quotes),
      formatInt(row.binds),
      formatPercent(row.q2b_score),
      formatInt(row.scored_policies),
      formatDecimal(row.cpb, 2),
      formatDecimal(row.target_cpb, 2),
      formatPercent(row.performance),
      formatPercent(roeAdjusted),
      formatPercent(combineAdjusted),
      formatDecimal(row.mrltv, 2),
      formatDecimal(row.profit, 2),
      formatDecimal(row.equity, 2)
    ];

    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    el.stateSegmentTableBody.appendChild(tr);
  }
}

function applyStateSegmentViewAndRender() {
  const viewMode = el.stateSegmentViewMode.value;
  ensureStateSegmentSortKey(viewMode);
  syncStateSegmentDimensionHeaders(viewMode);
  const aggregated = aggregateStateSegmentRows(state.stateSegmentRawRows, viewMode);
  const sorted = sortStateSegmentRows(aggregated);
  state.stateSegmentDisplayRows = sorted;
  renderStateSegmentRows(sorted);
  updateSortHeaderUI();
}

function exportStateSegmentToCsv() {
  if (!state.stateSegmentDisplayRows.length) {
    setStatus(el.analyticsStatus, "No rows to export.", true);
    return;
  }

  const viewMode = el.stateSegmentViewMode.value;
  const dimensions = getStateSegmentDimensionsForView(viewMode);
  const headers = [
    ...(dimensions.includes("state") ? ["State"] : []),
    ...(dimensions.includes("segment") ? ["Segment"] : []),
    ...(dimensions.includes("channel_group_name") ? ["Channel Group"] : []),
    "Bids",
    "Sold",
    "Total Cost",
    "Quote Started",
    "Quotes",
    "Binds",
    "Q2B Score",
    "Scored Policies",
    "CPB",
    "Target CPB",
    "Performance",
    "ROE",
    "Combine Ratio",
    "MRLTV",
    "Profit",
    "Equity"
  ];

  const csvRows = [headers.join(",")];
  for (const row of state.stateSegmentDisplayRows) {
    const roeAdjusted = adjustRoeByQbc(row.roe);
    const combineAdjusted = adjustCombineRatioByQbc(row.combined_ratio);
    const values = [
      ...(dimensions.includes("state") ? [row.state] : []),
      ...(dimensions.includes("segment") ? [row.segment] : []),
      ...(dimensions.includes("channel_group_name") ? [getRowChannelGroup(row)] : []),
      row.bids,
      row.sold,
      row.total_cost,
      row.quote_started,
      row.quotes,
      row.binds,
      row.q2b_score,
      row.scored_policies,
      row.cpb,
      row.target_cpb,
      row.performance,
      roeAdjusted === null || roeAdjusted === undefined ? "" : `${(Number(roeAdjusted) * 100).toFixed(2)}%`,
      combineAdjusted,
      row.mrltv,
      row.profit,
      row.equity
    ].map((value) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "state_segment_performance.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function renderPriceExplorationKpis(rows) {
  if (!rows.length) {
    el.kpiOpps.textContent = "0";
    el.kpiBids.textContent = "0";
    el.kpiWinRate.textContent = "-";
    el.kpiSold.textContent = "0";
    el.kpiCpc.textContent = "-";
    el.kpiAvgBid.textContent = "-";
    el.kpiWinRateUplift.textContent = "-";
    el.kpiCpcUplift.textContent = "-";
    el.kpiAdditionalClicks.textContent = "0";
    el.kpiAdditionalBudget.textContent = "0.00";
    el.kpiStatSig.textContent = "-";
    return;
  }

  const totals = rows.reduce(
    (acc, row) => {
      const opps = Number(row.opps) || 0;
      const bids = Number(row.bids) || 0;
      const sold = Number(row.sold) || 0;
      const cpc = Number(row.cpc) || 0;
      const avgBid = Number(row.avg_bid) || 0;
      const winRateUplift = row.win_rate_uplift;
      const cpcUplift = row.cpc_uplift;
      const additionalClicks = Number(row.additional_clicks) || 0;
      const channelStateKey = `${row.channel_group_name}__${row.state}`;
      const additionalBudgetNeeded = Number(row.additional_budget_needed);

      acc.opps += opps;
      acc.bids += bids;
      acc.sold += sold;
      acc.totalSpend += cpc * sold;
      acc.avgBidWeightedSum += avgBid * bids;
      acc.winRateUpliftWeightedSum += (winRateUplift ?? 0) * bids;
      acc.winRateUpliftWeight += winRateUplift === null || winRateUplift === undefined ? 0 : bids;
      acc.cpcUpliftWeightedSum += (cpcUplift ?? 0) * sold;
      acc.cpcUpliftWeight += cpcUplift === null || cpcUplift === undefined ? 0 : sold;
      acc.additionalClicks += additionalClicks;
      if (!acc.additionalBudgetByChannelState.has(channelStateKey) && !Number.isNaN(additionalBudgetNeeded)) {
        acc.additionalBudgetByChannelState.set(channelStateKey, additionalBudgetNeeded);
      }
      acc.hasHigh = acc.hasHigh || row.stat_sig === "high";
      acc.hasMid = acc.hasMid || row.stat_sig === "mid";
      acc.hasBaseline = acc.hasBaseline || row.stat_sig === "baseline";
      return acc;
    },
    {
      opps: 0,
      bids: 0,
      sold: 0,
      totalSpend: 0,
      avgBidWeightedSum: 0,
      winRateUpliftWeightedSum: 0,
      winRateUpliftWeight: 0,
      cpcUpliftWeightedSum: 0,
      cpcUpliftWeight: 0,
      additionalClicks: 0,
      additionalBudgetByChannelState: new Map(),
      hasHigh: false,
      hasMid: false,
      hasBaseline: false
    }
  );

  let statSig = "low";
  if (totals.hasHigh) {
    statSig = "high";
  } else if (totals.hasMid) {
    statSig = "mid";
  } else if (totals.hasBaseline) {
    statSig = "baseline";
  }

  el.kpiOpps.textContent = formatInt(totals.opps);
  el.kpiBids.textContent = formatInt(totals.bids);
  el.kpiWinRate.textContent = totals.bids ? formatPercent(totals.sold / totals.bids) : "-";
  el.kpiSold.textContent = formatInt(totals.sold);
  el.kpiCpc.textContent = totals.sold ? formatDecimal(totals.totalSpend / totals.sold, 2) : "-";
  el.kpiAvgBid.textContent = totals.bids ? formatDecimal(totals.avgBidWeightedSum / totals.bids, 2) : "-";
  el.kpiWinRateUplift.textContent = totals.winRateUpliftWeight
    ? formatPercent(totals.winRateUpliftWeightedSum / totals.winRateUpliftWeight)
    : "-";
  el.kpiCpcUplift.textContent = totals.cpcUpliftWeight
    ? formatPercent(totals.cpcUpliftWeightedSum / totals.cpcUpliftWeight)
    : "-";
  el.kpiAdditionalClicks.textContent = formatInt(totals.additionalClicks);
  el.kpiAdditionalBudget.textContent = formatDecimal(
    Array.from(totals.additionalBudgetByChannelState.values()).reduce((sum, value) => sum + value, 0),
    2
  );
  el.kpiStatSig.textContent = statSig;
}

function renderPriceExplorationRows(rows) {
  el.priceExplorationTableBody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 25;
    td.textContent = "No data for selected filters.";
    tr.appendChild(td);
    el.priceExplorationTableBody.appendChild(tr);
    renderPriceExplorationKpis([]);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    const cells = [
      row.channel_group_name,
      row.state,
      `${formatDecimal(row.testing_point, 0)}%`,
      `${formatDecimal(row.recommended_testing_point, 0)}%`,
      formatPercentFixed(row.win_rate, 1),
      formatCurrency(row.avg_bid, 2),
      formatCurrency(row.cpc, 2),
      formatInt(row.sold),
      formatPercentFixed(row.win_rate_uplift, 0),
      formatPercentFixed(row.cpc_uplift, 0),
      formatPercentFixed(row.win_rate_uplift_channel, 1),
      formatPercentFixed(row.cpc_uplift_channel, 1),
      formatInt(row.additional_clicks),
      formatCurrency(row.additional_budget_needed, 2),
      formatCurrency(row.current_cpb, 2),
      formatCurrency(row.expected_cpb, 2),
      formatPercentFixed(row.cpb_uplift, 1),
      `${row.stat_sig} (${row.stat_sig_source || "channel & state"})`,
      formatInt(row.channel_quote),
      formatPercentFixed(row.click_to_channel_quote, 1),
      formatInt(row.binds),
      formatPercentFixed(row.q2b, 1),
      formatInt(row.channel_binds),
      formatPercentFixed(row.channel_q2b, 1),
      formatDecimal(row.expected_bind_change, 1)
    ];

    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    el.priceExplorationTableBody.appendChild(tr);
  }

  renderPriceExplorationKpis(rows);
}

function resetPriceExplorationResults(message = "Choose filters and click Apply Filters.") {
  renderPriceExplorationRows([]);
  setStatus(el.priceExplorationStatus, message);
}

function renderStrategyAnalysisRows(rows) {
  if (!el.strategyAnalysisTableBody) {
    return;
  }
  el.strategyAnalysisTableBody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 16;
    td.textContent = "No strategy analysis rows for selected filters.";
    tr.appendChild(td);
    el.strategyAnalysisTableBody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    const cells = [
      row.rule_name || "-",
      Array.isArray(row.states) ? row.states.join(", ") : "-",
      Array.isArray(row.segments) ? row.segments.join(", ") : "-",
      formatInt(row.bids),
      formatInt(row.sold),
      formatPercent(row.wr),
      formatInt(row.quotes),
      formatInt(row.binds),
      formatPercent(row.q2b),
      formatPercent(row.performance),
      formatPercent(row.roe),
      formatPercent(row.cor),
      formatInt(row.additional_clicks),
      formatDecimal(row.additional_binds, 2),
      formatPercent(row.cpb_uplift),
      formatCurrency(row.additional_budget, 2)
    ];

    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    el.strategyAnalysisTableBody.appendChild(tr);
  }
}

async function refreshStrategyAnalysisTable() {
  try {
    const planId =
      String(el.strategyAnalysisPlanId?.value || "").trim() || String(el.selectedPlanId?.value || "").trim();
    if (!planId) {
      renderStrategyAnalysisRows([]);
      setStatus(el.strategyAnalysisStatus, "Select a plan ID to load strategy analysis.");
      return;
    }

    const queryString = buildStrategyAnalysisQuery();
    const data = await api(`/api/analytics/strategy-analysis?${queryString}`);
    state.strategyAnalysisRows = data.rows || [];
    renderStrategyAnalysisRows(state.strategyAnalysisRows);
    setStatus(el.strategyAnalysisStatus, `Loaded ${state.strategyAnalysisRows.length} row(s).`);
  } catch (err) {
    renderStrategyAnalysisRows([]);
    setStatus(el.strategyAnalysisStatus, err.message, true);
  }
}

async function checkMe() {
  try {
    const data = await api("/api/me");
    state.email = data.user.email;
    state.role = data.user.role;
    localStorage.setItem("planning_user_email", state.email);
    localStorage.setItem("planning_user_role", state.role);
    applyRoleAccessUi();
    setStatus(el.meStatus, `Access granted as ${data.user.email} (${data.user.role})`);
    return data.user;
  } catch (err) {
    setStatus(el.meStatus, err.message, true);
    throw err;
  }
}

async function tryRestoreSession() {
  if (!isAuthenticated()) {
    return false;
  }
  try {
    await checkMe();
    showAppLayout();
    return true;
  } catch (_err) {
    clearSessionLocally();
    showLoginScreen("Please log in.");
    return false;
  }
}

function resetLoginUiState() {
  state.authEmailCandidate = "";
  if (el.authPassword) {
    el.authPassword.value = "";
  }
  if (el.authCreatePassword) {
    el.authCreatePassword.value = "";
  }
  if (el.authConfirmPassword) {
    el.authConfirmPassword.value = "";
  }
  if (el.userPasswordLoginWrap) {
    el.userPasswordLoginWrap.hidden = true;
  }
  if (el.userPasswordSetupWrap) {
    el.userPasswordSetupWrap.hidden = true;
  }
}

async function loadUserLoginState() {
  const email = (el.authEmail?.value || "").trim().toLowerCase();
  if (!email) {
    setStatus(el.authStatus, "Enter your email.", true);
    return;
  }
  try {
    const data = await publicApi("/api/auth/user-status", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    if (!data.exists) {
      setStatus(el.authStatus, "User not found. Ask admin to add your email first.", true);
      resetLoginUiState();
      return;
    }
    state.authEmailCandidate = email;
    if (el.userPasswordLoginWrap) {
      el.userPasswordLoginWrap.hidden = Boolean(data.requiresPasswordSetup);
    }
    if (el.userPasswordSetupWrap) {
      el.userPasswordSetupWrap.hidden = !data.requiresPasswordSetup;
    }
    const msg = data.requiresPasswordSetup
      ? "First login detected. Create your password."
      : "Enter your password to continue.";
    setStatus(el.authStatus, msg);
  } catch (err) {
    setStatus(el.authStatus, err.message, true);
  }
}

async function loginAsAdmin() {
  const code = (el.adminAccessCode?.value || "").trim();
  if (!code) {
    setStatus(el.authStatus, "Enter admin code.", true);
    return;
  }
  setButtonBusy(el.adminLoginBtn, true, "Signing in...");
  setStatus(el.authStatus, "Signing in as admin...");
  try {
    const session = await publicApi("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ code })
    });
    setSession(session);
    showAppLayout();
    setStatus(el.authStatus, "Signed in.");
    if (el.adminAccessCode) {
      el.adminAccessCode.value = "";
    }
    void loadAppDataAfterLogin();
  } catch (err) {
    setStatus(el.authStatus, err.message, true);
  } finally {
    setButtonBusy(el.adminLoginBtn, false);
  }
}

async function loginAsUser() {
  const email = state.authEmailCandidate || (el.authEmail?.value || "").trim().toLowerCase();
  const password = el.authPassword?.value || "";
  if (!email || !password) {
    setStatus(el.authStatus, "Enter email and password.", true);
    return;
  }
  setButtonBusy(el.userLoginBtn, true, "Signing in...");
  setStatus(el.authStatus, "Signing in...");
  try {
    const session = await publicApi("/api/auth/user-login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setSession(session);
    showAppLayout();
    setStatus(el.authStatus, "Signed in.");
    if (el.authPassword) {
      el.authPassword.value = "";
    }
    void loadAppDataAfterLogin();
  } catch (err) {
    setStatus(el.authStatus, err.message, true);
  } finally {
    setButtonBusy(el.userLoginBtn, false);
  }
}

async function setupPasswordAndLogin() {
  const email = state.authEmailCandidate || (el.authEmail?.value || "").trim().toLowerCase();
  const password = el.authCreatePassword?.value || "";
  const confirm = el.authConfirmPassword?.value || "";
  if (!email) {
    setStatus(el.authStatus, "Enter your email first.", true);
    return;
  }
  if (!password) {
    setStatus(el.authStatus, "Enter a password.", true);
    return;
  }
  if (password !== confirm) {
    setStatus(el.authStatus, "Passwords do not match.", true);
    return;
  }
  setButtonBusy(el.userSetPasswordBtn, true, "Saving...");
  setStatus(el.authStatus, "Creating password...");
  try {
    const session = await publicApi("/api/auth/user-setup-password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setSession(session);
    showAppLayout();
    setStatus(el.authStatus, "Signed in.");
    if (el.authCreatePassword) {
      el.authCreatePassword.value = "";
    }
    if (el.authConfirmPassword) {
      el.authConfirmPassword.value = "";
    }
    void loadAppDataAfterLogin();
  } catch (err) {
    setStatus(el.authStatus, err.message, true);
  } finally {
    setButtonBusy(el.userSetPasswordBtn, false);
  }
}

async function logoutCurrentUser() {
  try {
    if (state.sessionToken) {
      await publicApi("/api/auth/logout", {
        method: "POST",
        headers: { "x-session-token": state.sessionToken }
      });
    }
  } catch (_err) {
    // No-op on logout failure.
  }
  clearSessionLocally();
  resetLoginUiState();
  showLoginScreen("Logged out.");
}

function renderUsersTable(users) {
  el.usersTableBody.innerHTML = "";
  if (!users.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No users found.";
    tr.appendChild(td);
    el.usersTableBody.appendChild(tr);
    return;
  }

  for (const user of users) {
    const tr = document.createElement("tr");

    const emailTd = document.createElement("td");
    emailTd.textContent = user.email || "-";
    tr.appendChild(emailTd);

    const roleTd = document.createElement("td");
    roleTd.textContent = user.role || "-";
    tr.appendChild(roleTd);

    const activeTd = document.createElement("td");
    activeTd.textContent = user.is_active ? "Yes" : "No";
    tr.appendChild(activeTd);

    const lastLoginTd = document.createElement("td");
    lastLoginTd.textContent = user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never";
    tr.appendChild(lastLoginTd);

    const actionsTd = document.createElement("td");
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "Reset Password";
    resetBtn.addEventListener("click", async () => {
      try {
        await api(`/api/users/${user.user_id}/reset-password`, { method: "POST" });
        setStatus(el.usersStatus, `Password reset for ${user.email}. User must create a new password on next login.`);
        await refreshManagedUsers();
      } catch (err) {
        setStatus(el.usersStatus, err.message, true);
      }
    });
    actionsTd.appendChild(resetBtn);
    tr.appendChild(actionsTd);

    el.usersTableBody.appendChild(tr);
  }
}

async function refreshManagedUsers() {
  if (state.role !== "admin") {
    el.usersTableBody.innerHTML = "";
    setStatus(el.usersStatus, "User management is available only for admin access.", true);
    return;
  }

  try {
    const data = await api("/api/users");
    renderUsersTable(data.users || []);
    setStatus(el.usersStatus, `Loaded ${data.users?.length || 0} user(s).`);
  } catch (err) {
    setStatus(el.usersStatus, err.message, true);
  }
}

async function ensureSelectedPlanId() {
  const existing = getSelectedPlanId();
  if (existing) {
    return existing;
  }

  const data = await api("/api/plans");
  const latestPlanId = data?.plans?.[0]?.plan_id ? String(data.plans[0].plan_id) : "";
  if (!latestPlanId) {
    return "";
  }

  el.selectedPlanId.value = latestPlanId;
  localStorage.setItem(SELECTED_PLAN_ID_STORAGE_KEY, latestPlanId);
  return latestPlanId;
}

async function addManagedUserFromInput() {
  if (state.role !== "admin") {
    setStatus(el.usersStatus, "Only admin can add users.", true);
    return;
  }
  const email = (el.newUserEmail?.value || "").trim().toLowerCase();
  if (!email) {
    setStatus(el.usersStatus, "Enter user email.", true);
    return;
  }
  try {
    await api("/api/users", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    if (el.newUserEmail) {
      el.newUserEmail.value = "";
    }
    setStatus(el.usersStatus, `User ${email} is ready. They can create a password on first login.`);
    await refreshManagedUsers();
  } catch (err) {
    setStatus(el.usersStatus, err.message, true);
  }
}

async function refreshPlans() {
  try {
    const data = await api("/api/plans");
    el.plansList.innerHTML = "";

    for (const plan of data.plans) {
      const li = document.createElement("li");
      li.textContent = `${plan.plan_name} | id=${plan.plan_id} | status=${plan.status}`;
      li.addEventListener("click", async () => {
        el.selectedPlanId.value = plan.plan_id;
        if (el.strategyAnalysisPlanId) {
          el.strategyAnalysisPlanId.value = plan.plan_id;
        }
        localStorage.setItem(SELECTED_PLAN_ID_STORAGE_KEY, plan.plan_id);
        if (state.activeSection === "plan" && state.activePlanTab === "strategy") {
          await loadPlanStrategyForSelectedPlan();
        }
      });
      el.plansList.appendChild(li);
    }
  } catch (err) {
    setStatus(el.createStatus, err.message, true);
  }
}

async function refreshAnalyticsFilters() {
  try {
    const params = new URLSearchParams();
    appendGlobalFilter(params);
    if (el.startDate.value) {
      params.set("startDate", el.startDate.value);
    }
    if (el.endDate.value) {
      params.set("endDate", el.endDate.value);
    }

    const data = await api(`/api/analytics/state-segment-performance/filters?${params.toString()}`);
    setMultiOptions("states", data.states || []);
    setMultiOptions("segments", data.segments || []);
    setMultiOptions("stateSegmentChannels", data.channel_groups || data.channelGroups || []);
  } catch (err) {
    setStatus(el.analyticsStatus, err.message, true);
  }
}

async function refreshStateSegmentTable() {
  try {
    const queryString = buildStateSegmentAnalyticsQuery();
    const data = await api(`/api/analytics/state-segment-performance?${queryString}`);
    state.stateSegmentRawRows = data.rows || [];
    applyStateSegmentViewAndRender();
    setStatus(el.analyticsStatus, `Loaded ${state.stateSegmentDisplayRows.length || 0} row(s).`);
  } catch (err) {
    setStatus(el.analyticsStatus, err.message, true);
  }
}

async function clearStateSegmentFilters() {
  el.startDate.value = "";
  el.endDate.value = "";
  state.multiSelectValues.states = [];
  state.multiSelectValues.segments = [];
  state.multiSelectValues.stateSegmentChannels = [];
  updateMultiToggleLabel("states");
  updateMultiToggleLabel("segments");
  updateMultiToggleLabel("stateSegmentChannels");
  el.stateSegmentViewMode.value = "state_segment";
  await refreshAnalyticsFilters();
  await refreshStateSegmentTable();
}

async function refreshPriceExplorationFilters() {
  try {
    const params = new URLSearchParams();
    appendGlobalFilter(params);
    if (el.priceStartDate.value) {
      params.set("startDate", el.priceStartDate.value);
    }
    if (el.priceEndDate.value) {
      params.set("endDate", el.priceEndDate.value);
    }

    const data = await api(`/api/analytics/price-exploration/filters?${params.toString()}`);
    setMultiOptions("priceStates", data.states || []);
    setMultiOptions("priceChannels", data.channelGroups || []);
  } catch (err) {
    setStatus(el.priceExplorationStatus, err.message, true);
  }
}

async function refreshPriceExplorationTable() {
  try {
    const queryString = buildPriceExplorationQuery();
    const data = await api(`/api/analytics/price-exploration?${queryString}`);
    renderPriceExplorationRows(data.rows || []);
    const rowCount = data.rows?.length || 0;
    const suffix =
      rowCount >= PRICE_EXPLORATION_MAX_ROWS
        ? ` Showing first ${PRICE_EXPLORATION_MAX_ROWS.toLocaleString()} rows. Narrow filters for full detail.`
        : "";
    setStatus(el.priceExplorationStatus, `Loaded ${rowCount} row(s).${suffix}`);
  } catch (err) {
    setStatus(el.priceExplorationStatus, err.message, true);
  }
}

async function clearPriceExplorationFilters() {
  el.priceStartDate.value = "";
  el.priceEndDate.value = "";
  state.multiSelectValues.priceStates = [];
  state.multiSelectValues.priceChannels = [];
  updateMultiToggleLabel("priceStates");
  updateMultiToggleLabel("priceChannels");
  await refreshPriceExplorationFilters();
  resetPriceExplorationResults();
}

async function refreshDerivedTargetOptions() {
  const segmentFallback = ["MCH", "MCR", "SCH", "SCR"];
  const params = new URLSearchParams();
  appendGlobalFilter(params);
  if (el.targetsStartDate.value) {
    params.set("startDate", el.targetsStartDate.value);
  }
  if (el.targetsEndDate.value) {
    params.set("endDate", el.targetsEndDate.value);
  }

  if (!isAuthenticated()) {
    state.derivedTargetStateOptions = mergeWithAllStateCodes(
      state.targetsRows.map((row) => String(row.state || "").toUpperCase()).filter(Boolean)
    );
    state.derivedTargetSegmentOptions = segmentFallback;
    renderDerivedTargetRules();
    return;
  }

  try {
    const data = await api(`/api/analytics/state-segment-performance/filters?${params.toString()}`);
    const states = mergeWithAllStateCodes(data.states || []);
    const segments = [...new Set((data.segments || []).map((value) => String(value || "").toUpperCase()).filter(Boolean))];
    state.derivedTargetStateOptions = states;
    state.derivedTargetSegmentOptions = segments.length ? segments : segmentFallback;

    const stateSet = new Set(state.derivedTargetStateOptions);
    const segmentSet = new Set(state.derivedTargetSegmentOptions);
    let mutated = false;
    for (const rule of state.derivedTargetRules) {
      const prevStates = rule.states.length;
      const prevSegments = Array.isArray(rule.segments) ? rule.segments.length : 0;
      rule.states = rule.states.filter((stateCode) => stateSet.has(stateCode));
      rule.segments = (Array.isArray(rule.segments) ? rule.segments : []).filter((segmentCode) =>
        segmentSet.has(segmentCode)
      );
      if (rule.states.length !== prevStates || rule.segments.length !== prevSegments) {
        mutated = true;
      }
    }
    if (mutated) {
      persistDerivedRulesForCurrentMode();
    }
    renderDerivedTargetRules();
  } catch (_err) {
    state.derivedTargetStateOptions = mergeWithAllStateCodes(
      state.targetsRows.map((row) => String(row.state || "").toUpperCase()).filter(Boolean)
    );
    state.derivedTargetSegmentOptions = segmentFallback;
    renderDerivedTargetRules();
  }
}

async function refreshTargetsFromBq() {
  try {
    renderTargetsLoadingRow("Loading targets from BQ...");
    const queryString = buildTargetsQuery();
    const data = await api(`/api/targets?${queryString}`);
    state.targetsMode = "bq";
    state.uploadedTargetsFile = null;
    state.targetsDefaultLoaded = false;
    state.targetsRows = data.rows || [];
    renderTargetsRows(state.targetsRows);
    await refreshDerivedTargetOptions();
    setStatus(el.targetsStatus, `Loaded ${state.targetsRows.length || 0} BQ row(s).`);
  } catch (err) {
    setStatus(el.targetsStatus, err.message, true);
  }
}

async function addTargetRow() {
  if (state.targetsMode !== "bq") {
    setStatus(el.targetsStatus, "Add Row is available only in BQ mode.", true);
    return;
  }
  try {
    await api("/api/targets", { method: "POST" });
    await logChange({
      objectType: "target_row",
      action: "create_target_row",
      before: null,
      after: { mode: "bq" }
    });
    await refreshTargetsFromBq();
  } catch (err) {
    setStatus(el.targetsStatus, err.message, true);
  }
}

async function saveDerivedTargetRulesPreview() {
  if (state.targetsGoalMode === "cpb") {
    setStatus(el.derivedTargetRulesStatus, "Switch to ROE or COR mode first.", true);
    return;
  }
  if (state.derivedTargetRules.some((rule) => rule.isEditing)) {
    setStatus(el.derivedTargetRulesStatus, "Save all rule rows first (click save icon).", true);
    return;
  }
  const adjustments = buildDerivedTargetAdjustments();
  el.derivedTargetPreviewWrap.hidden = true;
  if (!adjustments.length) {
    setStatus(el.derivedTargetRulesStatus, "No matching rows found for current rules/date range.", true);
    return;
  }
  setStatus(el.derivedTargetRulesStatus, `Prepared ${adjustments.length} row(s) for adjustment.`);
}

async function applyDerivedTargetAdjustments() {
  if (state.targetsGoalMode === "cpb") {
    setStatus(el.derivedTargetRulesStatus, "Switch to ROE or COR mode first.", true);
    return;
  }
  if (state.derivedTargetRules.some((rule) => rule.isEditing)) {
    setStatus(el.derivedTargetRulesStatus, "Save all rule rows first (click save icon).", true);
    return;
  }
  const adjustments = buildDerivedTargetAdjustments();
  el.derivedTargetPreviewWrap.hidden = true;
  if (!adjustments.length) {
    setStatus(el.derivedTargetRulesStatus, "No matching rows found for current rules/date range.", true);
    return;
  }

  if (state.targetsMode === "file") {
    const before = adjustments.map((item) => ({
      target_id: item.row.target_id,
      source: item.row.source,
      state: item.row.state,
      segment: item.row.segment,
      target_value: item.row.target_value
    }));
    for (const item of adjustments) {
      item.row.target_value = item.adjustedTargetCpb;
      syncFileRow(item.row);
    }
    renderTargetsRows(state.targetsRows);
    await logChange({
      objectType: "target_adjustment",
      action: "apply_adjustment_file",
      before,
      after: adjustments.map((item) => ({
        target_id: item.row.target_id,
        source: item.row.source,
        state: item.row.state,
        segment: item.row.segment,
        target_value: item.adjustedTargetCpb
      })),
      metadata: { mode: state.targetsGoalMode, adjustedRows: adjustments.length }
    });
    setStatus(el.derivedTargetRulesStatus, `Adjusted ${adjustments.length} file row(s).`);
    return;
  }

  const bqAdjustments = adjustments.filter((item) => !item.row.__fromFile && item.row.target_id);
  if (!bqAdjustments.length) {
    setStatus(el.derivedTargetRulesStatus, "No BQ rows available for update.", true);
    return;
  }

  renderTargetsLoadingRow("Applying adjusted targets...");
  const concurrency = 8;
  let index = 0;
  let updated = 0;
  let failed = 0;

  async function worker() {
    while (index < bqAdjustments.length) {
      const current = bqAdjustments[index];
      index += 1;
      try {
        await api(`/api/targets/${current.row.target_id}`, {
          method: "PUT",
          body: JSON.stringify({ targetValue: current.adjustedTargetCpb })
        });
        updated += 1;
      } catch (_err) {
        failed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, bqAdjustments.length) }, () => worker()));
  await refreshTargetsFromBq();
  await logChange({
    objectType: "target_adjustment",
    action: "apply_adjustment_bq",
    before: bqAdjustments.map((item) => ({
      target_id: item.row.target_id,
      source: item.row.source,
      state: item.row.state,
      segment: item.row.segment,
      target_value: item.row.target_value
    })),
    after: bqAdjustments.map((item) => ({
      target_id: item.row.target_id,
      source: item.row.source,
      state: item.row.state,
      segment: item.row.segment,
      target_value: item.adjustedTargetCpb
    })),
    metadata: { mode: state.targetsGoalMode, updated, failed }
  });
  const message = failed
    ? `Adjusted ${updated} BQ row(s), ${failed} failed.`
    : `Adjusted ${updated} BQ row(s).`;
  setStatus(el.derivedTargetRulesStatus, message, failed > 0);
}

el.adminLoginBtn.addEventListener("click", loginAsAdmin);
el.userContinueBtn.addEventListener("click", loadUserLoginState);
el.userLoginBtn.addEventListener("click", loginAsUser);
el.userSetPasswordBtn.addEventListener("click", setupPasswordAndLogin);
el.adminAccessCode.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void loginAsAdmin();
  }
});
el.authPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void loginAsUser();
  }
});
el.authConfirmPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void setupPasswordAndLogin();
  }
});
el.logoutBtn.addEventListener("click", logoutCurrentUser);
el.refreshUsersBtn.addEventListener("click", refreshManagedUsers);
el.addUserBtn.addEventListener("click", addManagedUserFromInput);

el.createPlan.addEventListener("click", async () => {
  try {
    const body = {
      planName: el.planName.value.trim(),
      description: el.planDesc.value.trim() || undefined
    };
    const data = await api("/api/plans", {
      method: "POST",
      body: JSON.stringify(body)
    });
    setStatus(el.createStatus, `Created plan: ${data.planId}`);
    el.selectedPlanId.value = data.planId;
    if (el.strategyAnalysisPlanId) {
      el.strategyAnalysisPlanId.value = data.planId;
    }
    localStorage.setItem(SELECTED_PLAN_ID_STORAGE_KEY, data.planId);
    await refreshPlans();
  } catch (err) {
    setStatus(el.createStatus, err.message, true);
  }
});

el.refreshPlans.addEventListener("click", refreshPlans);

el.saveParameter.addEventListener("click", async () => {
  try {
    const planId = el.selectedPlanId.value.trim();
    await api(`/api/plans/${planId}/parameters`, {
      method: "PUT",
      body: JSON.stringify({
        parameters: [
          {
            key: el.paramKey.value.trim(),
            value: el.paramValue.value.trim(),
            valueType: el.paramType.value
          }
        ]
      })
    });
    setStatus(el.actionStatus, "Parameter saved");
  } catch (err) {
    setStatus(el.actionStatus, err.message, true);
  }
});

el.addDecision.addEventListener("click", async () => {
  try {
    const planId = el.selectedPlanId.value.trim();
    const stateValue = el.decisionState.value.trim();
    const channelValue = el.decisionChannel.value.trim();

    await api(`/api/plans/${planId}/decisions`, {
      method: "POST",
      body: JSON.stringify({
        decisions: [
          {
            decisionType: el.decisionType.value.trim(),
            decisionValue: el.decisionValue.value.trim(),
            state: stateValue || undefined,
            channel: channelValue || undefined
          }
        ]
      })
    });
    setStatus(el.actionStatus, "Decision added");
  } catch (err) {
    setStatus(el.actionStatus, err.message, true);
  }
});

el.runPlan.addEventListener("click", async () => {
  try {
    const planId = el.selectedPlanId.value.trim();
    const data = await api(`/api/plans/${planId}/runs`, {
      method: "POST"
    });
    setStatus(el.actionStatus, `Run queued: ${data.runId}`);
  } catch (err) {
    setStatus(el.actionStatus, err.message, true);
  }
});

for (const item of el.menuItems) {
  item.addEventListener("click", () => setActiveSection(item.dataset.section));
}

el.planTabBuilder.addEventListener("click", () => {
  setActiveSection("plan");
  setActivePlanTab("builder");
});

el.planTabTargets.addEventListener("click", async () => {
  setActiveSection("plan");
  setActivePlanTab("targets");
  const targetsRange = computeRangeFromToday(state.config.targetsFromDays, state.config.targetsToDays);
  el.targetsStartDate.value = targetsRange.startIso;
  el.targetsEndDate.value = targetsRange.endIso;
  await refreshDerivedTargetOptions();
  try {
    await ensureTargetsDefaultLoaded();
    await refreshTargetsFileMode();
  } catch (err) {
    setStatus(el.targetsStatus, err.message || "Failed to load targets default file.", true);
  }
});

if (el.planTabStrategy) {
  el.planTabStrategy.addEventListener("click", async () => {
    setActiveSection("plan");
    setActivePlanTab("strategy");
    const targetsRange = computeRangeFromToday(state.config.targetsFromDays, state.config.targetsToDays);
    el.targetsStartDate.value = targetsRange.startIso;
    el.targetsEndDate.value = targetsRange.endIso;
    try {
      await ensureSelectedPlanId();
    } catch (_err) {
      // No-op: load handler below will show relevant status.
    }
    await refreshPlanStrategyOptions();
    await loadPlanStrategyForSelectedPlan();
  });
}

el.analyticsTabStateSegment.addEventListener("click", async () => {
  setActiveSection("analytics");
  setActiveAnalyticsTab("state-segment");
  const perfRange = computeRangeFromToday(state.config.perfFromDays, state.config.perfToDays);
  el.startDate.value = perfRange.startIso;
  el.endDate.value = perfRange.endIso;
  if (isAuthenticated()) {
    await refreshAnalyticsFilters();
    await refreshStateSegmentTable();
  }
});
el.analyticsTabPriceExploration.addEventListener("click", async () => {
  setActiveSection("analytics");
  setActiveAnalyticsTab("price-exploration");
  const priceRange = computeRangeFromToday(state.config.priceFromDays, state.config.priceToDays);
  el.priceStartDate.value = priceRange.startIso;
  el.priceEndDate.value = priceRange.endIso;
  if (isAuthenticated()) {
    await refreshPriceExplorationFilters();
    resetPriceExplorationResults();
  }
});
if (el.analyticsTabStrategyAnalysis) {
  el.analyticsTabStrategyAnalysis.addEventListener("click", async () => {
    setActiveSection("analytics");
    setActiveAnalyticsTab("strategy-analysis");
    const perfRange = computeRangeFromToday(state.config.perfFromDays, state.config.perfToDays);
    if (el.strategyAnalysisStartDate) {
      el.strategyAnalysisStartDate.value = perfRange.startIso;
    }
    if (el.strategyAnalysisEndDate) {
      el.strategyAnalysisEndDate.value = perfRange.endIso;
    }
    if (el.strategyAnalysisPlanId && !String(el.strategyAnalysisPlanId.value || "").trim()) {
      el.strategyAnalysisPlanId.value = String(el.selectedPlanId?.value || "").trim();
    }
    if (isAuthenticated()) {
      await refreshStrategyAnalysisTable();
    }
  });
}

el.settingsSubConfig.addEventListener("click", () => {
  setActiveSection("settings");
  setActiveSettingsTab("config");
});

el.settingsSubUsers.addEventListener("click", async () => {
  setActiveSection("settings");
  setActiveSettingsTab("users");
  await refreshManagedUsers();
});

el.applyAnalyticsFilters.addEventListener("click", refreshStateSegmentTable);
el.clearAnalyticsFilters.addEventListener("click", clearStateSegmentFilters);
el.startDate.addEventListener("change", refreshAnalyticsFilters);
el.endDate.addEventListener("change", refreshAnalyticsFilters);
el.stateSegmentViewMode.addEventListener("change", applyStateSegmentViewAndRender);
el.exportStateSegmentExcel.addEventListener("click", exportStateSegmentToCsv);

for (const th of el.stateSegmentSortableHeaders) {
  th.addEventListener("click", () => {
    const key = th.dataset.sortKey;
    if (!key) {
      return;
    }
    if (state.stateSegmentSort.key === key) {
      state.stateSegmentSort.direction = state.stateSegmentSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.stateSegmentSort.key = key;
      state.stateSegmentSort.direction = "asc";
    }
    applyStateSegmentViewAndRender();
  });
}

el.applyPriceExplorationFilters.addEventListener("click", refreshPriceExplorationTable);
el.clearPriceExplorationFilters.addEventListener("click", clearPriceExplorationFilters);
el.priceStartDate.addEventListener("change", async () => {
  await refreshPriceExplorationFilters();
  resetPriceExplorationResults();
});
el.priceEndDate.addEventListener("change", async () => {
  await refreshPriceExplorationFilters();
  resetPriceExplorationResults();
});
if (el.applyStrategyAnalysisFilters) {
  el.applyStrategyAnalysisFilters.addEventListener("click", refreshStrategyAnalysisTable);
}
if (el.strategyAnalysisStartDate) {
  el.strategyAnalysisStartDate.addEventListener("change", () => {
    if (state.activeSection === "analytics" && state.activeAnalyticsTab === "strategy-analysis") {
      void refreshStrategyAnalysisTable();
    }
  });
}
if (el.strategyAnalysisEndDate) {
  el.strategyAnalysisEndDate.addEventListener("change", () => {
    if (state.activeSection === "analytics" && state.activeAnalyticsTab === "strategy-analysis") {
      void refreshStrategyAnalysisTable();
    }
  });
}
if (el.strategyAnalysisPlanId) {
  el.strategyAnalysisPlanId.addEventListener("change", () => {
    if (state.activeSection === "analytics" && state.activeAnalyticsTab === "strategy-analysis") {
      void refreshStrategyAnalysisTable();
    }
  });
}
el.targetsModeCpb.addEventListener("click", () => setTargetsGoalMode("cpb"));
el.targetsModeRoe.addEventListener("click", async () => {
  setTargetsGoalMode("roe");
  await refreshDerivedTargetOptions();
});
el.targetsModeCor.addEventListener("click", async () => {
  setTargetsGoalMode("cor");
  await refreshDerivedTargetOptions();
});
el.addDerivedTargetRule.addEventListener("click", () => {
  addDerivedTargetRule({ segments: state.derivedTargetSegmentOptions[0] ? [state.derivedTargetSegmentOptions[0]] : [] });
  persistDerivedRulesForCurrentMode();
  void logChange({
    objectType: "targets_rule",
    action: "add_rule",
    before: null,
    after: state.derivedTargetRules[state.derivedTargetRules.length - 1] || null,
    metadata: { mode: state.targetsGoalMode }
  });
  renderDerivedTargetRules();
});
el.adjustDerivedTargetBtn.addEventListener("click", applyDerivedTargetAdjustments);
el.uploadTargetsFile.addEventListener("click", () => el.targetsFileInput.click());
el.targetsFileInput.addEventListener("change", async () => {
  const file = el.targetsFileInput.files?.[0];
  if (!file) {
    return;
  }
  try {
    await importTargetsFile(file);
  } catch (err) {
    setStatus(el.targetsStatus, err.message || "Failed to load file.", true);
  } finally {
    el.targetsFileInput.value = "";
  }
});
el.downloadTargetsFile.addEventListener("click", downloadTargetsFile);
if (el.downloadDerivedTargetsFile) {
  el.downloadDerivedTargetsFile.addEventListener("click", downloadTargetsFile);
}
el.setDefaultTargetsFile.addEventListener("click", () => el.defaultTargetsFileInput.click());
el.defaultTargetsFileInput.addEventListener("change", async () => {
  const file = el.defaultTargetsFileInput.files?.[0];
  if (!file) {
    return;
  }
  try {
    const before = safeLogPayload(state.defaultTargetsFile ? { fileName: state.defaultTargetsFile.fileName } : null);
    await setDefaultTargetsFile(file);
    setStatus(el.configurationStatus, "Default targets file saved.");
    await logChange({
      objectType: "settings_default_target_file",
      action: "set_default_file",
      before,
      after: { fileName: file.name }
    });

    if (state.activeSection === "plan" && state.activePlanTab === "targets") {
      if (!state.uploadedTargetsFile || state.targetsDefaultLoaded) {
        await loadDefaultTargetsFile();
      }
      await refreshTargetsFileMode();
    }
  } catch (err) {
    setStatus(el.configurationStatus, err.message || "Failed to set default file.", true);
  } finally {
    el.defaultTargetsFileInput.value = "";
  }
});
el.clearDefaultTargetsFile.addEventListener("click", async () => {
  try {
    const before = safeLogPayload(state.defaultTargetsFile ? { fileName: state.defaultTargetsFile.fileName } : null);
    await clearDefaultTargetsFile();
    setStatus(el.configurationStatus, "Default targets file cleared.");
    await logChange({
      objectType: "settings_default_target_file",
      action: "clear_default_file",
      before,
      after: null
    });
    if (state.activeSection === "plan" && state.activePlanTab === "targets" && state.targetsDefaultLoaded) {
      try {
        await loadDefaultTargetsFile();
        await refreshTargetsFileMode();
      } catch (err) {
        setStatus(el.targetsStatus, err.message || "Failed to load bundled default file.", true);
      }
    }
  } catch (err) {
    setStatus(el.configurationStatus, err.message || "Failed to clear default file.", true);
  }
});
el.targetsStartDate.addEventListener("change", async () => {
  await refreshDerivedTargetOptions();
  if (state.activeSection === "plan" && state.activePlanTab === "strategy") {
    await refreshPlanStrategyOptions();
  }
  if (state.targetsMode === "bq") {
    await refreshTargetsFromBq();
  } else {
    await refreshTargetsFileMode();
  }
});
el.targetsEndDate.addEventListener("change", async () => {
  await refreshDerivedTargetOptions();
  if (state.activeSection === "plan" && state.activePlanTab === "strategy") {
    await refreshPlanStrategyOptions();
  }
  if (state.targetsMode === "bq") {
    await refreshTargetsFromBq();
  } else {
    await refreshTargetsFileMode();
  }
});

el.activityLeadTypeFilter.addEventListener("change", async () => {
  state.activityLeadType = el.activityLeadTypeFilter.value || "all";
  localStorage.setItem("planning_activity_lead_type", state.activityLeadType);

  if (!isAuthenticated()) {
    return;
  }

  await refreshAnalyticsFilters();
  await refreshStateSegmentTable();
  await refreshPriceExplorationFilters();
  resetPriceExplorationResults();
  if (state.activeSection === "analytics" && state.activeAnalyticsTab === "strategy-analysis") {
    await refreshStrategyAnalysisTable();
  }
  await refreshChangeLogTable();
  if (state.activeSection === "plan" && state.activePlanTab === "targets") {
    await refreshDerivedTargetOptions();
    await refreshTargetsCurrentMode();
  }
  if (state.activeSection === "plan" && state.activePlanTab === "strategy") {
    await refreshPlanStrategyOptions();
  }
});

if (el.selectedPlanId) {
  el.selectedPlanId.addEventListener("change", async () => {
    const planId = getSelectedPlanId();
    if (el.strategyAnalysisPlanId && !String(el.strategyAnalysisPlanId.value || "").trim()) {
      el.strategyAnalysisPlanId.value = planId;
    }
    if (planId) {
      localStorage.setItem(SELECTED_PLAN_ID_STORAGE_KEY, planId);
    } else {
      localStorage.removeItem(SELECTED_PLAN_ID_STORAGE_KEY);
    }
    if (state.activeSection === "plan" && state.activePlanTab === "strategy") {
      await loadPlanStrategyForSelectedPlan();
    }
    if (state.activeSection === "analytics" && state.activeAnalyticsTab === "strategy-analysis") {
      await refreshStrategyAnalysisTable();
    }
  });
}

if (el.addPlanStrategyRule) {
  el.addPlanStrategyRule.addEventListener("click", async () => {
    const planId = getSelectedPlanId() || (await ensureSelectedPlanId());
    if (!planId) {
      setStatus(el.planStrategyStatus, "Select a plan ID before adding rules.", true);
      return;
    }
    state.planStrategyRules.push(
      createPlanStrategyRule({
        name: `Strategy ${state.planStrategyRuleIdCounter}`,
        isEditing: true
      })
    );
    renderPlanStrategyTables();
  });
}

if (el.savePlanStrategyBtn) {
  el.savePlanStrategyBtn.addEventListener("click", savePlanStrategyForSelectedPlan);
}

for (const input of [
  el.perfFromDays,
  el.perfToDays,
  el.priceFromDays,
  el.priceToDays,
  el.targetsFromDays,
  el.targetsToDays
]) {
  input.addEventListener("input", updateConfigPreviewText);
}

for (const input of [el.targetsFromDays, el.targetsToDays]) {
  input.addEventListener("change", async () => {
    saveTargetsRangeLocally();
    applyConfigDefaultsToInputs();
    if (state.activeSection === "plan" && state.activePlanTab === "targets") {
      await refreshDerivedTargetOptions();
      await refreshTargetsCurrentMode();
    }
  });
}

el.saveConfiguration.addEventListener("click", async () => {
  const before = safeLogPayload(state.config);
  saveConfigurationLocally();
  applyConfigDefaultsToInputs();
  setStatus(el.configurationStatus, "Configuration saved");
  await logChange({
    objectType: "settings_configuration",
    action: "save_configuration",
    before,
    after: safeLogPayload(state.config)
  });
  if (!isAuthenticated()) {
    return;
  }
  await refreshAnalyticsFilters();
  await refreshStateSegmentTable();
  await refreshPriceExplorationFilters();
  resetPriceExplorationResults();
  if (state.activeSection === "analytics" && state.activeAnalyticsTab === "strategy-analysis") {
    await refreshStrategyAnalysisTable();
  }
  await refreshChangeLogTable();
  if (state.activeSection === "plan" && state.activePlanTab === "targets") {
    await refreshDerivedTargetOptions();
    await refreshTargetsCurrentMode();
  }
});

el.refreshChangeLog.addEventListener("click", refreshChangeLogTable);

async function loadAppDataAfterLogin() {
  setStatus(el.meStatus, "Loading account and data...");
  try {
    await checkMe();
  } catch (_err) {
    return;
  }

  await Promise.allSettled([
    refreshPlans(),
    refreshAnalyticsFilters().then(() => refreshStateSegmentTable()),
    refreshPriceExplorationFilters(),
    refreshStrategyAnalysisTable(),
    refreshChangeLogTable()
  ]);
  resetPriceExplorationResults("Filters are ready. Click Apply Filters to load price exploration data.");
  if (state.activeSection === "settings" && state.activeSettingsTab === "users") {
    await refreshManagedUsers();
  }
  if (state.activeSection === "plan" && state.activePlanTab === "targets") {
    try {
      await refreshDerivedTargetOptions();
      await ensureTargetsDefaultLoaded();
      await refreshTargetsFileMode();
    } catch (err) {
      setStatus(el.targetsStatus, err.message || "Failed to load targets default file.", true);
    }
  }
  if (state.activeSection === "plan" && state.activePlanTab === "strategy") {
    try {
      await ensureSelectedPlanId();
    } catch (_err) {
      // Keep going and let strategy loader show status.
    }
    await refreshPlanStrategyOptions();
    await loadPlanStrategyForSelectedPlan();
  }
}

async function initialize() {
  initializeMultiDropdowns();
  setActiveSection(state.activeSection);
  setActivePlanTab(state.activePlanTab);
  setActiveAnalyticsTab(state.activeAnalyticsTab);
  setActiveSettingsTab(state.activeSettingsTab);
  applyRoleAccessUi();
  applyConfigDefaultsToInputs();
  updateConfigPreviewText();
  updateSortHeaderUI();
  updateTargetsSortHeaderUI();
  setTargetsGoalMode(state.targetsGoalMode);
  renderDerivedTargetRules();
  renderPlanStrategyTables();
  state.defaultTargetsFile = await readStoredDefaultTargetsFile();
  updateDefaultTargetsFileStatus();

  const restored = await tryRestoreSession();
  if (!restored) {
    resetLoginUiState();
    showLoginScreen("Please log in to continue.");
    return;
  }

  await loadAppDataAfterLogin();
}

initialize();
