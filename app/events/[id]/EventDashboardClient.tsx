"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, MapPin, Users, Wallet, Printer,
  LayoutDashboard, PieChart, Clock, Store, Lightbulb, MessageCircle,
} from "lucide-react";
import BudgetTab from "@/frontend/components/BudgetTab";
import TimelineTab from "@/frontend/components/TimelineTab";
import VendorsTab from "@/frontend/components/VendorsTab";
import IdeasTab from "@/frontend/components/IdeasTab";
import ChatPanel from "@/frontend/components/ChatPanel";
import Toaster from "@/frontend/components/Toaster";

/* ── types that cross the server/client boundary (Dates serialised to strings) */
interface SerializedEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
interface SerializedBudgetItem {
  id: string; eventId: string; category: string; label: string;
  percentage: number; estimated: number; actual: number;
  paid: boolean; aiGenerated: boolean; createdAt: string; updatedAt: string;
}
interface SerializedTimelineTask {
  id: string; eventId: string; phase: string; title: string;
  description: string | null; dueDate: string; status: string;
  aiGenerated: boolean; createdAt: string; updatedAt: string;
}
interface SerializedVendorItem {
  id: string; eventId: string; category: string; name: string | null;
  contact: string | null; quote: number | null; status: string;
  questionsToAsk: string | null; documentsNeeded: string | null;
  paymentTips: string | null; aiGenerated: boolean; createdAt: string; updatedAt: string;
}
interface SerializedIdea {
  id: string; eventId: string; category: string; title: string;
  description: string; saved: boolean; aiGenerated: boolean;
  createdAt: string; updatedAt: string;
}

interface Props {
  event: SerializedEvent;
  budgetItems: SerializedBudgetItem[];
  timelineTasks: SerializedTimelineTask[];
  vendorItems: SerializedVendorItem[];
  ideas: SerializedIdea[];
  isNew: boolean;
}

const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "budget",    label: "Budget",    icon: PieChart },
  { id: "timeline",  label: "Timeline",  icon: Clock },
  { id: "vendors",   label: "Vendors",   icon: Store },
  { id: "ideas",     label: "Ideas",     icon: Lightbulb },
] as const;

type TabId = typeof TABS[number]["id"];

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  wedding:   { emoji: "💍", color: "bg-rose-100 text-rose-700" },
  birthday:  { emoji: "🎂", color: "bg-orange-100 text-orange-700" },
  community: { emoji: "🌟", color: "bg-violet-100 text-violet-700" },
  other:     { emoji: "🎉", color: "bg-blue-100 text-blue-700" },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "د.إ",
};

