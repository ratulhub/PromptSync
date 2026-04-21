# 📘 PromptSync PRO — User Manual

> Complete guide to all features, commands, modes, and settings.

---

## Table of Contents

- [Getting Started](#getting-started)
- [The Popup Dashboard](#the-popup-dashboard)
  - [Profile Tab](#1-profile-tab)
  - [Saved Tab](#2-saved-tab)
  - [Modes Tab](#3-modes-tab)
  - [Settings Tab](#4-settings-tab)
  - [Help Tab](#5-help-tab)
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

---

## Getting Started

After installing the extension:

1. Click the PromptSync icon in Chrome's toolbar to open the popup.
2. Fill in your profile (name, role, goals) in the **Profile** tab.
3. Add context notes in the **Saved** tab.
4. Navigate to any supported AI site and start chatting.

PromptSync automatically injects your context before every message. You'll see a token badge on the page confirming it's active.

---

## The Popup Dashboard

The popup has 5 tabs:

### 1. Profile Tab

Your profile is the core of what gets injected. Each profile contains:

| Field | Description |
|-------|-------------|
| Name | Your name or handle |
| Role | Your job, study role, or identity (e.g., "Senior React Dev") |
| Goals | What you're trying to accomplish |
| Skills | Technologies, subjects, or skills you have |
| Preferences | How you like responses (e.g., "No code comments, use TypeScript") |
| Custom Notes | Freeform profile-level notes |

**Switching Profiles:**
- Use the profile dropdown at the top of the tab.
- Built-in profiles: Default, Student, Developer.
- Create new profiles with the **+** button.
- Delete custom profiles with the trash icon.

**Profile Preview:**
- Scroll down to see a preview of exactly what will be injected with the current profile.

---

### 2. Saved Tab

Saved notes are context memories that get injected alongside your profile.

**Adding a note:**
1. Type your note in the text area.
2. Optionally add tags (e.g., `react`, `work`).
3. Set priority: High / Medium / Low.
4. Toggle **Pin** to always include it regardless of relevance.
5. Click **Save**.

**Note Features:**

| Feature | Description |
|---------|-------------|
| Enable/Disable | Toggle individual notes on/off without deleting |
| Pin | Always inject this note regardless of message context |
| Priority | High notes score higher in smart selection |
| Tags | Organize notes by topic |
| Search | Filter notes by text or tag |
| Drag & Drop | Reorder notes manually |
| Bulk Delete | Select multiple notes and delete at once |

**Smart Keyword Matching:**
PromptSync analyzes your message and automatically selects the most relevant saved notes. For example, if you ask about React hooks, notes tagged `react` or containing "hooks" will be prioritized.

---

### 3. Modes Tab

**Task Modes** change the instruction injected with your context.

**Built-in Modes:**

| Mode | Injected Instruction |
|------|---------------------|
| Coding | "Give clean, minimal, working code. No explanation unless asked." |
| Study | "Explain simply step by step. Use easy words. Give examples." |
| Short | "Answer in the shortest possible way." |

**Custom Modes:**
1. Click **+ New Mode**.
2. Give it a name and write a custom instruction.
3. Select it from the mode dropdown or activate with `/mode your-mode-name`.

**Custom Commands:**
Also managed in this tab. See [Command System](#command-system) for details.

---

### 4. Settings Tab

| Section | Options |
|---------|---------|
| **Injection** | Enable/disable injection globally; set injection delay |
| **Template** | Edit the injection format and toggle sections |
| **Response Control** | Enable/edit the default short-answer instruction |
| **Security** | Enable/disable sensitive data scanning |
| **Decay** | Enable memory decay; set number of days before suggestion |
| **Auto-Switch** | Map domains to profiles |
| **Platforms** | Enable/disable injection per platform |
| **Advanced** | Max memories, strict mode, debug mode, max token limit |
| **Floating Panel** | Set panel visibility (badge only / full panel / hidden) |

---

### 5. Help Tab

- Full list of available commands with descriptions.
- Tips and usage examples.
- Button to reset onboarding overlay.

---

## Injection System

### What Gets Injected

When you send a message, PromptSync builds a context block using a customizable template:

```
[USER CONTEXT START]
Name: {user_name}
Role: {user_role}
Goals: {user_goals}
Memory: {memories}
Instruction: {instruction}
[USER CONTEXT END]
```

Each section can be independently toggled on/off in **Settings → Template**.

### Injection Modes

- **Default:** Context is prepended to every message.
- **Per-message override:** Use slash commands to change behavior for one message.

### Token-Saving Default

When no task mode is active, PromptSync injects a default short-answer instruction:

> *"Answer as short as possible. No explanation unless asked."*

This can be disabled globally in **Settings → Response Control**.

---

## Command System

Type these commands anywhere in your message. They are stripped before sending.

### Built-in Commands

| Command | Effect |
|---------|--------|
| `/no-memory` | Skip injection entirely for this message |
| `/only-profile` | Inject profile only — no saved notes |
| `/strict` | Minimal injection: name + pinned notes only |
| `/explain` | Allow full explanation (disables short-answer) |
| `/detail` | Full context + request detailed response |
| `/code` | Activate coding mode for this message |
| `/short` | Force shortest possible answer |
| `/mode <name>` | Switch to a named task mode for this message |
| `/reset` | Revert to default injection behavior |
| `/temp <text>` | Add session-only memory (not saved permanently) |

**Example:**
```
/code How do I debounce an input in React?
```
This activates coding mode and sends the question with coding instructions injected.

### Custom Commands

Create your own commands in **Modes → Custom Commands**:

1. Click **+ New Command**.
2. Set the command name (e.g., `/fast`).
3. Configure actions:
   - Switch task mode
   - Enable or disable memory
   - Skip system prompt
   - Inject custom instruction text

**Example custom command `/fast`:**
- Task mode: Short
- Disable memory: Yes
- Custom instruction: "Be extremely brief."

> Custom commands use predefined action sets only — no arbitrary code execution.

---

## Task Modes

Task modes change the instruction injected with your context. Set a mode globally or per-message.

**Set globally:** Use the mode dropdown in the popup (Profile tab) or the floating panel.

**Set per-message:** Use `/mode coding`, `/mode study`, etc.

**Disable for a message:** Use `/reset`.

When a task mode is active, the token-saving default instruction is automatically suppressed.

---

## Floating Panel

A persistent overlay appears on all supported AI pages.

### Token Badge
- Always visible, shows current injection token count (e.g., `120 tok`).
- Click to expand the full panel.

### Full Panel (click badge to open)

| Control | Description |
|---------|-------------|
| Memory toggle | Enable/disable context injection instantly |
| Mode switcher | Change task mode without opening popup |
| Token breakdown | See input / memory / session token counts |
| Context window bar | Color-coded progress bar showing % of platform limit used |
| Session reset | Clear session-only memories added with `/temp` |

- **Draggable:** Drag the panel anywhere on screen. Position is saved.
- **Collapse:** Click outside the panel.
- **Visibility settings:** Badge only / Full panel / Hidden — in Settings.

---

## Token Tracking

PromptSync uses the **o200k_base BPE tokenizer** for accurate token counts (same tokenizer used by GPT-4o).

**Tracked values:**
- Input tokens (your message)
- Injected memory tokens (your context)
- Session total

**Context window limits per platform:**

| Platform | Limit |
|----------|-------|
| ChatGPT | 128K tokens |
| Claude | 200K tokens |
| Gemini | 1M tokens |
| Perplexity | 16K tokens |
| DeepSeek | 64K tokens |

The floating panel shows a color-coded progress bar: green → yellow → red as you approach the limit.

---

## Security Guard

Before any note is saved, PromptSync scans for sensitive data:

| Pattern | Examples Detected |
|---------|------------------|
| OpenAI API keys | `sk-...` |
| Stripe keys | `pk_live_...`, `sk_live_...` |
| AWS keys | `AKIA...` |
| GitHub tokens | `ghp_...` |
| Private keys | `-----BEGIN PRIVATE KEY-----` |
| Bearer tokens | `Bearer ...` |
| Passwords | `password:`, `passwd=`, `secret:` |
| Credit cards | 13–19 digit Luhn-validated numbers |

If detected, a **warning popup** appears. You can override and save anyway, or cancel.

To disable scanning: **Settings → Security → Detect Sensitive Data → Off**.

---

## Memory Decay

Stale notes clutter your context and waste tokens. Memory Decay helps you clean them up.

- Every note tracks a `lastUsed` timestamp (updated each time the note is injected).
- After a configurable number of days (default: 7), unused notes are flagged.
- A **decay banner** appears in the Saved tab listing flagged notes.
- Click **Remove All Stale** to bulk-delete them in one click.
- **Pinned notes are exempt** from decay.

**Configure decay:** Settings → Decay → Enable toggle + Days input.

---

## Profile Auto-Switch

Automatically switch to a specific profile when you visit a domain.

**Set up a mapping:**
1. Go to **Settings → Auto-Switch**.
2. Enable the toggle.
3. Add a domain → profile mapping (e.g., `claude.ai` → `Student`).

Multiple mappings are supported. If no mapping matches, the last active profile is used.

---

## Import & Export

Back up or transfer all your PromptSync data.

**Export:** Settings → Advanced → Export Data → saves `promptsync-*.json`

**Import:** Settings → Advanced → Import Data → select a `.json` file

The export includes all profiles, saved notes, task modes, custom commands, and settings.

> Data is validated on import (length limits, type checking) to prevent corruption.

---

## Keyboard Shortcut

**`Ctrl + Shift + M`** (Windows/Linux) / **`Cmd + Shift + M`** (Mac)

Opens the popup from anywhere in Chrome.

You can also right-click selected text on any page and choose **"Save to PromptSync"** to quickly add it as a note.

---

## Dark Mode

Three options available:

| Mode | Behavior |
|------|----------|
| Light | Always light theme |
| Dark | Always dark theme |
| System | Matches your OS preference automatically |

**Cycle themes:** Click the theme button in the popup header.

The floating panel and toasts use glassmorphism effects in dark mode.

---

## Advanced Settings

Found under **Settings → Advanced:**

| Setting | Default | Description |
|---------|---------|-------------|
| Injection Delay | — | Delay (ms) before injection fires |
| Max Memories | — | Maximum number of notes to inject per message |
| Strict Mode | Off | Only inject name + pinned notes by default |
| Debug Mode | Off | Log injection details to browser console |
| Max Token Limit | — | Hard cap on injected tokens per message |

---

## Tips & Best Practices

- **Keep notes atomic** — One fact per note works better than long paragraphs.
- **Use tags** — Tags make search and smart selection more accurate.
- **Pin sparingly** — Pinned notes always inject, so only pin truly universal context.
- **Use task modes** — Switch modes instead of rewriting your question every time.
- **Use `/temp`** for session context — Temporary memories like "today's task: fix login bug" don't clutter your permanent storage.
- **Check the token badge** — If tokens are high, delete old notes or use `/strict` to reduce injection size.
- **Set per-domain profiles** — Use Auto-Switch so Claude gets your study profile and ChatGPT gets your dev profile.

---

*PromptSync PRO v3.0.0 — Stop repeating. Start syncing.*
