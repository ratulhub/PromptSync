# ⚡ PromptSync PRO

> **Your context. Synced with AI.**
> Less typing, smarter AI, better results.

PromptSync is a smart AI memory assistant that automatically adds your context to AI chats to save time and improve answers. It remembers your goals, preferences, and important info, then injects them into every message — so you stop repeating yourself and start getting better responses.

**Privacy-first** — all data stays on your device. Nothing is ever sent to any server.

---

## 🎯 What It Does

| Problem | PromptSync Solution |
|---------|-------------------|
| Typing "I'm a developer, I use React..." every chat | Your profile auto-injects |
| AI gives long, unwanted explanations | Token-saving prompt enforces short answers |
| Forgetting to mention project context | Saved notes match to your question keywords |
| Different needs on different AI platforms | Per-platform profiles auto-switch |
| Wasting tokens on repeated context | Smart injection minimizes token usage |

---

## ✨ Features

### 🧠 Smart Memory System
- **Profile injection** — name, role, goals, skills auto-prepend to every message
- **Multi-profile support** — switch between Student, Developer, or custom profiles
- **Auto-switch per site** — use different profiles on ChatGPT vs Claude vs Gemini
- **Saved context notes** — add, pin, tag, prioritize, enable/disable individual notes
- **Keyword matching** — notes relevant to your question get selected automatically
- **Priority system** — high/medium/low priority with visual indicators
- **Memory decay** — suggests removing unused notes after configurable days

### ⌨️ Command System
- `/no-memory` — skip injection for this message
- `/strict` — ultra-minimal context (name + pinned only)
- `/code` — coding mode with clean code output
- `/short` — force shortest possible answer
- `/mode study` — switch to study mode with step-by-step explanations
- `/temp <text>` — add session-only temporary memory
- **Custom commands** — create your own like `/fast` or `/deep`

### 🎛️ Task Modes
- **Coding** — clean, working code, no unnecessary explanation
- **Study** — step-by-step, simple words, examples
- **Short** — shortest possible answer
- **Custom** — create your own modes with custom instructions

### 📝 Customizable Template
- Edit the injection format with placeholders: `{user_name}`, `{user_role}`, `{user_goals}`, `{memories}`, `{instruction}`
- Toggle sections on/off (name, role, goals, memory, instruction)
- Editable response control instructions

### ⚡ Floating Panel
- Token badge always visible on AI pages
- Click to expand: memory toggle, mode switch, token breakdown
- Draggable and repositionable
- Session token tracking with context window progress bar

### 🔒 Security Guard
- Detects API keys (OpenAI, Stripe, AWS, GitHub, GitLab)
- Catches passwords, credit card numbers, private keys
- Warns before saving sensitive data

### 🌙 Design
- Clean, minimal, non-intrusive UI
- Dark/light/system theme
- Glassmorphism floating panel
- Smooth micro-animations

---

## 🌐 Supported Platforms

| Platform | Status |
|----------|--------|
| ChatGPT (chat.openai.com / chatgpt.com) | ✅ Full support |
| Claude (claude.ai) | ✅ Full support |
| Gemini (gemini.google.com) | ✅ Full support |
| Perplexity (perplexity.ai) | ✅ Full support |
| DeepSeek (chat.deepseek.com) | ✅ Full support |

Each platform can be individually enabled/disabled.

---

## 📁 Architecture

```
promptsync/
├── manifest.json          — Manifest V3 configuration
├── background/
│   └── background.js      — Service worker: context menu, shortcuts, alarms
├── content/
│   ├── content.js         — Core injection pipeline
│   ├── content.css        — All injected UI styles
│   ├── floatingPanel.js   — Token badge + expandable control panel
│   └── onboarding.js      — First-run welcome overlay
├── popup/
│   ├── popup.html         — 5-tab dashboard UI
│   ├── popup.js           — All popup logic
│   └── popup.css          — Popup styles with CSS variables
├── storage/
│   └── storage.js         — Central data layer (chrome.storage.local)
├── utils/
│   ├── tokenizer.js       — BPE token counting (o200k_base)
│   ├── contextEngine.js   — Smart context selection + template engine
│   ├── commandParser.js   — Slash command parser + custom commands
│   └── securityGuard.js   — Sensitive data detection
├── vendor/
│   └── o200k_base.js      — GPT tokenizer library
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── build.sh               — Release build script
```

### Data Flow

```
User Input → Parse Commands → Build Context (Engine) → Inject → Track Tokens
                ↓                    ↓
           Custom Commands    Template + Profile + Notes + Mode
```

### Storage Keys
All data in `chrome.storage.local`:
- `asm_profiles` — multi-profile data
- `asm_items` — saved context notes with keywords, priority, decay
- `asm_settings` — all settings including platform toggles, auto-switch, decay
- `asm_task_modes` — coding/study/short/custom modes
- `asm_custom_commands` — user-defined slash commands
- `asm_template` — customizable injection template
- `asm_panel_position` — floating panel coordinates

---

## 🚀 Installation

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the project folder
5. Pin PromptSync to your toolbar
6. Open any supported AI platform and start chatting

---

## 📜 Version History

| Version | Highlights |
|---------|-----------|
| v3.0.0  | Multi-profiles, auto-switch, custom commands, floating panel, task modes, template editor, security guard, memory decay, onboarding |
| v2.5.0  | Token tracking, command system, context engine, dark mode |
| v2.0.0  | Smart injection, keyword matching, platform support |
| v1.0.0  | Basic memory storage and injection |

---

## 🔐 Privacy

- **Zero network requests** — nothing leaves your device
- **No analytics** — no tracking, no telemetry
- **Local-only storage** — all data in `chrome.storage.local`
- **Open source** — inspect every line of code
- **Security guard** — actively prevents saving sensitive data

---

**PromptSync PRO v3.0.0**
*Stop repeating. Start syncing.*
