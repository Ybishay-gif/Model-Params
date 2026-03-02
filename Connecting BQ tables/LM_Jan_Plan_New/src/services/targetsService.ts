import { randomUUID } from "node:crypto";
import { query, table } from "../db/bigquery.js";

const RAW_CROSS_TACTIC_TABLE = "`crblx-beacon-prod.Custom_Reports.Cross Tactic Analysis Full Data `";
let targetsTableReady: Promise<void> | null = null;

export type TargetsFilters = {
  startDate?: string;
  endDate?: string;
  activityLeadType?: string;
  qbc?: number;
};

export type TargetRow = {
  target_id: string;
  state: string;
  segment: string;
  source: string;
  target_value: number;
  current_target: number | null;
  sold: number | null;
  binds: number | null;
  scored_policies: number | null;
  cpb: number | null;
  target_cpb: number | null;
  performance: number | null;
  roe: number | null;
  combined_ratio: number | null;
  avg_profit: number | null;
  avg_equity: number | null;
  avg_lifetime_premium: number | null;
  avg_lifetime_cost: number | null;
  created_at: string;
  updated_at: string;
};

export type TargetMetricInputRow = {
  state: string;
  segment: string;
  source: string;
  accountId?: string;
};

export type TargetMetricRow = {
  state: string;
  segment: string;
  source: string;
  account_id: string;
  current_target: number | null;
  sold: number | null;
  binds: number | null;
  scored_policies: number | null;
  cpb: number | null;
  target_cpb: number | null;
  performance: number | null;
  roe: number | null;
  combined_ratio: number | null;
  avg_profit: number | null;
  avg_equity: number | null;
  avg_lifetime_premium: number | null;
  avg_lifetime_cost: number | null;
};

type CombinedFilterParts = {
  stateSegmentActivityType: string;
  stateSegmentLeadType: string;
};

function splitCombinedFilter(value?: string): CombinedFilterParts {
  switch ((value || "").toLowerCase()) {
    case "clicks_auto":
      return { stateSegmentActivityType: "Click", stateSegmentLeadType: "CAR_INSURANCE_LEAD" };
    case "clicks_home":
      return { stateSegmentActivityType: "Click", stateSegmentLeadType: "HOME_INSURANCE_LEAD" };
    case "leads_auto":
      return { stateSegmentActivityType: "Lead", stateSegmentLeadType: "CAR_INSURANCE_LEAD" };
    case "leads_home":
      return { stateSegmentActivityType: "Lead", stateSegmentLeadType: "HOME_INSURANCE_LEAD" };
    case "calls_auto":
      return { stateSegmentActivityType: "Call", stateSegmentLeadType: "CAR_INSURANCE_LEAD" };
    case "calls_home":
      return { stateSegmentActivityType: "Call", stateSegmentLeadType: "HOME_INSURANCE_LEAD" };
    default:
      return { stateSegmentActivityType: "", stateSegmentLeadType: "" };
  }
}

function normalizeFilters(filters: TargetsFilters) {
  const combined = splitCombinedFilter(filters.activityLeadType);
  return {
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    stateSegmentActivityType: combined.stateSegmentActivityType,
    stateSegmentLeadType: combined.stateSegmentLeadType,
    qbc: Number.isFinite(Number(filters.qbc)) ? Number(filters.qbc) : 0
  };
}

