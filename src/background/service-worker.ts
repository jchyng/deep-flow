const ALARM_NAME = 'deep-flow-timer';

interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  task: string;
  durationMinutes: number;
  endTime: number; // timestamp ms
  pausedTimeLeft: number; // ms remaining when paused
}

const DEFAULT_STATE: TimerState = {
  status: 'idle',
  task: '',
  durationMinutes: 0,
  endTime: 0,
  pausedTimeLeft: 0,
};

async function getTimerState(): Promise<TimerState> {
  const result = await chrome.storage.session.get('timerState');
  return result.timerState || { ...DEFAULT_STATE };
}

async function setTimerState(state: TimerState): Promise<void> {
  await chrome.storage.session.set({ timerState: state });
}

async function closeOffscreen(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

// Wait for offscreen document to be ready
function waitForOffscreenReady(): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      resolve(); // Resolve anyway after timeout
    }, 1000);

    const listener = (message: { type: string }) => {
      if (message.type === 'OFFSCREEN_READY') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(listener);
        resolve();
      }
    };

    chrome.runtime.onMessage.addListener(listener);
  });
}

async function playSound(file: string): Promise<void> {
  console.log("Calling playSound for:", file);
  try {
    await closeOffscreen();
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Play sound: ' + file,
    });
    
    // Wait for offscreen document to signal it's ready
    await waitForOffscreenReady();
    
    chrome.runtime.sendMessage({ type: 'PLAY_SOUND', file });
  } catch (e) {
    console.error('Failed to play sound:', e);
  }
}

async function handleTimerComplete(): Promise<void> {
  const state = await getTimerState();
  const task = state.task;
  const durationMinutes = state.durationMinutes;

  await setTimerState({ ...DEFAULT_STATE, status: 'completed', task, durationMinutes });

  // Show notification
  chrome.notifications.create('deep-flow-complete', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Deep Flow Timer',
    message: `Your focus session on "${task}" has ended.`,
    priority: 2,
  });

  // Play timer alarm, then completion chime
  await playSound('timer.wav');
  setTimeout(() => playSound('completed.wav'), 3000);

  // Notify side panel
  try {
    chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', payload: { task, durationMinutes } });
  } catch {
    // Side panel might be closed
  }
}

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    handleTimerComplete();
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handleMessage = async () => {
    switch (message.type) {
      case 'START_TIMER': {
        const { task, durationMinutes } = message.payload;
        const endTime = Date.now() + durationMinutes * 60 * 1000;

        await chrome.alarms.create(ALARM_NAME, { when: endTime });
        await setTimerState({
          status: 'running',
          task,
          durationMinutes,
          endTime,
          pausedTimeLeft: 0,
        });

        sendResponse({ success: true });
        break;
      }

      case 'PAUSE_TIMER': {
        const state = await getTimerState();
        if (state.status !== 'running') {
          sendResponse({ success: false });
          return;
        }

        const timeLeft = state.endTime - Date.now();
        await chrome.alarms.clear(ALARM_NAME);
        await setTimerState({
          ...state,
          status: 'paused',
          pausedTimeLeft: Math.max(0, timeLeft),
        });

        sendResponse({ success: true });
        break;
      }

      case 'RESUME_TIMER': {
        const state = await getTimerState();
        if (state.status !== 'paused') {
          sendResponse({ success: false });
          return;
        }

        const newEndTime = Date.now() + state.pausedTimeLeft;
        await chrome.alarms.create(ALARM_NAME, { when: newEndTime });
        await setTimerState({
          ...state,
          status: 'running',
          endTime: newEndTime,
          pausedTimeLeft: 0,
        });

        sendResponse({ success: true });
        break;
      }

      case 'CANCEL_TIMER': {
        await chrome.alarms.clear(ALARM_NAME);
        await setTimerState({ ...DEFAULT_STATE });
        sendResponse({ success: true });
        break;
      }

      case 'COMPLETE_EARLY': {
        const state = await getTimerState();
        await chrome.alarms.clear(ALARM_NAME);

        const totalMs = state.durationMinutes * 60 * 1000;
        const remainingMs = state.status === 'paused'
          ? state.pausedTimeLeft
          : Math.max(0, state.endTime - Date.now());
        const elapsedMs = totalMs - remainingMs;
        const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

        await setTimerState({
          ...DEFAULT_STATE,
          status: 'completed',
          task: state.task,
          durationMinutes: elapsedMinutes,
        });

        // Play only completion chime (no timer alarm for early complete)
        await playSound('completed.wav');

        sendResponse({ success: true, elapsedMinutes });
        break;
      }

      case 'GET_TIMER_STATE': {
        const state = await getTimerState();

        if (state.status === 'running') {
          const timeLeft = Math.max(0, state.endTime - Date.now());
          sendResponse({ ...state, timeLeft });
        } else if (state.status === 'paused') {
          sendResponse({ ...state, timeLeft: state.pausedTimeLeft });
        } else {
          sendResponse({ ...state, timeLeft: 0 });
        }
        break;
      }

      case 'ACK_COMPLETE': {
        await setTimerState({ ...DEFAULT_STATE });
        sendResponse({ success: true });
        break;
      }

      default:
        break;
    }
  };

  handleMessage();
  return true; // Keep message channel open for async response
});

// Open side panel on action click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

