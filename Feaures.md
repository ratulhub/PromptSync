# ✨ PromptSync PRO — Feature Reference

Complete breakdown of all 16 features in PromptSync PRO v3.0.0.

---

## F1 — Multi-Profile System

Store and manage multiple profiles for different contexts:

- **Built-in profiles:** Default, Student, Developer
- **Custom profiles:** Create unlimited custom profiles
- Each profile stores: name, role, goals, skills, preferences, custom notes
- Switch profiles from the popup dropdown at any time
- Profiles are fully independent — switching changes all injected context instantly

---

## F2 — Profile Auto-Switch Per Website

Map specific domains to specific profiles so the right context loads automatically:

- Configure in **Settings → Auto-Switch**
- Example: `claude.ai → Student`, `chatgpt.com → Developer`
- Detection happens on page load
- Manual mapping only (no AI-based detection)
- Toggle the entire feature on/off without losing your mappings

---

## F3 — Smart Context Injection

Builds a context block using a customizable template before every message:

**Placeholders:**
- `{user_name}` — from profile
- `{user_role}` — from profile
- `{user_goals}` — from profile
- `{memories}` — selected saved notes
- `{instruction}` — active response control or task mode instruction

**Section toggles:** Each section (name, role, goals, memory, instruction) can be independently enabled or disabled in Settings.

**Wrapped in markers:**
```
[USER CONTEXT START]
...
[USER CONTEXT END]
```

---

## F4 — Token-Saving Default System

When no task mode is active, PromptSync appends a short-answer instruction:

> *"Answer as short as possible. No explanation unless asked."*

Additional behavior:
- Facts → direct answer only
- Best choice questions → only the best option, no list of alternatives
- Automatically disabled when a task mode is active
- Override per-message with `/explain` or `/detail`

---

## F5 — Command System

12 built-in slash commands modify injection behavior for a single message.

| Command | Effect |
|---------|--------|
| `/no-memory` | Skip injection entirely |
| `/only-profile` | Profile only, no saved notes |
| `/strict` | Minimal: name + pinned only |
| `/explain` | Allow full explanation |
| `/detail` | Full context + detailed response |
| `/code` | Coding assistant mode |
| `/short` | Shortest possible answer |
| `/mode <name>` | Activate a named task mode |
| `/reset` | Revert to default |
| `/temp <text>` | Add session-only memory |

Commands are stripped from the message before sending — the AI never sees them.

---

## F6 — Custom Commands

Create your own slash commands with custom behavior:

- Define a command name (e.g., `/fast`, `/deep`)
- Configure actions:
  - Switch to a task mode
  - Enable or disable memory injection
  - Skip system/response control prompt
  - Inject a custom instruction string
- Create, edit, delete from **Modes Tab → Custom Commands**
- No arbitrary code execution — all actions use predefined safe action types

---

## F7 — Task Modes

Modes change the instruction injected with your context.

**Built-in Modes:**

| Mode | Instruction Injected |
|------|---------------------|
| **Coding** | "Give clean, minimal, working code. No explanation unless asked." |
| **Study** | "Explain simply step by step. Use easy words. Give examples." |
| **Short** | "Answer in the shortest possible way." |

**Custom Modes:**
- Create modes with any name and any custom instruction text
- Set a mode globally (from popup or floating panel) or per-message with `/mode`

When a task mode is active, the token-saving default is automatically suppressed.

---

## F8 — Saved Context Notes

A rich note system for storing persistent context:

| Feature | Detail |
|---------|--------|
| Text | The context content |
| Tags | Categorical labels for organization |
| Priority | High / Medium / Low — affects injection order |
| Pin | Always inject regardless of relevance |
| Enable/Disable | Toggle without deleting |
| Source tracking | Manual, selection, context menu, auto-detect |
| Drag & drop | Reorder notes visually |
| Bulk delete | Select multiple notes and delete at once |
| Search | Filter by text content or tag |

