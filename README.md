<div align="center">

# 🔄 PromptSync PRO

**Your context. Synced with AI.**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/your-repo/promptsync)
[![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local-brightgreen.svg)](#privacy)

> Stop repeating yourself. PromptSync automatically injects your personal context into every AI chat — so you get better, more relevant answers without typing your preferences every time.

**Works on:** ChatGPT · Claude · Gemini · Perplexity · DeepSeek

</div>

---

## 📖 Table of Contents

- [What is PromptSync?](#what-is-promptsync)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [User Manual](#user-manual)
- [Architecture](#architecture)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [License](#license)

---

## What is PromptSync?

Every new AI chat starts from zero. You find yourself typing *"I'm a developer, I use React, keep answers short"* hundreds of times across hundreds of sessions.

**PromptSync fixes this.**

It stores your profile and saved notes locally, then silently prepends them to every message before it sends. The AI sees your context + your question as a single, rich prompt — giving you smarter, more personalized responses instantly.

```
User types:    "What's the best way to handle async errors?"
AI receives:   [USER CONTEXT START]
               Name: Alex | Role: Senior React Developer
               Goals: Build scalable apps, avoid over-engineering
               Memory: Prefers TypeScript, uses React Query, dislikes Redux
               Instruction: Keep answer short. No extra explanation.
               [USER CONTEXT END]
               What's the best way to handle async errors?
```

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| F1 | **Multi-Profile System** | Store profiles for different roles (Default, Student, Developer, Custom) |
| F2 | **Profile Auto-Switch** | Auto-switch profiles per domain (claude.ai → Student, chatgpt.com → Dev) |
| F3 | **Smart Context Injection** | Customizable template with toggleable sections |
| F4 | **Token-Saving Mode** | Default short-answer instruction to reduce verbose responses |
| F5 | **Command System** | 12 built-in slash commands + user-defined custom commands |
| F6 | **Custom Commands** | Create `/fast`, `/deep` etc. with predefined action triggers |
| F7 | **Task Modes** | Coding / Study / Short modes with custom instruction text |
| F8 | **Saved Context Notes** | Tagged, prioritized, searchable notes with smart keyword matching |
| F9 | **Memory Decay** | Auto-suggests removal of stale, unused notes |
| F10 | **Security Guard** | Scans for API keys, passwords, credit cards before saving |
| F11 | **Custom Injection Template** | Edit exact format + placeholders of injected context |
| F12 | **Response Control** | Global custom instruction appended to every injection |
| F13 | **Floating Panel** | Token badge + control panel overlay on AI pages |
| F14 | **Real-Time Token Tracking** | Accurate BPE token counting with per-platform context window % |
| F15 | **Dark Mode** | Light / Dark / System with glassmorphism effects |
| F16 | **Onboarding** | First-run 3-step visual guide |

---

## Installation

### From Chrome Web Store *(recommended)*
> Coming soon — link will be added after review approval.

### Manual (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/your-username/promptsync.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer Mode** (top-right toggle)

4. Click **Load unpacked** and select the project folder

5. The PromptSync icon will appear in your Chrome toolbar

> **Note:** The extension uses Manifest V3 and requires Chrome 88+.

---

## Quick Start

1. Click the PromptSync icon in your toolbar
2. Go to the **Profile** tab and fill in your name, role, and goals
3. Go to the **Saved** tab and add a few context notes (e.g., "I prefer TypeScript")
4. Open ChatGPT, Claude, or any supported AI platform
5. Type a message and send — your context is injected automatically!

You'll see a small token badge (e.g., `120 tok`) on the page confirming injection is active.

---

## User Manual

→ See **[MANUAL.md](MANUAL.md)** for complete usage documentation including all commands, modes, settings, and advanced configuration.

---

## Architecture

```
manifest.json (Manifest V3)
├── background/background.js      Service worker (context menu, shortcuts, decay alarm)
├── storage/storage.js            Central data layer (profiles, notes, modes, settings)
├── utils/
│   ├── tokenizer.js              BPE token counter (o200k_base + heuristic fallback)
│   ├── contextEngine.js          Smart context selection + template engine
│   ├── commandParser.js          Slash command parser (built-in + custom)
│   └── securityGuard.js          Sensitive data scanner (API keys, CC, passwords)
├── content/
│   ├── content.js                Core injection pipeline + platform detection
│   ├── content.css               Injected UI styles
│   ├── floatingPanel.js          Token badge + floating control panel
│   └── onboarding.js             First-run overlay
├── popup/
│   ├── popup.html                5-tab dashboard UI
│   ├── popup.js                  All popup logic
│   └── popup.css                 CSS variables, light/dark, all components
└── vendor/o200k_base.js          GPT tokenizer library
```

### Supported Platforms

| Platform | Input Type | Context Window |
|----------|-----------|----------------|
| ChatGPT | ProseMirror | 128K tokens |
| Claude | ProseMirror | 200K tokens |
| Gemini | contenteditable | 1M tokens |
| Perplexity | textarea | 16K tokens |
| DeepSeek | textarea | 64K tokens |

---

## Privacy & Security

- ✅ **100% local** — All data stored in `chrome.storage.local`. Nothing ever leaves your device.
- ✅ **Zero network requests** — No analytics, no telemetry, no external API calls.
- ✅ **Security scanning** — Detects API keys, passwords, credit card numbers before saving
- ✅ **XSS prevention** — All output is HTML-escaped
- ✅ **No code execution** — Custom commands use predefined action sets only (no `eval`)
- ✅ **Input sanitization** — Length limits and type validation on import

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

[MIT](LICENSE) — © 2024 PromptSync
