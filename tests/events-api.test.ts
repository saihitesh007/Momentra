import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn() }));
vi.mock("@/backend/lib/db", () => ({ prisma: { event: { create: db.create, findMany: db.findMany } } }));

import { POST } from "@/app/api/events/route";

const validEvent = {
  name: "Test wedding", type: "wedding", date: "2030-10-25", location: "Pune",
  guestCount: 80, budget: 500000, currency: "INR", notes: "Vegetarian",
};

describe("POST /api/events", () => {
  beforeEach(() => { db.create.mockReset(); });
  it("creates a validated event", async () => {
    db.create.mockResolvedValue({ id: "evt-1", ...validEvent });
    const request = new Request("http://local/api/events", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "test-event-create" },
      body: JSON.stringify(validEvent),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(db.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: validEvent.name, budget: 500000 }) }));
  });
  it("rejects malformed data and never exposes database errors", async () => {
    const invalid = await POST(new Request("http://local/api/events", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "test-event-invalid" }, body: JSON.stringify({ ...validEvent, budget: -1 }),
    }));
    expect(invalid.status).toBe(400);
    db.create.mockRejectedValue(new Error("private database message"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failed = await POST(new Request("http://local/api/events", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "test-event-fail" }, body: JSON.stringify(validEvent),
    }));
    expect(failed.status).toBe(500);
    expect(await failed.text()).not.toContain("private database message");
  });
});
