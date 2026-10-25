import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generateContent };
    constructor() {}
  },
}));

import { callGemini } from "@/backend/lib/gemini";
import { z } from "zod";

const OutputSchema = z.object({ answer: z.number() });

describe("Gemini adapter", () => {
  beforeEach(() => {
    mocks.generateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });
  it("returns validated JSON and bounds generation settings", async () => {
    mocks.generateContent.mockResolvedValue({ text: '{"answer":42}' });
    await expect(callGemini("prompt", OutputSchema)).resolves.toEqual({ answer: 42 });
    expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-2.5-flash",
      config: expect.objectContaining({ responseMimeType: "application/json", maxOutputTokens: 4096 }),
    }));
  });
  it("retries once for invalid structured output", async () => {
    mocks.generateContent.mockResolvedValueOnce({ text: "not-json" }).mockResolvedValueOnce({ text: '{"answer":7}' });
    await expect(callGemini("prompt", OutputSchema)).resolves.toEqual({ answer: 7 });
    expect(mocks.generateContent).toHaveBeenCalledTimes(2);
  });
  it("does not retry a provider 429", async () => {
    mocks.generateContent.mockRejectedValue({ status: 429 });
    await expect(callGemini("prompt", OutputSchema)).rejects.toMatchObject({ kind: "rate_limit" });
    expect(mocks.generateContent).toHaveBeenCalledTimes(1);
  });
  it("raises a typed error after a second invalid output", async () => {
    mocks.generateContent.mockResolvedValue({ text: "bad" });
    await expect(callGemini("prompt", OutputSchema)).rejects.toMatchObject({ name: "GeminiError", kind: "invalid_output" });
  });
});
