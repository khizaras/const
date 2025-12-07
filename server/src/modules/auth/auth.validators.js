const { z } = require("zod");

const registerSchema = z
  .object({
    organizationId: z.coerce.number().int().positive().optional(),
    organizationName: z.string().min(2).max(255).optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    projectIds: z.array(z.coerce.number().int().positive()).optional(),
  })
  .refine((data) => data.organizationId || data.organizationName, {
    message: "organizationId or organizationName is required",
    path: ["organizationId"],
  });

const loginSchema = z.object({
  organizationId: z.coerce.number().int().positive(),
  email: z.string().email(),
  password: z.string().min(1),
});

const parseBody = (schema, payload) => schema.parse(payload);

module.exports = {
  parseRegisterBody: (payload) => parseBody(registerSchema, payload),
  parseLoginBody: (payload) => parseBody(loginSchema, payload),
};
