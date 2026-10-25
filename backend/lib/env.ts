import { z } from "zod";

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  DATABASE_URL: z.string().min(1),
});

/** Loads and validates server environment values only when a feature needs them. */
export function getEnv() {
  return EnvSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    GEMINI_MODEL: process.env.GEMINI_MODEL || undefined,
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

/** Returns Gemini credentials and model, raising a typed validation error if absent. */
export function getGeminiEnv() {
  const env = getEnv();
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL };
}
