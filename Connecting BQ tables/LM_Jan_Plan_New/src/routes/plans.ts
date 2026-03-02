import { Router } from "express";
import { z } from "zod";
import { requireRole, requireUser } from "../middleware/auth.js";
import {
  getPlanMergedAnalytics,
  getPriceExploration,
  getStrategyAnalysis,
  getStateSegmentPerformance,
  listPlanMergedFilters,
  listPriceExplorationFilters,
  listStateSegmentFilters
} from "../services/analyticsService.js";
import {
  appendDecisions,
  createPlan,
  createRun,
  getPlan,
  listPlanParameters,
  getRun,
  getRunResults,
  listPlans,
  upsertParameters
} from "../services/plansService.js";
import { createTarget, getTargetsMetrics, listTargets, updateTarget } from "../services/targetsService.js";
import { appendChangeLog, listChangeLogs } from "../services/changeLogService.js";
import {
  addManagedUser,
  getUserLoginState,
  listManagedUsers,
  loginAdminWithCode,
  loginUser,
  logoutSession,
  resetManagedUserPassword,
  setupUserPassword
} from "../services/authService.js";

const createPlanSchema = z.object({
  planName: z.string().min(1),
  description: z.string().optional()
});

const parametersSchema = z.object({
  parameters: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
      valueType: z.enum(["int", "float", "bool", "string", "json"])
    })
  )
});

const decisionsSchema = z.object({
  decisions: z.array(
    z.object({
      decisionType: z.string().min(1),
      decisionValue: z.string().min(1),
      state: z.string().optional(),
      channel: z.string().optional(),
      reason: z.string().optional()
    })
  )
});

const updateTargetSchema = z
  .object({
    state: z.string().optional(),
    segment: z.string().optional(),
    source: z.string().optional(),
    targetValue: z.number().finite().optional()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one field must be provided"
  });

const targetsMetricsSchema = z.object({
  rows: z.array(
    z.object({
      state: z.string(),
      segment: z.string(),
      source: z.string(),
      accountId: z.string().optional()
    })
  )
});

const changeLogCreateSchema = z.object({
  objectType: z.string().min(1),
  objectId: z.string().optional(),
  action: z.string().min(1),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  metadata: z.unknown().optional()
});

const adminLoginSchema = z.object({
  code: z.string().min(1)
});

const userStatusSchema = z.object({
  email: z.string().email()
});

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const userSetupPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const addUserSchema = z.object({
  email: z.string().email()
});

export const plansRouter = Router();

