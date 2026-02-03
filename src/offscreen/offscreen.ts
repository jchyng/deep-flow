// Offscreen document for playing sound files
// Service workers cannot use Audio APIs directly

function playSound(file: string): void {
  console.log("Playing sound:", file);
  const audio = new Audio(chrome.runtime.getURL(`sounds/${file}`));
  audio.play().catch((e) => console.error('Failed to play sound:', e));
}

chrome.runtime.onMessage.addListener((message) => {
  console.log("Offscreen received message:", message);
  if (message.type === 'PLAY_SOUND' && message.file) {
    playSound(message.file);
  }
});

// Signal that offscreen document is ready
chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' }).catch(() => {
  // Ignore errors if no listener
});
