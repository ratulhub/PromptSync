<div align="center">

# 🔄 PromptSync PRO

**Your context. Synced with AI.**

[![Version](https://img.shields.io/badge/version-3.1.1-blue.svg)](#)
[![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Firefox](https://img.shields.io/badge/Firefox-WebExtension-orange.svg)](https://extensionworkshop.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local-brightgreen.svg)](#privacy--security)
[![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox-blueviolet.svg)](#installation)

> Stop repeating yourself. PromptSync automatically injects your personal context into every AI chat — so you get smarter, more relevant answers without typing your preferences every time.

**Works on:** ChatGPT · Claude · Gemini · Perplexity · DeepSeek

**Runs on:** Chrome · Firefox · Edge · Brave · Opera · Firefox for Android · Zen Browser · Vivaldi

</div>

---

## Table of Contents

- [What is PromptSync?](#what-is-promptsync)
- [What's New in v3.1.1](#whats-new-in-v311)
- [Browser Support](#browser-support)
- [Installation](#installation)
  - [Chrome / Edge / Brave / Opera](#chrome--edge--brave--opera)
  - [Firefox / Firefox for Android](#firefox--firefox-for-android)
- [Quick Start](#quick-start)
- [Features](#features)
  - [Multi-Profile System](#1-multi-profile-system)
  - [Role-Based Engine](#2-role-based-engine)
  - [Smart Context Injection](#3-smart-context-injection)
  - [Slash Commands](#4-slash-commands)
  - [Custom Commands](#5-custom-commands)
  - [Task Modes](#6-task-modes)
  - [Saved Context Notes](#7-saved-context-notes)
  - [Preview System](#8-preview-system)
  - [Sandboxed Claude Counter](#9-sandboxed-claude-counter)
  - [Floating Panel & Token Tracking](#10-floating-panel--token-tracking)
  - [Memory Decay](#11-memory-decay)
  - [Security Guard](#12-security-guard)
  - [Profile Auto-Switch](#13-profile-auto-switch)
  - [Customizable Template](#14-customizable-template)
  - [Import & Export](#15-import--export)
  - [Dark Mode](#16-dark-mode)
- [The Popup Dashboard](#the-popup-dashboard)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Architecture](#architecture)
- [Privacy & Security](#privacy--security)
- [Changelog](#changelog)
- [Author](#author)
- [License](#license)

---

## What is PromptSync?

Every new AI chat starts from zero. You find yourself typing the same thing over and over:

> *"I'm a developer. I use React and TypeScript. Keep answers short."*

**PromptSync fixes this.**

It stores your profile and saved notes locally in your browser, then silently prepends them to every message before it sends. The AI sees your full context + your question as one rich prompt — giving you smarter, personalized responses instantly. And now, it works across **all major browsers**.

```
You type:      "How do I normalize a dataset?"

AI receives:   [USER CONTEXT START]
               Name: Ratul | Role: CSE Student, ML Learner
               Goals: Build real ML projects, master data science
               Memory: Uses Python, NumPy, Pandas — no code comments
               Instruction: Keep answer short. No extra explanation.
               [USER CONTEXT END]
               How do I normalize a dataset?
```

**Pipeline:** `User Input → Parse Commands → Build Context → Inject → Track Tokens`

---

## What's New in v3.1.1

> 🚀 **Headline Feature: Cross-Browser Support**

PromptSync PRO now runs natively on **Chrome and Firefox** — and by extension, all Chromium-based browsers (Edge, Brave, Opera) and Firefox for Android. One codebase. Two builds. Full parity.

| Change | Details |
|--------|---------|
| 🌐 **Cross-Browser Support** | Full feature parity on Chrome, Firefox, Edge, Brave, Opera, Firefox for Android |
| 🔧 **Unified Storage API** | Abstracted `browser.storage` / `chrome.storage` layer — works on both engines with zero code duplication |
| 🦊 **Firefox Manifest** | Separate `manifest.firefox.json` with `browser_specific_settings` for AMO submission |
| ⏱️ **Sandboxed Claude Counter** | Fully independent token counter running only on `claude.ai` |
| 🎭 **Role-Based Engine** | Strict `[ROLE]` / `[STYLE]` formatting with fail-safe detection |
| 👁️ **Preview System** | Review and edit injected context before sending |
| 📦 **Dual Build System** | `build.sh` now outputs `promptsync-chrome.zip` and `promptsync-firefox.zip` separately |

---

## Browser Support

| Browser | Engine | Support | Notes |
|---------|--------|---------|-------|
| **Chrome** | Chromium | ✅ Full | MV3 — Chrome Web Store ready |
| **Firefox** | Gecko | ✅ Full | WebExtension API — AMO ready |
| **Edge** | Chromium | ✅ Full | Load Chrome build directly |
| **Brave** | Chromium | ✅ Full | Load Chrome build directly |
| **Opera** | Chromium | ✅ Full | Load Chrome build directly |
| **Firefox for Android** | Gecko | ✅ Full | Install from Firefox Add-ons |

> **Note:** Safari is not currently supported. The floating panel's drag-and-drop relies on the Pointer Events API which has limited Safari compatibility.

---

## Installation

### Chrome / Edge / Brave / Opera

#### Step 1 — Build the Chrome package

```bash
git clone https://github.com/ratulhub/promptsync.git
cd promptsync
bash build.sh chrome
# Output: build/promptsync-chrome.zip  +  build/chrome/ (unpacked)
```

#### Step 2 — Load the extension

1. Open your browser and go to the extensions page:
   - **Chrome / Brave:** `chrome://extensions/`
   - **Edge:** `edge://extensions/`
   - **Opera:** `opera://extensions/`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **Load unpacked** → select the `build/chrome/` folder
4. Pin the **PromptSync** icon to your toolbar ✅

> Requires Chrome 88+ / Edge 88+ / Brave 1.20+ (Manifest V3).

<br>

<div align="center">

<video src="https://github.com/user-attachments/assets/c29fc815-5872-4ee4-a32b-56cb295e112e" autoplay loop muted playsinline width="90%"></video>

*📦 Installation walkthrough — follow along to get set up in under a minute.*

</div>

---

### Firefox / Firefox for Android

#### Step 1 — Build the Firefox package

```bash
git clone https://github.com/ratulhub/promptsync.git
cd promptsync
bash build.sh firefox
# Output: build/promptsync-firefox.zip  +  build/firefox/ (unpacked)
```

#### Step 2A — Temporary Load (about:debugging)

1. Open Firefox → navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on...**
4. Navigate to `build/firefox/` → select `manifest.json` ✅

> ⚠️ Temporary add-ons are removed when Firefox restarts. Use Step 2B for persistence.

#### Step 2B — Signed Installation (Persistent)

1. Open Firefox → go to `about:addons`
2. Click the **⚙️ gear icon** → **Install Add-on From File...**
3. Select `build/promptsync-firefox.zip` ✅

> The extension must be self-signed or published on [addons.mozilla.org](https://addons.mozilla.org) (AMO) for full persistence without Firefox Developer Edition.

#### Firefox for Android

1. Install **Firefox for Android** from the Google Play Store
2. Enable custom add-ons: Firefox menu → Settings → **About Firefox** → tap the logo 5× to unlock debug menu
3. Go to Settings → **Install Extension from File** → select `promptsync-firefox.zip`
4. Or install directly from the AMO listing once published ✅

---

## Quick Start

1. Click the PromptSync icon → open the popup
2. Go to **Profile tab** → fill in your name, role, and goals → **Save Profile**
3. Go to **Saved tab** → add context notes *(e.g. "I use Python for all projects")*
4. Open any supported AI site (ChatGPT, Claude, Gemini...)
5. Type a message and send — your context injects automatically ✅

You'll see a token badge (e.g. `85 tok`) on the page confirming it's active.

---

## Features

### 1. Multi-Profile System

Store multiple profiles for different roles and switch between them instantly.

| Built-in Profiles | What It Stores |
|-------------------|---------------|
| Default | General purpose |
| Student | Study-focused context |
| Developer | Coding-focused context |
| Custom | Anything you define |

Each profile holds: **Name, Role, Goals, Skills, Preferences, Custom Notes**

> **Tip:** Create profiles for Work, Study, Personal — switch from the popup dropdown in one click.

---

### 2. Role-Based Engine

Choose a professional role so the AI responds exactly how you need. Uses strict `[ROLE]` and `[STYLE]` formatting for reliable results.

| Role | AI Behavior |
|------|------------|
| 🧑‍💻 Developer | Clean minimal code, no unnecessary explanation |
| 🔬 Researcher | Thorough analysis, structured and sourced |
| 🎨 Designer | UI/UX focused, visual thinking |
| ✍️ Writer | Clear, structured, professional writing |
| 💼 Business | Formal, professional business-style answers |

You can also **create your own custom roles** from the Roles tab.

**Fail-Safe Detection:** If you type *"Act as..."* or *"You are a..."* manually, PromptSync detects it and skips injecting its own role — so it never conflicts with your intent.

---

### 3. Smart Context Injection

Builds a context block using your profile + selected notes before every message.

**Default template:**
```
[USER CONTEXT START]
Name: {user_name}
Role: {user_role}
Goals: {user_goals}
Memory: {memories}
Instruction: {instruction}
[USER CONTEXT END]
```

- Each section can be toggled on/off individually
- Template is fully editable from **Settings → Template**
- Notes are selected smartly based on keyword relevance to your message

---

### 4. Slash Commands

Type these directly in the chat input to control injection for that one message. Commands are removed before sending — the AI never sees them.

| Command | What It Does |
|---------|-------------|
| `/no-memory` | Skip all injection for this message |
| `/only-profile` | Inject profile only, skip saved notes |
| `/strict` | Inject name + pinned notes only |
| `/code` | Switch to coding mode |
| `/short` | Force the shortest possible answer |
| `/explain` | Allow full detailed explanation |
| `/detail` | Full context + detailed response |
| `/mode <name>` | Activate a named task mode |
| `/temp <text>` | Add session-only memory (not saved) |
| `/reset` | Revert to default injection behavior |

**Example:**
```
/code How do I debounce a React input?
```

---

### 5. Custom Commands

Create your own slash commands with predefined behaviors.

- Go to **Modes tab → Custom Commands → + New Command**
- Set a name (e.g. `/fast`) and define what it does:
  - Switch to a task mode
  - Enable/disable memory injection
  - Inject a custom instruction

No arbitrary code execution — only safe predefined actions.

---

### 6. Task Modes

Replace the default instruction with a specialized one for different types of work.

| Mode | Injected Instruction |
|------|---------------------|
| Coding | *"Give clean, minimal, working code. No explanation unless asked."* |
| Study | *"Explain simply step by step. Use easy words. Give examples."* |
| Short | *"Answer in the shortest possible way."* |
| Custom | Your own instruction text |

- Set globally from popup or floating panel
- Override per-message with `/mode <name>`
- Disable for one message with `/reset`

---

### 7. Saved Context Notes

A full note management system for persistent context.

| Feature | Detail |
|---------|--------|
| Text | The context content to inject |
| Tags | Labels for organization and filtering |
| Priority | High / Medium / Low — affects injection scoring |
| Pin | Always inject regardless of relevance |
| Enable/Disable | Toggle without deleting |
| Search | Filter by text or tag |
| Drag & Drop | Reorder notes visually |
| Bulk Delete | Select multiple and remove at once |

**How notes are selected:** Keywords are extracted from your message → each note is scored by keyword match + priority + pin bonus → top N notes are injected.

> **Right-click any text on a webpage** → *"Save to PromptSync"* to instantly create a note from selected content.

---

### 8. Preview System

Want to see exactly what's being injected before it sends?

1. Open popup → **Roles tab** → enable **Preview before sending**
2. Press Enter in the chat — PromptSync injects the context into the input box and **pauses**
3. Review or edit the text
4. Press Enter again to actually send

---

### 9. Sandboxed Claude Counter

A fully isolated, independent token counter running **exclusively on `claude.ai`** — never interfering with the core injection pipeline.

| Feature | Detail |
|---------|--------|
| Real-time BPE tokenization | Tracks input, memory, and session tokens live |
| Context window progress bar | Visual indicator for Claude's 200K window |
| Glassmorphism floating UI | Draggable panel integrated into the Claude interface |
| Zero conflicts | Sandboxed execution — completely independent from the core engine |

---

### 10. Floating Panel & Token Tracking

A persistent overlay on all supported AI pages.

**Token Badge** — always visible, shows current injection token count (e.g. `120 tok`). Click to expand the full panel.

**Full Panel controls:**
- Memory injection toggle (ON/OFF)
- Mode switcher dropdown
- Token breakdown: input / memory / session
- Context window progress bar (green → yellow → red)
- Session reset button

**Context window limits per platform:**

| Platform | Limit |
|----------|-------|
| ChatGPT | 128,000 tokens |
| Claude | 200,000 tokens |
| Gemini | 1,000,000 tokens |
| Perplexity | 16,000 tokens |
| DeepSeek | 64,000 tokens |

Token counting uses the **o200k_base BPE tokenizer** (same as GPT-4o) for accuracy. The panel is draggable — position saved across sessions.

---

### 11. Memory Decay

Prevents your saved notes from becoming stale and bloated.

- Every note tracks a `lastUsed` timestamp
- After a configurable number of days (default: **7 days**), unused notes are flagged as stale
- A decay banner appears in the Saved tab → click **"Remove All Stale"** to clean up
- **Pinned notes are exempt** — they never decay

Configure in **Settings → Decay**.

---

### 12. Security Guard

Scans note text for sensitive data before saving.

| Detected Pattern | Example |
|-----------------|---------|
| OpenAI API keys | `sk-...` |
| Stripe keys | `pk_live_...` |
| AWS access keys | `AKIA...` |
| GitHub tokens | `ghp_...` |
| Private keys | `-----BEGIN PRIVATE KEY-----` |
| Bearer tokens | `Bearer ...` |
| Passwords | `password:`, `secret:` |
| Credit cards | Luhn-validated 13–19 digit numbers |

Shows a warning with override option. Toggle in **Settings → Security**.

---

### 13. Profile Auto-Switch

Automatically load the right profile when visiting each AI platform.

**Example mappings:**
- `claude.ai` → Student
- `chatgpt.com` → Developer
- `gemini.google.com` → Default

Configure in **Settings → Auto-Switch**. Toggle on/off without losing your mappings.

---

### 14. Customizable Template

Edit the exact format of the injected context block.

- Use placeholders: `{user_name}`, `{user_role}`, `{user_goals}`, `{memories}`, `{instruction}`
- Toggle each section on/off individually
- Changes apply to all future injections immediately

---

### 15. Import & Export

- **Export:** Settings → Advanced → Export Data → saves `promptsync-*.json`
- **Import:** Settings → Advanced → Import Data → select `.json` file

Exports include all profiles, notes, modes, commands, and settings. Input is validated on import.

---

### 16. Dark Mode

Light / Dark / System (auto OS). Cycle with the button in the popup header. Glassmorphism effects on the floating panel and toast notifications.

---

## The Popup Dashboard

The popup has **5 tabs:**

| Tab | What's Inside |
|-----|--------------|
| **Profile** | Profile switcher, form fields, injection preview, token bar |
| **Saved** | Add/manage notes with tags, priority, pin, decay banner |
| **Modes** | Task modes + custom commands |
| **Settings** | Template, response control, security, decay, auto-switch, platforms, advanced |
| **Help** | All commands listed, tips, reset onboarding |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + M` | Open popup (Windows / Linux) |
| `Cmd + Shift + M` | Open popup (Mac) |
| Right-click selected text | *"Save to PromptSync"* — instantly save as a note |

---

## Architecture

```
promptsync/
├── manifest.json                  — Chrome / Chromium (Manifest V3)
├── manifest.firefox.json          — Firefox (WebExtension + browser_specific_settings)
├── build.sh                       — Dual build: promptsync-chrome.zip + promptsync-firefox.zip
├── background/
│   └── background.js              — Service worker (context menu, shortcuts, alarms)
├── claude-counter/                — Sandboxed Claude Token Counter (independent)
│   ├── content/
│   │   ├── bridge-client.js
│   │   ├── constants.js
│   │   ├── main.js
│   │   ├── tokens.js
│   │   └── ui.js
│   ├── injected/
│   │   └── bridge.js
│   ├── vendor/
│   │   └── o200k_base.js
│   └── styles.css
├── content/
│   ├── content.js                 — Core injection pipeline
│   ├── content.css                — All injected UI styles
│   ├── floatingPanel.js           — Token badge + control panel
│   └── onboarding.js              — First-run welcome overlay
├── popup/
│   ├── popup.html                 — 5-tab dashboard
│   ├── popup.js                   — All popup logic
│   └── popup.css                  — Styles with CSS variables
├── storage/
│   └── storage.js                 — Unified API: chrome.storage / browser.storage abstraction
├── utils/
│   ├── tokenizer.js               — BPE token counting (o200k_base)
│   ├── contextEngine.js           — Smart context selection + template engine
│   ├── commandParser.js           — Slash command parser + custom commands
│   ├── tokenTracker.js            — Token tracking integration
│   └── securityGuard.js           — Sensitive data detection
├── vendor/
│   └── o200k_base.js              — GPT tokenizer library (offline, bundled)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**Cross-Browser Storage Abstraction** (`storage/storage.js`):
```js
// Works on Chrome (chrome.*) and Firefox (browser.*)
const api = typeof browser !== "undefined" ? browser : chrome;
api.storage.local.get(keys, callback);
```

**Storage keys (all local — never synced to a server):**

| Key | Stores |
|-----|--------|
| `asm_profiles` | All profile data |
| `asm_items` | Saved context notes |
| `asm_settings` | All settings |
| `asm_task_modes` | Built-in + custom modes |
| `asm_roles` | Role-Based Engine data |
| `asm_custom_commands` | User-defined slash commands |
| `asm_template` | Injection template format |
| `asm_panel_position` | Floating panel coordinates |

---

## Privacy & Security

- **100% local** — all data stored in `chrome.storage.local` / `browser.storage.local`. Nothing ever leaves your device.
- **Zero network requests** — no analytics, no telemetry, no external API calls.
- **XSS prevention** — all output is HTML-escaped in display contexts.
- **Security Guard** — scans for API keys, passwords, and credit cards before every save.
- **No code execution** — custom commands use predefined action sets only. No `eval`.
- **Namespace isolation** — all DOM elements prefixed with `asm-` to avoid conflicts.
- **Open source** — inspect every line of code.

---

## Changelog

### v3.1.1 *(Latest)*
- 🌐 **Cross-Browser Support** — full parity on Chrome, Firefox, Edge, Brave, Opera, Firefox for Android
- 🔧 **Unified Storage API** — single `browser`/`chrome` abstraction layer, zero code duplication
- 📦 **Dual Build System** — `build.sh` outputs `promptsync-chrome.zip` and `promptsync-firefox.zip`
- 🦊 **Firefox Manifest** — dedicated `manifest.firefox.json` with `browser_specific_settings` for AMO
- ⏱️ **Sandboxed Claude Counter** — dedicated isolated token counter for Claude
- 🎭 **Role-Based Engine** — strict `[ROLE]` / `[STYLE]` formatting with fail-safe detection
- 👁️ **Preview System** — review and edit injected context before sending
- 🛡️ **Fail-Safe Detection** — skips role injection if you manually define a role in your message

### v3.0.0
- Multi-profile system with profile auto-switch per domain
- Floating panel with real-time BPE token tracking
- Memory decay system with configurable threshold
- Security Guard with Luhn credit card validation
- Custom commands + customizable task modes
- Editable injection template with per-section toggles
- Dark / Light / System theme with glassmorphism
- Onboarding 3-step overlay on first install

---

## Author

<div align="center">

**MD. Abdur Rahim Ratul**

[![Portfolio](https://img.shields.io/badge/Portfolio-ratul.site-blue?style=for-the-badge&logo=googlechrome)](https://ratul.site)
[![GitHub](https://img.shields.io/badge/GitHub-ratulhub-black?style=for-the-badge&logo=github)](https://github.com/ratulhub)

</div>

---

## License

[MIT](LICENSE) — © 2026 PromptSync PRO

---

<div align="center">

**PromptSync PRO v3.1.1 — Stop repeating. Start syncing.**

*Built by [MD. Abdur Rahim Ratul](https://ratul.site)*

<sub>Claude token counter inspired by <a href="https://github.com/she-llac/claude-counter">she-llac/claude-counter</a></sub>

</div>

---

*Generated By MD. Abdur Rahim Ratul*
