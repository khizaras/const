const { z } = require("zod");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((val) => val);

const createRfiSchema = z.object({
  title: z.string().min(3).max(255),
  question: z.string().min(1),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .default("medium"),
  discipline: z.string().max(64).optional().nullable(),
  specSection: z.string().max(64).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  dueDate: isoDate.optional().nullable(),
  neededBy: isoDate.optional().nullable(),
  assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
  ballInCourtUserId: z.coerce.number().int().positive().optional().nullable(),
  watchers: z.array(z.coerce.number().int().positive()).optional().default([]),
});

const updateRfiSchema = z
  .object({
    title: z.string().min(3).max(255).optional(),
    question: z.string().min(1).optional(),
    status: z.enum(["open", "answered", "closed", "void"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    discipline: z.string().max(64).optional().nullable(),
    specSection: z.string().max(64).optional().nullable(),
    location: z.string().max(255).optional().nullable(),
    dueDate: isoDate.optional().nullable(),
    neededBy: isoDate.optional().nullable(),
    assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
    ballInCourtUserId: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const responseSchema = z.object({
  responseText: z.string().min(1),
  isOfficial: z.boolean().optional().default(false),
  returnToUserId: z.coerce.number().int().positive().optional().nullable(),
});

const watcherSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const commentSchema = z.object({
  body: z
    .string()
    .min(1)
    .max(2000)
    .transform((v) => v.trim()),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(["open", "answered", "closed", "void"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  ballInCourt: z.coerce.number().int().positive().optional(),
  search: z.string().max(255).optional(),
  dueBefore: isoDate.optional(),
});

const parseBody = (schema, payload) => schema.parse(payload);
const parseQuery = (schema, payload) => schema.parse(payload);

module.exports = {
  parseCreateRfiBody: (payload) => parseBody(createRfiSchema, payload),
  parseUpdateRfiBody: (payload) => parseBody(updateRfiSchema, payload),
  parseResponseBody: (payload) => parseBody(responseSchema, payload),
  parseWatcherBody: (payload) => parseBody(watcherSchema, payload),
  parseCommentBody: (payload) => parseBody(commentSchema, payload),
  parseListQuery: (payload) => parseQuery(listQuerySchema, payload),
};
