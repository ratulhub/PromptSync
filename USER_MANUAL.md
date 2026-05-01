# PromptSync PRO - User Manual

Welcome to **PromptSync PRO**, your privacy-first AI context manager. This extension automatically injects your context, goals, and role instructions into your prompts across all major AI platforms (ChatGPT, Claude, Gemini, Perplexity, DeepSeek) so you never have to repeat yourself again.

---

## 1. Installation

1. Download or clone the PromptSync repository to your computer.
2. Open Google Chrome (or Edge/Brave) and go to `chrome://extensions`.
3. Turn on **Developer mode** using the toggle in the top right corner.
4. Click the **Load unpacked** button and select the PromptSync folder.
5. **Pin** the extension to your browser toolbar for quick access.

---

## 2. First-Time Setup

Click the PromptSync extension icon in your toolbar to open the **Dashboard**.

### Setting Up Your Profile
1. Go to the **Profile** tab.
2. Fill in your details: Name, Role, Goals, Skills, and Preferences. 
3. *Tip:* You can create multiple profiles (e.g., "Student", "Work") and switch between them.
4. Click **Save Profile**. 

### Saving Memory Notes
1. Go to the **Saved** tab.
2. Add facts or context you want the AI to always remember (e.g., "I use React and TailwindCSS" or "Project X is launching in Q3").
3. You can also highlight any text on a webpage and click the floating **"＋ Save to PromptSync"** button to quickly save context!

---

## 3. Using the Role-Based Engine

PromptSync uses a powerful Role-Based Engine to ensure the AI behaves exactly how you want.

### Selecting a Role
1. Open the extension popup and navigate to the **Roles** tab.
2. Select an **Active Role** from the dropdown (e.g., *Researcher*, *Developer*, *Writer*).
3. Whenever you send a message, PromptSync will automatically inject instructions telling the AI to act as that role.

### Creating a Custom Role
If the built-in roles don't fit your needs:
1. In the **Roles** tab, enter a Role Name (e.g., "Architect") and the Instruction (e.g., "You are a Cloud Architect...").
2. Click **Create Role**. It will immediately be available in your Active Roles dropdown.

### Managing Injection Settings
Under the **Roles** tab, you'll find the **Role Settings**:
- **Injection Position:** Choose whether context is injected at the `TOP` (recommended) or `BOTTOM` of your prompt.
- **Role Mode:** 
  - `AUTO`: Always uses your selected Default Role.
  - `MANUAL`: Only injects a role if you explicitly type a slash command (see Section 4).
  - `OFF`: Completely disables role injection.
- **Persistent Role:** If turned *ON*, using a shortcut permanently switches your active role. If *OFF*, the shortcut only applies to that single message.
- **Enable STYLE Block:** Automatically appends formatting rules (e.g., "Be direct", "Focus on quality") to ensure professional outputs. You can edit these rules right from the dashboard.

---

## 4. Quick Commands & Shortcuts

You don't need to open the popup every time you want to switch context. You can type these commands directly into the AI chat box:

### Role Shortcuts
Type these at the start of your prompt to instantly switch roles for that message:
- `/dev` — Switch to Developer
- `/research` — Switch to Researcher
- `/design` — Switch to Designer
- `/business` — Switch to Business
- `/writer` — Switch to Writer

*Example:* `/dev Can you write a Python script for this?`

### System Commands
- `/no-memory` — Send a raw message with zero context injected.
- `/only-profile` — Inject your Profile info, but skip all Saved Notes.
- `/strict` — Ultra-minimal context (Only injects your name and pinned notes).
- `/temp [text]` — Add a temporary memory that only lasts for the current tab session.
- `/reset` — Resets all overrides.

### The Fail-Safe System
If you ever manually type a role instruction in your prompt (e.g., `"Act as a..."` or `"You are a..."`), PromptSync will intelligently detect it and **automatically skip** injecting its own Role block, ensuring it never overrides your manual intent.

---

## 5. Token Tracking & Preview System

### Floating Panel
On any supported AI site, you will see a small, draggable badge in the bottom right corner showing your token usage.
- Click the badge to expand it into a full panel.
- From here, you can quickly **toggle Memory ON/OFF**, switch your **Active Role**, or change the **Injection Position** without leaving the chat.

### Claude Counter
If you are using **Claude (claude.ai)**, PromptSync includes a fully sandboxed token tracker specifically designed to monitor your Claude conversation token limits accurately. It runs completely independently and ensures you never accidentally run out of tokens.

### Preview Before Sending
Want to see exactly what PromptSync is injecting before it sends?
1. Open the popup, go to the **Roles** tab.
2. Enable **Preview before sending**.
3. Now, when you press Enter in the chat, PromptSync will inject the text into your input box and *pause*. 
4. Review or edit the text, then press Enter again to officially send it!

---

## 6. Security & Privacy

**100% Local.**
PromptSync operates entirely on your machine. Your profiles, memory notes, and settings are saved in your browser's local storage. There are no servers, no databases, and no telemetry.

**Security Guard.**
PromptSync has a built-in Security Guard. If you attempt to save text that looks like an API Key, Password, or Credit Card number, it will warn you to ensure you don't accidentally store sensitive secrets in your context.
