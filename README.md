<div align="center">

<img src="https://img.shields.io/badge/PromptSync-PRO-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="PromptSync PRO" />

# PromptSync PRO

**Your context. Synced with AI.**

*Stop repeating yourself. Start getting smarter responses.*

[![Version](https://img.shields.io/badge/version-3.1.0-6366f1?style=flat-square)](https://github.com)
[![Manifest](https://img.shields.io/badge/Manifest-V3-blue?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-22c55e?style=flat-square)](#privacy)
[![Platforms](https://img.shields.io/badge/Works%20on-5%20AI%20Platforms-f59e0b?style=flat-square)](#platform-support)

Works on → **ChatGPT · Claude · Gemini · Perplexity · DeepSeek**

</div>

---

## The Problem

Every new AI chat starts from zero.

You type *"I'm a CS student, keep answers short, I use Python"* — again and again and again.

## The Fix

PromptSync stores your profile and notes **locally on your device**, then silently injects them into every message you send. The AI sees your full context + your question as one combined prompt — automatically.

```
You type  →  "How do I sort a list?"
AI sees   →  [Your profile + preferences + notes]  +  "How do I sort a list?"
Result    →  Precise, personalized answer. Zero extra typing.
```

**All data stays in `chrome.storage.local`. No servers. No telemetry. Nothing leaves your device. Ever.**

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

> Requires Chrome 88+ (Manifest V3).

<br>
<div align="center">
<video src="https://github.com/user-attachments/assets/c29fc815-5872-4ee4-a32b-56cb295e112e" autoplay loop muted playsinline width="90%"></video>

*📦 Installation walkthrough — follow along to get set up in under a minute.*
</div>

---

## Feature Overview

### 🧠 Multi-Profile System
Store multiple personas (Student, Developer, Designer, Custom) with different names, roles, goals, skills, and preferences. Switch manually or let **auto-switch** handle it — map domains like `claude.ai → Student` and `chatgpt.com → Developer`, and the right profile loads automatically on page visit.

---

### ⚡ Smart Context Injection
Builds a personalized injection from a **customizable template** using placeholders:

```
{user_name}  {user_role}  {user_goals}  {memories}  {instruction}
```

You can toggle each section on/off individually. Output is wrapped in `[USER CONTEXT START]...[USER CONTEXT END]` markers so the AI treats it as structured context. A built-in **token-saving default** appends *"Answer as short as possible. No explanation unless asked."* — disabled automatically when a task mode is active.

---

### 🔢 Sandboxed Claude Token Counter *(Priority Feature)*

One of the most powerful features in PromptSync PRO — built exclusively for **Claude** (`claude.ai`).

**Why it matters:** Claude has a 200K context window. Without tracking, you can silently approach the limit and get degraded responses without realizing it.

**How it works:**
- Runs as a **fully independent, sandboxed script** that targets only `claude.ai` — zero interference with the core injection engine
- Uses the **o200k_base BPE tokenizer** (same algorithm as OpenAI's tiktoken) for highly accurate, fully offline token counting — no API calls required
- Tracks **input tokens**, **injected memory tokens**, and **total session tokens** in real-time
- Displays a **visual progress bar** showing exactly what percentage of the 200K window is used, color-coded by usage level
- All metrics appear in a **draggable glassmorphism floating panel** directly on the Claude interface

> Think of it as a fuel gauge for your Claude conversations — always visible, always accurate.

The floating panel is collapsible: when closed, it shows a compact badge like `120 tok`. Click to expand and see the full breakdown + context window bar.

---

### 💬 Command System

Type slash commands in your message to control behavior on the fly:

| Command | Effect |
|---|---|
| `/research` | Switch to Researcher role |
| `/dev` | Switch to Developer role |
| `/design` | Switch to Designer role |
| `/code` | Coding assistant mode |
| `/short` | Force shortest possible answer |
| `/explain` | Allow full detailed explanation |
| `/no-memory` | Skip injection for this message |
| `/only-profile` | Inject profile only, no notes |
| `/strict` | Ultra-minimal (name + pinned notes only) |
| `/temp <text>` | Add session-only temporary memory |
| `/reset` | Revert to defaults |

You can also **create your own commands** (`/fast`, `/deep`, etc.) that trigger predefined actions like mode changes, toggling memory, or appending custom instructions — no arbitrary code execution.

---

### 📝 Saved Context Notes

Save notes with tags, priority levels (high / medium / low), and pin status. Notes are **keyword-matched**: when you type a message, PromptSync scores all your notes against your prompt keywords and auto-selects the most relevant ones to inject. Pinned notes are always included.

Features: drag-and-drop reorder, bulk delete, per-note enable/disable toggle, full-text search.

---

### 🔐 Security Guard

Scans every input before saving to detect and warn about accidental storage of sensitive data:

- API keys: OpenAI (`sk-`), Stripe (`pk_/sk_`), AWS (`AKIA`), GitHub (`ghp_`)
- Passwords and secrets (`password:`, `secret:`, `passwd=`)
- Private keys (`-----BEGIN PRIVATE KEY-----`)
- Bearer tokens
- Credit card numbers (13–19 digits, Luhn-validated)

A warning popup appears — you can override or cancel. Nothing sensitive gets saved by accident.

---

### 🧹 Memory Decay

Tracks the `lastUsed` timestamp on every note. After a configurable number of days (default: 7), unused notes surface in a **decay banner** with a one-click bulk-remove option. Pinned notes are exempt. Your memory stays clean and relevant automatically.

---

### 👁️ Preview System

Optionally intercept the send action. PromptSync injects the full context into the textbox and **pauses** — letting you review and edit the generated prompt before it's actually sent. Full control, zero surprises.

---

### 🎨 Themes

Light / Dark / System (auto-detects your OS preference). Glassmorphism effects on the floating panel and toast notifications. Toggle with a single button in the header.

---

## Platform Support

| Platform | Input Type | Context Window Tracked |
|---|---|---|
| **ChatGPT** | ProseMirror | 128K |
| **Claude** | ProseMirror | 200K *(+ Sandboxed Counter)* |
| **Gemini** | ContentEditable | 1M |
| **Perplexity** | Textarea | 16K |
| **DeepSeek** | Textarea | 64K |

SPA navigation is handled via URL polling + popstate listener, so injection works even as you navigate between chats without a page reload.

---

## Architecture

```
promptsync-pro/
├── manifest.json                    → Manifest V3 configuration
├── build.sh                         → Release build script
│
├── background/
│   └── background.js                → Service worker: context menus, shortcuts, decay alarms
│
├── storage/
│   └── storage.js                   → Central data layer (chrome.storage.local)
│                                      Profiles, notes, modes, commands, settings CRUD
│
├── utils/
│   ├── tokenizer.js                 → Base BPE tokenizer (o200k_base + heuristic fallback)
│   ├── tokenTracker.js              → Token tracking integration layer
│   ├── contextEngine.js             → Keyword extraction, relevance scoring, template builder
│   ├── commandParser.js             → Built-in + custom slash command parser
│   └── securityGuard.js             → Sensitive data scanner (10 patterns, Luhn CC check)
│
├── content/
│   ├── content.js                   → Core injection pipeline, platform selectors, send interception
│   ├── floatingPanel.js             → Token badge + draggable control panel
│   └── content.css                  → All injected UI styles
│
├── claude-counter/                  → Sandboxed Claude Token Counter (independent, claude.ai only)
│   ├── content/
│   │   ├── main.js                  → Entry point
│   │   ├── tokens.js                → Token calculation logic
│   │   ├── ui.js                    → Floating panel UI rendering
│   │   ├── bridge-client.js         → Communicates with injected bridge
│   │   └── constants.js             → Claude-specific constants (200K limit, selectors)
│   ├── injected/
│   │   └── bridge.js                → Page-context bridge for DOM access
│   ├── vendor/
│   │   └── o200k_base.js            → Local copy of BPE tokenizer (sandboxed scope)
│   └── styles.css                   → Counter UI styles
│
├── popup/
│   ├── popup.html                   → 5-tab dashboard (Profile, Saved, Modes, Settings, Help)
│   ├── popup.js                     → All popup logic
│   └── popup.css                    → CSS variables, light/dark, component styles
│
├── vendor/
│   └── o200k_base.js                → Offline BPE tokenizer (shared, main extension scope)
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── build/                           → Compiled output (.zip / .crx) for production
├── counter_ref/                     → Original counter reference (Mozilla manifest, src, LICENSE)
├── README.md
├── USER_MANUAL.md
├── FEATURES.md
└── LICENSE
```

---

## Privacy

| What | Status |
|---|---|
| Data storage | `chrome.storage.local` only |
| External API calls | ❌ None |
| Analytics / telemetry | ❌ None |
| Token counting (API) | ❌ None — fully offline BPE |
| Data leaving your device | ❌ Never |

---

## Open Source Credits

- **[o200k_base Tokenizer](https://github.com/openai/tiktoken)** — BPE tokenizer derived from OpenAI's tiktoken, used for accurate offline token counting in the Claude Sandboxed Counter and the floating panel's real-time token tracker.

---

<div align="center">

**PromptSync PRO v3.1.0**

*Stop repeating. Start syncing.*

</div>
