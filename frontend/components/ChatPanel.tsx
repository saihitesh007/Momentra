"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/frontend/components/Toaster";
import { ChatSuggestedActionSchema } from "@/backend/lib/schemas";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Action {
  type: string;
  description: string;
  payload: Record<string, unknown>;
}

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

export default function ChatPanel({ eventId, open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        document.getElementById("open-chat")?.focus();
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeys);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeys);
      document.getElementById("open-chat")?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setPendingActions([]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          message: msg,
          history: messages.slice(-10),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();

      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.suggestedAction) {
        const action = ChatSuggestedActionSchema.safeParse(data.suggestedAction);
        if (action.success) setPendingActions([action.data]);
        else toast("Momentra returned an invalid suggested change.", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chat failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function applyAction(action: Action) {
    try {
      const validated = ChatSuggestedActionSchema.safeParse(action);
      if (!validated.success) throw new Error("Suggested change is invalid");
      action = validated.data;
      let endpoint = "";
      let body: Record<string, unknown> = action.payload;

      if (action.type === "UPDATE_BUDGET") {
        const { id, ...rest } = action.payload as { id: string; [k: string]: unknown };
        endpoint = `/api/events/${eventId}/budget/${id}`;
        body = rest;
      } else if (action.type === "UPDATE_TASK") {
        const { id, ...rest } = action.payload as { id: string; [k: string]: unknown };
        endpoint = `/api/events/${eventId}/timeline/${id}`;
        body = rest;
      } else if (action.type === "ADD_IDEA") {
        endpoint = `/api/events/${eventId}/ideas`;
        body = action.payload;
      }

      if (!endpoint) { toast("Unknown action type", "error"); return; }

      const res = await fetch(endpoint, {
        method: action.type === "ADD_IDEA" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to apply action");
      toast("✅ Action applied! Refresh to see changes.", "success");
      setPendingActions((prev) => prev.filter((a) => a !== action));
    } catch {
      toast("Failed to apply action", "error");
    }
  }

  if (!open) return null;

  return (
    <div
      className="chat-panel fixed inset-0 z-50 flex items-end sm:items-end sm:justify-end pointer-events-none"
    >
      {/* Backdrop for mobile */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="chat-title" className="relative pointer-events-auto w-full sm:w-[420px] sm:m-4 sm:mr-6 sm:mb-6 flex flex-col card shadow-2xl max-h-[85vh] sm:max-h-[600px] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-pink-500 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={16} />
            <span id="chat-title" className="font-semibold text-sm">Ask Momentra</span>
          </div>
          <button
            id="close-chat"
            onClick={onClose}
            aria-label="Close chat"
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div aria-live="polite" aria-relevant="additions text" className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px]">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-sm text-gray-600 font-medium">Hi! I&apos;m Momentra.</p>
              <p className="text-xs text-gray-600 mt-1">
                Ask me anything about your event — budget tips, task help, vendor advice, or ideas.
              </p>
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  "What's my next task?",
                  "How can I save on catering?",
                  "Suggest decor ideas",
                  "Which vendors should I book first?",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => { setInput(chip); inputRef.current?.focus(); }}
                    className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-orange-700 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 size={14} className="animate-spin text-gray-600" />
              </div>
            </div>
          )}

          {/* Pending action cards */}
          {pendingActions.map((action, i) => (
            <div
              key={i}
              className="border border-orange-200 bg-orange-50 rounded-xl p-3 space-y-2"
            >
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
                Suggested action
              </p>
              <p className="text-sm text-gray-700">{action.description}</p>
              <button
                id={`apply-action-${i}`}
                onClick={() => applyAction(action)}
                className="text-xs bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                ✅ Apply
              </button>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              aria-label="Message for Momentra"
              placeholder="Ask anything about your event…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={loading}
              aria-describedby="chat-send-status"
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
            />
            <button
              id="chat-send"
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="bg-orange-700 hover:bg-orange-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p id="chat-send-status" className="sr-only" aria-live="polite">{loading ? "Momentra is replying" : ""}</p>
          <p className="text-xs text-gray-600 text-center mt-2">
            Actions shown as cards must be approved — never auto-applied.
          </p>
        </div>
      </div>
    </div>
  );
}

