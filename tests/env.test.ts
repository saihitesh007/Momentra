import { afterEach, describe, expect, it } from "vitest";
import { getEnv, getGeminiEnv } from "@/backend/lib/env";

afterEach(() => { process.env.GEMINI_API_KEY = "test-key"; delete process.env.GEMINI_MODEL; });

describe("environment loader", () => {
  it("uses the default Gemini model", () => {
    process.env.GEMINI_MODEL = "";
    expect(getEnv().GEMINI_MODEL).toBe("gemini-2.5-flash");
  });
  it("requires the API key only when Gemini is invoked", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => getGeminiEnv()).toThrow("GEMINI_API_KEY");
  });
});
