import { SessionRecord } from "../types";

const KEY = 'deep_flow_history';

export const storageService = {
  saveSession: async (record: SessionRecord): Promise<void> => {
    const history = await storageService.getHistory();
    const updated = [record, ...history];
    await chrome.storage.local.set({ [KEY]: updated });
  },

  getHistory: async (): Promise<SessionRecord[]> => {
    try {
      const result = await chrome.storage.local.get(KEY);
      return result[KEY] || [];
    } catch {
      return [];
    }
  },

  updateSession: async (id: string, updates: Partial<Pick<SessionRecord, 'task' | 'insight'>>): Promise<void> => {
    const history = await storageService.getHistory();
    const updated = history.map((r) => r.id === id ? { ...r, ...updates } : r);
    await chrome.storage.local.set({ [KEY]: updated });
  },

  deleteSession: async (id: string): Promise<void> => {
    const history = await storageService.getHistory();
    const updated = history.filter((r) => r.id !== id);
    await chrome.storage.local.set({ [KEY]: updated });
  },

  getTotalMinutes: async (): Promise<number> => {
    const history = await storageService.getHistory();
    return history.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }
};
