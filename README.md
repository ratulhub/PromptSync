<div align="center">

# 🔄 PromptSync PRO

**Your context. Synced with AI.**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/your-username/promptsync)
[![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local-brightgreen.svg)](#privacy--security)

> Stop repeating yourself. PromptSync automatically injects your personal context into every AI chat — so you get better, more relevant answers without typing your preferences every time.

**Works on:** ChatGPT · Claude · Gemini · Perplexity · DeepSeek

</div>

---

## Table of Contents

- [What is PromptSync?](#what-is-promptsync)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Setup Manual](#setup-manual)
- [All 16 Features](#all-16-features)
- [The Popup Dashboard](#the-popup-dashboard)
- [Injection System](#injection-system)
- [Command System](#command-system)
- [Task Modes](#task-modes)
- [Floating Panel](#floating-panel)
- [Token Tracking](#token-tracking)
- [Security Guard](#security-guard)
- [Memory Decay](#memory-decay)
- [Profile Auto-Switch](#profile-auto-switch)
- [Import & Export](#import--export)
- [Keyboard Shortcut](#keyboard-shortcut)
- [Dark Mode](#dark-mode)
- [Advanced Settings](#advanced-settings)
- [Architecture](#architecture)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

---

## What is PromptSync?

Every new AI chat starts from zero. You find yourself typing *"I'm a developer, I use React, keep answers short"* hundreds of times across hundreds of sessions.

**PromptSync fixes this.**

It stores your profile and saved notes locally in Chrome, then silently prepends them to every message before it sends. The AI sees your full context + your question as a single rich prompt — giving you smarter, more personalized responses instantly.

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

**Pipeline:** User Input → Parse Commands → Build Context → Inject → Track Tokens

---

## Installation

### From Chrome Web Store *(recommended)*
> Coming soon — link will be added after review.

### Manual (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/your-username/promptsync.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right)
4. Click **Load unpacked** and select the project folder
5. The PromptSync icon appears in your Chrome toolbar

> Requires Chrome 88+ (Manifest V3).

---

## Quick Start

1. Click the PromptSync icon to open the popup
2. Go to **Profile** tab → fill in your name, role, and goals
3. Go to **Saved** tab → add context notes (e.g., "I prefer TypeScript, no comments in code")
4. Open ChatGPT, Claude, or any supported AI site
5. Type a message and send — your context is injected automatically

You'll see a token badge (e.g., `120 tok`) on the AI page confirming injection is active.

---

## Setup Manual

This section walks through every step to configure PromptSync PRO from scratch for the best experience.

---

### Step 1 — Set Up Your Profile

Your profile is the foundation of everything injected into AI chats.

1. Click the PromptSync icon → open the **Profile** tab
2. Select a profile from the dropdown or click **+** to create a new one
3. Fill in all fields:

| Field | What to Write | Example |
|-------|--------------|---------|
| **Name** | Your name or handle | Alex |
| **Role** | Your job, role, or identity | Senior React Developer |
| **Goals** | What you're working toward | Build clean, scalable apps fast |
| **Skills** | Tools and technologies you use | TypeScript, React, Node.js, PostgreSQL |
| **Preferences** | How you want AI to respond | No code comments, always use TypeScript, short answers |
| **Custom Notes** | Anything else AI should always know | Currently working on a SaaS billing module |

4. Scroll down to the **Injection Preview** to confirm what will be injected
5. Click **Save Profile**

> **Tip:** Create multiple profiles for different contexts — one for work, one for studying, one for personal projects. Switch instantly from the dropdown.

---

### Step 2 — Add Saved Context Notes

Notes let you store facts, preferences, and knowledge that gets smartly injected based on your message.

1. Go to the **Saved** tab
2. Click in the text area and write a note. Keep each note focused on one fact:
   - ✅ `"I use Tailwind CSS for all styling"`
   - ✅ `"My database is PostgreSQL 15 on Supabase"`
   - ❌ `"I use Tailwind and PostgreSQL and React and TypeScript and prefer short answers"` (too broad)
3. Add **tags** to help with smart matching (e.g., `css`, `database`, `react`)
4. Set **priority**:
   - **High** — critical context, always prioritized
   - **Medium** — useful but not essential
   - **Low** — background information
5. Toggle **Pin** if this note should always be injected regardless of the message topic
6. Click **Save**

Repeat for all the context you want PromptSync to remember.

> **Tip:** Right-click any text on a webpage and choose **"Save to PromptSync"** to instantly create a note from selected content.

---

### Step 3 — Configure the Injection Template

Control exactly what gets injected and how it's formatted.

1. Go to **Settings → Template**
2. Review the section toggles — enable or disable:
   - Name
   - Role
   - Goals
   - Memory (saved notes)
   - Instruction (response control / task mode)
3. Optionally edit the template text. Default format:
   ```
   [USER CONTEXT START]
   Name: {user_name}
   Role: {user_role}
   Goals: {user_goals}
   Memory: {memories}
   Instruction: {instruction}
   [USER CONTEXT END]
   ```
4. Only include sections that are useful for your use case. For example, if you use PromptSync only for coding, you might disable Goals and keep Name, Role, and Memory only.

---

### Step 4 — Set Up Response Control

This is the global instruction appended to every injection, telling the AI how to respond.

1. Go to **Settings → Response Control**
2. Enable the toggle
3. Edit the instruction to match your preference:
   - Default: `"Keep answer short. No extra explanation. Only give what is asked."`
   - For detailed work: `"Give thorough explanations with examples."`
   - For code only: `"Reply with code only. No prose unless asked."`
4. Save

> This instruction is overridden automatically when a Task Mode is active.

---

### Step 5 — Configure Task Modes

Task modes let you switch the AI's behavior instantly for different types of work.

1. Go to the **Modes** tab
2. Review the 3 built-in modes:
   - **Coding** — clean minimal code, no explanations
   - **Study** — step-by-step, simple language, examples
   - **Short** — shortest possible answer
3. To create a custom mode:
   - Click **+ New Mode**
   - Give it a name (e.g., `Writing`, `Debug`, `Review`)
   - Write the instruction (e.g., `"Review my code for bugs and suggest improvements only. No rewriting."`)
   - Save
4. Set your default active mode (or leave it off to use Response Control instead)

---

### Step 6 — Create Custom Commands (Optional)

If you frequently switch modes or behaviors, create shortcuts.

1. Go to **Modes → Custom Commands**
2. Click **+ New Command**
3. Name it (e.g., `/fast`)
4. Set its actions:
   - Switch to **Short** mode
   - Disable memory
   - Custom instruction: `"Answer in one sentence max."`
5. Save

Now type `/fast` in any message to activate those settings for that message.

---

### Step 7 — Set Up Profile Auto-Switch (Optional)

Automatically load the right profile on each AI platform.

1. Go to **Settings → Auto-Switch**
2. Enable the toggle
3. Add mappings:
   - `claude.ai` → `Student`
   - `chatgpt.com` → `Developer`
   - `gemini.google.com` → `Default`
4. Save

From now on, visiting each platform auto-loads the correct profile.

---

### Step 8 — Configure Platform Settings

Choose which AI platforms PromptSync is active on.

1. Go to **Settings → Platforms**
2. Toggle each platform on or off:
   - ChatGPT
   - Claude
   - Gemini
   - Perplexity
   - DeepSeek

Disable any platform where you don't want context injected.

---

### Step 9 — Configure the Floating Panel

The floating panel gives you real-time control without opening the popup.

1. Go to **Settings → Floating Panel**
2. Choose visibility:
   - **Badge only** — minimal, shows token count only
   - **Full panel** — badge + expandable control panel
   - **Hidden** — no overlay
3. On any AI page, click the badge to expand the panel and:
   - Toggle memory on/off instantly
   - Switch modes on the fly
   - Monitor your token usage vs. the platform's context window limit

---

### Step 10 — Configure Memory Decay

Prevent your saved notes from becoming stale and bloated over time.

1. Go to **Settings → Decay**
2. Enable the toggle
3. Set the threshold (default: 7 days)
4. When stale notes accumulate, a banner appears in the Saved tab — click **Remove All Stale** to clean up

---

### Step 11 — Configure Security Settings

Protect yourself from accidentally saving sensitive data.

1. Go to **Settings → Security**
2. Enable **Detect Sensitive Data**
3. PromptSync will now warn you before saving anything that looks like an API key, password, credit card number, or private key

---

### Step 12 — Test Everything

1. Open any supported AI platform (ChatGPT, Claude, Gemini, Perplexity, DeepSeek)
2. Confirm the token badge is visible (e.g., `85 tok`)
3. Type a message and send it
4. The AI should respond with context about your profile and relevant notes automatically applied
5. Try a slash command: type `/code tell me about error handling` — the coding instruction should activate
6. Open the floating panel and verify the token breakdown looks correct

---

### Recommended First-Time Settings

| Setting | Recommended Value |
|---------|------------------|
| Response Control | Enabled, default short-answer instruction |
| Security Guard | Enabled |
| Memory Decay | Enabled, 7 days |
| Floating Panel | Badge only or Full panel |
| Max Memories | 5–10 notes |
| Active Mode | None (use Response Control) or Coding |
| Auto-Switch | Configure if you use multiple platforms |

---

## All 16 Features

### F1 — Multi-Profile System

Store multiple profiles for different roles and contexts.

- Built-in profiles: Default, Student, Developer
- Create unlimited custom profiles
- Each profile stores: name, role, goals, skills, preferences, custom notes
- Switch profiles from the popup dropdown — changes all injected context instantly
- Profiles are fully independent of each other

### F2 — Profile Auto-Switch Per Website

Automatically switch to the right profile when visiting a domain.

- Configure mappings in **Settings → Auto-Switch** (e.g., `claude.ai → Student`, `chatgpt.com → Developer`)
- Detection happens on page load
- Manual mapping only (no AI-based detection)
- Toggle on/off without losing your mappings

### F3 — Smart Context Injection

Builds a context block using a fully customizable template before every message.

Placeholders available:
- `{user_name}` — your name from the active profile
- `{user_role}` — your role from the active profile
- `{user_goals}` — your goals from the active profile
- `{memories}` — smart-selected saved notes
- `{instruction}` — active response control or task mode instruction

Each section can be individually toggled on or off. The default format wraps your context in `[USER CONTEXT START]` / `[USER CONTEXT END]` markers.

### F4 — Token-Saving Default System

When no task mode is active, appends a short-answer instruction to every injection:

> *"Answer as short as possible. No explanation unless asked."*

- Facts → direct answer only
- Best-choice questions → single best option, no alternatives list
- Automatically disabled when a task mode is active
- Override per-message with `/explain` or `/detail`

### F5 — Command System (12 Built-in + Custom)

Slash commands typed in your message modify injection for that message only. Commands are stripped before sending — the AI never sees them.

| Command | Effect |
|---------|--------|
| `/no-memory` | Skip injection entirely for this message |
| `/only-profile` | Inject profile only — no saved notes |
| `/strict` | Minimal injection: name + pinned notes only |
| `/explain` | Allow full explanation (disables short-answer) |
| `/detail` | Full context + request detailed response |
| `/code` | Activate coding mode for this message |
| `/short` | Force shortest possible answer |
| `/mode <name>` | Activate a named task mode for this message |
| `/reset` | Revert to default injection behavior |
| `/temp <text>` | Add session-only memory (not saved permanently) |

### F6 — Custom Commands

Create your own slash commands with predefined behaviors.

- Define a command name (e.g., `/fast`, `/deep`)
- Configure what it does:
  - Switch to a task mode
  - Enable or disable memory injection
  - Skip the system/response-control prompt
  - Inject a custom instruction string
- Create, edit, and delete from **Modes Tab → Custom Commands**
- No arbitrary code execution — actions use a predefined safe set only

### F7 — Task Modes (3 Built-in + Custom)

Modes replace the default short-answer instruction with a specialized one.

Built-in modes:

| Mode | Injected Instruction |
|------|---------------------|
| Coding | "Give clean, minimal, working code. No explanation unless asked." |
| Study | "Explain simply step by step. Use easy words. Give examples." |
| Short | "Answer in the shortest possible way." |

- Create custom modes with any name and any instruction text
- Set globally from popup or floating panel
- Set per-message with `/mode <name>`
- Deactivate for a single message with `/reset`
- When active, the token-saving default is automatically suppressed

### F8 — Saved Context Notes

A full note management system for persistent context.

| Feature | Detail |
|---------|--------|
| Text | The context content to inject |
| Tags | Categorical labels for organization and filtering |
| Priority | High / Medium / Low — affects injection scoring |
| Pin | Always inject regardless of relevance scoring |
| Enable/Disable | Toggle individual notes without deleting |
| Source tracking | Tracks if note was added manually, via selection, context menu, or auto-detect |
| Drag & drop | Reorder notes visually |
| Bulk delete | Select multiple and delete at once |
| Search | Filter by text or tag |

**Smart Keyword Matching:** PromptSync extracts keywords from your current message (stop words filtered), then scores each note by keyword overlap + priority + pin bonus. The most relevant notes are automatically selected up to the configured maximum.

### F9 — Memory Decay

Prevents context bloat by flagging notes you haven't used recently.

- Every note tracks a `lastUsed` timestamp, updated each time it is injected
- After a configurable number of days (default: 7), unused notes are flagged as stale
- A decay banner appears in the Saved tab listing all stale notes
- One-click **"Remove All Stale"** bulk deletion
- Pinned notes are exempt — they never decay
- Configure in **Settings → Decay**

### F10 — Security Guard

Scans note text for sensitive data before saving.

| Detected Pattern | Example |
|-----------------|---------|
| OpenAI API keys | `sk-...` |
| Stripe keys | `pk_live_...`, `sk_live_...` |
| AWS access keys | `AKIA...` |
| GitHub tokens | `ghp_...` |
| Private keys | `-----BEGIN PRIVATE KEY-----` |
| Bearer tokens | `Bearer ...` |
| Passwords | `password:`, `passwd=`, `secret:` |
| Credit cards | 13–19 digit Luhn-validated numbers |

- Shows a warning popup when sensitive data is detected
- User can override and save anyway, or cancel
- Toggle in **Settings → Security → Detect Sensitive Data**

### F11 — Customizable Injection Template

Edit the exact format of the injected context block.

- Full text editor for the template
- Use any combination of placeholders: `{user_name}`, `{user_role}`, `{user_goals}`, `{memories}`, `{instruction}`
- Toggle each placeholder section on or off independently
- Changes apply immediately to all future injections

### F12 — Response Control

A global instruction appended to every injection.

- Default: `"Keep answer short. No extra explanation. Only give what is asked."`
- Fully editable — set any instruction you want
- Toggle on/off globally from Settings
- Automatically overridden when a task mode is active

### F13 — Floating Panel (Token Badge + Control Panel)

A persistent overlay on all supported AI pages.

**Token Badge:**
- Always visible, shows current injection token count (e.g., `120 tok`)
- Click to expand the full control panel

**Full Panel:**
- Memory injection toggle (ON/OFF)
- Mode switcher dropdown
- Token breakdown: input / memory / session counts
- Context window progress bar with color coding (green → yellow → red)
- Session reset button (clears `/temp` memories)

**Behavior:**
- Draggable — position is saved across sessions
- Collapses on outside click
- Visibility: badge only / full panel / hidden — configured in Settings

### F14 — Real-Time Token Tracking

Accurate token counting using the **o200k_base BPE tokenizer** (same as GPT-4o).

Tracked values:
- Input tokens (your typed message)
- Injected memory tokens (context block)
- Session total (cumulative across messages)

Context window limits per platform:

| Platform | Token Limit |
|----------|------------|
| ChatGPT | 128,000 |
| Claude | 200,000 |
| Gemini | 1,000,000 |
| Perplexity | 16,000 |
| DeepSeek | 64,000 |

Performance: token calculation debounced at 300ms. BPE results cached (200-entry LRU).

### F15 — Dark Mode / Theme

| Mode | Behavior |
|------|----------|
| Light | Always light |
| Dark | Always dark |
| System | Follows OS preference automatically |

- Cycle themes with the header button in the popup
- CSS variables for smooth, instant switching
- Glassmorphism effects on floating panel and toast notifications

### F16 — Onboarding

- 3-step visual overlay on first install explaining the core workflow
- Shows once per version (version tracked in settings)
- Dismissible with "Got it" or "Skip" — smooth fade-out
- Re-trigger anytime from **Help Tab → Reset Onboarding**

---

## The Popup Dashboard

The popup has 5 tabs:

### Profile Tab
- Profile switcher dropdown (built-in + custom profiles)
- Form fields: name, role, goals, skills, preferences, custom notes
- Injection preview: see exactly what will be injected
- Token bar: shows how many tokens the current profile uses
- Create / delete custom profiles

### Saved Tab
- Add notes with text, tags, priority, and pin toggle
- Enable/disable individual notes without deleting
- Search and filter by text or tag
- Drag-and-drop reorder
- Bulk delete (select multiple)
- Decay banner when stale notes exist

### Modes Tab
- View and switch between built-in task modes
- Create, edit, delete custom task modes
- Create, edit, delete custom commands

### Settings Tab
- **Injection:** global enable/disable, injection delay
- **Template:** edit format, toggle sections
- **Response Control:** enable/edit global instruction
- **Security:** toggle sensitive data scanning
- **Decay:** enable/set staleness threshold in days
- **Auto-Switch:** manage domain → profile mappings
- **Platforms:** enable/disable injection per platform individually
- **Advanced:** max memories, strict mode, debug mode, max token limit
- **Floating Panel:** set visibility mode

### Help Tab
- Full list of all commands with descriptions
- Usage tips
- Onboarding reset button

---

## Injection System

### What Gets Injected

```
[USER CONTEXT START]
Name: {user_name}
Role: {user_role}
Goals: {user_goals}
Memory: {memories}
Instruction: {instruction}
[USER CONTEXT END]
```

Each section is independently togglable. The full template is editable in Settings.

### Injection Modes

- **Default:** context prepended to every message
- **Per-message override:** slash commands change behavior for one message only

### How Notes Are Selected

1. Keywords extracted from your message (stop words removed)
2. Each enabled note scored: keyword overlap + priority bonus + pin bonus
3. Top N notes selected (N = max memories setting)
4. Pinned notes always included regardless of score

---

## Command System

Commands are typed anywhere in your message and stripped before sending.

**Built-in commands:**

| Command | Effect |
|---------|--------|
| `/no-memory` | Skip injection for this message |
| `/only-profile` | Profile only, no saved notes |
| `/strict` | Name + pinned notes only |
| `/explain` | Full explanation allowed |
| `/detail` | Full context + detailed response |
| `/code` | Coding mode for this message |
| `/short` | Shortest possible answer |
| `/mode <name>` | Activate named task mode |
| `/reset` | Revert to defaults |
| `/temp <text>` | Session-only memory |

**Custom commands** are created in the Modes tab. Each triggers a set of predefined actions (mode switch, memory toggle, instruction injection). No code execution.

**Example:**
```
/code How do I debounce a React input?
```

---

## Task Modes

| Mode | Instruction |
|------|------------|
| Coding | "Give clean, minimal, working code. No explanation unless asked." |
| Study | "Explain simply step by step. Use easy words. Give examples." |
| Short | "Answer in the shortest possible way." |
| Custom | Your own instruction text |

- Set globally from popup or floating panel
- Set per-message with `/mode <name>`
- Disable per-message with `/reset`
- Suppresses the token-saving default while active

---

## Floating Panel

**Token Badge** — always visible on AI pages, shows token count. Click to open full panel.

**Full Panel controls:**
- Memory ON/OFF toggle
- Mode switcher
- Token breakdown (input / memory / session)
- Context window progress bar (color-coded)
- Session reset

Draggable — position saved. Collapses on outside click.

---

## Token Tracking

Uses **o200k_base BPE tokenizer** (same as GPT-4o) for accurate counts.

| Platform | Context Window |
|----------|---------------|
| ChatGPT | 128K tokens |
| Claude | 200K tokens |
| Gemini | 1M tokens |
| Perplexity | 16K tokens |
| DeepSeek | 64K tokens |

Calculation debounced at 300ms. BPE results cached (200-entry LRU).

---

## Security Guard

Scans for sensitive patterns before saving any note. Detected types: OpenAI keys, Stripe keys, AWS keys, GitHub tokens, private keys, bearer tokens, password patterns, and credit card numbers (Luhn-validated).

Shows a warning with override option. Configurable in Settings → Security.

---

## Memory Decay

- Tracks `lastUsed` timestamp per note
- After N days without use (default: 7), note is flagged as stale
- Decay banner in Saved tab lists all stale notes
- One-click bulk removal
- Pinned notes are exempt

Configure in **Settings → Decay**.

---

## Profile Auto-Switch

Map domains to profiles for automatic switching on page load.

Example mappings:
- `claude.ai` → Student
- `chatgpt.com` → Developer
- `gemini.google.com` → Default

Configure in **Settings → Auto-Switch**. Toggle on/off without losing mappings.

---

## Import & Export

- **Export:** Settings → Advanced → Export Data → saves `promptsync-*.json`
- **Import:** Settings → Advanced → Import Data → select `.json` file

Exports include all profiles, notes, modes, commands, and settings. Input is validated on import (length limits + type checking).

---

## Keyboard Shortcut

`Ctrl + Shift + M` (Windows/Linux) or `Cmd + Shift + M` (Mac) — opens the popup from anywhere.

Right-click selected text on any page → **"Save to PromptSync"** to quickly create a note.

---

## Dark Mode

Light / Dark / System (auto OS). Cycle with the header button. Glassmorphism effects on panel and toasts.

---

## Advanced Settings

| Setting | Description |
|---------|-------------|
| Injection Delay | Delay in ms before injection fires |
| Max Memories | Maximum notes injected per message |
| Strict Mode | Only inject name + pinned notes globally |
| Debug Mode | Log injection details to browser console |
| Max Token Limit | Hard cap on injected tokens per message |

---

## Architecture

```
manifest.json (Manifest V3)
├── background/background.js      Service worker
│   ├── Context menu ("Save to PromptSync")
│   ├── Keyboard shortcut (Ctrl+Shift+M)
│   ├── Default settings/profiles/modes on first install
│   ├── Content script re-injection on update
│   └── Memory decay alarm (daily)
│
├── storage/storage.js            Central data layer
│   ├── Multi-profile CRUD
│   ├── Memory items CRUD with migration
│   ├── Task modes CRUD
│   ├── Custom commands CRUD
│   ├── Settings with deep-merge defaults
│   ├── Injection template management
│   ├── Domain → profile auto-switch lookup
│   ├── Export/import (all formats)
│   └── Settings cache with TTL
│
├── utils/
│   ├── tokenizer.js              BPE token counter (o200k_base + heuristic fallback)
│   ├── contextEngine.js          Smart context selection + template engine
│   │   ├── Keyword extraction (stop word filtered)
│   │   ├── Relevance scoring (keyword match + priority + pin bonus)
│   │   ├── Template-based build with placeholder replacement
│   │   ├── Task mode instruction injection
│   │   ├── Response control injection
│   │   ├── Session memory management
│   │   └── lastUsed timestamp tracking
│   ├── commandParser.js          Slash command parser
│   │   ├── 10 built-in commands
│   │   ├── Dynamic custom command loading
│   │   ├── Regex-based extraction
│   │   └── Human-readable command list generator
│   └── securityGuard.js          Sensitive data scanner
│       ├── 10 detection patterns
│       ├── Luhn checksum for credit card validation
│       └── Quick-check fast path
│
├── content/
│   ├── content.js                Core injection pipeline
│   │   ├── Platform detection (5 platforms)
│   │   ├── Input field discovery (multi-selector per platform)
│   │   ├── Send button interception (click + Enter)
│   │   ├── Injection pipeline (parse → build → inject → track)
│   │   ├── Auto-detect user info patterns
│   │   ├── Text selection save button
│   │   ├── SPA navigation detection
│   │   ├── Profile auto-switch per domain
│   │   ├── Security scanning on save
│   │   └── Debug mode logging
│   ├── content.css               All injected UI styles
│   ├── floatingPanel.js          Token badge + control panel
│   └── onboarding.js             First-run overlay
│
├── popup/
│   ├── popup.html                5-tab dashboard
│   ├── popup.js                  All popup logic
│   └── popup.css                 CSS variables, light/dark, all components
│
└── vendor/o200k_base.js          GPT tokenizer library
```

### Platform Support

| Platform | Input Type | Send Button |
|----------|-----------|-------------|
| ChatGPT | ProseMirror | `data-testid` send button |
| Claude | ProseMirror | `aria-label="Send Message"` |
| Gemini | `rich-textarea` contenteditable | `.send-button` class |
| Perplexity | `textarea` | `aria-label="Submit"` |
| DeepSeek | `textarea#chat-input` | `div[role=button]` |

SPA navigation handled via URL polling + `popstate` listener. Content scripts re-injected on extension update.

### Storage Schema

```
asm_profiles     — profile objects (name, role, goals, skills, preferences, notes)
asm_items        — saved notes (id, text, keywords, priority, lastUsed, pinned, enabled, tags)
asm_settings     — all settings (injection, platforms, decay, security, auto-switch, etc.)
asm_task_modes   — coding / study / short / custom modes
asm_custom_commands — user-defined slash commands
asm_template     — injection template format + section toggles
```

### Performance

- Settings cache with 2-second TTL (avoids repeated `chrome.storage` reads)
- Token calculation debounced at 300ms
- Auto-detect pattern matching debounced at 1500ms
- BPE tokenizer result cache (200 entries LRU)
- `MutationObserver` for DOM changes (no polling for input discovery)
- Lazy loading: floating panel initializes only when enabled in settings

---

## Privacy & Security

- **100% local** — All data stored in `chrome.storage.local`. Nothing ever leaves your device.
- **Zero network requests** — No analytics, no telemetry, no external API calls of any kind.
- **XSS prevention** — All output is HTML-escaped in display contexts.
- **Security Guard** — Scans for API keys, passwords, credit cards before every save.
- **No code execution** — Custom commands use predefined action sets only. No `eval`.
- **Input sanitization** — Length limits and type validation enforced on import.
- **Namespace isolation** — All DOM elements prefixed with `asm-` to avoid conflicts.

---

## Contributing

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/promptsync.git`
3. Load unpacked in `chrome://extensions/` with Developer Mode enabled
4. Create a feature branch: `git checkout -b feature/my-feature`
5. Make changes and test on at least one AI platform
6. Commit: `git commit -m 'feat: describe the change'`
7. Push and open a Pull Request against `main`

**Guidelines:**
- No external API calls — privacy-first always
- No `eval` or arbitrary code execution
- Prefix all injected DOM elements with `asm-`
- Test across all 5 platforms when changing content scripts
- No new dependencies without prior discussion

**Build a release zip:**
```bash
bash build.sh
# produces: promptsync-v3.0.0.zip
```

---

## Changelog

### v3.0.0
- Full rebrand to PromptSync PRO
- Floating panel with token badge and control overlay
- Real-time BPE token tracking (o200k_base)
- Memory decay system with configurable threshold
- Security Guard with Luhn credit card validation
- Profile auto-switch per domain
- Custom commands system
- Custom task modes
- Customizable injection template with per-section toggles
- Response control with editable global instruction
- Onboarding 3-step overlay (first-run)
- Dark / Light / System theme with glassmorphism
- Export filename: `promptsync-*.json`
- Injection header: `"injected by PromptSync"`

---

## License

[MIT](LICENSE) — © 2024 PromptSync

---

<div align="center">
<strong>PromptSync PRO v3.0.0 — Stop repeating. Start syncing.</strong>
</div>
