const { z } = require("zod");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((val) => val);

const createIssueSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(1),
  type: z.enum(["issue", "punch", "observation"]).optional().default("issue"),
  status: z.enum(["open", "in_progress", "closed"]).optional().default("open"),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .default("medium"),
  trade: z.string().max(64).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  dueDate: isoDate.optional().nullable(),
  assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
});

const updateIssueSchema = z
  .object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().min(1).optional(),
    type: z.enum(["issue", "punch", "observation"]).optional(),
    status: z.enum(["open", "in_progress", "closed"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    trade: z.string().max(64).optional().nullable(),
    location: z.string().max(255).optional().nullable(),
    dueDate: isoDate.optional().nullable(),
    assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(["open", "in_progress", "closed"]).optional(),
  type: z.enum(["issue", "punch", "observation"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  search: z.string().max(255).optional(),
  dueBefore: isoDate.optional(),
});

const parseBody = (schema, payload) => schema.parse(payload);
const parseQuery = (schema, payload) => schema.parse(payload);

module.exports = {
  parseCreateIssueBody: (payload) => parseBody(createIssueSchema, payload),
  parseUpdateIssueBody: (payload) => parseBody(updateIssueSchema, payload),
  parseListQuery: (payload) => parseQuery(listQuerySchema, payload),
};
