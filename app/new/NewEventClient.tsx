"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "@/frontend/components/Toaster";
import Toaster from "@/frontend/components/Toaster";

type EventType = "wedding" | "birthday" | "community" | "other";

const EVENT_TYPES: { value: EventType; label: string; emoji: string; desc: string }[] = [
  { value: "wedding",   label: "Wedding",         emoji: "💍", desc: "Tying the knot" },
  { value: "birthday",  label: "Birthday",        emoji: "🎂", desc: "Celebrating life" },
  { value: "community", label: "Community Event", emoji: "🌟", desc: "Bringing people together" },
  { value: "other",     label: "Other",           emoji: "🎉", desc: "Any celebration" },
];

const STEPS = ["Event Type", "Basics", "Budget", "Preferences"];
const QUICK_PREFERENCES = ["Vegetarian", "Vegan", "Jain-friendly", "Traditional", "Modern", "Kid-friendly", "Budget-conscious", "Outdoor"];

interface FormData {
  type: EventType;
  name: string;
  date: string;
  location: string;
  guestCount: string;
  budget: string;
  currency: string;
  notes: string;
}

export default function NewEventClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = (searchParams.get("type") as EventType) ?? "wedding";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quickPreferences, setQuickPreferences] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>({
    type: preselectedType,
    name: "",
    date: "",
    location: "",
    guestCount: "100",
    budget: "500000",
    currency: "INR",
    notes: "",
  });

  const update = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canProceed = () => {
    if (step === 0) return !!form.type;
    if (step === 1) return form.name.trim().length > 0 && !!form.date && form.location.trim().length > 0;
    if (step === 2) return Number(form.guestCount) > 0 && Number(form.budget) > 0;
    return true;
  };

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          date: form.date,
          location: form.location,
          guestCount: Number(form.guestCount),
          budget: Number(form.budget),
          currency: form.currency,
          notes: [form.notes.trim(), ...quickPreferences].filter(Boolean).join(" | ").slice(0, 1000) || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to create event", "error");
        return;
      }

      const event = await res.json();
      router.push(`/events/${event.id}?new=1`);
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-violet-50 flex flex-col">
      <Toaster />

      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-orange-100 z-10">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft size={20} className="text-gray-500 hover:text-gray-800 transition-colors" />
          </Link>
          <span className="font-semibold text-gray-900">Plan a new event</span>
        </div>
      </div>

      <main id="main" className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <h1 className="sr-only">Create your event plan</h1>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <button
                  id={`step-btn-${i}`}
                  onClick={() => i < step && setStep(i)}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    i < step
                      ? "bg-green-500 text-white cursor-pointer"
                      : i === step
                      ? "bg-orange-700 text-white ring-4 ring-orange-100"
                      : "bg-gray-100 text-gray-600 cursor-default"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </button>
                <span
                  className={`text-xs hidden sm:block ${
                    i === step ? "text-orange-700 font-medium" : "text-gray-600"
                  }`}
                >
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 rounded ${i < step ? "bg-green-400" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="card p-6 sm:p-8 animate-slide-up">
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What are you planning?</h2>
                <p className="text-gray-500 text-sm mb-6">Choose the type of event to get started.</p>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_TYPES.map((et) => (
                    <button
                      key={et.value}
                      id={`type-${et.value}`}
                      onClick={() => update("type", et.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-orange-300 ${
                        form.type === et.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <div className="text-3xl mb-2">{et.emoji}</div>
                      <div className="font-semibold text-sm text-gray-900">{et.label}</div>
                      <div className="text-xs text-gray-500">{et.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us the basics</h2>
                <p className="text-gray-500 text-sm mb-6">
                  These details help Momentra personalise your plan.
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Event name *
                    </label>
                    <input
                      id="event-name"
                      type="text"
                      placeholder='e.g. "Priya & Rahul Wedding"'
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Event date *
                    </label>
                    <input
                      id="event-date"
                      type="date"
                      value={form.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => update("date", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location / City *
                    </label>
                    <input
                      id="event-location"
                      type="text"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Budget & guest count</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We&apos;ll make sure your plan never exceeds the budget.
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="guest-count" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of guests *
                    </label>
                    <input
                      id="guest-count"
                      type="number"
                      min="1"
                      value={form.guestCount}
                      onChange={(e) => update("guestCount", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      id="currency"
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    >
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="AED">AED — UAE Dirham (د.إ)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="total-budget" className="block text-sm font-medium text-gray-700 mb-1">
                      Total budget ({form.currency}) *
                    </label>
                    <input
                      id="total-budget"
                      type="number"
                      min="1"
                      value={form.budget}
                      onChange={(e) => update("budget", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    {Number(form.budget) > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {form.currency === "INR" ? "₹" : form.currency}{" "}
                        {Number(form.budget).toLocaleString("en-IN")} total
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Any special preferences?</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Optional — the more you share, the better Momentra tailors your plan.
                </p>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes & preferences
                  </label>
                  <textarea
                    id="notes"
                    placeholder="e.g. Vegetarian menu, traditional south Indian ceremony, outdoor venue preferred..."
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  />
                </div>
                <fieldset className="mt-4">
                  <legend className="block text-sm font-medium text-gray-700 mb-2">Quick style, dietary &amp; vibe preferences</legend>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PREFERENCES.map((preference) => {
                      const selected = quickPreferences.includes(preference);
                      return (
                        <button
                          key={preference}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setQuickPreferences((current) => selected
                            ? current.filter((item) => item !== preference)
                            : [...current, preference])}
                          className={`min-h-11 rounded-full border px-3 py-2 text-sm transition-colors ${selected ? "border-orange-700 bg-orange-50 text-orange-800" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                        >
                          {preference}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Selected preferences are included with your notes to personalize AI suggestions.</p>
                </fieldset>
                <div className="mt-4 p-4 bg-orange-50 rounded-xl text-sm border border-orange-100">
                  <strong className="text-orange-900">What happens next?</strong>
                  <p className="mt-1 text-orange-700">
                    Momentra will generate your complete event plan — budget, timeline, vendor
                    checklists, and personalized ideas — all in under a minute.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                id="prev-step"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-0 transition-colors px-4 py-2"
              >
                <ArrowLeft size={16} /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  id="next-step"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 disabled:opacity-40 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  id="create-event"
                  onClick={submit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>✨ Generate my plan</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

