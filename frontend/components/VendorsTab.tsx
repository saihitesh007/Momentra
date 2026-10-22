"use client";

import { useState } from "react";
import { VendorItem } from "@prisma/client";
import { RefreshCw, Check } from "lucide-react";
import { toast } from "@/frontend/components/Toaster";
import { SkeletonCard } from "@/frontend/components/Skeletons";

const STATUS_META: Record<string, { label: string; color: string }> = {
  SHORTLIST: { label: "Shortlisted", color: "bg-yellow-100 text-yellow-700" },
  BOOKED:    { label: "Booked",      color: "bg-blue-100   text-blue-700"   },
  PAID:      { label: "Paid",        color: "bg-green-100  text-green-700"  },
};

const CATEGORY_EMOJI: Record<string, string> = {
  venue:         "🏛️",
  catering:      "🍽️",
  photography:   "📸",
  decor:         "🌸",
  music:         "🎵",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "د.إ",
};

interface Props {
  eventId: string;
  initialVendors: VendorItem[];
  currency: string;
}

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

export default function VendorsTab({ eventId, initialVendors, currency }: Props) {
  const [vendors, setVendors] = useState<VendorItem[]>(initialVendors);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<Record<string, Partial<VendorItem>>>({});
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();
      setVendors(data.vendors);
      toast("Vendor guide generated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error generating vendors", "error");
    } finally {
      setGenerating(false);
    }
  }

  function patchLocal(vendorId: string, field: keyof VendorItem, value: unknown) {
    setEditing((e) => ({ ...e, [vendorId]: { ...e[vendorId], [field]: value } }));
  }

  async function saveVendor(vendor: VendorItem) {
    const changes = editing[vendor.id];
    if (!changes) return;
    // Optimistic
    setVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, ...changes } : v)));
    setEditing((e) => { const n = { ...e }; delete n[vendor.id]; return n; });
    try {
      const res = await fetch(`/api/events/${eventId}/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (changes.name as string) ?? vendor.name,
          contact: (changes.contact as string) ?? vendor.contact,
          quote: changes.quote !== undefined ? Number(changes.quote) : vendor.quote,
          status: (changes.status as string) ?? vendor.status,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Vendor updated!", "success");
    } catch {
      toast("Failed to save vendor", "error");
    }
  }

  if (generating) return <div className="space-y-4">{Array.from({length:5}).map((_,i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-lg text-gray-900">Vendor Checklists</h2>
        <button
          id="generate-vendors"
          onClick={generate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={14} />
          {vendors.length === 0 ? "Generate Vendors" : "Regenerate"}
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-gray-500 mb-4">No vendor guide yet.</p>
          <button onClick={generate} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-600">
            Generate Vendor Guide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {vendors.map((vendor) => {
            const local = editing[vendor.id] ?? {};
            const questions = parseJsonArray(vendor.questionsToAsk);
            const docs = parseJsonArray(vendor.documentsNeeded);
            const status = (local.status as string) ?? vendor.status;
            const meta = STATUS_META[status] ?? STATUS_META.SHORTLIST;

            return (
              <div key={vendor.id} className="card p-5 space-y-4">
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CATEGORY_EMOJI[vendor.category] ?? "🏢"}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 capitalize">{vendor.category}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <select
                    id={`vendor-status-${vendor.id}`}
                    value={status}
                    onChange={(e) => patchLocal(vendor.id, "status", e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none ${meta.color}`}
                    aria-label={`Status for ${vendor.category}`}
                  >
                    <option value="SHORTLIST">Shortlist</option>
                    <option value="BOOKED">Booked</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                {/* Editable fields */}
                <div className="space-y-2">
                  <input
                    id={`vendor-name-${vendor.id}`}
                    type="text"
                    placeholder="Vendor name"
                    value={(local.name as string) ?? vendor.name ?? ""}
                    onChange={(e) => patchLocal(vendor.id, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
                  />
                  <input
                    id={`vendor-contact-${vendor.id}`}
                    type="text"
                    placeholder="Contact (phone / email)"
                    value={(local.contact as string) ?? vendor.contact ?? ""}
                    onChange={(e) => patchLocal(vendor.id, "contact", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{sym}</span>
                    <input
                      id={`vendor-quote-${vendor.id}`}
                      type="number"
                      placeholder="Quote amount"
                      value={(local.quote as number) ?? vendor.quote ?? ""}
                      onChange={(e) => patchLocal(vendor.id, "quote", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
                    />
                  </div>
                </div>

                {editing[vendor.id] && (
                  <button
                    id={`save-vendor-${vendor.id}`}
                    onClick={() => saveVendor(vendor)}
                    className="flex items-center gap-1.5 text-sm text-green-700 font-medium hover:text-green-800"
                  >
                    <Check size={14} /> Save changes
                  </button>
                )}

                {/* Questions */}
                {questions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                      Questions to ask
                    </h4>
                    <ul className="space-y-1">
                      {questions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documents */}
                {docs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                      Documents to collect
                    </h4>
                    <ul className="space-y-1">
                      {docs.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">📄</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Payment tips */}
                {vendor.paymentTips && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-amber-800 mb-1">💰 Payment tips</h4>
                    <p className="text-xs text-amber-700">{vendor.paymentTips}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

