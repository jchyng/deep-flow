import React, { useState } from "react";
import { SessionData } from "../types";
import { Tooltip } from "./ui/Tooltip";
import { ArrowRight, Clock, History } from "lucide-react";

interface SetupScreenProps {
  onStart: (data: SessionData) => void;
  onViewHistory: () => void;
  themeToggle: React.ReactNode;
  initialTask?: string;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStart,
  onViewHistory,
  themeToggle,
  initialTask,
}) => {
  const [task, setTask] = useState(initialTask || "");
  const [duration, setDuration] = useState(30);
  const [showTaskError, setShowTaskError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      setShowTaskError(false);
      onStart({ task, durationMinutes: duration });
    } else {
      setShowTaskError(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-5 py-8 animate-fade-in relative">
      {/* Top bar: theme toggle (left) + history (right) */}
      <div className="absolute top-4 left-4">{themeToggle}</div>
      <div className="absolute top-4 right-4">
        <Tooltip content="View session history">
          <button
            onClick={onViewHistory}
            className="p-2 text-focus-muted hover:text-focus-accent hover:bg-focus-hover rounded-full transition-all"
            aria-label="View History"
          >
            <History size={20} />
          </button>
        </Tooltip>
      </div>

      <div className="w-full space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-focus-text">
            Deep Flow
          </h1>
          <p className="text-sm text-focus-muted">Ready to focus?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-focus-muted uppercase tracking-wider text-center">
              What will you focus on?
            </label>
            <input
              type="text"
              value={task}
              onChange={(e) => {
                setTask(e.target.value);
                if (e.target.value.trim()) {
                  setShowTaskError(false);
                }
              }}
              className={`w-full bg-transparent border-b-2 ${
                showTaskError ? "border-red-500" : "border-focus-border"
              } text-2xl py-2 focus:border-focus-accent focus:outline-none transition-colors text-center text-focus-text placeholder-focus-placeholder`}
              placeholder="e.g. Read chapter 5"
              autoFocus
            />
            {showTaskError && (
              <p className="text-red-500 text-sm text-center mt-2">
                Please enter a task title.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-focus-muted uppercase tracking-wider flex items-center justify-center gap-2">
              <Clock size={14} /> Duration (min)
            </label>
            <div className="flex justify-center gap-3">
              {[15, 30, 45, 60].map((mins) => (
                <Tooltip
                  key={mins}
                  content={`${mins} minute session`}
                >
                  <button
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-4 py-2.5 rounded-full text-base transition-all duration-300 ${
                      duration === mins
                        ? "bg-focus-accent text-focus-bg font-bold shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                        : "bg-focus-hover text-focus-muted hover:bg-focus-hover-strong"
                    }`}
                  >
                    {mins}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="group flex items-center gap-3 px-7 py-3.5 bg-focus-hover hover:bg-focus-accent hover:text-focus-bg rounded-full transition-all duration-300 border border-focus-border hover:border-transparent"
            >
              <span className="text-lg tracking-wide">Start Focus</span>
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
