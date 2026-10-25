import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { GeminiError } from "@/backend/lib/gemini";
import { handleRoute } from "@/backend/lib/api";
import { z } from "zod";

describe("API error handler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps Zod validation errors to 400", async () => {
    const response = await handleRoute(async () => {
      z.string().parse(42);
      return NextResponse.json({ ok: true });
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Validation error" });
  });
  it("maps malformed JSON to 400", async () => {
    const response = await handleRoute(async () => { throw new SyntaxError("bad JSON"); });
    expect(response.status).toBe(400);
  });
  it("maps missing Prisma records and Gemini rate limits", async () => {
    const missing = new Prisma.PrismaClientKnownRequestError("missing", { code: "P2025", clientVersion: "test" });
    expect((await handleRoute(async () => { throw missing; })).status).toBe(404);
    expect((await handleRoute(async () => { throw new GeminiError("rate_limit", "private"); })).status).toBe(429);
  });
  it("logs unknown errors while returning no internal details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await handleRoute(async () => { throw new Error("database password"); });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong" });
    expect(console.error).toHaveBeenCalled();
  });
});
