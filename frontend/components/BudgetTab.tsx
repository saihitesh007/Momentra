"use client";

import { useState, useCallback } from "react";
import { BudgetItem } from "@prisma/client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Check, AlertTriangle, RefreshCw, Edit2 } from "lucide-react";
import { toast } from "@/frontend/components/Toaster";
import { SkeletonBudget } from "@/frontend/components/Skeletons";

const CATEGORY_COLORS: Record<string, string> = {
  venue:         "#f97316",
  catering:      "#ec4899",
  decor:         "#a855f7",
  photography:   "#3b82f6",
  attire:        "#14b8a6",
  entertainment: "#eab308",
  misc:          "#6b7280",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "د.إ",
};

interface Props {
  eventId: string;
  initialItems: BudgetItem[];
  totalBudget: number;
  currency: string;
}

export default function BudgetTab({ eventId, initialItems, totalBudget, currency }: Props) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [generating, setGenerating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editActual, setEditActual] = useState("");
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;

  const totalSpent = items.reduce((s, i) => s + i.actual, 0);
  const overBudget = totalSpent > totalBudget;

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();
      setItems(data.items);
      toast("Budget generated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error generating budget", "error");
    } finally {
      setGenerating(false);
    }
  }

  const togglePaid = useCallback(async (item: BudgetItem) => {
    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, paid: !i.paid } : i))
    );
    try {
      const res = await fetch(`/api/events/${eventId}/budget/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !item.paid }),
      });
      if (!res.ok) throw new Error("Failed");
      toast(item.paid ? "Marked unpaid" : "Marked paid!", "success");
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, paid: item.paid } : i))
      );
      toast("Failed to update", "error");
    }
  }, [eventId]);

  async function saveActual(item: BudgetItem) {
    const val = parseFloat(editActual);
    if (isNaN(val) || val < 0) { toast("Enter a valid amount", "error"); return; }
    // Optimistic
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, actual: val } : i)));
    setEditId(null);
    try {
      const res = await fetch(`/api/events/${eventId}/budget/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: val }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, actual: item.actual } : i)));
      toast("Failed to save", "error");
    }
  }

  const chartData = items.map((i) => ({
    name: i.label,
    value: i.estimated,
    color: CATEGORY_COLORS[i.category] ?? "#aaa",
  }));

  if (generating) return <SkeletonBudget />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-lg text-gray-900">Budget Breakdown</h2>
          <p className="text-sm text-gray-500">
            Total: {sym}{totalBudget.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          id="generate-budget"
          onClick={generate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={14} />
          {items.length === 0 ? "Generate Budget" : "Regenerate"}
        </button>
      </div>

      {/* Over-budget warning */}
      {overBudget && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>
            <strong>Over budget!</strong> Actual spend ({sym}{totalSpent.toLocaleString("en-IN")}) exceeds total budget ({sym}{totalBudget.toLocaleString("en-IN")}).
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-gray-500 mb-4">No budget plan yet.</p>
          <button
            onClick={generate}
            className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Generate AI Budget
          </button>
        </div>
      ) : (
        <>
          {/* Donut chart */}
          <div className="card p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${sym}${Number(value ?? 0).toLocaleString("en-IN")}`, ""]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Category</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-semibold">Estimated</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-semibold">Actual</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-semibold">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isOver = item.actual > item.estimated;
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: CATEGORY_COLORS[item.category] ?? "#aaa" }}
                            />
                            <span className="font-medium text-gray-800">{item.label}</span>
                          </div>
                          <div className="text-xs text-gray-400 ml-5">{item.percentage.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">
                          {sym}{item.estimated.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editId === item.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                id={`actual-input-${item.id}`}
                                type="number"
                                value={editActual}
                                onChange={(e) => setEditActual(e.target.value)}
                                className="w-24 px-2 py-1 border rounded text-right text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveActual(item);
                                  if (e.key === "Escape") setEditId(null);
                                }}
                              />
                              <button onClick={() => saveActual(item)} className="text-green-600 hover:text-green-700">
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`edit-actual-${item.id}`}
                              onClick={() => { setEditId(item.id); setEditActual(String(item.actual)); }}
                              className={`flex items-center gap-1 ml-auto hover:text-orange-600 transition-colors ${isOver ? "text-red-600 font-semibold" : "text-gray-700"}`}
                            >
                              {sym}{item.actual.toLocaleString("en-IN")}
                              {isOver && <AlertTriangle size={12} />}
                              <Edit2 size={11} className="opacity-40" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            id={`paid-toggle-${item.id}`}
                            onClick={() => togglePaid(item)}
                            aria-label={item.paid ? "Mark unpaid" : "Mark paid"}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mx-auto ${
                              item.paid ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
                            }`}
                          >
                            {item.paid && <Check size={12} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {sym}{items.reduce((s, i) => s + i.estimated, 0).toLocaleString("en-IN")}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${overBudget ? "text-red-600" : "text-gray-900"}`}>
                      {sym}{totalSpent.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {items.filter((i) => i.paid).length}/{items.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

