/**
 * background.js — Service Worker (V2.5 PRO)
 * Handles context menu "Save to Memory", keyboard shortcuts, and cross-tab messaging.
 * Fixed: merged double onInstalled listener, improved URL matching.
 */

const MAX_ITEMS = 100;

/* ── URL Pattern Matching ── */
const AI_PLATFORM_PATTERNS = [
  'https://chat.openai.com',
  'https://chatgpt.com',
  'https://claude.ai',
  'https://gemini.google.com',
  'https://www.perplexity.ai',
  'https://chat.deepseek.com'
];

function isAIPlatformTab(tab) {
  if (!tab?.url) return false;
  try {
    const url = new URL(tab.url);
    return AI_PLATFORM_PATTERNS.some(p => tab.url.startsWith(p));
  } catch {
    return false;
  }
}

/* ── Context Menu + Extension Initialization (single onInstalled handler) ── */
chrome.runtime.onInstalled.addListener((details) => {
  // 1. Create context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id:       'asm-save-selection',
      title:    'Save to AI Smart Memory',
      contexts: ['selection']
    });
  });

  // 2. Initialize default settings on first install
  if (details.reason === 'install') {
    chrome.storage.local.get('asm_settings', (res) => {
      if (!res.asm_settings) {
        chrome.storage.local.set({
          asm_settings: {
            injectEnabled:     true,
            compactMode:       false,
            autoDetect:        false,
            saveSelection:     true,
            showTokenCount:    true,
            tokenSavingPrompt: true,
            focusMode:         false,
            tokenIndicator:    true,
            injectionMode:     'normal',
            darkMode:          'system',
            platforms: {
              chatgpt:    true,
              claude:     true,
              gemini:     true,
              perplexity: true,
              deepseek:   true
            }
          }
        });
      }
    });
  }

  // 3. Re-inject content scripts on install/update to existing AI tabs
  if (details.reason === 'update' || details.reason === 'install') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (isAIPlatformTab(tab)) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['vendor/o200k_base.js', 'storage/storage.js', 'utils/tokenizer.js', 'utils/commandParser.js', 'utils/contextEngine.js', 'utils/tokenTracker.js', 'content/content.js']
          }).catch(() => {});
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content/content.css']
          }).catch(() => {});
        }
      }
    });
  }
});

/* ── Context Menu Click ── */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'asm-save-selection' || !info.selectionText) return;

  const text = info.selectionText.trim();
  if (!text) return;

  chrome.storage.local.get('asm_items', (res) => {
    const items = res.asm_items || [];

    // Duplicate detection
    const isDuplicate = items.some(i => i.text && i.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
      sendToTab(tab, 'Already saved ✓', 'info');
      return;
    }

    const newItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text,
      source: 'context-menu',
      timestamp: Date.now(),
      tags: [],
      pinned: false
    };

    items.unshift(newItem);
    const trimmed = items.slice(0, MAX_ITEMS);

    chrome.storage.local.set({ asm_items: trimmed }, () => {
      sendToTab(tab, 'Saved to Memory ✓', 'success');
    });
  });
});

/* ── Helper: Send toast to tab ── */
function sendToTab(tab, message, toastType = 'success') {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, {
    type: 'SHOW_TOAST',
    message,
    toastType
  }).catch(() => {
    // Content script may not be loaded yet, inject it
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['vendor/o200k_base.js', 'storage/storage.js', 'utils/tokenizer.js', 'utils/commandParser.js', 'utils/contextEngine.js', 'utils/tokenTracker.js', 'content/content.js']
    }).catch(() => {});
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
          // Notify all AI tabs
          chrome.tabs.query({}, (tabs) => {
            for (const tab of tabs) {
              if (isAIPlatformTab(tab)) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'SHOW_TOAST',
                  message: settings.injectEnabled ? 'Memory ON ✨' : 'Memory OFF ⏸',
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

/* ── Message relay & handler ── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Handle ping from content scripts to verify connection
  if (msg.type === 'ASM_PING') {
    sendResponse({ status: 'ok' });
    return true;
  }
  return false;
});