plansRouter.post("/auth/admin-login", async (req, res, next) => {
  try {
    const parsed = adminLoginSchema.parse(req.body);
    const session = await loginAdminWithCode(parsed.code);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/auth/user-status", async (req, res, next) => {
  try {
    const parsed = userStatusSchema.parse(req.body);
    const state = await getUserLoginState(parsed.email);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/auth/user-setup-password", async (req, res, next) => {
  try {
    const parsed = userSetupPasswordSchema.parse(req.body);
    const session = await setupUserPassword(parsed.email, parsed.password);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/auth/user-login", async (req, res, next) => {
  try {
    const parsed = userLoginSchema.parse(req.body);
    const session = await loginUser(parsed.email, parsed.password);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/auth/logout", async (req, res, next) => {
  try {
    const sessionToken = req.header("x-session-token")?.trim();
    if (sessionToken) {
      await logoutSession(sessionToken);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

plansRouter.use(requireUser);

plansRouter.get("/me", (req, res) => {
  res.json({ user: req.user });
});

plansRouter.get("/plans", async (_req, res, next) => {
  try {
    const plans = await listPlans();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/plans", requireRole(["admin", "planner"]), async (req, res, next) => {
  try {
    const parsed = createPlanSchema.parse(req.body);
    const result = await createPlan({
      planName: parsed.planName,
      description: parsed.description,
      createdBy: req.user!.userId
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/plans/:planId", async (req, res, next) => {
  try {
    const plan = await getPlan(req.params.planId);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/plans/:planId/parameters", async (req, res, next) => {
  try {
    const parameters = await listPlanParameters(req.params.planId);
    res.json({ parameters });
  } catch (error) {
    next(error);
  }
});

plansRouter.put("/plans/:planId/parameters", requireRole(["admin", "planner"]), async (req, res, next) => {
  try {
    const parsed = parametersSchema.parse(req.body);
    await upsertParameters(req.params.planId, req.user!.userId, parsed.parameters);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/plans/:planId/decisions", requireRole(["admin", "planner"]), async (req, res, next) => {
  try {
    const parsed = decisionsSchema.parse(req.body);
    const result = await appendDecisions(req.params.planId, req.user!.userId, parsed.decisions);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/plans/:planId/runs", requireRole(["admin", "planner"]), async (req, res, next) => {
  try {
    const result = await createRun(req.params.planId, req.user!.userId);

    // In production, enqueue a Cloud Run job / PubSub worker here.
    res.status(202).json({ ...result, status: "queued" });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/plans/:planId/runs/:runId", async (req, res, next) => {
  try {
    const run = await getRun(req.params.planId, req.params.runId);
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    res.json({ run });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/plans/:planId/runs/:runId/results", async (req, res, next) => {
  try {
    const results = await getRunResults(req.params.planId, req.params.runId);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

function parseQueryArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  const parts = Array.isArray(value) ? value : [value];
  return parts
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

plansRouter.get("/analytics/state-segment-performance/filters", async (req, res, next) => {
  try {
    const filters = await listStateSegmentFilters({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined
    });
    res.json(filters);
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/analytics/state-segment-performance", async (req, res, next) => {
  try {
    const qbc =
      typeof req.query.qbc === "string" && req.query.qbc.trim() !== ""
        ? Number(req.query.qbc)
        : undefined;

    const rows = await getStateSegmentPerformance({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      states: parseQueryArray(req.query.states),
      segments: parseQueryArray(req.query.segments),
      channelGroups: parseQueryArray(req.query.channelGroups),
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined,
      qbc: Number.isFinite(qbc) ? qbc : undefined
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/analytics/price-exploration/filters", async (req, res, next) => {
  try {
    const filters = await listPriceExplorationFilters({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined
    });
    res.json(filters);
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/analytics/price-exploration", async (req, res, next) => {
  try {
    const limit =
      typeof req.query.limit === "string" && req.query.limit.trim() !== ""
        ? Number(req.query.limit)
        : undefined;

    const rows = await getPriceExploration({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      q2bStartDate: typeof req.query.q2bStartDate === "string" ? req.query.q2bStartDate : undefined,
      q2bEndDate: typeof req.query.q2bEndDate === "string" ? req.query.q2bEndDate : undefined,
      states: parseQueryArray(req.query.states),
      channelGroups: parseQueryArray(req.query.channelGroups),
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined,
      limit: Number.isFinite(limit) ? limit : undefined
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/analytics/plan-merged/filters", async (req, res, next) => {
  try {
    const filters = await listPlanMergedFilters({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined
    });
    res.json(filters);
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/analytics/plan-merged", async (req, res, next) => {
  try {
    const rows = await getPlanMergedAnalytics({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      states: parseQueryArray(req.query.states),
      segments: parseQueryArray(req.query.segments),
      channelGroups: parseQueryArray(req.query.channelGroups),
      testingPoints: parseQueryArray(req.query.testingPoints),
      statSig: parseQueryArray(req.query.statSig),
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/analytics/strategy-analysis", async (req, res, next) => {
  try {
    const planId = typeof req.query.planId === "string" ? req.query.planId.trim() : "";
    if (!planId) {
      res.status(400).json({ error: "planId is required" });
      return;
    }

    const rows = await getStrategyAnalysis({
      planId,
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/targets", async (req, res, next) => {
  try {
    const qbc =
      typeof req.query.qbc === "string" && req.query.qbc.trim() !== ""
        ? Number(req.query.qbc)
        : undefined;

    const rows = await listTargets({
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined,
      qbc: Number.isFinite(qbc) ? qbc : undefined
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/targets", requireRole(["admin", "planner"]), async (req, res, next) => {
  try {
    const result = await createTarget(req.user!.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

plansRouter.put("/targets/:targetId", requireRole(["admin", "planner"]), async (req, res, next) => {
  try {
    const parsed = updateTargetSchema.parse(req.body);
    await updateTarget(req.params.targetId, parsed, req.user!.userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/targets/metrics", async (req, res, next) => {
  try {
    const parsed = targetsMetricsSchema.parse(req.body);
    const qbc =
      typeof req.query.qbc === "string" && req.query.qbc.trim() !== ""
        ? Number(req.query.qbc)
        : undefined;

    const rows = await getTargetsMetrics(parsed.rows, {
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      activityLeadType: typeof req.query.activityLeadType === "string" ? req.query.activityLeadType : undefined,
      qbc: Number.isFinite(qbc) ? qbc : undefined
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/change-log", async (req, res, next) => {
  try {
    const limit =
      typeof req.query.limit === "string" && req.query.limit.trim() !== ""
        ? Number(req.query.limit)
        : 200;
    const rows = await listChangeLogs(Number.isFinite(limit) ? limit : 200);
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/change-log", async (req, res, next) => {
  try {
    const parsed = changeLogCreateSchema.parse(req.body);
    const result = await appendChangeLog(
      {
        userId: req.user!.userId,
        email: req.user!.email
      },
      {
        objectType: parsed.objectType,
        objectId: parsed.objectId,
        action: parsed.action,
        before: parsed.before,
        after: parsed.after,
        metadata: parsed.metadata
      }
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

plansRouter.get("/users", requireRole(["admin"]), async (_req, res, next) => {
  try {
    const rows = await listManagedUsers();
    res.json({ users: rows });
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/users", requireRole(["admin"]), async (req, res, next) => {
  try {
    const parsed = addUserSchema.parse(req.body);
    const created = await addManagedUser(parsed.email);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

plansRouter.post("/users/:userId/reset-password", requireRole(["admin"]), async (req, res, next) => {
  try {
    await resetManagedUserPassword(req.params.userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
