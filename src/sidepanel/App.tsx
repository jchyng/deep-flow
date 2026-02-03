import React, { useState, useEffect } from 'react';
import { AppState, SessionData } from './types';
import { SetupScreen } from './components/SetupScreen';
import { FocusScreen } from './components/FocusScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ThemeToggle } from './components/ui/ThemeToggle';

type Theme = 'dark' | 'light' | 'system';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'dark' | 'light') {
  document.documentElement.className = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#09090b' : '#f8f8fa');
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');

  // Load theme from storage on mount
  useEffect(() => {
    chrome.storage.local.get('theme', (result) => {
      const savedTheme: Theme = result.theme === 'light' ? 'light' : result.theme === 'dark' ? 'dark' : 'system';
      setTheme(savedTheme);
      applyTheme(savedTheme === 'system' ? getSystemTheme() : savedTheme);
    });
  }, []);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemTheme());
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    applyTheme(next === 'system' ? getSystemTheme() : next);
    chrome.storage.local.set({ theme: next });
  };

  // On mount, check if there's an active timer in the background
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
      if (response && response.status === 'running') {
        setSessionData({ task: response.task, durationMinutes: response.durationMinutes });
        setAppState(AppState.FOCUS);
      } else if (response && response.status === 'paused') {
        setSessionData({ task: response.task, durationMinutes: response.durationMinutes });
        setAppState(AppState.FOCUS);
      } else if (response && response.status === 'completed') {
        setSessionData({ task: response.task, durationMinutes: response.durationMinutes });
        setAppState(AppState.COMPLETED);
      }
      setIsLoading(false);
    });
  }, []);

  // Listen for timer completion from background
  useEffect(() => {
    const listener = (message: { type: string; payload?: { task: string; durationMinutes: number } }) => {
      if (message.type === 'TIMER_COMPLETE' && message.payload) {
        setSessionData({
          task: message.payload.task,
          durationMinutes: message.payload.durationMinutes,
        });
        setAppState(AppState.COMPLETED);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleStartSession = (data: SessionData) => {
    chrome.runtime.sendMessage(
      { type: 'START_TIMER', payload: { task: data.task, durationMinutes: data.durationMinutes } },
      () => {
        setSessionData(data);
        setAppState(AppState.FOCUS);
      }
    );
  };

  const handleCompleteSession = (actualMinutes?: number) => {
    if (actualMinutes !== undefined && sessionData) {
      setSessionData({ ...sessionData, durationMinutes: actualMinutes });
    }
    setAppState(AppState.COMPLETED);
  };

  const handleCancelSession = () => {
    chrome.runtime.sendMessage({ type: 'CANCEL_TIMER' }, () => {
      setAppState(AppState.SETUP);
    });
  };

  const handleReset = () => {
    chrome.runtime.sendMessage({ type: 'ACK_COMPLETE' }, () => {
      setAppState(AppState.SETUP);
      setSessionData(null);
    });
  };

  const handleViewHistory = () => {
    setAppState(AppState.HISTORY);
  };

  const handleBackFromHistory = () => {
    setAppState(AppState.SETUP);
  };

  const themeToggle = <ThemeToggle theme={theme} onToggle={toggleTheme} />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-focus-bg text-focus-muted">
        <div className="w-2 h-2 rounded-full bg-focus-accent animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-focus-bg text-focus-text font-sans antialiased selection:bg-focus-accent selection:text-focus-bg">
      {appState === AppState.SETUP && (
        <SetupScreen
          onStart={handleStartSession}
          onViewHistory={handleViewHistory}
          themeToggle={themeToggle}
          initialTask={sessionData?.task}
        />
      )}

      {appState === AppState.HISTORY && (
        <HistoryScreen onBack={handleBackFromHistory} themeToggle={themeToggle} />
      )}

      {appState === AppState.FOCUS && sessionData && (
        <FocusScreen
          data={sessionData}
          onComplete={handleCompleteSession}
          onCancel={handleCancelSession}
          themeToggle={themeToggle}
        />
      )}

      {appState === AppState.COMPLETED && sessionData && (
        <CompletionScreen
          data={sessionData}
          onReset={handleReset}
          themeToggle={themeToggle}
        />
      )}
    </div>
  );
};

export default App;
