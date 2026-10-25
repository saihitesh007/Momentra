import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  event: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  budgetItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
  timelineTask: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  vendorItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
  idea: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
  callGemini: vi.fn(),
}));

vi.mock("@/backend/lib/db", () => ({ prisma: db }));
vi.mock("@/backend/lib/gemini", () => ({
  callGemini: db.callGemini,
  GeminiError: class GeminiError extends Error { kind = "upstream"; status?: number; },
}));

import { GET as listEvents } from "@/app/api/events/route";
import { GET as getEvent, PATCH as patchEvent, DELETE as deleteEvent } from "@/app/api/events/[id]/route";
import { GET as getBudget } from "@/app/api/events/[id]/budget/route";
import { PATCH as patchBudgetItem } from "@/app/api/events/[id]/budget/[itemId]/route";
import { GET as getTimeline, POST as addTask } from "@/app/api/events/[id]/timeline/route";
import { PATCH as patchTask, DELETE as deleteTask } from "@/app/api/events/[id]/timeline/[taskId]/route";
import { GET as getVendors } from "@/app/api/events/[id]/vendors/route";
import { PATCH as patchVendor } from "@/app/api/events/[id]/vendors/[vendorId]/route";
import { GET as getIdeas, POST as addIdea } from "@/app/api/events/[id]/ideas/route";
import { PATCH as patchIdea } from "@/app/api/events/[id]/ideas/[ideaId]/route";
import { POST as generateBudget } from "@/app/api/ai/budget/route";
import { POST as generateTimeline } from "@/app/api/ai/timeline/route";
import { POST as generateVendors } from "@/app/api/ai/vendors/route";
import { POST as generateIdeas } from "@/app/api/ai/ideas/route";
import { POST as chat } from "@/app/api/ai/chat/route";

const event = {
  id: "evt-1", name: "Test event", type: "wedding", date: new Date("2030-01-01T00:00:00Z"),
  location: "Pune", guestCount: 50, budget: 10000, currency: "INR", notes: "Vegetarian",
  createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z"),
};
const routeContext = { params: Promise.resolve({ id: "evt-1", itemId: "budget-1", taskId: "task-1", vendorId: "vendor-1", ideaId: "idea-1" }) };
const request = (body?: unknown) => new Request("http://local/api", {
  method: body === undefined ? "GET" : "POST",
  headers: { "content-type": "application/json", "x-forwarded-for": crypto.randomUUID() },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const aiRequest = (body: unknown) => new Request("http://local/api/ai", {
  method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": crypto.randomUUID() }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  db.event.findUnique.mockResolvedValue(event);
  db.event.update.mockResolvedValue(event);
  db.event.delete.mockResolvedValue({ count: 1 });
  db.budgetItem.update.mockResolvedValue({ id: "budget-1", eventId: "evt-1" });
  db.timelineTask.create.mockResolvedValue({ id: "task-new", eventId: "evt-1" });
  db.timelineTask.update.mockResolvedValue({ id: "task-1", eventId: "evt-1" });
  db.timelineTask.delete.mockResolvedValue({ count: 1 });
  db.vendorItem.update.mockResolvedValue({ id: "vendor-1", eventId: "evt-1" });
  db.idea.create.mockResolvedValue({ id: "idea-new", eventId: "evt-1" });
  db.idea.update.mockResolvedValue({ id: "idea-1", eventId: "evt-1" });
  for (const model of [db.event, db.budgetItem, db.timelineTask, db.vendorItem, db.idea]) {
    if ("findMany" in model) model.findMany.mockResolvedValue([]);
  }
  db.$transaction.mockImplementation(async (callback) => callback(db));
});

describe("event and nested data routes", () => {
  it("lists and retrieves event data without caching", async () => {
    const list = await listEvents();
    expect(list.status).toBe(200);
    expect(list.headers.get("Cache-Control")).toBe("no-store");
    expect((await getEvent(request(), routeContext)).status).toBe(200);
    db.event.findUnique.mockResolvedValue(null);
    expect((await getEvent(request(), routeContext)).status).toBe(404);
  });
  it("updates and deletes events", async () => {
    expect((await patchEvent(request({ name: "Updated" }), routeContext)).status).toBe(200);
    expect((await deleteEvent(request(), routeContext)).status).toBe(200);
  });
  it("lists and updates budget rows scoped to the event", async () => {
    expect((await getBudget(request(), routeContext)).status).toBe(200);
    expect((await patchBudgetItem(request({ actual: 200 }), routeContext)).status).toBe(200);
    expect(db.budgetItem.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "budget-1", eventId: "evt-1" } }));
  });
  it("lists, adds, updates and deletes timeline tasks with event scoping", async () => {
    expect((await getTimeline(request(), routeContext)).status).toBe(200);
    expect((await addTask(request({ title: "Book hall", phase: "8 Weeks", dueDate: "2029-10-01" }), routeContext)).status).toBe(201);
    expect((await patchTask(request({ status: "DONE" }), routeContext)).status).toBe(200);
    expect((await deleteTask(request(), routeContext)).status).toBe(200);
    expect(db.timelineTask.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "task-1", eventId: "evt-1" } }));
  });
  it("lists and updates vendor rows scoped to the event", async () => {
    expect((await getVendors(request(), routeContext)).status).toBe(200);
    expect((await patchVendor(request({ name: "Vendor" }), routeContext)).status).toBe(200);
    expect(db.vendorItem.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "vendor-1", eventId: "evt-1" } }));
  });
  it("lists, creates, and updates ideas with strict request data", async () => {
    expect((await getIdeas(request(), routeContext)).status).toBe(200);
    expect((await addIdea(request({ category: "menu", title: "Veg menu", description: "Seasonal" }), routeContext)).status).toBe(201);
    expect((await patchIdea(request({ saved: true }), routeContext)).status).toBe(200);
    expect(db.idea.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "idea-1", eventId: "evt-1" } }));
  });
});

