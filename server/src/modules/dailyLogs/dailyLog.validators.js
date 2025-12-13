const { z } = require("zod");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((val) => val);

const laborRow = z.object({
  trade: z.string().min(1).max(64),
  headcount: z.coerce.number().int().min(0).max(10000).default(0),
});

const equipmentRow = z.object({
  equipmentName: z.string().min(1).max(128),
  hours: z.coerce.number().min(0).max(100000).default(0),
});

const createDailyLogSchema = z.object({
  logDate: isoDate,
  shift: z.enum(["day", "night"]).optional().default("day"),
  weatherConditions: z.string().max(128).optional().nullable(),
  workSummary: z.string().optional().nullable(),
  safetyNotes: z.string().optional().nullable(),
  delaysIssues: z.string().optional().nullable(),
  status: z.enum(["draft", "submitted"]).optional().default("draft"),
  clientUpdatedAt: z.string().datetime().optional().nullable(),
  labor: z.array(laborRow).optional().default([]),
  equipment: z.array(equipmentRow).optional().default([]),
});

const updateDailyLogSchema = z
  .object({
    logDate: isoDate.optional(),
    shift: z.enum(["day", "night"]).optional(),
    weatherConditions: z.string().max(128).optional().nullable(),
    workSummary: z.string().optional().nullable(),
    safetyNotes: z.string().optional().nullable(),
    delaysIssues: z.string().optional().nullable(),
    status: z.enum(["draft", "submitted"]).optional(),
    clientUpdatedAt: z.string().datetime().optional().nullable(),
    labor: z.array(laborRow).optional(),
    equipment: z.array(equipmentRow).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  from: isoDate.optional(),
  to: isoDate.optional(),
  status: z.enum(["draft", "submitted"]).optional(),
  shift: z.enum(["day", "night"]).optional(),
});

const parseBody = (schema, payload) => schema.parse(payload);
const parseQuery = (schema, payload) => schema.parse(payload);

module.exports = {
  parseCreateDailyLogBody: (payload) =>
    parseBody(createDailyLogSchema, payload),
  parseUpdateDailyLogBody: (payload) =>
    parseBody(updateDailyLogSchema, payload),
  parseDailyLogListQuery: (payload) => parseQuery(listQuerySchema, payload),
};
