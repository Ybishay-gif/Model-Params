import { query, table } from "../db/bigquery.js";

const RAW_CROSS_TACTIC_TABLE = "`crblx-beacon-prod.Custom_Reports.Cross Tactic Analysis Full Data `";

export type StateSegmentFilters = {
  startDate?: string;
  endDate?: string;
  states?: string[];
  segments?: string[];
  channelGroups?: string[];
  activityLeadType?: string;
  qbc?: number;
};

export type PriceExplorationFilters = {
  startDate?: string;
  endDate?: string;
  q2bStartDate?: string;
  q2bEndDate?: string;
  states?: string[];
  channelGroups?: string[];
  activityLeadType?: string;
  limit?: number;
};

export type PlanMergedFilters = {
  startDate?: string;
  endDate?: string;
  states?: string[];
  segments?: string[];
  channelGroups?: string[];
  testingPoints?: string[];
  statSig?: string[];
  activityLeadType?: string;
};

export type StateSegmentPerformanceRow = {
  state: string;
  segment: string;
  channel_group_name: string;
  bids: number;
  sold: number;
  total_cost: number;
  quote_started: number;
  quotes: number;
  binds: number;
  q2b_score: number;
  scored_policies: number;
  cpb: number;
  target_cpb: number;
  performance: number;
  roe: number;
  combined_ratio: number;
  mrltv: number;
  profit: number;
  equity: number;
};

export type PriceExplorationRow = {
  channel_group_name: string;
  state: string;
  testing_point: number;
  opps: number;
  bids: number;
  win_rate: number;
  sold: number;
  binds: number;
  quotes: number;
  click_to_quote: number | null;
  channel_quote: number;
  click_to_channel_quote: number | null;
  q2b: number | null;
  channel_binds: number | null;
  channel_q2b: number | null;
  cpc: number;
  avg_bid: number;
  win_rate_uplift_state: number | null;
  cpc_uplift_state: number | null;
  win_rate_uplift_channel: number | null;
  cpc_uplift_channel: number | null;
  win_rate_uplift: number | null;
  cpc_uplift: number | null;
  additional_clicks: number | null;
  expected_bind_change: number | null;
  additional_budget_needed: number | null;
  current_cpb: number | null;
  expected_cpb: number | null;
  cpb_uplift: number | null;
  recommended_testing_point: number | null;
  stat_sig: string;
  stat_sig_channel_group: string;
  stat_sig_source: string;
};

export type PlanMergedRow = {
  start_date: string;
  end_date: string;
  channel_group_name: string;
  state: string;
  segment: string;
  price_adjustment_percent: number;
  stat_sig: string;
  stat_sig_channel_group: string;
  cpc_uplift: number | null;
  win_rate_uplift: number | null;
  additional_clicks: number | null;
  expected_total_clicks: number | null;
  expected_cpc: number | null;
  expected_total_cost: number | null;
  expected_total_binds: number | null;
  additional_expected_binds: number | null;
  expected_cpb: number | null;
  ss_performance: number | null;
  expected_performance: number | null;
  performance_uplift: number | null;
};

type FilterOptionsRow = {
  states: string[];
  segments: string[];
  channel_groups: string[];
};

type PriceExplorationFilterOptionsRow = {
  states: string[];
  channel_groups: string[];
};

type PlanMergedFilterOptionsRow = {
  states: string[];
  segments: string[];
  channel_groups: string[];
  testing_points: number[];
  stat_sig: string[];
};

type StrategyRule = {
  id: number;
  name: string;
  states: string[];
  segments: string[];
};

type StrategyAnalysisFilters = {
  planId: string;
  startDate?: string;
  endDate?: string;
  activityLeadType?: string;
};

type StrategyBaselineRow = {
  state: string;
  segment: string;
  bids: number | null;
  sold: number | null;
  quotes: number | null;
  binds: number | null;
  q2b: number | null;
  performance: number | null;
  roe: number | null;
  combined_ratio: number | null;
};

type StrategyPlanMergedRow = {
  channel_group_name: string;
  state: string;
  segment: string;
  price_adjustment_percent: number | null;
  pe_bids: number | null;
  pe_sold: number | null;
  pe_number_of_quotes: number | null;
  pe_win_rate: number | null;
  pe_total_spend: number | null;
  ss_cpb: number | null;
  expected_cpb: number | null;
  additional_clicks: number | null;
  additional_expected_binds: number | null;
  expected_total_cost: number | null;
};

export type StrategyAnalysisRow = {
  rule_name: string;
  states: string[];
  segments: string[];
  bids: number;
  sold: number;
  wr: number | null;
  quotes: number;
  binds: number;
  q2b: number | null;
  performance: number | null;
  roe: number | null;
  cor: number | null;
  additional_clicks: number;
  additional_binds: number;
  cpb_uplift: number | null;
  additional_budget: number;
};

const ALL_US_STATE_CODES = [
  "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL",
  "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA",
  "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE",
  "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"
];

function withAllStateCodes(states?: string[]): string[] {
  const normalized = (states ?? []).map((value) => String(value || "").trim().toUpperCase()).filter(Boolean);
  return [...new Set([...ALL_US_STATE_CODES, ...normalized])].sort();
}

function parseStrategyRules(raw: string): StrategyRule[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.rules)) {
      return [];
    }
    return parsed.rules
      .map((rule: any, index: number) => ({
        id: Number(rule?.id) || index + 1,
        name: String(rule?.name || "").trim(),
        states: Array.isArray(rule?.states)
          ? rule.states.map((value: string) => String(value || "").trim().toUpperCase()).filter(Boolean)
          : [],
        segments: Array.isArray(rule?.segments)
          ? rule.segments.map((value: string) => String(value || "").trim().toUpperCase()).filter(Boolean)
          : []
      }))
      .filter((rule: StrategyRule) => rule.name && rule.states.length > 0 && rule.segments.length > 0);
  } catch {
    return [];
  }
}

type CombinedFilterParts = {
  activityType: string;
  leadType: string;
  activityPattern: string;
  leadPattern: string;
  stateSegmentActivityType: string;
  stateSegmentLeadType: string;
};

function splitCombinedFilter(value?: string): CombinedFilterParts {
  switch ((value || "").toLowerCase()) {
    case "clicks_auto":
      return {
        activityType: "clicks",
        leadType: "auto",
        activityPattern: "click",
        leadPattern: "auto",
        stateSegmentActivityType: "Click",
        stateSegmentLeadType: "CAR_INSURANCE_LEAD"
      };
    case "clicks_home":
      return {
        activityType: "clicks",
        leadType: "home",
        activityPattern: "click",
        leadPattern: "home",
        stateSegmentActivityType: "Click",
        stateSegmentLeadType: "HOME_INSURANCE_LEAD"
      };
    case "leads_auto":
      return {
        activityType: "leads",
        leadType: "auto",
        activityPattern: "lead",
        leadPattern: "auto",
        stateSegmentActivityType: "Lead",
        stateSegmentLeadType: "CAR_INSURANCE_LEAD"
      };
    case "leads_home":
      return {
        activityType: "leads",
        leadType: "home",
        activityPattern: "lead",
        leadPattern: "home",
        stateSegmentActivityType: "Lead",
        stateSegmentLeadType: "HOME_INSURANCE_LEAD"
      };
    case "calls_auto":
      return {
        activityType: "calls",
        leadType: "auto",
        activityPattern: "call",
        leadPattern: "auto",
        stateSegmentActivityType: "Call",
        stateSegmentLeadType: "CAR_INSURANCE_LEAD"
      };
    case "calls_home":
      return {
        activityType: "calls",
        leadType: "home",
        activityPattern: "call",
        leadPattern: "home",
        stateSegmentActivityType: "Call",
        stateSegmentLeadType: "HOME_INSURANCE_LEAD"
      };
    default:
      return {
        activityType: "",
        leadType: "",
        activityPattern: "",
        leadPattern: "",
        stateSegmentActivityType: "",
        stateSegmentLeadType: ""
      };
  }
}

