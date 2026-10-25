import { describe, expect, it } from "vitest";
import {
  AddIdeaActionPayloadSchema,
  ChatMessageSchema,
  CreateEventSchema,
  GeminiBudgetSchema,
  UpdateBudgetItemSchema,
} from "@/backend/lib/schemas";

const validEvent = {
  name: "Family gathering", type: "community", date: "2030-10-25", location: "Pune",
  guestCount: 50, budget: 100000, currency: "INR", notes: "Vegetarian",
};

describe("request and model schemas", () => {
  it("accepts a valid event and rejects invalid or overlong values", () => {
    expect(CreateEventSchema.safeParse(validEvent).success).toBe(true);
    expect(CreateEventSchema.safeParse({ ...validEvent, name: "" }).success).toBe(false);
    expect(CreateEventSchema.safeParse({ ...validEvent, budget: -1 }).success).toBe(false);
    expect(CreateEventSchema.safeParse({ ...validEvent, guestCount: 0 }).success).toBe(false);
    expect(CreateEventSchema.safeParse({ ...validEvent, notes: "x".repeat(1001) }).success).toBe(false);
    expect(CreateEventSchema.safeParse({ ...validEvent, injected: true }).success).toBe(false);
  });
  it("requires exactly seven budget categories", () => {
    const item = { category: "venue", label: "Venue", percentage: 100, estimated: 1000, rationale: "Fits" };
    expect(GeminiBudgetSchema.safeParse({ items: Array(7).fill(item) }).success).toBe(true);
    expect(GeminiBudgetSchema.safeParse({ items: [item] }).success).toBe(false);
  });
  it("rejects unknown fields in updates and suggested actions", () => {
    expect(UpdateBudgetItemSchema.safeParse({ actual: 5, eventId: "another-event" }).success).toBe(false);
    expect(AddIdeaActionPayloadSchema.safeParse({ category: "menu", title: "Veg", description: "Menu", admin: true }).success).toBe(false);
  });
  it("bounds message history length and content size", () => {
    expect(ChatMessageSchema.safeParse({ message: "Hello", history: Array(21).fill({ role: "user", content: "x" }) }).success).toBe(false);
    expect(ChatMessageSchema.safeParse({ message: "Hello", history: [{ role: "user", content: "x".repeat(2001) }] }).success).toBe(false);
  });
});
