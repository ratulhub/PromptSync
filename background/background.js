/**
 * background.js — Service Worker (v3.0 PRO)
 * Handles context menus, keyboard shortcuts, memory decay alarms, and cross-tab messaging.
 */

const MAX_ITEMS = 100;

const AI_PLATFORM_PATTERNS = [
  'https://chat.openai.com', 'https://chatgpt.com',
  'https://claude.ai', 'https://gemini.google.com',
  'https://www.perplexity.ai', 'https://chat.deepseek.com'
];

const CONTENT_SCRIPTS = [
  'vendor/o200k_base.js', 'storage/storage.js', 'utils/tokenizer.js',
  'utils/securityGuard.js', 'utils/commandParser.js', 'utils/contextEngine.js',
  'content/floatingPanel.js', 'content/content.js'
];

function isAIPlatformTab(tab) {
  if (!tab?.url) return false;
  return AI_PLATFORM_PATTERNS.some(p => tab.url.startsWith(p));
}

/* ── Install / Update ── */
chrome.runtime.onInstalled.addListener((details) => {
  // Context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'asm-save-selection',
      title: 'Save to PromptSync',
      contexts: ['selection']
    });
  });

  // Default settings on first install
  if (details.reason === 'install') {
    chrome.storage.local.get('asm_settings', (res) => {
      if (!res.asm_settings) {
        chrome.storage.local.set({
          asm_settings: {
            injectEnabled: true,
            compactMode: false,
            autoDetect: false,
            saveSelection: true,
            showTokenCount: true,
            tokenSavingPrompt: true,
            focusMode: false,
            tokenIndicator: true,
            injectionMode: 'normal',
            darkMode: 'system',
            activeProfile: 'default',
            activeMode: '',
            platforms: { chatgpt: true, claude: true, gemini: true, perplexity: true, deepseek: true },
            responseControl: {
              enabled: true,
              text: 'IMPORTANT:\n• Keep answer short\n• No extra explanation\n• Only give what is asked',
              perMessage: false
            },
            security: { detectSensitive: true },
            decay: { enabled: true, days: 7 },
            advanced: { injectionDelay: 0, maxMemories: 8, strictMode: false, debugMode: false, maxTokenLimit: 4000 },
            autoSwitch: { enabled: false, mappings: {} },
            floatingPanel: { mode: 'badge', visible: true }
          }
        });
      }
    });

    // Default profiles
    chrome.storage.local.get('asm_profiles', (res) => {
      if (!res.asm_profiles) {
        chrome.storage.local.set({
          asm_profiles: {
            default: { name: '', role: '', goals: '', skills: '', preferences: '', customNotes: '' },
            student: { name: '', role: 'Student', goals: 'Learn and understand concepts', skills: '', preferences: 'Simple explanations, examples', customNotes: '' },
            developer: { name: '', role: 'Developer', goals: 'Build production-ready code', skills: '', preferences: 'Clean code, minimal explanation', customNotes: '' }
          }
        });
      }
    });

    // Default modes
    chrome.storage.local.get('asm_task_modes', (res) => {
      if (!res.asm_task_modes) {
        chrome.storage.local.set({
          asm_task_modes: {
            coding: { name: 'Coding', instruction: 'You are a coding assistant. Give clean, minimal, working code. No explanation unless asked.', builtin: true },
            study: { name: 'Study', instruction: 'Explain simply step by step. Use easy words. Give examples.', builtin: true },
            short: { name: 'Short', instruction: 'Answer in the shortest possible way. No extra explanation.', builtin: true }
          }
        });
      }
    });
  }

  // Re-inject content scripts to existing AI tabs
  if (details.reason === 'update' || details.reason === 'install') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (isAIPlatformTab(tab)) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: CONTENT_SCRIPTS
          }).catch(() => {});
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content/content.css']
          }).catch(() => {});
        }
      }
    });
  }

  // Set up decay check alarm
  chrome.alarms.create('asm-decay-check', { periodInMinutes: 1440 }); // Daily
});

/* ── Decay alarm ── */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'asm-decay-check') return;
  // Just log — actual decay UI is handled in popup
  console.log('[ASM] Decay check alarm fired');
});

/* ── Context Menu Click ── */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'asm-save-selection' || !info.selectionText) return;
  const text = info.selectionText.trim();
  if (!text) return;

  chrome.storage.local.get('asm_items', (res) => {
    const items = res.asm_items || [];
    if (items.some(i => i.text && i.text.toLowerCase() === text.toLowerCase())) {
      sendToTab(tab, 'Already saved ✓', 'info');
      return;
    }
    const newItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text, source: 'context-menu', timestamp: Date.now(), lastUsed: Date.now(),
      tags: [], keywords: [], priority: 'medium', pinned: false, enabled: true
    };
    items.unshift(newItem);
    chrome.storage.local.set({ asm_items: items.slice(0, MAX_ITEMS) }, () => {
      sendToTab(tab, 'Saved to Memory ✓', 'success');
    });
  });
});

/* ── Toast helper ── */
function sendToTab(tab, message, toastType = 'success') {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'SHOW_TOAST', message, toastType }).catch(() => {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: CONTENT_SCRIPTS }).catch(() => {});
  });
}

/* ── Keyboard shortcut ── */
if (chrome.commands?.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-injection') {
      chrome.storage.local.get('asm_settings', (res) => {
        const settings = res.asm_settings || {};
        settings.injectEnabled = !settings.injectEnabled;
        chrome.storage.local.set({ asm_settings: settings }, () => {
          chrome.tabs.query({}, (tabs) => {
            for (const tab of tabs) {
              if (isAIPlatformTab(tab)) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'SHOW_TOAST',
                  message: settings.injectEnabled ? 'Memory ON' : 'Memory OFF',
                  toastType: 'info'
                }).catch(() => {});
              }
            }
          });
        });
      });
    }
  });
}

/* ── Message relay ── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ASM_PING') { sendResponse({ status: 'ok' }); return true; }
  return false;
});