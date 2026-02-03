import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Clock, Calendar, PenLine, StickyNote, Trash2, Check, X } from 'lucide-react';
import { SessionRecord } from '../types';
import { Tooltip } from './ui/Tooltip';
import { storageService } from '../services/storageService';

interface HistoryScreenProps {
  onBack: () => void;
  themeToggle: React.ReactNode;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, themeToggle }) => {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState('');
  const [editInsight, setEditInsight] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    const data = await storageService.getHistory();
    setHistory(data);
    const total = await storageService.getTotalMinutes();
    setTotalMinutes(total);
  };

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    if (editingId && taskInputRef.current) {
      taskInputRef.current.focus();
    }
  }, [editingId]);

  const startEdit = (record: SessionRecord) => {
    setEditingId(record.id);
    setEditTask(record.task);
    setEditInsight(record.insight || '');
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editTask.trim()) return;
    await storageService.updateSession(editingId, {
      task: editTask.trim(),
      insight: editInsight.trim(),
    });
    setEditingId(null);
    await loadHistory();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancelEdit();
  };

  const confirmDelete = async (id: string) => {
    await storageService.deleteSession(id);
    setDeletingId(null);
    await loadHistory();
  };

  return (
    <div className="flex flex-col min-h-screen w-full px-4 py-6 bg-focus-bg text-focus-text animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Tooltip content="Back to setup">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full hover:bg-focus-hover text-focus-muted hover:text-focus-text-strong transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        </Tooltip>
        <h2 className="text-lg font-light tracking-wide">History</h2>
        {themeToggle}
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-focus-surface to-focus-bg border border-focus-ring-bg rounded-xl p-5 mb-6 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-focus-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="text-xs font-bold text-focus-accent uppercase tracking-wider">Total Focus Time</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-4xl font-mono font-light text-focus-text-strong">
              {Math.floor(totalMinutes / 60)}
            </span>
            <span className="text-xs text-focus-muted">hr</span>
            <span className="text-4xl font-mono font-light text-focus-text-strong ml-1.5">
              {totalMinutes % 60}
            </span>
            <span className="text-xs text-focus-muted">min</span>
          </div>
          <p className="text-xs text-focus-muted mt-3">
            {history.length} session{history.length !== 1 ? 's' : ''} completed.
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-6 space-y-3">
        {history.length === 0 ? (
          <div className="text-center text-focus-muted py-8 text-sm">
            No sessions yet.<br />Start your first focus session.
          </div>
        ) : (
          history.map((record) => (
            <div key={record.id} className="bg-focus-hover border border-focus-ring-bg rounded-lg p-4 hover:border-focus-accent/30 transition-colors group">

              {editingId === record.id ? (
                /* ---- Edit Mode ---- */
                <div className="space-y-3" onKeyDown={handleEditKeyDown}>
                  <input
                    ref={taskInputRef}
                    value={editTask}
                    onChange={(e) => setEditTask(e.target.value)}
                    className="w-full bg-focus-hover border border-focus-border rounded-lg px-3 py-1.5 text-sm text-focus-text-strong focus:border-focus-accent focus:outline-none transition-colors"
                    placeholder="Task name"
                  />
                  <textarea
                    value={editInsight}
                    onChange={(e) => setEditInsight(e.target.value)}
                    className="w-full bg-focus-hover border border-focus-border rounded-lg px-3 py-1.5 text-xs text-focus-text-strong/80 focus:border-focus-accent focus:outline-none transition-colors resize-none h-16"
                    placeholder="Notes (optional)"
                  />
                  <div className="flex justify-end gap-2">
                    <Tooltip content="Cancel editing">
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-md text-focus-muted hover:text-focus-text-strong hover:bg-focus-hover transition-colors"
                        aria-label="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Save changes">
                      <button
                        onClick={saveEdit}
                        className="p-1.5 rounded-md text-focus-accent hover:bg-focus-accent/10 transition-colors"
                        aria-label="Save"
                      >
                        <Check size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ) : deletingId === record.id ? (
                /* ---- Delete Confirm ---- */
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-400">Delete this session?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-2.5 py-1 rounded-md text-xs text-focus-muted hover:text-focus-text-strong hover:bg-focus-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDelete(record.id)}
                      className="px-2.5 py-1 rounded-md text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* ---- View Mode ---- */
                <>
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-sm font-medium text-focus-text-strong/90">{record.task}</h3>
                    <span className="flex items-center gap-1 text-[10px] text-focus-accent bg-focus-accent/10 px-1.5 py-0.5 rounded-full font-mono shrink-0 ml-2">
                      <Clock size={10} /> {record.durationMinutes}m
                    </span>
                  </div>
                  {record.insight && (
                    <div className="flex gap-2 mt-2 mb-2">
                      <StickyNote size={12} className="text-focus-muted shrink-0 mt-0.5" />
                      <p className="text-xs text-focus-text-strong/80 leading-relaxed whitespace-pre-wrap">
                        {record.insight}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-focus-ring-bg">
                    <div className="flex items-center gap-1.5 text-[10px] text-focus-muted">
                      <Calendar size={10} />
                      {new Date(record.completedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content="Edit session">
                        <button
                          onClick={() => startEdit(record)}
                          className="p-1 rounded text-focus-muted hover:text-focus-accent transition-colors"
                          aria-label="Edit"
                        >
                          <PenLine size={12} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete session">
                        <button
                          onClick={() => { setDeletingId(record.id); setEditingId(null); }}
                          className="p-1 rounded text-focus-muted hover:text-red-400 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
