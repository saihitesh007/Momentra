import Link from "next/link";
import { prisma } from "@/backend/lib/db";
import { Calendar, MapPin, Users, ArrowRight, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

function getProgress(tasks: { status: string }[]) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "DONE").length;
  return Math.round((done / tasks.length) * 100);
}

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  wedding:   { emoji: "💍", color: "bg-rose-100 text-rose-700" },
  birthday:  { emoji: "🎂", color: "bg-orange-100 text-orange-700" },
  community: { emoji: "🌟", color: "bg-violet-100 text-violet-700" },
  other:     { emoji: "🎉", color: "bg-blue-100 text-blue-700" },
};

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { timelineTasks: { select: { status: true } } },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-xl text-gray-900">Momentra</span>
          </Link>
          <Link
            href="/new"
            id="new-event-btn"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={16} /> New Event
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Events</h1>
          <p className="text-gray-500 mt-1">
            {events.length === 0 ? "No events yet" : `${events.length} event${events.length > 1 ? "s" : ""} planned`}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="card p-12 flex flex-col items-center text-center">
            <div className="text-6xl mb-4">🌸</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Start planning your first event</h2>
            <p className="text-gray-500 mb-6 max-w-sm">
              Momentra uses AI to generate a complete plan — budget, timeline, vendors, and ideas.
            </p>
            <Link
              href="/new"
              id="empty-state-cta"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Plus size={18} /> Plan my first event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => {
              const progress = getProgress(event.timelineTasks);
              const meta = TYPE_META[event.type] ?? TYPE_META.other;
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  id={`event-card-${event.id}`}
                  className="card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                      {meta.emoji} {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    {isPast && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Past</span>
                    )}
                  </div>

                  <h2 className="font-bold text-gray-900 text-lg leading-tight mb-3 group-hover:text-orange-600 transition-colors">
                    {event.name}
                  </h2>

                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={13} />
                      {event.guestCount.toLocaleString()} guests
                    </div>
                  </div>

                  {/* Progress bar */}
                  {event.timelineTasks.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-pink-400 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {event.currency === "INR" ? "₹" : event.currency}
                      {event.budget.toLocaleString("en-IN")}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