**Smart Keyword Matching:**
- Extracts keywords from your current message (stop words filtered)
- Scores each note by keyword overlap + priority + pin bonus
- Automatically selects the most relevant notes up to the configured max

---

## F9 — Memory Decay

Prevents context bloat by flagging notes you no longer use:

- Every note has a `lastUsed` timestamp, updated each time it's injected
- After a configurable number of days (default: 7), unused notes are flagged
- A **decay banner** in the Saved tab lists all stale notes
- One-click **"Remove All Stale"** bulk deletion
- **Pinned notes are exempt** — they never decay

Configure: **Settings → Decay**

---

## F10 — Security Guard

Scans note text for sensitive data before saving:

| Pattern | Detection Method |
|---------|-----------------|
| OpenAI API keys | `sk-` prefix |
| Stripe keys | `pk_live_`, `sk_live_` prefix |
| AWS access keys | `AKIA` prefix |
| GitHub tokens | `ghp_` prefix |
| Private keys | `-----BEGIN PRIVATE KEY-----` header |
| Bearer tokens | `Bearer` keyword |
| Passwords | `password:`, `passwd=`, `secret:` patterns |
| Credit cards | 13–19 digit Luhn-validated number sequences |

- Shows a **warning popup** when sensitive data is detected
- User can **override** (save anyway) or **cancel**
- Toggle scanning: **Settings → Security → Detect Sensitive Data**

---

## F11 — Customizable Injection Template

Edit the exact format of the context block injected before your messages:

- Full text editor for the template format
- Use any combination of placeholders: `{user_name}`, `{user_role}`, `{user_goals}`, `{memories}`, `{instruction}`
- Toggle each section on or off independently
- Default format uses `[USER CONTEXT START]` / `[USER CONTEXT END]` markers
- Changes apply immediately to all future injections

---

## F12 — Response Control

A global instruction appended to every injection:

- **Default:** `"Keep answer short. No extra explanation. Only give what is asked."`
- Fully customizable to any text
- Toggle on/off globally from Settings
- Overridden when a task mode is active

---

## F13 — Floating Panel

A persistent overlay on AI pages providing quick access to injection controls:

**Token Badge:**
- Always visible, shows current token count (e.g., `120 tok`)
- Click to expand the full panel

**Full Panel:**
- Memory injection toggle (ON/OFF)
- Mode switcher dropdown
- Token breakdown: input / memory / session
- Context window progress bar with color coding (green → yellow → red)
- Session reset button (clears `/temp` memories)

**Panel behavior:**
- Draggable — position saves across sessions
- Collapses when clicking outside
- Visibility options: badge only / full panel / hidden — in Settings

---

## F14 — Real-Time Token Tracking

Accurate, real-time token counting using the **o200k_base BPE tokenizer** (same as GPT-4o).

**Tracked:**
- Input tokens (your typed message)
- Injected memory tokens (context block)
- Session total (cumulative)

**Context window per platform:**

| Platform | Limit |
|----------|-------|
| ChatGPT | 128,000 tokens |
| Claude | 200,000 tokens |
| Gemini | 1,000,000 tokens |
| Perplexity | 16,000 tokens |
| DeepSeek | 64,000 tokens |

**Performance:** Token calculation is debounced at 300ms. BPE results are cached (200-entry LRU) for repeated strings.

---

## F15 — Dark Mode / Theme

Three theme options:

| Option | Behavior |
|--------|----------|
| Light | Always light |
| Dark | Always dark |
| System | Follows OS preference automatically |

- Cycle themes with the header button in the popup
- CSS variables enable smooth, instant switching
- Glassmorphism effects on floating panel and toast notifications

---

## F16 — Onboarding

A guided first-run experience for new users:

- 3-step visual overlay explains the core workflow
- Shows only once per version (version tracked in settings)
- Dismissible via "Got it" or "Skip" with smooth fade-out animation
- Can be re-triggered from **Help Tab → Reset Onboarding**

---

*PromptSync PRO v3.0.0 — 16 features. Zero cloud. Total control.*
