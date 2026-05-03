# PromptSync PRO - Detailed Features

PromptSync PRO is an advanced, privacy-first context management system that automatically injects your context, goals, and roles into AI chats. It is designed to work seamlessly across major platforms (ChatGPT, Claude, Gemini, Perplexity, DeepSeek).

Below is the comprehensive list of features that power the extension.

---

## 1. Professional Role-Based Engine
A fully flexible engine that replaces legacy generic tasks with specialized professional roles.
*   **Built-in Roles:** Includes highly optimized instructions for **Researcher**, **Developer**, **Designer**, **Business**, and **Writer**.
*   **Strict Markdown Formatting:** Automatically formats instructions using exact `[ROLE]` and `[STYLE]` blocks to guarantee the AI recognizes and adheres to the persona.
*   **Custom Roles:** Create, edit, and delete your own custom roles from the dashboard.
*   **Dynamic Role Modes:** Configure injection to run `AUTO` (always use default role), `MANUAL` (only apply role if a command is used), or `OFF`.

## 2. Dynamic Injection Position
*   **Top or Bottom:** Decide where your context is injected relative to your prompt. You can prepend it at the `TOP` (recommended for systemic instructions) or append it at the `BOTTOM`.

## 3. Style Block & Response Control
*   **Customizable Style Instructions:** Append a dedicated `[STYLE]` block enforcing professional outputs (e.g., "Be direct", "Focus on quality output").
*   **Toggleable:** Easily enable or disable the style block injection globally.
*   **Response Control:** Add customized overarching rules (e.g., "Do not use emojis") appended to the very end of your context.

## 4. Fail-Safe AI Intent Detection
*   PromptSync intelligently reads your prompt before injecting context.
*   If you manually specify a role using phrases like *"act as..."*, *"you are a..."*, or manually type `[ROLE]`, the system recognizes your intent and **skips automatic injection** to prevent conflicts or duplications.

## 5. Quick Command Shortcuts
Instantly switch contexts or manage memory directly from the AI chat input using slash commands.
*   **Role Switches:** `/research`, `/dev`, `/design`, `/business`, `/writer`
*   **Memory Controls:** `/no-memory` (skip injection), `/only-profile` (inject only profile, no notes), `/strict` (ultra-minimal context), `/temp [text]` (add session memory).
*   **One-Time vs Persistent Roles:** Define whether typing a shortcut changes your role permanently, or if it reverts to your default role after a single message.

## 6. Optional Preview System
*   **Review Before Sending:** Enable the preview toggle in settings. When you hit Enter, PromptSync will inject the full context block directly into your input box but pause execution.
*   You can manually review, edit, or tweak the injected prompt before sending it manually.

## 7. Sandboxed Claude Token Counter
*   A specialized, independent token counter explicitly built for **Claude (claude.ai)**.
*   Runs in a fully isolated namespace to prevent conflicts with PromptSync's core logic.
*   Uses a dedicated communication bridge to intercept requests and calculate precise Claude API-level token limits.

## 8. Multi-Profile Context System
*   **Multiple Personas:** Create different profiles (e.g., "Student", "Developer", "Default") containing different Names, Roles, Goals, Skills, and Preferences.
*   **Auto-Switch per Domain:** Map profiles to specific AI platforms (e.g., default to "Student" on Claude, but "Developer" on ChatGPT).

## 9. Smart Saved Context Notes
*   **Memory Management:** Add, edit, tag, and prioritize individual memory notes (e.g., "I use Tailwind CSS").
*   **Keyword Matching:** PromptSync parses your prompt, filters out stop words, and actively searches your saved notes to only inject context that is relevant to your current question.
*   **Priority & Pinned Notes:** Set high priority for important notes, or "Pin" them to ensure they are always injected regardless of keyword matching.

## 10. Memory Decay
*   PromptSync tracks the `lastUsed` timestamp for every note.
*   Notes that haven't been matched or used in a configurable number of days (default: 7) are flagged for removal. 
*   Keeps your context lean and relevant, avoiding token bloat from outdated information.

## 11. Security Guard
*   A robust, real-time scanner that analyzes text before you save it to your memory.
*   **Pattern Matching:** Detects API keys (OpenAI, AWS, GitHub, Stripe), private keys, bearer tokens, and passwords.
*   **Luhn Checksum:** Validates credit card numbers to prevent accidental saving.
*   Warns you before saving any sensitive data to your local storage.

## 12. Floating Quick Panel
*   **Token Badge:** A minimal badge sits in the corner of your AI chat showing real-time token tracking.
*   **Expandable Panel:** Click to reveal a full control panel where you can toggle memory injection ON/OFF, quickly change your Active Role, or alter the Injection Position without opening the dashboard popup.
*   **Session Tracking:** See exactly how much context you've consumed across your entire conversation.

## 13. Auto-Detect & Selection Save
*   **Web Selection:** Highlight text on any website and a "Save to PromptSync" button will appear. One click saves the context instantly.
*   **Auto-Detect:** If you type phrases like *"I am learning..."* or *"My goal is..."* in the chat, PromptSync will recognize this as valuable context and prompt you to save it permanently.

## 14. 100% Local & Privacy-First
*   All data, profiles, and settings are stored locally in your browser using `api.storage.local` (wrapping `chrome.storage.local` and `browser.storage.local`).
*   Zero external API calls. Zero analytics. Zero telemetry.
*   Your personal data and chat context never leaves your machine.

## 15. Customizable Injection Template
*   Edit the exact structure of your injected context from the settings tab.
*   Use variables like `{user_name}`, `{user_goals}`, and `{memories}` to format the output precisely how you prefer.

## 16. Fast, Native Performance
*   Built entirely with vanilla JavaScript and CSS.
*   Zero heavy frameworks, meaning ultra-fast execution, no UI lag, and extremely low memory consumption.
*   Debounced mutation observers and smart DOM checking ensures the extension never slows down your browser.

## 17. Premium Dark Mode & UI
*   A professional, clean popup dashboard built with Glassmorphism elements.
*   Supports Light mode, Dark mode, and System-synced themes with smooth CSS variable transitions.

## 18. Cross-Browser Compatibility (Chrome & Firefox)
*   **Universal API Wrapper:** A custom `browserApi.js` layer ensures all storage, messaging, and runtime APIs execute flawlessly on both Chromium-based browsers (Chrome, Edge, Brave) and Firefox.
*   **Manifest Split System:** Dedicated build pipelines generate `manifest.chrome.json` (Service Worker architecture) and `manifest.firefox.json` (Background Scripts architecture) automatically, avoiding legacy compatibility issues.
