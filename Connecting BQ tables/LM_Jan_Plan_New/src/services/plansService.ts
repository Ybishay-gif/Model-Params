import { randomUUID } from "node:crypto";
import { query, table } from "../db/bigquery.js";

type PlanStatus = "draft" | "ready" | "archived";

type CreatePlanInput = {
  planName: string;
  description?: string;
  createdBy: string;
};

type PlanRow = {
  plan_id: string;
  plan_name: string;
  description: string | null;
  status: PlanStatus;
  created_by: string;
  created_at: { value: string } | string;
  updated_at: { value: string } | string | null;
};

type PlanParameterRow = {
  param_key: string;
  param_value: string;
  value_type: "int" | "float" | "bool" | "string" | "json";
  updated_by: string | null;
  updated_at: { value: string } | string | null;
};

export async function listPlans(): Promise<PlanRow[]> {
  return query<PlanRow>(
    `
      SELECT plan_id, plan_name, description, status, created_by, created_at, updated_at
      FROM ${table("plans")}
      ORDER BY created_at DESC
    `
  );
}

export async function createPlan(input: CreatePlanInput): Promise<{ planId: string }> {
  const planId = randomUUID();

  await query(
    `
      INSERT INTO ${table("plans")}
      (plan_id, plan_name, description, status, created_by, created_at)
      VALUES (@planId, @planName, @description, 'draft', @createdBy, CURRENT_TIMESTAMP())
    `,
    {
      planId,
      planName: input.planName,
      description: input.description ?? null,
      createdBy: input.createdBy
    }
  );

  return { planId };
}

export async function getPlan(planId: string): Promise<PlanRow | null> {
  const rows = await query<PlanRow>(
    `
      SELECT plan_id, plan_name, description, status, created_by, created_at, updated_at
      FROM ${table("plans")}
      WHERE plan_id = @planId
      LIMIT 1
    `,
    { planId }
  );

  return rows[0] ?? null;
}

export async function listPlanParameters(planId: string): Promise<PlanParameterRow[]> {
  return query<PlanParameterRow>(
    `
      SELECT param_key, param_value, value_type, updated_by, updated_at
      FROM ${table("plan_parameters")}
      WHERE plan_id = @planId
      ORDER BY param_key
    `,
    { planId }
  );
}

export async function upsertParameters(
  planId: string,
  userId: string,
  parameters: Array<{ key: string; value: string; valueType: "int" | "float" | "bool" | "string" | "json" }>
): Promise<void> {
  if (parameters.length === 0) {
    return;
  }

  for (const parameter of parameters) {
    await query(
      `
        MERGE ${table("plan_parameters")} T
        USING (
          SELECT @planId AS plan_id, @paramKey AS param_key
        ) S
        ON T.plan_id = S.plan_id AND T.param_key = S.param_key
        WHEN MATCHED THEN
          UPDATE SET
            param_value = @paramValue,
            value_type = @valueType,
            updated_by = @updatedBy,
            updated_at = CURRENT_TIMESTAMP()
        WHEN NOT MATCHED THEN
          INSERT (plan_id, param_key, param_value, value_type, updated_by, updated_at)
          VALUES (@planId, @paramKey, @paramValue, @valueType, @updatedBy, CURRENT_TIMESTAMP())
      `,
      {
        planId,
        paramKey: parameter.key,
        paramValue: parameter.value,
        valueType: parameter.valueType,
        updatedBy: userId
      }
    );
  }
}

export async function appendDecisions(
  planId: string,
  userId: string,
  decisions: Array<{
    decisionType: string;
    decisionValue: string;
    state?: string;
    channel?: string;
    reason?: string;
  }>
): Promise<{ decisionIds: string[] }> {
  const decisionIds: string[] = [];

  for (const decision of decisions) {
    const decisionId = randomUUID();
    decisionIds.push(decisionId);

    await query(
      `
        INSERT INTO ${table("plan_decisions")}
        (decision_id, plan_id, decision_type, state, channel, decision_value, reason, created_by, created_at)
        VALUES (
          @decisionId,
          @planId,
          @decisionType,
          NULLIF(@state, ''),
          NULLIF(@channel, ''),
          @decisionValue,
          NULLIF(@reason, ''),
          @createdBy,
          CURRENT_TIMESTAMP()
        )
      `,
      {
        decisionId,
        planId,
        decisionType: decision.decisionType,
        state: decision.state ?? "",
        channel: decision.channel ?? "",
        decisionValue: decision.decisionValue,
        reason: decision.reason ?? "",
        createdBy: userId
      }
    );
  }

  return { decisionIds };
}

export async function createRun(planId: string, userId: string): Promise<{ runId: string }> {
  const runId = randomUUID();

  await query(
    `
      INSERT INTO ${table("plan_runs")}
      (run_id, plan_id, triggered_by, status, created_at)
      VALUES (@runId, @planId, @triggeredBy, 'queued', CURRENT_TIMESTAMP())
    `,
    { runId, planId, triggeredBy: userId }
  );

  return { runId };
}

export async function getRun(planId: string, runId: string) {
  const rows = await query(
    `
      SELECT run_id, plan_id, triggered_by, status, started_at, finished_at, error_message, created_at
      FROM ${table("plan_runs")}
      WHERE plan_id = @planId AND run_id = @runId
      LIMIT 1
    `,
    { planId, runId }
  );

  return rows[0] ?? null;
}

export async function getRunResults(planId: string, runId: string) {
  return query(
    `
      SELECT run_id, plan_id, state, channel, metric_name, baseline_value, simulated_value, delta_value, delta_pct, created_at
      FROM ${table("plan_results")}
      WHERE plan_id = @planId AND run_id = @runId
      ORDER BY state, channel, metric_name
    `,
    { planId, runId }
  );
}
