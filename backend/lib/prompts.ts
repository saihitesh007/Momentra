// ─── Prompt builders ─────────────────────────────────────────────────────────
// Each function returns a fully-formed prompt string for a Gemini call.
// Prompts request strict JSON that matches the corresponding Zod schemas in
// schemas.ts. Keep prompts co-located here so they're easy to tune.

import type { Event, BudgetItem, TimelineTask, VendorItem } from "@prisma/client";

// ─── Budget ───────────────────────────────────────────────────────────────────

export function buildBudgetPrompt(event: Event): string {
  return `
You are an expert Indian event budget planner. Given the event details below,
produce a category-wise budget breakdown in strict JSON format.

Event details:
- Name: ${event.name}
- Type: ${event.type}
- Date: ${event.date.toISOString().split("T")[0]}
- Location: ${event.location}
- Guest count: ${event.guestCount}
- Total budget: ${event.currency} ${event.budget}
- Notes: ${event.notes ?? "None"}

Return a JSON object with a single key "items" containing an array of budget
category objects. The percentages MUST sum to exactly 100. Cover these
categories: venue, catering, decor, photography, attire, entertainment, misc.

Each object must have:
  category: string (one of the 7 categories above)
  label: string (friendly display name, e.g. "Venue & Hall")
  percentage: number (0–100, two decimal places max)
  estimated: number (percentage / 100 * ${event.budget}, rounded to 2 decimal places)
  rationale: string (one-sentence explanation for this allocation)

Tailor the allocation to the event type, guest count, and any notes.
Do NOT exceed the total budget. Respond ONLY with valid JSON, no markdown.
`.trim();
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function buildTimelinePrompt(event: Event): string {
  const eventDate = event.date.toISOString().split("T")[0];
  return `
You are an expert Indian event coordinator. Generate a detailed phased planning
timeline for the event below. All task due dates must be BEFORE the event date.

Event details:
- Name: ${event.name}
- Type: ${event.type}
- Date: ${eventDate}
- Location: ${event.location}
- Guest count: ${event.guestCount}
- Total budget: ${event.currency} ${event.budget}
- Notes: ${event.notes ?? "None"}

Return a JSON object with a single key "tasks" containing an array of task
objects covering phases from ~12 weeks before to the event day.

Each task object must have:
  phase: string (e.g. "12 Weeks Before", "1 Week Before", "Day Of")
  title: string (concise task name)
  description: string (1-2 sentence details)
  dueDate: string (ISO 8601 date, must be ≤ "${eventDate}")
  status: "TODO"

Generate 15–25 tasks, ordered chronologically. Tailor tasks to the event type.
Respond ONLY with valid JSON, no markdown.
`.trim();
}

// ─── Vendor Checklist ─────────────────────────────────────────────────────────

export function buildVendorPrompt(event: Event): string {
  return `
You are an expert Indian event vendor advisor. Generate vendor guidance
checklists for the event below.

Event details:
- Name: ${event.name}
- Type: ${event.type}
- Date: ${event.date.toISOString().split("T")[0]}
- Location: ${event.location}
- Guest count: ${event.guestCount}
- Total budget: ${event.currency} ${event.budget}
- Notes: ${event.notes ?? "None"}

Return a JSON object with a single key "vendors" containing an array of vendor
category objects. Cover: venue, catering, photography, decor, music.

Each vendor object must have:
  category: string (one of the 5 categories above)
  questionsToAsk: string[] (5–8 practical questions to ask this vendor)
  documentsNeeded: string[] (3–5 documents/contracts to collect)
  paymentTips: string (2–3 sentences of payment advice specific to India)

Respond ONLY with valid JSON, no markdown.
`.trim();
}

// ─── Personalized Ideas ───────────────────────────────────────────────────────

export function buildIdeasPrompt(event: Event): string {
  return `
You are a creative Indian event stylist. Generate fresh, personalized ideas
for the event below.

Event details:
- Name: ${event.name}
- Type: ${event.type}
- Date: ${event.date.toISOString().split("T")[0]}
- Location: ${event.location}
- Guest count: ${event.guestCount}
- Total budget: ${event.currency} ${event.budget}
- Notes: ${event.notes ?? "None"}

Return a JSON object with a single key "ideas" containing an array of idea
objects across these categories: theme, menu, decor, activity, gift.

Each idea object must have:
  category: string (one of the 5 categories above)
  title: string (short, punchy name)
  description: string (2–3 sentences explaining the idea and why it fits)

Generate 3–4 ideas per category (15–20 total). Make them specific to the
guest count, budget range, and any notes. Avoid generic suggestions.
Respond ONLY with valid JSON, no markdown.
`.trim();
}

// ─── Chat Assistant ───────────────────────────────────────────────────────────

export function buildChatPrompt(
  event: Event,
  budgetItems: BudgetItem[],
  tasks: TimelineTask[],
  vendors: VendorItem[],
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): string {
  const budgetSummary = budgetItems
    .map((b) => `  ${b.label}: ₹${b.estimated} (actual ₹${b.actual})`)
    .join("\n");

  const taskSummary = tasks
    .filter((t) => t.status !== "DONE")
    .slice(0, 10)
    .map((t) => `  [${t.status}] ${t.title} (due ${t.dueDate.toISOString().split("T")[0]})`)
    .join("\n");

  const vendorSummary = vendors
    .map((v) => `  ${v.category}: ${v.name ?? "TBD"} (${v.status})`)
    .join("\n");

  const historyText = history
    .map((h) => `${h.role === "user" ? "User" : "Momentra"}: ${h.content}`)
    .join("\n");

  return `
You are Momentra, a helpful and friendly Indian event planning assistant.
You have full context of the user's event and its current planning state.

## Event Context
- Name: ${event.name}
- Type: ${event.type}
- Date: ${event.date.toISOString().split("T")[0]}
- Location: ${event.location}
- Guests: ${event.guestCount}
- Budget: ${event.currency} ${event.budget}
- Notes: ${event.notes ?? "None"}

## Budget Summary
${budgetSummary || "  Not generated yet."}

## Pending Tasks (top 10)
${taskSummary || "  No pending tasks."}

## Vendors
${vendorSummary || "  No vendors tracked yet."}

## Conversation History
${historyText || "  (start of conversation)"}

## User's Message
${userMessage}

---
Respond helpfully and concisely. If the user asks you to make a change to the
plan (budget, tasks, vendors, ideas), include a "suggestedAction" in your JSON
response that the user must explicitly approve. Never auto-apply changes.

Return a JSON object with:
  reply: string (your response in plain text, max 300 words)
  suggestedAction: null | {
    type: "UPDATE_BUDGET" | "UPDATE_TASK" | "ADD_IDEA",
    description: string,
    payload: object
  }

Respond ONLY with valid JSON, no markdown.
`.trim();
}

