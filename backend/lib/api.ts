import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { GeminiError } from "./gemini";

/** Standardizes safe error responses for route handlers. */
export async function handleRoute<T extends Response>(handler: () => Promise<T>): Promise<T | Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (error instanceof GeminiError && error.kind === "rate_limit") {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }
    console.error("API route failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
