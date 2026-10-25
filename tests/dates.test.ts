import { describe, expect, it } from "vitest";
import { clampDueDate, isOverdue, phaseFor } from "@/backend/lib/dates";

describe("date helpers", () => {
  const now = new Date("2026-10-25T12:00:00.000Z");
  it("does not call a task due today overdue, but does for yesterday", () => {
    expect(isOverdue("2026-10-25T00:00:00.000Z", "TODO", now)).toBe(false);
    expect(isOverdue("2026-10-24T23:59:00.000Z", "TODO", now)).toBe(true);
  });
  it("never marks completed or invalid dates overdue", () => {
    expect(isOverdue("2026-10-20", "DONE", now)).toBe(false);
    expect(isOverdue("not a date", "TODO", now)).toBe(false);
  });
  it("clamps invalid and post-event dates", () => {
    const eventDate = new Date("2026-12-01T00:00:00.000Z");
    expect(clampDueDate("bad", eventDate)).toEqual(eventDate);
    expect(clampDueDate("2027-01-01", eventDate)).toEqual(eventDate);
  });
  it("rejects an invalid event boundary", () => {
    expect(() => clampDueDate("2026-10-01", "bad event date")).toThrow(RangeError);
  });
  it("maps lead time to phases", () => {
    expect(phaseFor(90)).toBe("12 Weeks Before");
    expect(phaseFor(0)).toBe("Event Day");
  });
});
