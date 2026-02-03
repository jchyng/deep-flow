// Mock chrome APIs for local dev (npm run dev)
// Only applied when chrome.runtime is not available

if (typeof globalThis.chrome === 'undefined' || !globalThis.chrome?.runtime?.id) {
  console.log('[Dev] Chrome API mock loaded');

  const storage: Record<string, unknown> = {};
  const listeners: Array<(message: unknown) => void> = [];

  // --- Mock Helpers ---

  const mockPlaySound = (file: string) => {
    console.log(`[Dev] Playing sound: ${file}`);
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch(e => console.error('[Dev] Sound play failed:', e));
  };

  const mockShowNotification = (title: string, message: string) => {
    console.log(`[Dev] Showing notification: "${title}" - "${message}"`);
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/icons/icon128.png' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body: message, icon: '/icons/icon128.png' });
        }
      });
    }
  };


  // --- Timer mock state ---
  let timerState: {
    status: 'idle' | 'running' | 'paused' | 'completed';
    task: string;
    durationMinutes: number;
    endTime: number;
    pausedTimeLeft: number;
  } = {
    status: 'idle',
    task: '',
    durationMinutes: 0,
    endTime: 0,
    pausedTimeLeft: 0,
  };

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const handleMockTimerComplete = (isEarly: boolean = false) => {
    const sessionName = timerState.task;
    const sessionMins = isEarly
      ? timerState.durationMinutes - Math.ceil((timerState.endTime - Date.now()) / 60000)
      : timerState.durationMinutes;

    if (isEarly) {
      mockPlaySound('completed.wav');
    } else {
      mockShowNotification(
        'Deep Flow Timer',
        `Your focus session on "${sessionName}" has ended.`
      );
      mockPlaySound('timer.wav');
      setTimeout(() => mockPlaySound('completed.wav'), 3000);
      listeners.forEach(l => l({ type: 'TIMER_COMPLETE', payload: { task: sessionName, durationMinutes: sessionMins } }));
    }
    return Math.max(1, sessionMins);
  }

  (globalThis as any).chrome = {
    runtime: {
      id: 'dev-mock',
      sendMessage: (message: any, callback?: (response: any) => void) => {
        const cb = callback || (() => {});
        console.log('[Dev] sendMessage received:', message);

        switch (message.type) {
          case 'GET_TIMER_STATE': {
            if (timerState.status === 'running') {
              const timeLeft = timerState.endTime - Date.now();
              if (timeLeft <= 0) {
                clearTimer();
                timerState.status = 'completed';
                handleMockTimerComplete();
                cb({ status: 'completed', task: timerState.task, durationMinutes: timerState.durationMinutes });
              } else {
                cb({ status: 'running', task: timerState.task, durationMinutes: timerState.durationMinutes, timeLeft });
              }
            } else if (timerState.status === 'paused') {
              cb({ status: 'paused', task: timerState.task, durationMinutes: timerState.durationMinutes, timeLeft: timerState.pausedTimeLeft });
            } else if (timerState.status === 'completed') {
              cb({ status: 'completed', task: timerState.task, durationMinutes: timerState.durationMinutes });
            } else {
              cb({ status: 'idle' });
            }
            break;
          }
          case 'START_TIMER': {
            const { task, durationMinutes } = message.payload;
            timerState = {
              status: 'running',
              task,
              durationMinutes,
              endTime: Date.now() + durationMinutes * 60 * 1000,
              pausedTimeLeft: 0,
            };

            clearTimer();
            timerInterval = setInterval(() => {
              if (timerState.status === 'running' && Date.now() >= timerState.endTime) {
                clearTimer();
                timerState.status = 'completed';
                handleMockTimerComplete();
              }
            }, 1000);
            cb({});
            break;
          }
          case 'PAUSE_TIMER': {
            if (timerState.status === 'running') {
              timerState.pausedTimeLeft = timerState.endTime - Date.now();
              timerState.status = 'paused';
              clearTimer();
            }
            cb({});
            break;
          }
          case 'RESUME_TIMER': {
            if (timerState.status === 'paused') {
              timerState.endTime = Date.now() + timerState.pausedTimeLeft;
              timerState.status = 'running';
              clearTimer();
              timerInterval = setInterval(() => {
                if (timerState.status === 'running' && Date.now() >= timerState.endTime) {
                  clearTimer();
                  timerState.status = 'completed';
                  handleMockTimerComplete();
                }
              }, 1000);
            }
            cb({});
            break;
          }
          case 'CANCEL_TIMER': {
            clearTimer();
            timerState = { status: 'idle', task: '', durationMinutes: 0, endTime: 0, pausedTimeLeft: 0 };
            cb({});
            break;
          }
          case 'COMPLETE_EARLY': {
            clearTimer();
            timerState.status = 'completed';
            const elapsedMinutes = handleMockTimerComplete(true);
            cb({ success: true, elapsedMinutes });
            break;
          }
          case 'ACK_COMPLETE': {
            timerState = { status: 'idle', task: '', durationMinutes: 0, endTime: 0, pausedTimeLeft: 0 };
            cb({});
            break;
          }
          default:
            cb({});
        }
      },
      onMessage: {
        addListener: (fn: (message: unknown) => void) => { listeners.push(fn); },
        removeListener: (fn: (message: unknown) => void) => {
          const idx = listeners.indexOf(fn);
          if (idx >= 0) listeners.splice(idx, 1);
        },
      },
    },
    storage: {
      local: {
        get: (keys: string | string[], callback?: (result: Record<string, unknown>) => void) => {
          const keyArr = typeof keys === 'string' ? [keys] : keys;
          const result: Record<string, unknown> = {};
          keyArr.forEach(k => { if (k in storage) result[k] = storage[k]; });
          if (callback) {
            callback(result);
          } else {
            return Promise.resolve(result);
          }
        },
        set: (items: Record<string, unknown>, callback?: () => void) => {
          Object.assign(storage, items);
          if (callback) {
            callback();
          } else {
            return Promise.resolve();
          }
        },
      },
      session: {
        get: (keys: string | string[], callback?: (result: Record<string, unknown>) => void) => {
          const keyArr = typeof keys === 'string' ? [keys] : keys;
          const result: Record<string, unknown> = {};
          keyArr.forEach(k => { if (k in storage) result[k] = storage[k]; });
          if (callback) {
            callback(result);
          } else {
            return Promise.resolve(result);
          }
        },
        set: (items: Record<string, unknown>, callback?: () => void) => {
          Object.assign(storage, items);
          if (callback) {
            callback();
          } else {
            return Promise.resolve();
          }
        },
      },
    },
  };
}
