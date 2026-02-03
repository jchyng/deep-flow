import React, { useState } from "react";
import { SessionData } from "../types";
import { Check, RefreshCcw, PenLine, ArrowRight } from "lucide-react";
import { storageService } from "../services/storageService";

interface CompletionScreenProps {
  data: SessionData;
  onReset: () => void;
  themeToggle: React.ReactNode;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  data,
  onReset,
  themeToggle,
}) => {
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    await storageService.saveSession({
      ...data,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      insight: note.trim(),
    });
    setIsSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-focus-bg text-focus-text animate-fade-in px-5 py-8 relative">
        <div className="absolute top-4 left-4">{themeToggle}</div>
        <div className="w-16 h-16 rounded-full bg-focus-accent/10 flex items-center justify-center mb-6 border border-focus-accent/20 shadow-[0_0_40px_rgba(45,212,191,0.1)]">
          <Check size={32} className="text-focus-accent" />
        </div>

        <h1 className="text-2xl font-light mb-2">Saved</h1>
        <p className="text-sm text-focus-muted mb-8 text-center">
          Your session has been recorded successfully.
        </p>

        <div className="w-full bg-focus-hover border border-focus-border rounded-xl p-5 mb-8">
          <h3 className="text-xs font-bold text-focus-accent uppercase tracking-wider mb-2">
            My Log
          </h3>
          <p className="text-sm text-focus-text-strong/90 leading-relaxed whitespace-pre-wrap">
            {note || ""}
          </p>
        </div>

        <button
          onClick={onReset}
          className="group flex items-center gap-2 text-focus-muted hover:text-focus-text-strong transition-colors px-5 py-2.5 rounded-full hover:bg-focus-hover"
        >
          <RefreshCcw
            size={16}
            className="group-hover:rotate-180 transition-transform duration-500"
          />
          <span className="text-sm">Start new session</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-focus-bg text-focus-text animate-fade-in px-5 py-8 relative">
      <div className="absolute top-4 left-4">{themeToggle}</div>
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light text-focus-text-strong">Session Complete</h1>
          <p className="text-sm text-focus-muted">
            You focused on{" "}
            <span className="text-focus-text-strong font-medium mx-1">{data.task}</span>
            for{" "}
            <span className="text-focus-accent font-medium">
              {data.durationMinutes} min
            </span>
            .
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-focus-muted">
            <PenLine size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Reflection
            </span>
          </div>

          <div className="relative">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you accomplish in this session?"
              className="w-full h-32 bg-focus-hover border border-focus-border rounded-xl p-4 text-sm focus:border-focus-accent focus:ring-1 focus:ring-focus-accent focus:outline-none transition-all resize-none placeholder-focus-placeholder text-focus-text-strong/90"
              autoFocus
            />
            <div className="absolute bottom-3 right-3 text-xs text-focus-placeholder">
              Enter to save
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full group flex items-center justify-center gap-2 px-6 py-3 bg-focus-accent text-focus-bg hover:bg-focus-accent/90 rounded-xl transition-all duration-300 font-bold text-sm shadow-[0_0_20px_rgba(45,212,191,0.2)]"
        >
          <span>Save</span>
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>

        <div className="flex justify-center">
          <button
            onClick={onReset}
            className="text-xs text-focus-muted hover:text-focus-text-strong transition-colors"
          >
            Skip and finish
          </button>
        </div>
      </div>
    </div>
  );
};
