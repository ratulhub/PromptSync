<div align="center">

# 🔄 PromptSync PRO

**Your context. Synced with AI.**

[![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)](#)
[![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local-brightgreen.svg)](#privacy--security)

> Stop repeating yourself. PromptSync automatically injects your personal context into every AI chat — so you get smarter, more relevant answers without typing your preferences every time.

**Works on:** ChatGPT · Claude · Gemini · Perplexity · DeepSeek

---

<video src="YOUR_VIDEO_LINK.mp4" autoplay loop muted playsinline width="100%"></video>

> 📺 *See PromptSync in action — context injected automatically, every time.*

</div>

---

## Table of Contents

- [What is PromptSync?](#what-is-promptsync)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
  - [Multi-Profile System](#1-multi-profile-system)
  - [Role-Based Engine](#2-role-based-engine-new-in-v310)
  - [Smart Context Injection](#3-smart-context-injection)
  - [Slash Commands](#4-slash-commands)
  - [Custom Commands](#5-custom-commands)
  - [Task Modes](#6-task-modes)
  - [Saved Context Notes](#7-saved-context-notes)
  - [Preview System](#8-preview-system-new-in-v310)
  - [Floating Panel & Token Tracking](#9-floating-panel--token-tracking)
  - [Memory Decay](#10-memory-decay)
  - [Security Guard](#11-security-guard)
  - [Profile Auto-Switch](#12-profile-auto-switch)
  - [Customizable Template](#13-customizable-template)
  - [Import & Export](#14-import--export)
  - [Dark Mode](#15-dark-mode)
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

It stores your profile and saved notes locally in Chrome, then silently prepends them to every message before it sends. The AI sees your full context + your question as one rich prompt — giving you smarter, personalized responses instantly.

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

## Installation

### Manual (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/ratulhub/promptsync.git
   ```
2. Open Chrome → go to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right)
4. Click **Load unpacked** → select the project folder
5. Pin the PromptSync icon to your Chrome toolbar

<video src="[YOUR_VIDEO_LINK.mp4](https://github.com/user-attachments/assets/c29fc815-5872-4ee4-a32b-56cb295e112e)" autoplay loop muted playsinline width="100%"></video>

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

### 2. Role-Based Engine *(New in v3.1.0)*

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

### 8. Preview System *(New in v3.1.0)*

Want to see exactly what's being injected before it sends?

1. Open popup → **Roles tab** → enable **Preview before sending**
2. Press Enter in the chat — PromptSync injects the context into the input box and **pauses**
3. Review or edit the text
4. Press Enter again to actually send

---

### 9. Floating Panel & Token Tracking

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

### 10. Memory Decay

Prevents your saved notes from becoming stale and bloated.

- Every note tracks a `lastUsed` timestamp
- After a configurable number of days (default: **7 days**), unused notes are flagged as stale
- A decay banner appears in the Saved tab → click **"Remove All Stale"** to clean up
- **Pinned notes are exempt** — they never decay

Configure in **Settings → Decay**.

---

### 11. Security Guard

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

### 12. Profile Auto-Switch

Automatically load the right profile when visiting each AI platform.

**Example mappings:**
- `claude.ai` → Student
- `chatgpt.com` → Developer
- `gemini.google.com` → Default

Configure in **Settings → Auto-Switch**. Toggle on/off without losing your mappings.

---

### 13. Customizable Template

Edit the exact format of the injected context block.

- Use placeholders: `{user_name}`, `{user_role}`, `{user_goals}`, `{memories}`, `{instruction}`
- Toggle each section on/off individually
- Changes apply to all future injections immediately

---

### 14. Import & Export

- **Export:** Settings → Advanced → Export Data → saves `promptsync-*.json`
- **Import:** Settings → Advanced → Import Data → select `.json` file

Exports include all profiles, notes, modes, commands, and settings. Input is validated on import.

---

### 15. Dark Mode

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
├── manifest.json                  — Manifest V3
├── background/
│   └── background.js              — Service worker (context menu, shortcuts, alarms)
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
│   └── storage.js                 — Central data layer (chrome.storage.local)
├── utils/
│   ├── tokenizer.js               — BPE token counting (o200k_base)
│   ├── contextEngine.js           — Smart context selection + template engine
│   ├── commandParser.js           — Slash command parser + custom commands
│   └── securityGuard.js           — Sensitive data detection
├── vendor/
│   └── o200k_base.js              — GPT tokenizer library
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**Storage keys (all in `chrome.storage.local`):**

| Key | Stores |
|-----|--------|
| `asm_profiles` | All profile data |
| `asm_items` | Saved context notes |
| `asm_settings` | All settings |
| `asm_task_modes` | Built-in + custom modes |
| `asm_custom_commands` | User-defined slash commands |
| `asm_template` | Injection template format |

---

## Privacy & Security

- **100% local** — all data stored in `chrome.storage.local`. Nothing ever leaves your device.
- **Zero network requests** — no analytics, no telemetry, no external API calls.
- **XSS prevention** — all output is HTML-escaped in display contexts.
- **Security Guard** — scans for API keys, passwords, and credit cards before every save.
- **No code execution** — custom commands use predefined action sets only. No `eval`.
- **Namespace isolation** — all DOM elements prefixed with `asm-` to avoid conflicts.

---

## Changelog

### v3.1.0
- **Role-Based Engine** — built-in professional roles with strict `[ROLE]` / `[STYLE]` formatting
- **Preview System** — review and edit injected context before sending
- **Fail-Safe Detection** — skips injection if you manually define a role in your message
- **Sandboxed Claude Counter** — dedicated isolated token counter for Claude

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

**PromptSync PRO v3.1.0 — Stop repeating. Start syncing.**

*Built by [MD. Abdur Rahim Ratul](https://ratul.site)*

<sub>Claude token counter inspired by <a href="https://github.com/she-llac/claude-counter">she-llac/claude-counter</a></sub>

</div>
