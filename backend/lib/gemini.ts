import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// ─── Client (server-side only) ────────────────────────────────────────────────

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

// ─── Core call helper ─────────────────────────────────────────────────────────

/**
 * Calls Gemini with a prompt and returns strict JSON, validated by the
 * provided Zod schema. Retries once on parse/validation failure.
 */
export async function callGemini<T>(
  prompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  async function attempt(): Promise<T> {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
    }

    return schema.parse(parsed);
  }

  try {
    return await attempt();
  } catch {
    // One retry on any parse / validation failure
    try {
      return await attempt();
    } catch (secondError) {
      const msg =
        secondError instanceof Error
          ? secondError.message
          : "Unknown Gemini error";
      throw new Error(`Gemini call failed after 2 attempts: ${msg}`);
    }
  }
}

