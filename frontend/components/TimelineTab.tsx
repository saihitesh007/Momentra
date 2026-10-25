"use client";

import { useState, useMemo } from "react";
import type { TimelineTask } from "@prisma/client";
import { isOverdue as isTaskOverdue } from "@/backend/lib/dates";
import { Trash2, Plus, RefreshCw, AlertTriangle, Check, Clock, Circle } from "lucide-react";
import { toast } from "@/frontend/components/Toaster";
import { SkeletonTimeline } from "@/frontend/components/Skeletons";

const STATUS_META = {
  TODO:  { label: "To Do",       icon: Circle,    color: "text-gray-600",  bg: "bg-gray-100  text-gray-600"  },
  DOING: { label: "In Progress", icon: Clock,     color: "text-blue-500",  bg: "bg-blue-100  text-blue-700"  },
  DONE:  { label: "Done",        icon: Check,     color: "text-green-500", bg: "bg-green-100 text-green-700" },
};

interface Props {
  eventId: string;
  initialTasks: ClientTimelineTask[];
  eventDate: string;
}

type ClientTimelineTask = Omit<TimelineTask, "dueDate" | "createdAt" | "updatedAt"> & {
  dueDate: string; createdAt: string; updatedAt: string;
};

function groupByPhase(tasks: ClientTimelineTask[]) {
  const map = new Map<string, ClientTimelineTask[]>();
  for (const t of tasks) {
    const arr = map.get(t.phase) ?? [];
    arr.push(t);
    map.set(t.phase, arr);
  }
  return map;
}

export default function TimelineTab({ eventId, initialTasks, eventDate }: Props) {
  const [tasks, setTasks] = useState<ClientTimelineTask[]>(initialTasks);
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", phase: "Custom", dueDate: "" });

  const donePct = useMemo(() => tasks.length === 0 ? 0 : Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100), [tasks]);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();
      setTasks(data.tasks);
      toast("Timeline generated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error generating timeline", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function updateStatus(task: ClientTimelineTask, status: "TODO" | "DOING" | "DONE") {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      const res = await fetch(`/api/events/${eventId}/timeline/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      toast("Failed to update task", "error");
    }
  }

  async function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await fetch(`/api/events/${eventId}/timeline/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast("Task deleted", "info");
    } catch {
      toast("Failed to delete task", "error");
    }
  }

  async function addTask() {
    if (!newTask.title.trim() || !newTask.dueDate) {
      toast("Title and due date are required", "error");
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.title, phase: newTask.phase, dueDate: newTask.dueDate }),
      });
      if (!res.ok) throw new Error("Failed");
      const task = await res.json();
      setTasks((prev) => [...prev, task].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setNewTask({ title: "", phase: "Custom", dueDate: "" });
      setAdding(false);
      toast("Task added!", "success");
    } catch {
      toast("Failed to add task", "error");
    }
  }

  if (generating) return <SkeletonTimeline />;

  const grouped = groupByPhase(tasks);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-lg text-gray-900">Planning Timeline</h2>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full w-40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-green-400 rounded-full transition-all"
                  style={{ width: `${donePct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{donePct}% complete</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            id="add-task-btn"
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-300 text-gray-700 text-sm px-3 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} /> Add task
          </button>
          <button
            id="generate-timeline"
            onClick={generate}
            className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCw size={14} />
            {tasks.length === 0 ? "Generate" : "Regenerate"}
          </button>
        </div>
      </div>

      {/* Add task form */}
      {adding && (
        <div className="card p-4 border-orange-200 bg-orange-50 space-y-3 animate-slide-up">
          <input
            id="new-task-title"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask((n) => ({ ...n, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <div className="flex gap-2">
            <input
              id="new-task-phase"
              placeholder="Phase (e.g. 4 Weeks Before)"
              value={newTask.phase}
              onChange={(e) => setNewTask((n) => ({ ...n, phase: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <input
              id="new-task-date"
              type="date"
              value={newTask.dueDate}
              max={eventDate.split("T")[0]}
              onChange={(e) => setNewTask((n) => ({ ...n, dueDate: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addTask} className="bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-800">
              Add
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500 mb-4">No timeline yet.</p>
          <button onClick={generate} className="bg-orange-700 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-800 transition-colors">
            Generate AI Timeline
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([phase, phaseTasks]) => (
            <div key={phase}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3 px-1">{phase}</h3>
              <div className="space-y-2">
                {phaseTasks.map((task) => {
                  const dueDate = new Date(task.dueDate);
                  const overdue = isTaskOverdue(dueDate, task.status);
                  const meta = STATUS_META[task.status as keyof typeof STATUS_META];
                  const Icon = meta.icon;

                  return (
                    <div
                      key={task.id}
                      className={`card p-4 flex items-start gap-3 transition-all ${
                        overdue ? "border-red-200 bg-red-50/30" : ""
                      }`}
                    >
                      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <span className={`font-medium text-sm ${task.status === "DONE" ? "line-through text-gray-600" : "text-gray-900"}`}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {overdue && (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle size={11} /> Overdue
                              </span>
                            )}
                            <select
                              id={`task-status-${task.id}`}
                              value={task.status}
                              onChange={(e) => updateStatus(task, e.target.value as "TODO" | "DOING" | "DONE")}
                              aria-label={`Status for ${task.title}`}
                              className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 ${meta.bg}`}
                            >
                              <option value="TODO">To Do</option>
                              <option value="DOING">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                            <button
                              id={`delete-task-${task.id}`}
                              onClick={() => deleteTask(task.id)}
                              aria-label="Delete task"
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          Due: {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

