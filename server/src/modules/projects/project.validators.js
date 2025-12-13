const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().max(64).optional().nullable(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

const projectRoleSchema = z.enum(["admin", "pm", "reviewer", "field"]);

const addProjectUserSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  role: projectRoleSchema.optional().default("field"),
});

const parseBody = (schema, payload) => schema.parse(payload);

module.exports = {
  parseCreateProjectBody: (payload) => parseBody(createProjectSchema, payload),
  parseAddProjectUserBody: (payload) =>
    parseBody(addProjectUserSchema, payload),
};