export default function EventDashboardClient({
  event,
  budgetItems,
  timelineTasks,
  vendorItems,
  ideas,
  isNew,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<Record<string, string>>({});
  const generationStarted = useRef(false);
  const generationAbortController = useRef<AbortController | null>(null);

  const meta = TYPE_META[event.type] ?? TYPE_META.other;
  const sym = CURRENCY_SYMBOLS[event.currency] ?? event.currency;
  const eventDate = new Date(event.date);

  const progressPct = useMemo(() => {
    const doneTasks = timelineTasks.filter((task) => task.status === "DONE").length;
    return timelineTasks.length === 0 ? 0 : Math.round((doneTasks / timelineTasks.length) * 100);
  }, [timelineTasks]);

  // Auto-generate plan if brand new event and no data yet
  const generateAll = useCallback(async () => {
    const steps = ["budget", "timeline", "vendors", "ideas"];
    generationAbortController.current?.abort();
    const controller = new AbortController();
    generationAbortController.current = controller;
    setGenerationProgress(Object.fromEntries(steps.map((step) => [step, "pending"])));
    await Promise.allSettled(steps.map(async (step) => {
      try {
        const response = await fetch(`/api/ai/${step}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`${step} generation failed`);
        setGenerationProgress((current) => ({ ...current, [step]: "done" }));
      } catch {
        if (!controller.signal.aborted) {
          setGenerationProgress((current) => ({ ...current, [step]: "failed" }));
        }
      }
    }));
    if (!controller.signal.aborted) router.refresh();
  }, [event.id, router]);

  useEffect(() => {
    if (isNew && budgetItems.length === 0 && timelineTasks.length === 0 && !generationStarted.current) {
      generationStarted.current = true;
      void generateAll();
    }
    return () => generationAbortController.current?.abort();
  }, [isNew, budgetItems.length, timelineTasks.length, generateAll]);

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextTab = TABS[nextIndex].id;
    setActiveTab(nextTab);
    document.getElementById(`tab-${nextTab}`)?.focus();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/events" aria-label="Back to events" className="text-gray-600 hover:text-gray-700 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.emoji}</span>
              <span className="font-bold text-gray-900 text-lg truncate max-w-[160px] sm:max-w-none">
                {event.name}
              </span>
              <span className={`hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                {event.type}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-plan"
              onClick={() => window.print()}
              aria-label="Export as PDF"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Printer size={14} /> Export PDF
            </button>
            <button
              id="open-chat"
              onClick={() => setChatOpen(true)}
              aria-label="Open chat assistant"
              className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle size={14} /> Ask Momentra
            </button>
          </div>
        </div>
      </nav>

      {/* ── Event meta strip ──────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 no-print">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {event.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} /> {event.guestCount.toLocaleString()} guests
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet size={13} /> {sym}{event.budget.toLocaleString("en-IN")}
          </span>
          {timelineTasks.length > 0 && (
            <span className="flex items-center gap-2 ml-auto">
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-green-400 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs">{progressPct}% done</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 no-print">
        <div role="tablist" aria-label="Event plan sections" onKeyDown={handleTabKeyDown} className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls="event-tabpanel"
              tabIndex={activeTab === id ? 0 : -1}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === id
                  ? "border-orange-500 text-orange-700"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="sr-only">{event.name} event plan</h1>
        {Object.keys(generationProgress).length > 0 && (
          <p className="card mb-5 p-3 text-sm text-gray-700" aria-live="polite">
            Creating your plan: {Object.entries(generationProgress).map(([step, status]) => `${step} ${status === "done" ? "✓" : status === "failed" ? "failed" : "…"}`).join(" · ")}
          </p>
        )}
        <div id="event-tabpanel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
        {activeTab === "overview" && (
          <OverviewTab
            event={event}
            budgetItems={budgetItems}
            timelineTasks={timelineTasks}
            vendorItems={vendorItems}
            ideas={ideas}
            sym={sym}
            progressPct={progressPct}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === "budget" && (
          <BudgetTab
            eventId={event.id}
            initialItems={budgetItems}
            totalBudget={event.budget}
            currency={event.currency}
          />
        )}
        {activeTab === "timeline" && (
          <TimelineTab
            eventId={event.id}
            initialTasks={timelineTasks}
            eventDate={event.date}
          />
        )}
        {activeTab === "vendors" && (
          <VendorsTab
            eventId={event.id}
            initialVendors={vendorItems}
            currency={event.currency}
          />
        )}
        {activeTab === "ideas" && (
          <IdeasTab
            eventId={event.id}
            initialIdeas={ideas}
          />
        )}
        </div>
      </main>

      {/* ── Chat panel ────────────────────────────────────────── */}
      <ChatPanel
        eventId={event.id}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────────────────── */

function OverviewTab({
  event, budgetItems, timelineTasks, vendorItems, ideas, sym, progressPct, onTabChange,
}: {
  event: SerializedEvent;
  budgetItems: SerializedBudgetItem[];
  timelineTasks: SerializedTimelineTask[];
  vendorItems: SerializedVendorItem[];
  ideas: SerializedIdea[];
  sym: string;
  progressPct: number;
  onTabChange: (t: TabId) => void;
}) {
  const totalSpent = budgetItems.reduce((s, i) => s + i.actual, 0);
  const bookedVendors = vendorItems.filter((v) => v.status === "BOOKED" || v.status === "PAID").length;
  const savedIdeas = ideas.filter((i) => i.saved).length;
  const overdueTasks = timelineTasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tasks done", value: `${progressPct}%`, sub: `${timelineTasks.filter((t) => t.status === "DONE").length}/${timelineTasks.length}`, tab: "timeline" as TabId, color: "text-green-600" },
          { label: "Budget spent", value: `${sym}${totalSpent.toLocaleString("en-IN")}`, sub: `of ${sym}${event.budget.toLocaleString("en-IN")}`, tab: "budget" as TabId, color: "text-orange-700" },
          { label: "Vendors booked", value: String(bookedVendors), sub: `of ${vendorItems.length}`, tab: "vendors" as TabId, color: "text-blue-600" },
          { label: "Ideas saved", value: String(savedIdeas), sub: `of ${ideas.length}`, tab: "ideas" as TabId, color: "text-purple-600" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => onTabChange(s.tab)}
            className="card p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
          </button>
        ))}
      </div>

      {/* Overdue warning */}
      {overdueTasks > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <span className="text-xl">⚠️</span>
          <span>
            <strong>{overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""}!</strong>{" "}
            <button onClick={() => onTabChange("timeline")} className="underline">
              View timeline →
            </button>
          </span>
        </div>
      )}

      {/* Event details */}
      <div className="card p-6 space-y-3">
        <h2 className="font-bold text-gray-900">Event Details</h2>
        {event.notes && (
          <p className="text-sm text-gray-600 bg-orange-50 border border-orange-100 rounded-lg p-3">
            📝 {event.notes}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-600">Type</span><p className="font-medium capitalize">{event.type}</p></div>
          <div><span className="text-gray-600">Date</span><p className="font-medium">{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>
          <div><span className="text-gray-600">Location</span><p className="font-medium">{event.location}</p></div>
          <div><span className="text-gray-600">Guests</span><p className="font-medium">{event.guestCount.toLocaleString()}</p></div>
        </div>
      </div>

      {/* Upcoming tasks */}
      {timelineTasks.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Upcoming Tasks</h2>
            <button onClick={() => onTabChange("timeline")} className="text-xs text-orange-700 hover:text-orange-700">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {timelineTasks
              .filter((t) => t.status !== "DONE")
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{task.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.status === "DOING" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

