/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({ default: () => () => null }));

import BudgetTab from "@/frontend/components/BudgetTab";
import TimelineTab from "@/frontend/components/TimelineTab";
import ChatPanel from "@/frontend/components/ChatPanel";

afterEach(() => vi.unstubAllGlobals());

describe("planning components", () => {
  it("shows the overspend amount and an equivalent category table", () => {
    render(<BudgetTab
      eventId="evt"
      totalBudget={100}
      currency="INR"
      initialItems={[{
        id: "budget-1", eventId: "evt", category: "venue", label: "Venue", percentage: 100,
        estimated: 100, actual: 125, paid: false, aiGenerated: false,
        createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      }]}
    />);
    expect(screen.getByText(/Over budget by ₹25/)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Percent" })).toBeInTheDocument();
    expect(screen.getByText("Venue")).toBeInTheDocument();
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });

  it("shows overdue text only for past unfinished timeline tasks", () => {
    const base = { eventId: "evt", phase: "Today", description: null, aiGenerated: false, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
    render(<TimelineTab eventId="evt" eventDate="2027-01-01" initialTasks={[
      { ...base, id: "todo", title: "Book lights", dueDate: "2026-01-01T00:00:00.000Z", status: "TODO" },
      { ...base, id: "done", title: "Choose venue", dueDate: "2026-01-01T00:00:00.000Z", status: "DONE" },
    ]} />);
    expect(screen.getAllByText("Overdue")).toHaveLength(1);
  });

  it("keeps chat suggestions pending until the user clicks Apply and closes with Escape", async () => {
    const opener = document.createElement("button");
    opener.id = "open-chat";
    document.body.append(opener);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        reply: "I can mark that task done.",
        suggestedAction: { type: "UPDATE_TASK", description: "Mark task done", payload: { id: "task-1", status: "DONE" } },
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();
    render(<ChatPanel eventId="evt" open onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: "Ask Momentra" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Message for Momentra")).toHaveFocus());
    fireEvent.change(screen.getByLabelText("Message for Momentra"), { target: { value: "Mark task done" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByText("Mark task done");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Apply/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(opener).toHaveFocus());
    opener.remove();
  });
});
