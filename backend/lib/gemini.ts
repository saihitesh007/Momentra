import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getGeminiEnv } from "./env";

export type GeminiErrorKind = "rate_limit" | "timeout" | "upstream" | "invalid_output" | "configuration";

/** Safe typed error used by API handlers without exposing provider details. */
export class GeminiError extends Error {
  constructor(public readonly kind: GeminiErrorKind, message: string, public readonly status?: number) {
    super(message);
    this.name = "GeminiError";
  }
}

function upstreamStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { status?: unknown; code?: unknown };
  const status = typeof candidate.status === "number" ? candidate.status : Number(candidate.code);
  return Number.isFinite(status) && status >= 400 && status <= 599 ? status : undefined;
}

/** Calls Gemini with bounded JSON output, validating data and retrying only invalid output once. */
export async function callGemini<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  let env: ReturnType<typeof getGeminiEnv>;
  try {
    env = getGeminiEnv();
  } catch {
    throw new GeminiError("configuration", "Gemini is not configured.");
  }

  const genai = new GoogleGenAI({ apiKey: env.apiKey });
  let responseJsonSchema: unknown;
  try {
    responseJsonSchema = z.toJSONSchema(schema, { target: "draft-7" });
  } catch {
    responseJsonSchema = undefined;
  }

  const request = async (): Promise<T> => {
    const call = genai.models.generateContent({
      model: env.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        ...(responseJsonSchema ? { responseJsonSchema } : {}),
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.5,
      },
    });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        call,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new GeminiError("timeout", "Gemini request timed out.")), 20_000);
        }),
      ]);
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text ?? "");
        return schema.parse(parsed);
      } catch {
        throw new GeminiError("invalid_output", "Gemini returned invalid structured output.");
      }
    } catch (error) {
      if (error instanceof GeminiError) throw error;
      const status = upstreamStatus(error);
      throw new GeminiError(status === 429 ? "rate_limit" : "upstream", "Gemini request failed.", status);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };

  try {
    return await request();
  } catch (error) {
    if (!(error instanceof GeminiError) || error.kind !== "invalid_output") throw error;
    try {
      return await request();
    } catch (retryError) {
      if (retryError instanceof GeminiError && retryError.kind === "invalid_output") {
        throw new GeminiError("invalid_output", "Gemini returned invalid output twice.");
      }
      throw retryError;
    }
  }
}
