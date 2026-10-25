/** Returns true when an unfinished task's calendar date is before today's date. */
export function isOverdue(dueDate: Date | string, status: string, now = new Date()): boolean {
  if (status === "DONE") return false;
  const due = new Date(dueDate);
  if (!Number.isFinite(due.getTime()) || !Number.isFinite(now.getTime())) return false;
  return Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()) <
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Returns a valid due date no later than the event date; invalid dates fall back to the event date. */
export function clampDueDate(dueDate: Date | string, eventDate: Date | string): Date {
  const event = new Date(eventDate);
  if (!Number.isFinite(event.getTime())) throw new RangeError("Event date is invalid.");
  const due = new Date(dueDate);
  if (!Number.isFinite(due.getTime()) || due.getTime() > event.getTime()) return event;
  return due;
}

/** Maps days remaining to a human-readable timeline phase. */
export function phaseFor(daysBefore: number): string {
  if (!Number.isFinite(daysBefore)) return "Event Day";
  if (daysBefore >= 84) return "12 Weeks Before";
  if (daysBefore >= 56) return "8 Weeks Before";
  if (daysBefore >= 28) return "4 Weeks Before";
  if (daysBefore >= 7) return "1 Week Before";
  return daysBefore > 0 ? "Final Days" : "Event Day";
}
