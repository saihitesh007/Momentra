"use client";

import { useState, useMemo } from "react";
import type { Idea } from "@prisma/client";
import { Heart, RefreshCw } from "lucide-react";
import { toast } from "@/frontend/components/Toaster";
import { SkeletonCard } from "@/frontend/components/Skeletons";

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  theme:    { label: "Theme",     emoji: "🎨", color: "bg-purple-50 border-purple-100" },
  menu:     { label: "Menu",      emoji: "🍽️", color: "bg-orange-50 border-orange-100" },
  decor:    { label: "Decor",     emoji: "🌸", color: "bg-pink-50   border-pink-100"   },
  activity: { label: "Activity",  emoji: "🎮", color: "bg-blue-50   border-blue-100"   },
  gift:     { label: "Gift",      emoji: "🎁", color: "bg-green-50  border-green-100"  },
};

type FilterKind = "all" | "theme" | "menu" | "decor" | "activity" | "gift";

interface Props {
  eventId: string;
  initialIdeas: ClientIdea[];
}

type ClientIdea = Omit<Idea, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string };

export default function IdeasTab({ eventId, initialIdeas }: Props) {
  const [ideas, setIdeas] = useState<ClientIdea[]>(initialIdeas);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<FilterKind>("all");

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();
      setIdeas(data.ideas);
      toast("Ideas generated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error generating ideas", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleSaved(idea: ClientIdea) {
    // Optimistic
    setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, saved: !i.saved } : i)));
    try {
      const res = await fetch(`/api/events/${eventId}/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: !idea.saved }),
      });
      if (!res.ok) throw new Error("Failed");
      toast(idea.saved ? "Removed from saved" : "Idea saved! ❤️", idea.saved ? "info" : "success");
    } catch {
      setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, saved: idea.saved } : i)));
      toast("Failed to update", "error");
    }
  }

  const displayed = useMemo(() => filter === "all" ? ideas : ideas.filter((idea) => idea.category === filter), [filter, ideas]);

  if (generating) return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({length:8}).map((_,i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-lg text-gray-900">Personalized Ideas</h2>
        <button
          id="generate-ideas"
          onClick={generate}
          className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={14} />
          {ideas.length === 0 ? "Generate Ideas" : "Regenerate"}
        </button>
      </div>

      {/* Filter pills */}
      {ideas.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(["all", "theme", "menu", "decor", "activity", "gift"] as FilterKind[]).map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === f
                  ? "bg-orange-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : `${CATEGORY_META[f]?.emoji} ${CATEGORY_META[f]?.label}`}
            </button>
          ))}
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-gray-500 mb-4">No ideas yet.</p>
          <button onClick={generate} className="bg-orange-700 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-800">
            Generate AI Ideas
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          No ideas in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.map((idea) => {
            const meta = CATEGORY_META[idea.category] ?? { emoji: "💡", label: idea.category, color: "bg-gray-50 border-gray-100" };
            return (
              <div
                key={idea.id}
                id={`idea-card-${idea.id}`}
                className={`card p-4 border ${meta.color} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{meta.label}</span>
                  </div>
                  <button
                    id={`save-idea-${idea.id}`}
                    onClick={() => toggleSaved(idea)}
                    aria-label={idea.saved ? "Unsave idea" : "Save idea"}
                    className={`flex-shrink-0 transition-colors ${idea.saved ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                  >
                    <Heart size={18} fill={idea.saved ? "currentColor" : "none"} />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{idea.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{idea.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {ideas.length > 0 && ideas.some((i) => i.saved) && (
        <p className="text-xs text-gray-600 text-center">
          {ideas.filter((i) => i.saved).length} idea{ideas.filter((i) => i.saved).length > 1 ? "s" : ""} saved ❤️
        </p>
      )}
    </div>
  );
}

