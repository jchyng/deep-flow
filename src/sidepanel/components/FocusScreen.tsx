import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SessionData } from '../types';
import { TimerRing } from './ui/TimerRing';
import { Tooltip } from './ui/Tooltip';
import { Pause, Play, X, Check, Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../services/audioService';

interface FocusScreenProps {
  data: SessionData;
  onComplete: (actualMinutes?: number) => void;
  onCancel: () => void;
  themeToggle: React.ReactNode;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({ data, onComplete, onCancel, themeToggle }) => {
  const totalSeconds = data.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync state from background on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
      if (!response) return;

      if (response.status === 'running') {
        const timeLeftMs = response.timeLeft || 0;
        setSecondsLeft(Math.max(0, Math.ceil(timeLeftMs / 1000)));
        setIsPaused(false);
      } else if (response.status === 'paused') {
        const timeLeftMs = response.timeLeft || 0;
        setSecondsLeft(Math.max(0, Math.ceil(timeLeftMs / 1000)));
        setIsPaused(true);
      }
      setIsInitialized(true);
    });
  }, []);

  // Poll background for accurate time when running
  useEffect(() => {
    if (!isInitialized || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
        if (!response) return;
        if (response.status === 'running') {
          const timeLeftMs = response.timeLeft || 0;
          const secs = Math.max(0, Math.ceil(timeLeftMs / 1000));
          setSecondsLeft(secs);
        }
      });
    };

    intervalRef.current = window.setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInitialized, isPaused]);

  // Listen for completion from background
  // Note: Main completion handling is in App.tsx to avoid duplicate processing
  useEffect(() => {
    const listener = (message: { type: string }) => {
      if (message.type === 'TIMER_COMPLETE') {
        // Just stop local audio - App.tsx handles state transition
        audioService.stop();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { audioService.stop(); };
  }, []);

  // Audio control
  useEffect(() => {
    if (isPaused) {
      audioService.toggle(false);
    } else if (!isMuted) {
      audioService.toggle(true);
    }
  }, [isPaused, isMuted]);

  const toggleAudio = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    audioService.toggle(!newState);
  };

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      chrome.runtime.sendMessage({ type: 'RESUME_TIMER' }, () => {
        setIsPaused(false);
      });
    } else {
      chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' }, () => {
        setIsPaused(true);
      });
    }
  }, [isPaused]);

  const handleEarlyComplete = () => {
    audioService.stop();
    chrome.runtime.sendMessage({ type: 'COMPLETE_EARLY' }, (response) => {
      if (response?.success) {
        onComplete(response.elapsedMinutes);
      }
    });
  };

  const handleCancel = () => {
    audioService.stop();
    onCancel();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progress = (secondsLeft / totalSeconds) * 100;

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-focus-bg text-focus-text overflow-hidden transition-colors duration-1000">
      {/* Background Ambience Hint */}
      {!isMuted && !isPaused && (
        <div className="absolute inset-0 bg-focus-accent/5 pointer-events-none animate-pulse-slow" />
      )}

      {/* Top Bar */}
      <header className="w-full px-4 pt-4 pb-2 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          {themeToggle}
          <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-focus-accent animate-pulse'}`} />
          <span className="text-xs font-mono tracking-widest text-focus-muted uppercase">FOCUS</span>
        </div>
        <Tooltip content={isMuted ? "Play ambient sound" : "Mute ambient sound"}>
          <button
            onClick={toggleAudio}
            className="text-focus-muted hover:text-focus-text-strong transition-colors p-1"
            aria-label={isMuted ? "Unmute Background Music" : "Mute Background Music"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-focus-accent" />}
          </button>
        </Tooltip>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="mb-8 text-center animate-fade-in select-none">
          <h2 className="text-lg font-light leading-tight tracking-tight text-focus-text-strong/90">
            Focusing on <span className="text-focus-accent font-medium">{data.task}</span>
            <br />for <span className="font-mono text-focus-text-strong">{data.durationMinutes} min</span>
          </h2>
        </div>

        <div className="relative mb-8 cursor-default">
          <TimerRing progress={progress} radius={100} stroke={2} color={isPaused ? "stroke-yellow-500/50" : "stroke-focus-accent"} />
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            {/* Screen reader announcement for timer */}
            <span 
              aria-live="polite" 
              aria-atomic="true"
              className="sr-only"
            >
              {minutes} minutes and {seconds} seconds remaining
            </span>
            <span className={`text-5xl font-mono font-light tracking-tighter tabular-nums select-none transition-colors ${isPaused ? 'text-focus-text-strong/50' : 'text-focus-text-strong'}`}>
              {formattedTime}
            </span>
            <span className="text-xs text-focus-muted mt-2 font-light tracking-widest uppercase">
              {isPaused ? 'PAUSED' : 'REMAINING'}
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="w-full flex justify-center gap-4 pb-8 pt-4 z-20">
        <Tooltip content={isPaused ? "Resume session" : "Pause session"}>
          <button
            onClick={handlePauseResume}
            className="p-3.5 rounded-full bg-focus-hover hover:bg-focus-hover-strong text-focus-text-strong transition-colors border border-focus-ring-bg"
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} />}
          </button>
        </Tooltip>

        {isPaused && (
          <>
            <Tooltip content="Complete now and save">
              <button
                onClick={handleEarlyComplete}
                className="p-3.5 rounded-full bg-focus-accent/10 hover:bg-focus-accent/20 text-focus-accent transition-colors border border-focus-accent/10"
                aria-label="Complete Early"
              >
                <Check size={20} />
              </button>
            </Tooltip>

            <Tooltip content="Cancel without saving">
              <button
                onClick={handleCancel}
                className="p-3.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/10"
                aria-label="Cancel Session"
              >
                <X size={20} />
              </button>
            </Tooltip>
          </>
        )}
      </footer>
    </div>
  );
};
