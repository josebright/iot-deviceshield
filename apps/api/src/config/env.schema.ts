import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  FRONTEND_URL: z.string().url().default('http://localhost:3001'),

  AI_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() !== 'false' && v !== '0'),
  OLLAMA_HOST: z.string().default('http://ollama:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:3b'),

  NVD_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  ADMIN_API_TOKEN: z
    .string()
    .min(32, 'ADMIN_API_TOKEN must be at least 32 characters (openssl rand -hex 32)'),

  CLIENT_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(60),
  CLIENT_VULN_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(10),
  CATALOG_REFRESH_CRON: z.string().default('0 3 * * *'),
  CVE_CACHE_MINUTES: z.coerce.number().int().positive().default(30),
  CPE_RESOLVE_TTL_DAYS: z.coerce.number().int().positive().default(30),
  WARM_CACHE_ON_BOOT: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() !== 'false' && v !== '0'),

  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCheck .env against .env.example.`,
    );
  }
  return parsed.data;
}
