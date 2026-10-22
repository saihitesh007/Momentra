"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Array<(t: Toast) => void> = [];

export function toast(message: string, type: ToastType = "info") {
  const t: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(t));
}

const COLORS: Record<ToastType, string> = {
  success: "bg-green-50 border-green-300 text-green-800",
  error:   "bg-red-50 border-red-300 text-red-800",
  warning: "bg-amber-50 border-amber-300 text-amber-800",
  info:    "bg-blue-50 border-blue-300 text-blue-800",
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 no-print"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-up flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm max-w-xs ${COLORS[t.type]}`}
        >
          <span className="flex-1">{t.message}</span>
          <button
            aria-label="Dismiss"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