function normalizeFilters(filters: StateSegmentFilters) {
  const states = (filters.states ?? []).map((value) => value.trim()).filter(Boolean);
  const segments = (filters.segments ?? []).map((value) => value.trim().toUpperCase()).filter(Boolean);
  const channelGroups = (filters.channelGroups ?? []).map((value) => value.trim()).filter(Boolean);
  const combined = splitCombinedFilter(filters.activityLeadType);

  return {
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    states: states.length > 0 ? states : ["__ALL__"],
    segments: segments.length > 0 ? segments : ["__ALL__"],
    channelGroups: channelGroups.length > 0 ? channelGroups : ["__ALL__"],
    activityType: combined.activityType,
    leadType: combined.leadType,
    activityPattern: combined.activityPattern,
    leadPattern: combined.leadPattern,
    stateSegmentActivityType: combined.stateSegmentActivityType,
    stateSegmentLeadType: combined.stateSegmentLeadType,
    qbc: Number.isFinite(Number(filters.qbc)) ? Number(filters.qbc) : 0
  };
}

function normalizePriceExplorationFilters(filters: PriceExplorationFilters) {
  const states = (filters.states ?? []).map((value) => value.trim()).filter(Boolean);
  const channelGroups = (filters.channelGroups ?? []).map((value) => value.trim()).filter(Boolean);
  const combined = splitCombinedFilter(filters.activityLeadType);

  return {
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    q2bStartDate: filters.q2bStartDate || filters.startDate || "",
    q2bEndDate: filters.q2bEndDate || filters.endDate || "",
    states: states.length > 0 ? states : ["__ALL__"],
    channelGroups: channelGroups.length > 0 ? channelGroups : ["__ALL__"],
    activityType: combined.activityType,
    leadType: combined.leadType,
    activityPattern: combined.activityPattern,
    leadPattern: combined.leadPattern,
    stateSegmentActivityType: combined.stateSegmentActivityType,
    stateSegmentLeadType: combined.stateSegmentLeadType,
    limit: Number.isFinite(Number(filters.limit)) ? Math.min(Math.max(Number(filters.limit), 1), 20000) : 5000
  };
}

