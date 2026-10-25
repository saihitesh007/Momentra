import Link from "next/link";
import { Heart, Calendar, ArrowRight, Sparkles, CheckCircle } from "lucide-react";

const EVENT_TYPES = [
  {
    type: "wedding",
    emoji: "💍",
    title: "Wedding",
    desc: "Plan every detail of your dream wedding — from mandap to mehendi.",
    color: "from-rose-50 to-pink-50 border-rose-100",
    accent: "text-rose-600",
    bg: "bg-rose-500",
  },
  {
    type: "birthday",
    emoji: "🎂",
    title: "Birthday",
    desc: "Make it unforgettable with the perfect theme, venue, and activities.",
    color: "from-orange-50 to-amber-50 border-orange-100",
    accent: "text-orange-700",
    bg: "bg-orange-700",
  },
  {
    type: "community",
    emoji: "🌟",
    title: "Community Event",
    desc: "Coordinate large gatherings, festivals, and cultural celebrations.",
    color: "from-violet-50 to-purple-50 border-violet-100",
    accent: "text-violet-600",
    bg: "bg-violet-500",
  },
];

const FEATURES = [
  { icon: "💰", title: "AI Budget Planner", desc: "Category-wise breakdown that never exceeds your budget" },
  { icon: "📅", title: "Smart Timeline", desc: "12-week phased task list with due dates and reminders" },
  { icon: "🤝", title: "Vendor Checklists", desc: "Questions to ask, documents to collect, payment tips" },
  { icon: "✨", title: "Personalized Ideas", desc: "Themes, menus, decor tailored to your event and budget" },
  { icon: "💬", title: "AI Chat Assistant", desc: "Ask Momentra anything and get plan-aware suggestions" },
  { icon: "📄", title: "PDF Export", desc: "Print your entire plan in one click" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-xl text-gray-900">Momentra</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              My Events
            </Link>
            <Link
              href="/new"
              id="nav-cta"
              className="bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Plan an Event
            </Link>
          </div>
        </div>
      </nav>

      <main id="main">
      {/* ── Hero ────────────────────────────────────────── */}
      <section className="hero-gradient py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={12} />
            Powered by Gemini AI
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6 text-balance">
            Plan your perfect event
            <span className="gradient-text"> with AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 text-balance">
            Momentra turns your event details into a complete plan — budget breakdown, 
            timeline, vendor checklists, and personalized ideas — in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/new"
              id="hero-cta"
              className="inline-flex items-center justify-center gap-2 bg-orange-700 hover:bg-orange-800 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-200"
            >
              Plan my event
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/events"
              id="hero-secondary"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-4 rounded-2xl text-lg transition-colors border border-gray-200"
            >
              <Calendar size={20} />
              View my events
            </Link>
          </div>
          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500">
            {[
              { icon: <CheckCircle size={14} className="text-green-500" />, text: "Free to use" },
              { icon: <CheckCircle size={14} className="text-green-500" />, text: "No account needed" },
              { icon: <CheckCircle size={14} className="text-green-500" />, text: "INR first" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Event Type Cards ─────────────────────────────── */}
      <section className="py-20 px-4" id="event-types">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            What are you planning?
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Pick your event type to get started with a tailored AI plan.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {EVENT_TYPES.map((et) => (
              <Link
                key={et.type}
                href={`/new?type=${et.type}`}
                id={`event-type-${et.type}`}
                className={`group card bg-gradient-to-br ${et.color} p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block`}
              >
                <div className={`text-5xl mb-4`}>{et.emoji}</div>
                <h3 className={`font-bold text-xl mb-2 ${et.accent}`}>{et.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{et.desc}</p>
                <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${et.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Start planning <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="bg-white py-20 px-4" id="features">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            Everything you need to plan, in one place
          </h2>
          <p className="text-center text-gray-500 mb-12">
            AI does the heavy lifting. You make the decisions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-pink-500">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4">🎊</div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to start planning?
          </h2>
          <p className="text-orange-100 mb-8">
            It takes 2 minutes to create a complete AI-powered event plan.
          </p>
          <Link
            href="/new"
            id="bottom-cta"
            className="inline-flex items-center gap-2 bg-white text-orange-700 font-bold px-8 py-4 rounded-2xl hover:bg-orange-50 transition-colors text-lg"
          >
            <Heart size={20} />
            Plan my event — it&apos;s free
          </Link>
        </div>
      </section>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span className="font-medium text-gray-600">Momentra</span>
            <span>— AI Event Planner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/events" className="hover:text-gray-700 transition-colors">My Events</Link>
            <Link href="/new" className="hover:text-gray-700 transition-colors">New Event</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

