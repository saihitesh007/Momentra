import { z } from "zod";

const boundedText = (max: number) => z.string().trim().max(max);

// ─── API Input Schemas ────────────────────────────────────────────────────────
const EventFieldsSchema = z.object({
  name: z.string().trim().min(1, "Event name is required").max(120),
  type: z.enum(["wedding", "birthday", "community", "other"]),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
  location: z.string().trim().min(1, "Location is required").max(120),
  guestCount: z.number().int().positive().max(100_000),
  budget: z.number().positive().max(1_000_000_000),
  currency: z.string().trim().min(3).max(4).default("INR"),
  notes: boundedText(1000).optional(),
}).strict();

function validateEventDate(dateValue: string | undefined, ctx: z.RefinementCtx): void {
  if (!dateValue) return;
  const date = new Date(dateValue);
  if (!Number.isFinite(date.getTime())) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "Invalid date" });
  } else if (date.getTime() > Date.now() + 5 * 365.25 * 24 * 60 * 60 * 1000) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "Date cannot be more than five years away" });
  }
}

export const CreateEventSchema = EventFieldsSchema.superRefine((event, ctx) => {
  validateEventDate(event.date, ctx);
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = EventFieldsSchema.partial().strict().superRefine((event, ctx) => {
  validateEventDate(event.date, ctx);
});
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const UpdateBudgetItemSchema = z.object({
  actual: z.number().min(0).max(1_000_000_000).optional(),
  estimated: z.number().min(0).max(1_000_000_000).optional(),
  paid: z.boolean().optional(),
  label: boundedText(100).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");
export type UpdateBudgetItemInput = z.infer<typeof UpdateBudgetItemSchema>;

export const UpdateTaskSchema = z.object({
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  description: boundedText(1000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const UpdateVendorSchema = z.object({
  name: boundedText(120).nullable().optional(),
  contact: boundedText(160).nullable().optional(),
  quote: z.number().min(0).max(1_000_000_000).nullable().optional(),
  status: z.enum(["SHORTLIST", "BOOKED", "PAID"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;

export const ChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  }).strict()).max(20).default([]),
}).strict();
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export const UpdateBudgetActionPayloadSchema = z.object({
  id: z.string().min(1).max(64),
  estimated: z.number().min(0).max(1_000_000_000).optional(),
  actual: z.number().min(0).max(1_000_000_000).optional(),
  paid: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== "id"), "An update is required");
export const UpdateTaskActionPayloadSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  title: z.string().trim().min(1).max(160).optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== "id"), "An update is required");
export const AddIdeaActionPayloadSchema = z.object({
  category: z.enum(["theme", "menu", "decor", "activity", "gift"]),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
}).strict();

export const ChatSuggestedActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("UPDATE_BUDGET"), description: z.string().max(300), payload: UpdateBudgetActionPayloadSchema }).strict(),
  z.object({ type: z.literal("UPDATE_TASK"), description: z.string().max(300), payload: UpdateTaskActionPayloadSchema }).strict(),
  z.object({ type: z.literal("ADD_IDEA"), description: z.string().max(300), payload: AddIdeaActionPayloadSchema }).strict(),
]);
export type ChatSuggestedAction = z.infer<typeof ChatSuggestedActionSchema>;

// ─── Gemini Output Schemas ────────────────────────────────────────────────────
export const GeminiBudgetItemSchema = z.object({
  category: z.enum(["venue", "catering", "decor", "photography", "attire", "entertainment", "misc"]),
  label: z.string().min(1).max(100),
  percentage: z.number().min(0).max(100),
  estimated: z.number().min(0).max(1_000_000_000),
  rationale: z.string().min(1).max(500),
}).strict();
export const GeminiBudgetSchema = z.object({ items: z.array(GeminiBudgetItemSchema).length(7) }).strict();
export type GeminiBudget = z.infer<typeof GeminiBudgetSchema>;

export const GeminiTaskSchema = z.object({
  phase: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  description: z.string().max(1000),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()),
  status: z.literal("TODO"),
}).strict();
export const GeminiTimelineSchema = z.object({ tasks: z.array(GeminiTaskSchema).min(10).max(30) }).strict();
export type GeminiTimeline = z.infer<typeof GeminiTimelineSchema>;

export const GeminiVendorItemSchema = z.object({
  category: z.enum(["venue", "catering", "photography", "decor", "music"]),
  questionsToAsk: z.array(z.string().min(1).max(300)).min(1).max(12),
  documentsNeeded: z.array(z.string().min(1).max(300)).min(1).max(12),
  paymentTips: z.string().min(1).max(1000),
}).strict();
export const GeminiVendorSchema = z.object({ vendors: z.array(GeminiVendorItemSchema).min(1).max(10) }).strict();
export type GeminiVendors = z.infer<typeof GeminiVendorSchema>;

export const GeminiIdeaItemSchema = z.object({
  category: z.enum(["theme", "menu", "decor", "activity", "gift"]),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(1000),
}).strict();
export const GeminiIdeasSchema = z.object({ ideas: z.array(GeminiIdeaItemSchema).min(5).max(25) }).strict();
export type GeminiIdeas = z.infer<typeof GeminiIdeasSchema>;

export const GeminiChatSchema = z.object({
  reply: z.string().min(1).max(3000),
  suggestedAction: ChatSuggestedActionSchema.nullable(),
}).strict();
export type GeminiChat = z.infer<typeof GeminiChatSchema>;