describe("AI routes", () => {
  it("recomputes estimated budget values and uses a transaction", async () => {
    db.callGemini.mockResolvedValue({ items: [
      ["venue", 20], ["catering", 20], ["decor", 15], ["photography", 15], ["attire", 10], ["entertainment", 10], ["misc", 10],
    ].map(([category, percentage]) => ({ category, percentage, label: String(category), estimated: 999999, rationale: "fit" })) });
    const response = await generateBudget(aiRequest({ eventId: "evt-1" }));
    expect(response.status).toBe(200);
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.budgetItem.createMany.mock.calls[0][0].data[0].estimated).toBe(2000);
  });
  it("generates timeline tasks and clamps dates to the event date", async () => {
    db.callGemini.mockResolvedValue({ tasks: Array.from({ length: 10 }, (_, index) => ({
      phase: "Planning", title: `Task ${index}`, description: "Do work", dueDate: "2031-01-01", status: "TODO",
    })) });
    expect((await generateTimeline(aiRequest({ eventId: "evt-1" }))).status).toBe(200);
    expect(db.timelineTask.createMany.mock.calls[0][0].data[0].dueDate).toEqual(event.date);
    expect(db.$transaction).toHaveBeenCalled();
  });
  it("generates vendor checklists and ideas in transactions", async () => {
    db.callGemini.mockResolvedValueOnce({ vendors: [{ category: "venue", questionsToAsk: ["Capacity?"], documentsNeeded: ["Contract"], paymentTips: "Use receipts" }] });
    expect((await generateVendors(aiRequest({ eventId: "evt-1" }))).status).toBe(200);
    db.callGemini.mockResolvedValueOnce({ ideas: Array.from({ length: 5 }, (_, index) => ({ category: "theme", title: `Idea ${index}`, description: "Fits budget" })) });
    expect((await generateIdeas(aiRequest({ eventId: "evt-1" }))).status).toBe(200);
    expect(db.$transaction).toHaveBeenCalledTimes(2);
  });
  it("handles chat validation, missing events and a valid assistant response", async () => {
    expect((await chat(aiRequest({ eventId: "evt-1", message: "x".repeat(1001) }))).status).toBe(400);
    db.event.findUnique.mockResolvedValueOnce(null);
    expect((await chat(aiRequest({ eventId: "missing", message: "Hello" }))).status).toBe(404);
    db.callGemini.mockResolvedValue({ reply: "Hello", suggestedAction: null });
    expect((await chat(aiRequest({ eventId: "evt-1", message: "Hello", history: [] }))).status).toBe(200);
    expect(db.timelineTask.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId: "evt-1", status: { not: "DONE" } }, take: 10 }));
  });
});