function normalizePlanMergedFilters(filters: PlanMergedFilters) {
  const states = (filters.states ?? []).map((value) => value.trim().toUpperCase()).filter(Boolean);
  const segments = (filters.segments ?? []).map((value) => value.trim().toUpperCase()).filter(Boolean);
  const channelGroups = (filters.channelGroups ?? []).map((value) => value.trim()).filter(Boolean);
  const testingPoints = (filters.testingPoints ?? [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const statSig = (filters.statSig ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const combined = splitCombinedFilter(filters.activityLeadType);

  return {
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    states: states.length > 0 ? states : ["__ALL__"],
    segments: segments.length > 0 ? segments : ["__ALL__"],
    channelGroups: channelGroups.length > 0 ? channelGroups : ["__ALL__"],
    testingPoints: testingPoints.length > 0 ? testingPoints : [999999999],
    statSig: statSig.length > 0 ? statSig : ["__ALL__"],
    activityType: combined.activityType,
    leadType: combined.leadType,
    activityPattern: combined.activityPattern,
    leadPattern: combined.leadPattern
  };
}

export async function listStateSegmentFilters(filters: StateSegmentFilters): Promise<FilterOptionsRow> {
  const normalized = normalizeFilters(filters);

  const rows = await query<FilterOptionsRow>(
    `
      WITH scoped AS (
        SELECT
          DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) AS event_date,
          Data_State AS state,
          COALESCE(
            NULLIF(TRIM(ChannelGroupName), ''),
            NULLIF(TRIM(CAST(Account_Name AS STRING)), ''),
            ''
          ) AS channel_group_name,
          UPPER(
            COALESCE(
              NULLIF(TRIM(Segments), ''),
              REGEXP_EXTRACT(UPPER(COALESCE(ChannelGroupName, '')), r'(MCH|MCR|SCH|SCR)')
            )
          ) AS segment
        FROM ${RAW_CROSS_TACTIC_TABLE}
        WHERE (@startDate = "" OR DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) >= DATE(@startDate))
          AND (@endDate = "" OR DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) <= DATE(@endDate))
          AND (@stateSegmentActivityType = "" OR LOWER(activitytype) = LOWER(@stateSegmentActivityType))
          AND (@stateSegmentLeadType = "" OR LOWER(Leadtype) = LOWER(@stateSegmentLeadType))
      )
      SELECT
        ARRAY(
          SELECT DISTINCT state
          FROM scoped
          WHERE state IS NOT NULL
          ORDER BY state
        ) AS states,
        ARRAY(
          SELECT DISTINCT segment
          FROM scoped
          WHERE segment IS NOT NULL AND segment IN ('MCH', 'MCR', 'SCH', 'SCR')
          ORDER BY segment
        ) AS segments,
        ARRAY(
          SELECT DISTINCT channel_group_name
          FROM scoped
          WHERE channel_group_name IS NOT NULL AND channel_group_name != ''
          ORDER BY channel_group_name
        ) AS channel_groups
    `,
    normalized
  );

  const first = rows[0];
  return {
    states: withAllStateCodes(first?.states),
    segments: first?.segments ?? [],
    channel_groups: first?.channel_groups ?? []
  };
}

export async function getStateSegmentPerformance(
  filters: StateSegmentFilters
): Promise<StateSegmentPerformanceRow[]> {
  const normalized = normalizeFilters(filters);

  return query<StateSegmentPerformanceRow>(
    `
      WITH base AS (
        SELECT
          DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) AS event_date,
          Data_State AS state,
          COALESCE(
            NULLIF(TRIM(ChannelGroupName), ''),
            NULLIF(TRIM(CAST(Account_Name AS STRING)), ''),
            ''
          ) AS channel_group_name,
          UPPER(
            COALESCE(
              NULLIF(TRIM(Segments), ''),
              REGEXP_EXTRACT(
                UPPER(
                  COALESCE(
                    NULLIF(TRIM(ChannelGroupName), ''),
                    NULLIF(TRIM(CAST(Account_Name AS STRING)), ''),
                    ''
                  )
                ),
                r'(MCH|MCR|SCH|SCR)'
              )
            )
          ) AS segment,
          SAFE_CAST(bid_count AS FLOAT64) AS bid_count,
          SAFE_CAST(Transaction_sold AS FLOAT64) AS transaction_sold,
          SAFE_CAST(TransactionSold AS FLOAT64) AS transaction_sold_alt,
          SAFE_CAST(Price AS FLOAT64) AS price,
          SAFE_CAST(TotalQuotes AS FLOAT64) AS total_quote,
          SAFE_CAST(TotalBinds AS FLOAT64) AS total_binds,
          SAFE_CAST(AutoOnlineQuotesStart AS FLOAT64) AS quote_started,
          SAFE_CAST(ScoredPolicies AS FLOAT64) AS scored_policies,
          SAFE_CAST(LifetimePremium AS FLOAT64) AS lifetime_premium,
          SAFE_CAST(LifeTimeCost AS FLOAT64) AS lifetime_cost,
          SAFE_CAST(CustomValues_Mrltv AS FLOAT64) AS avg_mrltv,
          SAFE_CAST(CustomValues_Profit AS FLOAT64) AS avg_profit,
          SAFE_CAST(Equity AS FLOAT64) AS avg_equity,
          SAFE_CAST(Target_TargetCPB AS FLOAT64) AS target_cpb
        FROM ${RAW_CROSS_TACTIC_TABLE}
        WHERE (@stateSegmentActivityType = "" OR LOWER(activitytype) = LOWER(@stateSegmentActivityType))
          AND (@stateSegmentLeadType = "" OR LOWER(Leadtype) = LOWER(@stateSegmentLeadType))
      )
      SELECT
        state,
        segment,
        channel_group_name,
        SUM(COALESCE(bid_count, 0)) AS bids,
        SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)) AS sold,
        SUM(COALESCE(price, 0)) AS total_cost,
        SUM(COALESCE(quote_started, 0)) AS quote_started,
        SUM(COALESCE(total_quote, 0)) AS quotes,
        SUM(COALESCE(total_binds, 0)) AS binds,
        SAFE_DIVIDE(
          SUM(COALESCE(total_binds, 0)),
          NULLIF(SUM(COALESCE(total_quote, 0)), 0)
        ) AS q2b_score,
        SUM(COALESCE(scored_policies, 0)) AS scored_policies,
        SAFE_DIVIDE(
          SUM(COALESCE(price, 0)),
          NULLIF(SUM(COALESCE(total_binds, 0)), 0)
        ) AS cpb,
        CASE
          WHEN SUM(COALESCE(total_binds, 0)) = 0 THEN 0
          ELSE SAFE_DIVIDE(
            SUM(COALESCE(target_cpb, 0)),
            SUM(COALESCE(total_binds, 0))
          )
        END AS target_cpb,
        SAFE_DIVIDE(
          CASE
            WHEN SUM(COALESCE(total_binds, 0)) = 0 THEN 0
            ELSE SAFE_DIVIDE(
              SUM(COALESCE(target_cpb, 0)),
              SUM(COALESCE(total_binds, 0))
            )
          END,
          SAFE_DIVIDE(
            SUM(COALESCE(price, 0)),
            NULLIF(SUM(COALESCE(total_binds, 0)), 0)
          )
        ) AS performance,
        CASE
          WHEN SUM(COALESCE(scored_policies, 0)) = 0
            OR SAFE_DIVIDE(
              SUM(COALESCE(avg_equity, 0)),
              NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
            ) = 0 THEN 0
          ELSE SAFE_DIVIDE(
            (
              SAFE_DIVIDE(
                SUM(COALESCE(avg_profit, 0)),
                NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
              )
              - (
                0.8 * (
                  SAFE_DIVIDE(
                    SAFE_DIVIDE(
                      SUM(COALESCE(price, 0)),
                      NULLIF(SUM(COALESCE(total_binds, 0)), 0)
                    ),
                    0.81
                  ) + @qbc
                )
              )
            ),
            SAFE_DIVIDE(
              SUM(COALESCE(avg_equity, 0)),
              NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
            )
          )
        END AS roe,
        CASE
          WHEN SUM(COALESCE(scored_policies, 0)) = 0
            OR SAFE_DIVIDE(
              SUM(COALESCE(lifetime_premium, 0)),
              NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
            ) = 0 THEN 0
          ELSE SAFE_DIVIDE(
            (
              SAFE_DIVIDE(
                SAFE_DIVIDE(
                  SUM(COALESCE(price, 0)),
                  NULLIF(SUM(COALESCE(total_binds, 0)), 0)
                ),
                0.81
              )
              + @qbc
              + SAFE_DIVIDE(
                SUM(COALESCE(lifetime_cost, 0)),
                NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
              )
            ),
            SAFE_DIVIDE(
              SUM(COALESCE(lifetime_premium, 0)),
              NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
            )
          )
        END AS combined_ratio,
        SAFE_DIVIDE(
          SUM(COALESCE(avg_mrltv, 0) * COALESCE(scored_policies, 0)),
          NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
        ) AS mrltv,
        SAFE_DIVIDE(
          SUM(COALESCE(avg_profit, 0)),
          NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
        ) AS profit,
        SAFE_DIVIDE(
          SUM(COALESCE(avg_equity, 0)),
          NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
        ) AS equity
      FROM base
      WHERE (@startDate = "" OR event_date >= DATE(@startDate))
        AND (@endDate = "" OR event_date <= DATE(@endDate))
        AND ("__ALL__" IN UNNEST(@states) OR state IN UNNEST(@states))
        AND ("__ALL__" IN UNNEST(@segments) OR segment IN UNNEST(@segments))
        AND ("__ALL__" IN UNNEST(@channelGroups) OR channel_group_name IN UNNEST(@channelGroups))
        AND segment IN ('MCH', 'MCR', 'SCH', 'SCR')
      GROUP BY state, segment, channel_group_name
      ORDER BY state, segment, channel_group_name
    `,
    normalized
  );
}

export async function listPriceExplorationFilters(
  filters: Pick<PriceExplorationFilters, "startDate" | "endDate" | "activityLeadType">
): Promise<{ states: string[]; channelGroups: string[] }> {
  const normalized = normalizePriceExplorationFilters(filters);

  const rows = await query<PriceExplorationFilterOptionsRow>(
    `
      WITH raw AS (
        SELECT
          Data_State AS state,
          ChannelGroupName AS channel_group_name,
          LOWER(COALESCE(activitytype, '')) AS activity_type_raw,
          LOWER(COALESCE(Leadtype, '')) AS lead_type_raw
        FROM ${RAW_CROSS_TACTIC_TABLE}
        WHERE Data_State IS NOT NULL
          AND ChannelGroupName IS NOT NULL
          AND SAFE_CAST(PriceAdjustmentPercent AS INT64) IS NOT NULL
          AND (@startDate = "" OR DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) >= DATE(@startDate))
          AND (@endDate = "" OR DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) <= DATE(@endDate))
      ),
      scoped AS (
        SELECT
          state,
          channel_group_name,
          CASE
            WHEN activity_type_raw LIKE 'click%' THEN 'clicks'
            WHEN activity_type_raw LIKE 'lead%' THEN 'leads'
            WHEN activity_type_raw LIKE 'call%' THEN 'calls'
            ELSE ''
          END AS activity_group,
          CASE
            WHEN lead_type_raw LIKE '%car%' THEN 'auto'
            WHEN lead_type_raw LIKE '%home%' THEN 'home'
            ELSE ''
          END AS lead_group
        FROM raw
      )
      SELECT
        ARRAY(
          SELECT DISTINCT state
          FROM scoped
          WHERE state IS NOT NULL
            AND (@activityType = "" OR activity_group = @activityType)
            AND (@leadType = "" OR lead_group = @leadType)
          ORDER BY state
        ) AS states,
        ARRAY(
          SELECT DISTINCT channel_group_name
          FROM scoped
          WHERE channel_group_name IS NOT NULL
            AND (@activityType = "" OR activity_group = @activityType)
            AND (@leadType = "" OR lead_group = @leadType)
          ORDER BY channel_group_name
        ) AS channel_groups
    `,
    normalized
  );

  const first = rows[0];
  return {
    states: withAllStateCodes(first?.states),
    channelGroups: first?.channel_groups ?? []
  };
}

export async function getPriceExploration(
  filters: PriceExplorationFilters
): Promise<PriceExplorationRow[]> {
  const normalized = normalizePriceExplorationFilters(filters);

  return query<PriceExplorationRow>(
    `
      WITH raw_all AS (
        SELECT
          ChannelGroupName AS channel_group_name,
          Data_State AS state,
          SAFE_CAST(PriceAdjustmentPercent AS INT64) AS price_adjustment_percent,
          Lead_LeadID,
          SAFE_CAST(bid_count AS FLOAT64) AS bid_count,
          SAFE_CAST(ExtraBidData_ReturnedAdsCount AS FLOAT64) AS returned_ads_count,
          SAFE_CAST(ExtraBidData_OriginalAdData_Position AS FLOAT64) AS ad_position,
          SAFE_CAST(Transaction_sold AS FLOAT64) AS transaction_sold,
          SAFE_CAST(TransactionSold AS FLOAT64) AS transaction_sold_alt,
          SAFE_CAST(bid_price AS FLOAT64) AS bid_price,
          SAFE_CAST(Price AS FLOAT64) AS price,
          SAFE_CAST(AutoOnlineQuotesStart AS FLOAT64) AS quote_started,
          SAFE_CAST(TotalQuotes AS FLOAT64) AS total_quotes,
          SAFE_CAST(TotalBinds AS FLOAT64) AS total_binds,
          LOWER(COALESCE(activitytype, '')) AS activity_type_raw,
          LOWER(COALESCE(Leadtype, '')) AS lead_type_raw
        FROM ${RAW_CROSS_TACTIC_TABLE}
        WHERE DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) BETWEEN
            IF(@startDate = "", DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), DATE(@startDate))
            AND IF(@endDate = "", CURRENT_DATE(), DATE(@endDate))
          AND Data_State IS NOT NULL
          AND ChannelGroupName IS NOT NULL
          AND SAFE_CAST(PriceAdjustmentPercent AS INT64) IS NOT NULL
          AND ("__ALL__" IN UNNEST(@channelGroups) OR ChannelGroupName IN UNNEST(@channelGroups))
      ),
      base_all AS (
        SELECT
          channel_group_name,
          state,
          price_adjustment_percent,
          Lead_LeadID,
          bid_count,
          returned_ads_count,
          ad_position,
          transaction_sold,
          transaction_sold_alt,
          bid_price,
          price,
          quote_started,
          total_quotes,
          total_binds,
          CASE
            WHEN activity_type_raw LIKE 'click%' THEN 'clicks'
            WHEN activity_type_raw LIKE 'lead%' THEN 'leads'
            WHEN activity_type_raw LIKE 'call%' THEN 'calls'
            ELSE ''
          END AS activity_group,
          CASE
            WHEN lead_type_raw LIKE '%car%' THEN 'auto'
            WHEN lead_type_raw LIKE '%home%' THEN 'home'
            ELSE ''
          END AS lead_group
        FROM raw_all
        WHERE (@activityType = "" OR (
          CASE
            WHEN activity_type_raw LIKE 'click%' THEN 'clicks'
            WHEN activity_type_raw LIKE 'lead%' THEN 'leads'
            WHEN activity_type_raw LIKE 'call%' THEN 'calls'
            ELSE ''
          END
        ) = @activityType)
          AND (@leadType = "" OR (
            CASE
              WHEN lead_type_raw LIKE '%car%' THEN 'auto'
              WHEN lead_type_raw LIKE '%home%' THEN 'home'
              ELSE ''
            END
          ) = @leadType)
      ),
      base_filtered AS (
        SELECT *
        FROM base_all
        WHERE ("__ALL__" IN UNNEST(@states) OR state IN UNNEST(@states))
      ),
      state_tp AS (
        SELECT
          channel_group_name,
          state,
          activity_group,
          lead_group,
          price_adjustment_percent,
          COUNT(DISTINCT Lead_LeadID) AS opps,
          SUM(COALESCE(bid_count, 0)) AS bids,
          SUM(COALESCE(returned_ads_count, 0)) AS total_impressions,
          AVG(COALESCE(ad_position, 0)) AS avg_position,
          SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)) AS sold,
          SAFE_DIVIDE(
            SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)),
            NULLIF(SUM(COALESCE(bid_count, 0)), 0)
          ) AS win_rate,
          AVG(COALESCE(bid_price, 0)) AS avg_bid,
          SAFE_DIVIDE(
            SUM(COALESCE(price, 0)),
            NULLIF(SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)), 0)
          ) AS cpc,
          SUM(COALESCE(price, 0)) AS total_spend,
          SAFE_DIVIDE(
            SUM(COALESCE(total_quotes, 0)),
            NULLIF(SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)), 0)
          ) AS click_to_quote,
          SAFE_DIVIDE(
            SUM(COALESCE(quote_started, 0)),
            NULLIF(SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)), 0)
          ) AS quote_start_rate,
          SUM(COALESCE(quote_started, 0)) AS number_of_quote_started,
          SUM(COALESCE(total_quotes, 0)) AS number_of_quotes,
          SUM(COALESCE(total_binds, 0)) AS number_of_binds
        FROM base_filtered
        GROUP BY 1, 2, 3, 4, 5
      ),
      channel_tp AS (
        SELECT
          channel_group_name,
          activity_group,
          lead_group,
          price_adjustment_percent,
          SUM(bids) AS channel_bids,
          SUM(sold) AS channel_sold,
          SAFE_DIVIDE(SUM(sold), NULLIF(SUM(bids), 0)) AS channel_win_rate,
          SAFE_DIVIDE(SUM(total_spend), NULLIF(SUM(sold), 0)) AS channel_cpc
        FROM (
          SELECT
            channel_group_name,
            activity_group,
            lead_group,
            price_adjustment_percent,
            SUM(COALESCE(bid_count, 0)) AS bids,
            SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)) AS sold,
            SUM(COALESCE(price, 0)) AS total_spend
          FROM base_all
          GROUP BY 1, 2, 3, 4
        )
        GROUP BY 1, 2, 3, 4
      ),
      joined AS (
        SELECT
          s.*,
          b.win_rate AS baseline_win_rate,
          b.cpc AS baseline_cpc,
          b.bids AS baseline_bids,
          b.sold AS baseline_sold,
          c.channel_bids,
          c.channel_sold,
          c.channel_win_rate,
          c.channel_cpc,
          cb.channel_win_rate AS channel_baseline_win_rate,
          cb.channel_cpc AS channel_baseline_cpc,
          cb.channel_bids AS channel_baseline_bids,
          cb.channel_sold AS channel_baseline_sold
        FROM state_tp s
        LEFT JOIN state_tp b
          ON b.channel_group_name = s.channel_group_name
         AND b.state = s.state
         AND b.activity_group = s.activity_group
         AND b.lead_group = s.lead_group
         AND b.price_adjustment_percent = 0
        LEFT JOIN channel_tp c
          ON c.channel_group_name = s.channel_group_name
         AND c.activity_group = s.activity_group
         AND c.lead_group = s.lead_group
         AND c.price_adjustment_percent = s.price_adjustment_percent
        LEFT JOIN channel_tp cb
          ON cb.channel_group_name = s.channel_group_name
         AND cb.activity_group = s.activity_group
         AND cb.lead_group = s.lead_group
         AND cb.price_adjustment_percent = 0
      ),
      scored AS (
        SELECT
          *,
          SAFE_DIVIDE(
            win_rate - baseline_win_rate,
            SQRT(
              SAFE_DIVIDE((sold + baseline_sold), NULLIF((bids + baseline_bids), 0))
              * (1 - SAFE_DIVIDE((sold + baseline_sold), NULLIF((bids + baseline_bids), 0)))
              * (SAFE_DIVIDE(1, NULLIF(bids, 0)) + SAFE_DIVIDE(1, NULLIF(baseline_bids, 0)))
            )
          ) AS z_state,
          SAFE_DIVIDE(
            channel_win_rate - channel_baseline_win_rate,
            SQRT(
              SAFE_DIVIDE((channel_sold + channel_baseline_sold), NULLIF((channel_bids + channel_baseline_bids), 0))
              * (
                1 - SAFE_DIVIDE((channel_sold + channel_baseline_sold), NULLIF((channel_bids + channel_baseline_bids), 0))
              )
              * (SAFE_DIVIDE(1, NULLIF(channel_bids, 0)) + SAFE_DIVIDE(1, NULLIF(channel_baseline_bids, 0)))
            )
          ) AS z_channel
        FROM joined
      ),
      per_group AS (
        SELECT
          channel_group_name,
          state,
          activity_group,
          lead_group,
          price_adjustment_percent AS testing_point,
          opps,
          bids,
          sold,
          number_of_binds,
          number_of_quotes,
          avg_bid,
          cpc,
          total_spend,
          CASE
            WHEN price_adjustment_percent = 0 THEN 'baseline'
            WHEN ABS(z_state) >= 2.58 THEN 'high'
            WHEN ABS(z_state) >= 1.96 THEN 'mid'
            ELSE 'low'
          END AS stat_sig,
          CASE
            WHEN price_adjustment_percent = 0 THEN 'baseline'
            WHEN ABS(z_channel) >= 2.58 THEN 'high'
            WHEN ABS(z_channel) >= 1.96 THEN 'mid'
            ELSE 'low'
          END AS stat_sig_channel_group,
          CASE
            WHEN price_adjustment_percent = 0 THEN NULL
            ELSE SAFE_DIVIDE(cpc - baseline_cpc, NULLIF(baseline_cpc, 0))
          END AS cpc_uplift_state,
          CASE
            WHEN price_adjustment_percent = 0 THEN NULL
            ELSE SAFE_DIVIDE(win_rate - baseline_win_rate, NULLIF(baseline_win_rate, 0))
          END AS win_rate_uplift_state,
          CASE
            WHEN price_adjustment_percent = 0 THEN NULL
            ELSE SAFE_DIVIDE(channel_cpc - channel_baseline_cpc, NULLIF(channel_baseline_cpc, 0))
          END AS cpc_uplift_channel,
          CASE
            WHEN price_adjustment_percent = 0 THEN NULL
            ELSE SAFE_DIVIDE(channel_win_rate - channel_baseline_win_rate, NULLIF(channel_baseline_win_rate, 0))
          END AS win_rate_uplift_channel,
          CASE
            WHEN price_adjustment_percent = 0 THEN NULL
            ELSE ((CASE WHEN ABS(z_state) >= 1.96 THEN win_rate ELSE channel_win_rate END) - baseline_win_rate) * bids
          END AS additional_clicks
        FROM scored
      ),
      final_agg AS (
        SELECT
          channel_group_name,
          state,
          testing_point,
          SUM(opps) AS opps,
          SUM(bids) AS bids,
          SAFE_DIVIDE(SUM(sold), NULLIF(SUM(bids), 0)) AS win_rate,
          SUM(sold) AS sold,
          SUM(number_of_binds) AS binds,
          SUM(number_of_quotes) AS quotes,
          SAFE_DIVIDE(SUM(number_of_quotes), NULLIF(SUM(bids), 0)) AS click_to_quote,
          SAFE_DIVIDE(SUM(total_spend), NULLIF(SUM(sold), 0)) AS cpc,
          SAFE_DIVIDE(SUM(avg_bid * bids), NULLIF(SUM(bids), 0)) AS avg_bid,
          SUM(total_spend) AS total_spend,
          SAFE_DIVIDE(
            SUM(IF(win_rate_uplift_state IS NULL, 0, win_rate_uplift_state * bids)),
            NULLIF(SUM(IF(win_rate_uplift_state IS NULL, 0, bids)), 0)
          ) AS win_rate_uplift_state,
          SAFE_DIVIDE(
            SUM(IF(cpc_uplift_state IS NULL, 0, cpc_uplift_state * sold)),
            NULLIF(SUM(IF(cpc_uplift_state IS NULL, 0, sold)), 0)
          ) AS cpc_uplift_state,
          SAFE_DIVIDE(
            SUM(IF(win_rate_uplift_channel IS NULL, 0, win_rate_uplift_channel * bids)),
            NULLIF(SUM(IF(win_rate_uplift_channel IS NULL, 0, bids)), 0)
          ) AS win_rate_uplift_channel,
          SAFE_DIVIDE(
            SUM(IF(cpc_uplift_channel IS NULL, 0, cpc_uplift_channel * sold)),
            NULLIF(SUM(IF(cpc_uplift_channel IS NULL, 0, sold)), 0)
          ) AS cpc_uplift_channel,
          SUM(COALESCE(additional_clicks, 0)) AS additional_clicks,
          CASE
            WHEN testing_point = 0 THEN 'baseline'
            WHEN COUNTIF(stat_sig = 'high') > 0 THEN 'high'
            WHEN COUNTIF(stat_sig = 'mid') > 0 THEN 'mid'
            ELSE 'low'
          END AS stat_sig,
          CASE
            WHEN testing_point = 0 THEN 'baseline'
            WHEN COUNTIF(stat_sig_channel_group = 'high') > 0 THEN 'high'
            WHEN COUNTIF(stat_sig_channel_group = 'mid') > 0 THEN 'mid'
            ELSE 'low'
          END AS stat_sig_channel_group
        FROM per_group
        GROUP BY channel_group_name, state, testing_point
      ),
      with_budget AS (
        SELECT
          *,
          SUM(bids) OVER (PARTITION BY channel_group_name, state) AS total_bids_channel_state,
          SUM(sold) OVER (PARTITION BY channel_group_name, state) AS current_sold_channel_state,
          SUM(quotes) OVER (PARTITION BY channel_group_name, state) AS channel_quote,
          SUM(total_spend) OVER (PARTITION BY channel_group_name, state) AS current_spend_channel_state
        FROM final_agg
      ),
      with_expected AS (
        SELECT
          *,
          MAX(IF(testing_point = 0, win_rate, NULL)) OVER (PARTITION BY channel_group_name, state)
            AS baseline_win_rate_channel_state,
          MAX(IF(testing_point = 0, cpc, NULL)) OVER (PARTITION BY channel_group_name, state)
            AS baseline_cpc_channel_state,
          (win_rate * total_bids_channel_state) AS expected_clicks,
          (win_rate * total_bids_channel_state * cpc) AS expected_total_cost
        FROM with_budget
      ),
      state_channel_binds AS (
        SELECT
          channel_group_name,
          state,
          SUM(COALESCE(total_binds, 0)) AS binds_state_channel
        FROM base_filtered
        GROUP BY channel_group_name, state
      ),
      channel_binds AS (
        SELECT
          channel_group_name,
          SUM(COALESCE(total_binds, 0)) AS channel_binds
        FROM base_all
        GROUP BY channel_group_name
      ),
      q2b_source AS (
        SELECT
          state,
          segment,
          SAFE_DIVIDE(SUM(COALESCE(total_binds, 0)), NULLIF(SUM(COALESCE(total_quote, 0)), 0)) AS q2b
        FROM ${table("v_state_segment_performance_daily")}
        WHERE (@q2bStartDate = "" OR event_date >= DATE(@q2bStartDate))
          AND (@q2bEndDate = "" OR event_date <= DATE(@q2bEndDate))
        GROUP BY state, segment
      ),
      q2b_channel AS (
        SELECT
          segment,
          SAFE_DIVIDE(SUM(COALESCE(total_binds, 0)), NULLIF(SUM(COALESCE(total_quote, 0)), 0)) AS channel_q2b
        FROM ${table("v_state_segment_performance_daily")}
        WHERE (@q2bStartDate = "" OR event_date >= DATE(@q2bStartDate))
          AND (@q2bEndDate = "" OR event_date <= DATE(@q2bEndDate))
        GROUP BY segment
      ),
      final_rows AS (
        SELECT
          with_expected.channel_group_name,
          with_expected.state,
          testing_point,
          opps,
          bids,
          win_rate,
          sold,
          state_channel_binds.binds_state_channel AS binds,
          quotes,
          click_to_quote,
          channel_quote,
          SAFE_DIVIDE(channel_quote, NULLIF(total_bids_channel_state, 0)) AS click_to_channel_quote,
          q2b_source.q2b,
          channel_binds.channel_binds,
          q2b_channel.channel_q2b,
          cpc,
          avg_bid,
          win_rate_uplift_state,
          cpc_uplift_state,
          win_rate_uplift_channel,
          cpc_uplift_channel,
          CASE
            WHEN testing_point = 0 THEN NULL
            WHEN stat_sig = 'low' THEN win_rate_uplift_channel
            ELSE win_rate_uplift_state
          END AS win_rate_uplift,
          CASE
            WHEN testing_point = 0 THEN NULL
            WHEN stat_sig = 'low' THEN cpc_uplift_channel
            ELSE cpc_uplift_state
          END AS cpc_uplift,
          CASE
            WHEN testing_point = 0 THEN 0
            ELSE
              (
                (win_rate * total_bids_channel_state)
                - (COALESCE(baseline_win_rate_channel_state, 0) * total_bids_channel_state)
              )
          END AS additional_clicks,
          (
            CASE
              WHEN testing_point = 0 THEN 0
              ELSE
                (
                  (win_rate * total_bids_channel_state)
                  - (COALESCE(baseline_win_rate_channel_state, 0) * total_bids_channel_state)
                )
            END
          )
          * SAFE_DIVIDE(channel_quote, NULLIF(total_bids_channel_state, 0))
          * (
            CASE
              WHEN testing_point = 0 THEN 0
              WHEN COALESCE(state_channel_binds.binds_state_channel, 0) >= 5 AND q2b_source.q2b IS NOT NULL
                THEN q2b_source.q2b
              ELSE COALESCE(q2b_channel.channel_q2b, 0)
            END
          ) AS expected_bind_change,
          (expected_total_cost - current_spend_channel_state) AS additional_budget_needed,
          SAFE_DIVIDE(
            current_spend_channel_state,
            NULLIF(state_channel_binds.binds_state_channel, 0)
          ) AS current_cpb,
          SAFE_DIVIDE(
            expected_total_cost,
            NULLIF(
              state_channel_binds.binds_state_channel
              + (
                (
                  CASE
                    WHEN testing_point = 0 THEN 0
                    ELSE
                      (
                        (win_rate * total_bids_channel_state)
                        - (COALESCE(baseline_win_rate_channel_state, 0) * total_bids_channel_state)
                      )
                  END
                )
                * SAFE_DIVIDE(channel_quote, NULLIF(total_bids_channel_state, 0))
                * (
                  CASE
                    WHEN testing_point = 0 THEN 0
                    WHEN COALESCE(state_channel_binds.binds_state_channel, 0) >= 5 AND q2b_source.q2b IS NOT NULL
                      THEN q2b_source.q2b
                    ELSE COALESCE(q2b_channel.channel_q2b, 0)
                  END
                )
              ),
              0
            )
          ) AS expected_cpb,
          SAFE_DIVIDE(
            SAFE_DIVIDE(
              expected_total_cost,
              NULLIF(
                state_channel_binds.binds_state_channel
                + (
                  (
                    CASE
                      WHEN testing_point = 0 THEN 0
                      ELSE
                        (
                          (win_rate * total_bids_channel_state)
                          - (COALESCE(baseline_win_rate_channel_state, 0) * total_bids_channel_state)
                        )
                    END
                  )
                  * SAFE_DIVIDE(channel_quote, NULLIF(total_bids_channel_state, 0))
                  * (
                    CASE
                      WHEN testing_point = 0 THEN 0
                      WHEN COALESCE(state_channel_binds.binds_state_channel, 0) >= 5 AND q2b_source.q2b IS NOT NULL
                        THEN q2b_source.q2b
                      ELSE COALESCE(q2b_channel.channel_q2b, 0)
                    END
                  )
                ),
                0
              )
            )
            - SAFE_DIVIDE(
                current_spend_channel_state,
                NULLIF(state_channel_binds.binds_state_channel, 0)
              ),
            NULLIF(
              SAFE_DIVIDE(
                current_spend_channel_state,
                NULLIF(state_channel_binds.binds_state_channel, 0)
              ),
              0
            )
          ) AS cpb_uplift,
          stat_sig,
          stat_sig_channel_group,
          CASE
            WHEN testing_point = 0 THEN 'baseline'
            WHEN stat_sig = 'low' THEN 'channel only'
            ELSE 'channel & state'
          END AS stat_sig_source
        FROM with_expected
        LEFT JOIN q2b_source
          ON q2b_source.state = with_expected.state
         AND q2b_source.segment = REGEXP_EXTRACT(UPPER(with_expected.channel_group_name), r'(MCH|MCR|SCH|SCR)')
        LEFT JOIN state_channel_binds
          ON state_channel_binds.channel_group_name = with_expected.channel_group_name
         AND state_channel_binds.state = with_expected.state
        LEFT JOIN channel_binds
          ON channel_binds.channel_group_name = with_expected.channel_group_name
        LEFT JOIN q2b_channel
          ON q2b_channel.segment = REGEXP_EXTRACT(UPPER(with_expected.channel_group_name), r'(MCH|MCR|SCH|SCR)')
      ),
      ranked_rows AS (
        SELECT
          *,
          FIRST_VALUE(testing_point) OVER (
            PARTITION BY channel_group_name, state
            ORDER BY
              CASE
                WHEN testing_point != 0
                  AND cpb_uplift IS NOT NULL
                  AND cpb_uplift <= 0.10
                  AND additional_clicks > 0
                  THEN 0
                WHEN testing_point = 0 THEN 1
                ELSE 2
              END,
              CASE
                WHEN testing_point != 0
                  AND cpb_uplift IS NOT NULL
                  AND cpb_uplift <= 0.10
                  AND additional_clicks > 0
                  THEN additional_clicks
                ELSE -1e18
              END DESC,
              testing_point
          ) AS recommended_testing_point
        FROM final_rows
      )
      SELECT *
      FROM ranked_rows
      ORDER BY channel_group_name, state, testing_point
      LIMIT @limit
    `,
    normalized
  );
}

export async function listPlanMergedFilters(
  filters: Pick<PlanMergedFilters, "startDate" | "endDate" | "activityLeadType">
): Promise<{
  states: string[];
  segments: string[];
  channelGroups: string[];
  testingPoints: number[];
  statSig: string[];
}> {
  const normalized = normalizePlanMergedFilters(filters);

  const rows = await query<PlanMergedFilterOptionsRow>(
    `
      WITH scoped AS (
        SELECT state, segment, channel_group_name, price_adjustment_percent, stat_sig
        FROM \`crblx-beacon-prod.planning_app.fn_plan_merged_agg\`(
          IF(@startDate = "", DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), DATE(@startDate)),
          IF(@endDate = "", CURRENT_DATE(), DATE(@endDate))
        )
        WHERE (
            @activityType = ""
            OR REGEXP_CONTAINS(LOWER(channel_group_name), @activityPattern)
          )
          AND (@leadType = "" OR REGEXP_CONTAINS(LOWER(channel_group_name), @leadPattern))
      )
      SELECT
        ARRAY(
          SELECT DISTINCT state
          FROM scoped
          WHERE state IS NOT NULL
          ORDER BY state
        ) AS states,
        ARRAY(
          SELECT DISTINCT segment
          FROM scoped
          WHERE segment IS NOT NULL
          ORDER BY segment
        ) AS segments,
        ARRAY(
          SELECT DISTINCT channel_group_name
          FROM scoped
          WHERE channel_group_name IS NOT NULL
          ORDER BY channel_group_name
        ) AS channel_groups,
        ARRAY(
          SELECT DISTINCT price_adjustment_percent
          FROM scoped
          ORDER BY price_adjustment_percent
        ) AS testing_points,
        ARRAY(
          SELECT DISTINCT stat_sig
          FROM scoped
          WHERE stat_sig IS NOT NULL
          ORDER BY stat_sig
        ) AS stat_sig
    `,
    normalized
  );

  const first = rows[0];
  return {
    states: withAllStateCodes(first?.states),
    segments: first?.segments ?? [],
    channelGroups: first?.channel_groups ?? [],
    testingPoints: first?.testing_points ?? [],
    statSig: first?.stat_sig ?? []
  };
}

export async function getPlanMergedAnalytics(
  filters: PlanMergedFilters
): Promise<PlanMergedRow[]> {
  const normalized = normalizePlanMergedFilters(filters);

  return query<PlanMergedRow>(
    `
      SELECT
        start_date,
        end_date,
        channel_group_name,
        state,
        segment,
        price_adjustment_percent,
        stat_sig,
        stat_sig_channel_group,
        cpc_uplift,
        win_rate_uplift,
        additional_clicks,
        expected_total_clicks,
        expected_cpc,
        expected_total_cost,
        expected_total_binds,
        additional_expected_binds,
        expected_cpb,
        ss_performance,
        expected_performance,
        performance_uplift
      FROM \`crblx-beacon-prod.planning_app.fn_plan_merged_agg\`(
        IF(@startDate = "", DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), DATE(@startDate)),
        IF(@endDate = "", CURRENT_DATE(), DATE(@endDate))
      )
      WHERE ("__ALL__" IN UNNEST(@states) OR state IN UNNEST(@states))
        AND ("__ALL__" IN UNNEST(@segments) OR segment IN UNNEST(@segments))
        AND ("__ALL__" IN UNNEST(@channelGroups) OR channel_group_name IN UNNEST(@channelGroups))
        AND (999999999 IN UNNEST(@testingPoints) OR price_adjustment_percent IN UNNEST(@testingPoints))
        AND ("__ALL__" IN UNNEST(@statSig) OR stat_sig IN UNNEST(@statSig))
        AND (
          @activityType = ""
          OR REGEXP_CONTAINS(LOWER(channel_group_name), @activityPattern)
        )
        AND (@leadType = "" OR REGEXP_CONTAINS(LOWER(channel_group_name), @leadPattern))
      ORDER BY channel_group_name, state, price_adjustment_percent
    `,
    normalized
  );
}

export async function getStrategyAnalysis(
  filters: StrategyAnalysisFilters
): Promise<StrategyAnalysisRow[]> {
  const combined = splitCombinedFilter(filters.activityLeadType);
  const normalizedPlanMerged = normalizePlanMergedFilters({
    startDate: filters.startDate,
    endDate: filters.endDate,
    activityLeadType: filters.activityLeadType
  });

  const paramRows = await query<{ param_value: string }>(
    `
      SELECT param_value
      FROM ${table("plan_parameters")}
      WHERE plan_id = @planId
        AND param_key = 'plan_strategy_config'
      LIMIT 1
    `,
    { planId: filters.planId }
  );

  const rules = parseStrategyRules(paramRows[0]?.param_value || "");
  if (!rules.length) {
    return [];
  }

  const baselineRows = await query<StrategyBaselineRow>(
    `
      WITH base AS (
        SELECT
          state,
          segment,
          SUM(COALESCE(opps, 0)) AS bids,
          SUM(COALESCE(sold, 0)) AS sold,
          SUM(COALESCE(total_quote, 0)) AS quotes,
          SUM(COALESCE(total_binds, 0)) AS binds,
          SAFE_DIVIDE(SUM(COALESCE(total_binds, 0)), NULLIF(SUM(COALESCE(total_quote, 0)), 0)) AS q2b,
          AVG(performance) AS performance,
          AVG(roe) AS roe,
          AVG(combined_ratio) AS combined_ratio
        FROM ${table("v_state_segment_performance_daily")}
        WHERE (@startDate = "" OR event_date >= DATE(@startDate))
          AND (@endDate = "" OR event_date <= DATE(@endDate))
          AND (@stateSegmentActivityType = "" OR LOWER(activitytype) = LOWER(@stateSegmentActivityType))
          AND (@stateSegmentLeadType = "" OR LOWER(leadtype) = LOWER(@stateSegmentLeadType))
          AND segment IN ('MCH', 'MCR', 'SCH', 'SCR')
        GROUP BY state, segment
      )
      SELECT * FROM base
    `,
    {
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
      stateSegmentActivityType: combined.stateSegmentActivityType,
      stateSegmentLeadType: combined.stateSegmentLeadType
    }
  );

  const mergedRows = await query<StrategyPlanMergedRow>(
    `
      SELECT
        channel_group_name,
        state,
        segment,
        price_adjustment_percent,
        pe_bids,
        pe_sold,
        pe_number_of_quotes,
        pe_win_rate,
        pe_total_spend,
        ss_cpb,
        expected_cpb,
        additional_clicks,
        additional_expected_binds,
        expected_total_cost
      FROM \`crblx-beacon-prod.planning_app.fn_plan_merged_agg\`(
        IF(@startDate = "", DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), DATE(@startDate)),
        IF(@endDate = "", CURRENT_DATE(), DATE(@endDate))
      )
      WHERE (
          @activityType = ""
          OR REGEXP_CONTAINS(LOWER(channel_group_name), @activityPattern)
        )
        AND (@leadType = "" OR REGEXP_CONTAINS(LOWER(channel_group_name), @leadPattern))
    `,
    normalizedPlanMerged
  );

  const baselineByKey = new Map<string, StrategyBaselineRow>();
  for (const row of baselineRows) {
    const key = `${String(row.state || "").toUpperCase()}|${String(row.segment || "").toUpperCase()}`;
    baselineByKey.set(key, row);
  }

  const mergedByChannelStateSegment = new Map<string, StrategyPlanMergedRow[]>();
  for (const row of mergedRows) {
    const key = `${String(row.channel_group_name || "")}|${String(row.state || "").toUpperCase()}|${String(row.segment || "").toUpperCase()}`;
    const current = mergedByChannelStateSegment.get(key) || [];
    current.push(row);
    mergedByChannelStateSegment.set(key, current);
  }

  const recommendedRows: StrategyPlanMergedRow[] = [];
  for (const groupRows of mergedByChannelStateSegment.values()) {
    const ranked = [...groupRows].sort((a, b) => {
      const aTp = Number(a.price_adjustment_percent) || 0;
      const bTp = Number(b.price_adjustment_percent) || 0;
      const aCpbUplift =
        Number.isFinite(Number(a.expected_cpb)) && Number.isFinite(Number(a.ss_cpb)) && Number(a.ss_cpb) !== 0
          ? (Number(a.expected_cpb) - Number(a.ss_cpb)) / Number(a.ss_cpb)
          : null;
      const bCpbUplift =
        Number.isFinite(Number(b.expected_cpb)) && Number.isFinite(Number(b.ss_cpb)) && Number(b.ss_cpb) !== 0
          ? (Number(b.expected_cpb) - Number(b.ss_cpb)) / Number(b.ss_cpb)
          : null;
      const aAdditionalClicks = Number(a.additional_clicks) || 0;
      const bAdditionalClicks = Number(b.additional_clicks) || 0;
      const aPriority =
        aTp !== 0 && aCpbUplift !== null && aCpbUplift <= 0.10 && aAdditionalClicks > 0 ? 0 : aTp === 0 ? 1 : 2;
      const bPriority =
        bTp !== 0 && bCpbUplift !== null && bCpbUplift <= 0.10 && bAdditionalClicks > 0 ? 0 : bTp === 0 ? 1 : 2;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      if (aPriority === 0 && aAdditionalClicks !== bAdditionalClicks) {
        return bAdditionalClicks - aAdditionalClicks;
      }
      return aTp - bTp;
    });
    if (ranked[0]) {
      recommendedRows.push(ranked[0]);
    }
  }

  return rules.map((rule) => {
    const stateSet = new Set(rule.states);
    const segmentSet = new Set(rule.segments);

    const matchingBaseline = baselineRows.filter(
      (row) => stateSet.has(String(row.state || "").toUpperCase()) && segmentSet.has(String(row.segment || "").toUpperCase())
    );
    const matchingRecommended = recommendedRows.filter(
      (row) => stateSet.has(String(row.state || "").toUpperCase()) && segmentSet.has(String(row.segment || "").toUpperCase())
    );

    const bids = matchingBaseline.reduce((sum, row) => sum + (Number(row.bids) || 0), 0);
    const sold = matchingBaseline.reduce((sum, row) => sum + (Number(row.sold) || 0), 0);
    const quotes = matchingBaseline.reduce((sum, row) => sum + (Number(row.quotes) || 0), 0);
    const binds = matchingBaseline.reduce((sum, row) => sum + (Number(row.binds) || 0), 0);
    const wr = bids > 0 ? sold / bids : null;
    const q2b = quotes > 0 ? binds / quotes : null;

    const performanceWeighted = matchingBaseline.reduce(
      (acc, row) => {
        const weight = Number(row.binds) || 0;
        const value = Number(row.performance);
        if (weight > 0 && Number.isFinite(value)) {
          acc.total += value * weight;
          acc.weight += weight;
        }
        return acc;
      },
      { total: 0, weight: 0 }
    );
    const roeWeighted = matchingBaseline.reduce(
      (acc, row) => {
        const weight = Number(row.sold) || 0;
        const value = Number(row.roe);
        if (weight > 0 && Number.isFinite(value)) {
          acc.total += value * weight;
          acc.weight += weight;
        }
        return acc;
      },
      { total: 0, weight: 0 }
    );
    const corWeighted = matchingBaseline.reduce(
      (acc, row) => {
        const weight = Number(row.sold) || 0;
        const value = Number(row.combined_ratio);
        if (weight > 0 && Number.isFinite(value)) {
          acc.total += value * weight;
          acc.weight += weight;
        }
        return acc;
      },
      { total: 0, weight: 0 }
    );

    const additionalClicks = matchingRecommended.reduce((sum, row) => sum + (Number(row.additional_clicks) || 0), 0);
    const additionalBinds = matchingRecommended.reduce(
      (sum, row) => sum + (Number(row.additional_expected_binds) || 0),
      0
    );
    const additionalBudget = matchingRecommended.reduce((sum, row) => {
      const expectedCost = Number(row.expected_total_cost) || 0;
      const currentSpend = Number(row.pe_total_spend) || 0;
      return sum + (expectedCost - currentSpend);
    }, 0);

    const cpbWeighted = matchingRecommended.reduce(
      (acc, row) => {
        const expected = Number(row.expected_cpb);
        const current = Number(row.ss_cpb);
        const weight = Number(row.pe_sold) || 0;
        if (weight > 0 && Number.isFinite(expected) && Number.isFinite(current) && current !== 0) {
          acc.total += ((expected - current) / current) * weight;
          acc.weight += weight;
        }
        return acc;
      },
      { total: 0, weight: 0 }
    );

    return {
      rule_name: rule.name,
      states: rule.states,
      segments: rule.segments,
      bids,
      sold,
      wr,
      quotes,
      binds,
      q2b,
      performance: performanceWeighted.weight > 0 ? performanceWeighted.total / performanceWeighted.weight : null,
      roe: roeWeighted.weight > 0 ? roeWeighted.total / roeWeighted.weight : null,
      cor: corWeighted.weight > 0 ? corWeighted.total / corWeighted.weight : null,
      additional_clicks: additionalClicks,
      additional_binds: additionalBinds,
      cpb_uplift: cpbWeighted.weight > 0 ? cpbWeighted.total / cpbWeighted.weight : null,
      additional_budget: additionalBudget
    };
  });
}
