import { z } from "zod";

// ─── API Input Schemas ────────────────────────────────────────────────────────

export const CreateEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  type: z.enum(["wedding", "birthday", "community", "other"]),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  location: z.string().min(1, "Location is required"),
  guestCount: z.number().int().positive("Guest count must be positive"),
  budget: z.number().positive("Budget must be positive"),
  currency: z.string().default("INR"),
  notes: z.string().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = CreateEventSchema.partial();
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

// Budget item update (user-driven: actual spend, paid flag)
export const UpdateBudgetItemSchema = z.object({
  actual: z.number().min(0).optional(),
  paid: z.boolean().optional(),
  label: z.string().optional(),
});
export type UpdateBudgetItemInput = z.infer<typeof UpdateBudgetItemSchema>;

// Timeline task status update
export const UpdateTaskSchema = z.object({
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// Vendor item update (user fills name, contact, quote, status)
export const UpdateVendorSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  quote: z.number().min(0).optional(),
  status: z.enum(["SHORTLIST", "BOOKED", "PAID"]).optional(),
});
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;

// Chat message input
export const ChatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

// ─── Gemini Output Schemas ────────────────────────────────────────────────────

// Budget
export const GeminiBudgetItemSchema = z.object({
  category: z.enum([
    "venue",
    "catering",
    "decor",
    "photography",
    "attire",
    "entertainment",
    "misc",
  ]),
  label: z.string(),
  percentage: z.number().min(0).max(100),
  estimated: z.number().min(0),
  rationale: z.string(),
});

export const GeminiBudgetSchema = z.object({
  items: z.array(GeminiBudgetItemSchema).length(7),
});
export type GeminiBudget = z.infer<typeof GeminiBudgetSchema>;

// Timeline
export const GeminiTaskSchema = z.object({
  phase: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  status: z.literal("TODO"),
});

export const GeminiTimelineSchema = z.object({
  tasks: z.array(GeminiTaskSchema).min(10).max(30),
});
export type GeminiTimeline = z.infer<typeof GeminiTimelineSchema>;

// Vendor
export const GeminiVendorItemSchema = z.object({
  category: z.enum(["venue", "catering", "photography", "decor", "music"]),
  questionsToAsk: z.array(z.string()).min(1),
  documentsNeeded: z.array(z.string()).min(1),
  paymentTips: z.string(),
});

export const GeminiVendorSchema = z.object({
  vendors: z.array(GeminiVendorItemSchema),
});
export type GeminiVendors = z.infer<typeof GeminiVendorSchema>;

// Ideas
export const GeminiIdeaItemSchema = z.object({
  category: z.enum(["theme", "menu", "decor", "activity", "gift"]),
  title: z.string(),
  description: z.string(),
});

export const GeminiIdeasSchema = z.object({
  ideas: z.array(GeminiIdeaItemSchema).min(5).max(25),
});
export type GeminiIdeas = z.infer<typeof GeminiIdeasSchema>;

// Chat
export const GeminiChatSchema = z.object({
  reply: z.string(),
  suggestedAction: z
    .object({
      type: z.enum(["UPDATE_BUDGET", "UPDATE_TASK", "ADD_IDEA"]),
      description: z.string(),
      payload: z.record(z.string(), z.unknown()),
    })
    .nullable(),
});
export type GeminiChat = z.infer<typeof GeminiChatSchema>;

