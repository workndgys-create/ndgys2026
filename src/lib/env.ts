import { z } from "zod";

// Validate at boot. Public/optional integrations are allowed to be absent in dev.
// Provide safe defaults for local development to avoid crashing middleware
if (process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL ||= "file:./dev.db";
  process.env.JWT_SECRET ||= "development-secret-please-change";
}
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),

  // Cashfree (required to take payments; optional in pure-frontend dev)
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_MODE: z.string().default("sandbox"),
  NEXT_PUBLIC_CASHFREE_MODE: z.string().default("sandbox"),

  // Resend (optional; email no-ops when absent)
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("New Delhi Global Youth Summit <onboarding@resend.dev>"),
  MAIL_ADMIN_TO: z.string().optional()
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.flatten().fieldErrors;
  console.error("❌ Invalid environment variables:", issues);
  throw new Error("Invalid environment configuration. See errors above.");
}

export const env = parsed.data;