function normalizeState(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeSegment(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeSource(value: string): string {
  return value.trim();
}

function normalizeAccountId(value?: string): string {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  return raw.replace(/\.0+$/, "");
}

function getPerfScopedCte() {
  return `
      WITH perf_base AS (
        SELECT
          DATE(COALESCE(createdate_utc, Data_DateCreated, DateCreated)) AS event_date,
          UPPER(Data_State) AS state,
          UPPER(
            COALESCE(
              NULLIF(TRIM(Segments), ''),
              REGEXP_EXTRACT(UPPER(COALESCE(ChannelGroupName, '')), r'(MCH|MCR|SCH|SCR)')
            )
          ) AS segment,
          COALESCE(ChannelGroupName, '') AS channel_group_name,
          COALESCE(CAST(Account_Name AS STRING), '') AS account_name,
          COALESCE(CAST(CompanyAccountId AS STRING), '') AS company_account_id,
          SAFE_CAST(TotalBinds AS FLOAT64) AS total_binds,
          SAFE_CAST(Transaction_sold AS FLOAT64) AS transaction_sold,
          SAFE_CAST(TransactionSold AS FLOAT64) AS transaction_sold_alt,
          SAFE_CAST(Price AS FLOAT64) AS price,
          SAFE_CAST(Target_TargetCPB AS FLOAT64) AS bq_target_cpb,
          SAFE_CAST(ScoredPolicies AS FLOAT64) AS scored_policies,
          SAFE_CAST(LifetimePremium AS FLOAT64) AS lifetime_premium,
          SAFE_CAST(LifeTimeCost AS FLOAT64) AS lifetime_cost,
          SAFE_CAST(CustomValues_Profit AS FLOAT64) AS avg_profit,
          SAFE_CAST(Equity AS FLOAT64) AS avg_equity
        FROM ${RAW_CROSS_TACTIC_TABLE}
        WHERE (@stateSegmentActivityType = "" OR LOWER(activitytype) = LOWER(@stateSegmentActivityType))
          AND (@stateSegmentLeadType = "" OR LOWER(Leadtype) = LOWER(@stateSegmentLeadType))
      ),
      perf AS (
        SELECT
          state,
          segment,
          REGEXP_REPLACE(LOWER(account_name), r'[^a-z0-9]+', '') AS source_key,
          SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)) AS sold,
          SUM(COALESCE(total_binds, 0)) AS binds,
          SUM(COALESCE(scored_policies, 0)) AS scored_policies,
          SAFE_DIVIDE(
            SUM(COALESCE(price, 0)),
            NULLIF(SUM(COALESCE(total_binds, 0)), 0)
          ) AS cpb,
          CASE
            WHEN SUM(COALESCE(total_binds, 0)) = 0 THEN 0
            ELSE SAFE_DIVIDE(
              SUM(COALESCE(bq_target_cpb, 0)),
              SUM(COALESCE(total_binds, 0))
            )
          END AS target_cpb,
          SAFE_DIVIDE(
            CASE
              WHEN SUM(COALESCE(total_binds, 0)) = 0 THEN 0
              ELSE SAFE_DIVIDE(
                SUM(COALESCE(bq_target_cpb, 0)),
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
            SUM(COALESCE(avg_profit, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_profit,
          SAFE_DIVIDE(
            SUM(COALESCE(avg_equity, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_equity,
          SAFE_DIVIDE(
            SUM(COALESCE(lifetime_premium, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_lifetime_premium,
          SAFE_DIVIDE(
            SUM(COALESCE(lifetime_cost, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_lifetime_cost
        FROM perf_base
        WHERE (@startDate = "" OR event_date >= DATE(@startDate))
          AND (@endDate = "" OR event_date <= DATE(@endDate))
          AND segment IN ('MCH', 'MCR', 'SCH', 'SCR')
        GROUP BY state, segment, source_key
      )
  `;
}

function ensureTargetsTableExists(): Promise<void> {
  if (!targetsTableReady) {
    targetsTableReady = query(
      `
        CREATE TABLE IF NOT EXISTS ${table("targets")} (
          target_id STRING NOT NULL,
          state STRING NOT NULL,
          segment STRING NOT NULL,
          source STRING NOT NULL,
          target_value FLOAT64 NOT NULL,
          created_by STRING NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_by STRING NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `
    ).then(() => undefined);
  }
  return targetsTableReady;
}

export async function listTargets(filters: TargetsFilters): Promise<TargetRow[]> {
  await ensureTargetsTableExists();
  const normalized = normalizeFilters(filters);

  return query<TargetRow>(
    `
      ${getPerfScopedCte()}
      SELECT
        t.target_id,
        t.state,
        t.segment,
        t.source,
        t.target_value,
        p.target_cpb AS current_target,
        p.sold,
        p.binds,
        COALESCE(p.scored_policies, 0) AS scored_policies,
        p.cpb,
        p.target_cpb,
        p.performance,
        p.roe,
        p.combined_ratio,
        p.avg_profit,
        p.avg_equity,
        p.avg_lifetime_premium,
        p.avg_lifetime_cost,
        CAST(t.created_at AS STRING) AS created_at,
        CAST(t.updated_at AS STRING) AS updated_at
      FROM ${table("targets")} t
      LEFT JOIN perf p
        ON p.state = t.state
       AND p.segment = t.segment
       AND p.source_key = REGEXP_REPLACE(LOWER(t.source), r'[^a-z0-9]+', '')
      ORDER BY t.state, t.segment, t.source
    `,
    normalized
  );
}

export async function getTargetsMetrics(
  rows: TargetMetricInputRow[],
  filters: TargetsFilters
): Promise<TargetMetricRow[]> {
  const normalized = normalizeFilters(filters);
  const rowsJson = JSON.stringify(
    rows.map((row) => ({
      state: normalizeState(row.state || ""),
      segment: normalizeSegment(row.segment || ""),
      source: normalizeSource(row.source || ""),
      accountId: normalizeAccountId(row.accountId)
    }))
  );

  return query<TargetMetricRow>(
    `
      ${getPerfScopedCte()},
      perf_account AS (
        SELECT
          state,
          segment,
          company_account_id,
          REGEXP_REPLACE(LOWER(account_name), r'[^a-z0-9]+', '') AS source_key,
          SUM(COALESCE(transaction_sold, transaction_sold_alt, 0)) AS sold,
          SUM(COALESCE(total_binds, 0)) AS binds,
          SUM(COALESCE(scored_policies, 0)) AS scored_policies,
          SAFE_DIVIDE(
            SUM(COALESCE(price, 0)),
            NULLIF(SUM(COALESCE(total_binds, 0)), 0)
          ) AS cpb,
          CASE
            WHEN SUM(COALESCE(total_binds, 0)) = 0 THEN 0
            ELSE SAFE_DIVIDE(
              SUM(COALESCE(bq_target_cpb, 0)),
              SUM(COALESCE(total_binds, 0))
            )
          END AS target_cpb,
          SAFE_DIVIDE(
            CASE
              WHEN SUM(COALESCE(total_binds, 0)) = 0 THEN 0
              ELSE SAFE_DIVIDE(
                SUM(COALESCE(bq_target_cpb, 0)),
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
            SUM(COALESCE(avg_profit, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_profit,
          SAFE_DIVIDE(
            SUM(COALESCE(avg_equity, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_equity,
          SAFE_DIVIDE(
            SUM(COALESCE(lifetime_premium, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_lifetime_premium,
          SAFE_DIVIDE(
            SUM(COALESCE(lifetime_cost, 0)),
            NULLIF(SUM(COALESCE(scored_policies, 0)), 0)
          ) AS avg_lifetime_cost
        FROM perf_base
        WHERE (@startDate = "" OR event_date >= DATE(@startDate))
          AND (@endDate = "" OR event_date <= DATE(@endDate))
          AND segment IN ('MCH', 'MCR', 'SCH', 'SCR')
        GROUP BY state, segment, company_account_id, source_key
      ),
      input_rows AS (
        SELECT
          UPPER(JSON_VALUE(item, '$.state')) AS state,
          UPPER(JSON_VALUE(item, '$.segment')) AS segment,
          JSON_VALUE(item, '$.source') AS source,
          COALESCE(JSON_VALUE(item, '$.accountId'), '') AS account_id,
          REGEXP_REPLACE(LOWER(JSON_VALUE(item, '$.source')), r'[^a-z0-9]+', '') AS source_key
        FROM UNNEST(JSON_EXTRACT_ARRAY(@rowsJson)) AS item
      )
      SELECT
        i.state,
        i.segment,
        i.source,
        i.account_id,
        COALESCE(pa.target_cpb, p.target_cpb) AS current_target,
        COALESCE(pa.sold, p.sold) AS sold,
        COALESCE(pa.binds, p.binds) AS binds,
        COALESCE(pa.scored_policies, p.scored_policies, 0) AS scored_policies,
        COALESCE(pa.cpb, p.cpb) AS cpb,
        COALESCE(pa.target_cpb, p.target_cpb) AS target_cpb,
        COALESCE(pa.performance, p.performance) AS performance,
        COALESCE(pa.roe, p.roe) AS roe,
        COALESCE(pa.combined_ratio, p.combined_ratio) AS combined_ratio,
        COALESCE(pa.avg_profit, p.avg_profit) AS avg_profit,
        COALESCE(pa.avg_equity, p.avg_equity) AS avg_equity,
        COALESCE(pa.avg_lifetime_premium, p.avg_lifetime_premium) AS avg_lifetime_premium,
        COALESCE(pa.avg_lifetime_cost, p.avg_lifetime_cost) AS avg_lifetime_cost
      FROM input_rows i
      LEFT JOIN perf_account pa
        ON pa.state = i.state
       AND pa.segment = i.segment
       AND i.account_id != ""
       AND pa.company_account_id = i.account_id
       AND pa.source_key = i.source_key
      LEFT JOIN perf p
        ON p.state = i.state
       AND p.segment = i.segment
       AND i.account_id = ""
       AND p.source_key = i.source_key
    `,
    { ...normalized, rowsJson }
  );
}

export async function createTarget(userId: string): Promise<{ targetId: string }> {
  await ensureTargetsTableExists();
  const targetId = randomUUID();
  await query(
    `
      INSERT INTO ${table("targets")}
      (target_id, state, segment, source, target_value, created_by, created_at, updated_by, updated_at)
      VALUES (@targetId, 'NA', 'MCH', 'New Source', 0, @userId, CURRENT_TIMESTAMP(), @userId, CURRENT_TIMESTAMP())
    `,
    { targetId, userId }
  );
  return { targetId };
}

type UpdateTargetInput = {
  state?: string;
  segment?: string;
  source?: string;
  targetValue?: number;
};

export async function updateTarget(
  targetId: string,
  input: UpdateTargetInput,
  userId: string
): Promise<void> {
  await ensureTargetsTableExists();
  const updates: string[] = [];
  const params: Record<string, unknown> = { targetId, userId };

  if (typeof input.state === "string") {
    updates.push("state = @state");
    params.state = normalizeState(input.state);
  }
  if (typeof input.segment === "string") {
    updates.push("segment = @segment");
    params.segment = normalizeSegment(input.segment);
  }
  if (typeof input.source === "string") {
    updates.push("source = @source");
    params.source = normalizeSource(input.source);
  }
  if (typeof input.targetValue === "number" && Number.isFinite(input.targetValue)) {
    updates.push("target_value = @targetValue");
    params.targetValue = input.targetValue;
  }

  if (!updates.length) {
    return;
  }

  updates.push("updated_by = @userId");
  updates.push("updated_at = CURRENT_TIMESTAMP()");

  await query(
    `
      UPDATE ${table("targets")}
      SET ${updates.join(",\n          ")}
      WHERE target_id = @targetId
    `,
    params
  );
}
