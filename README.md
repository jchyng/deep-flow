<div align="center">

<img src="public/icons/icon128.png" width="80" />

# Deep Flow

**A minimal focus timer Chrome extension for deep work.**

Set a task, start the timer, and stay focused — right in your browser's side panel.

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

<br />

## ✨ Features

| | Feature | Description |
|:---:|---|---|
| ⏱️ | **Focus Sessions** | 15 / 30 / 45 / 60 minute presets to match your workflow |
| 🎵 | **Ambient Audio** | Optional background sound to help you stay in the zone |
| ⏸️ | **Pause & Resume** | Step away and pick up right where you left off |
| ✅ | **Early Complete** | Finish ahead of schedule and still save your progress |
| 📊 | **Session History** | Review past sessions with total focus time tracked |
| 📝 | **Reflection Notes** | Capture what you accomplished after each session |
| 🎨 | **Theme Support** | Dark / Light / System — follows your OS or manual toggle |
| 🔔 | **Notifications** | Sound alert and browser notification on completion |

<br />

## 📸 Screenshots

<div align="center">

| Setup | Focus | Complete |
|:---:|:---:|:---:|
| <img src="assets/screenshots/Frame 1.png" width="240" /> | <img src="assets/screenshots/Frame 2.png" width="240" /> | <img src="assets/screenshots/Frame 3.png" width="240" /> |

| History | Dark Mode |
|:---:|:---:|
| <img src="assets/screenshots/Frame 4.png" width="240" /> | <img src="assets/screenshots/Frame 5.png" width="240" /> |

</div>

<br />

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Chrome browser

### Install & Build

```bash
git clone https://github.com/jchyng/deep-flow.git
cd deep-flow
npm install
npm run build
```

### 🧩 Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist` folder
5. Click the Deep Flow icon in your toolbar to open the side panel

### 💻 Development

```bash
npm run dev
```

Runs the side panel UI at `localhost:5173` with hot reload.
Chrome APIs are mocked automatically in the dev environment.

<br />

## 🛠️ Tech Stack

| | Technology | Role |
|:---:|---|---|
| ⚛️ | **React 19** | UI framework |
| 🟦 | **TypeScript 5.8** | Type safety |
| 🌊 | **Tailwind CSS v4** | Styling |
| ⚡ | **Vite** | Build & dev server |
| 🧩 | **Chrome MV3** | Side panel, service worker, offscreen audio |

<br />

## 📁 Project Structure

```
deep-flow/
├── 📦 public/
│   ├── manifest.json            # Extension manifest (MV3)
│   ├── 🖼️ icons/                # Extension icons
│   └── 🔊 sounds/               # Timer & completion audio
├── 🔧 scripts/
│   └── build-extension.mjs      # Post-build packaging script
└── 📂 src/
    ├── 🔄 background/
    │   └── service-worker.ts    # Alarm, timer state, sound playback
    ├── 🔇 offscreen/
    │   └── offscreen.ts         # Offscreen doc for audio API access
    └── 🖥️ sidepanel/
        ├── App.tsx               # Root component & state machine
        ├── 🧱 components/        # Setup, Focus, Completion, History screens
        │   └── ui/               # ThemeToggle, TimerRing, Tooltip
        ├── ⚙️ services/          # audioService, storageService
        └── 🧪 dev/
            └── chromeMock.ts     # Chrome API mock for local dev
```

<br />

## 🔒 Privacy

Deep Flow runs **entirely on your device**.
No accounts, no analytics, no network requests — your data never leaves your browser.

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full details.

<br />

## 📄 License

[MIT](LICENSE)

<div align="center">
<sub>Built with ☕ for deep work.</sub>
</div>
