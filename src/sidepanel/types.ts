export enum AppState {
  SETUP = 'SETUP',
  FOCUS = 'FOCUS',
  COMPLETED = 'COMPLETED',
  HISTORY = 'HISTORY'
}

export interface SessionData {
  task: string;
  durationMinutes: number;
  startTime?: Date;
}

export interface SessionRecord extends SessionData {
  id: string;
  completedAt: string; // ISO String
  insight?: string;
}

// Message types for type-safe communication
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerState {
  status: TimerStatus;
  task: string;
  durationMinutes: number;
  endTime: number;
  pausedTimeLeft: number;
  timeLeft?: number;
}

// Messages from UI to Background
export type BackgroundMessage =
  | { type: 'START_TIMER'; payload: { task: string; durationMinutes: number } }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'CANCEL_TIMER' }
  | { type: 'COMPLETE_EARLY' }
  | { type: 'GET_TIMER_STATE' }
  | { type: 'ACK_COMPLETE' };

// Messages from Background to UI
export type UIMessage =
  | { type: 'TIMER_COMPLETE'; payload: { task: string; durationMinutes: number } };

// Messages for Offscreen document
export type OffscreenMessage =
  | { type: 'PLAY_SOUND'; file: string }
  | { type: 'OFFSCREEN_READY' };

// Response types
export interface TimerResponse {
  success?: boolean;
  elapsedMinutes?: number;
}
