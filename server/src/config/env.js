const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().default("4000"),
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.string().default("3306"),
  MYSQL_USER: z.string(),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DB: z.string().default("procore"),
  JWT_SECRET: z.string().min(16).default("dev_secret_change_me_123"),
  ENABLE_SETUP_UI: z.string().optional(),
  SETUP_TOKEN: z.string().optional(),
  EMAIL_HOST: z.string().default("smtp.gmail.com"),
  EMAIL_PORT: z.string().default("587"),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const env = envSchema.parse(process.env);
module.exports = { env };
