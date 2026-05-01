/**
 * storage.js
 * Central data layer for AI Smart Memory.
 * All data stored in chrome.storage.local — never leaves the device.
 * Works in both content script and popup contexts.
 */

const MemoryStorage = (() => {

  const KEYS = { PROFILE: 'asm_profile', ITEMS: 'asm_items', SETTINGS: 'asm_settings' };
  const MAX_ITEMS = 100;

  const DEFAULT_PROFILE = { name: '', goal: '', skills: '', preferences: '', customNotes: '' };

  const DEFAULT_SETTINGS = {
    injectEnabled:     true,
    compactMode:       false,
    autoDetect:        false,
    saveSelection:     true,
    showTokenCount:    true,
    tokenSavingPrompt: true,   // V2: inject short system prompt for token saving
    focusMode:         false,  // V2: profile + pinned only
    tokenIndicator:    true,   // V2: show token widget near AI input
    injectionMode:     'normal', // V2.5: 'normal' | 'compact' | 'strict'
    darkMode:          'system',
    platforms: {
      chatgpt:    true,
      claude:     true,
      gemini:     true,
      perplexity: true,
      deepseek:   true
    }
  };

  // V2: The token-saving system prompt (ultra-short to minimize token cost)
  const SYSTEM_PROMPT = 'Answer as short as possible. No explanation unless asked. Direct answer only.';

  /* ── Helpers ── */
  function storageGet(key) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(key, (r) => {
          if (chrome.runtime.lastError) {
            console.warn('[ASM] Storage get error:', chrome.runtime.lastError.message);
            resolve(undefined);
          } else {
            resolve(r[key]);
          }
        });
      } catch (e) {
        console.warn('[ASM] Storage access error:', e);
        resolve(undefined);
      }
    });
  }

  function storageSet(obj) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(obj, () => {
          if (chrome.runtime.lastError) {
            console.warn('[ASM] Storage set error:', chrome.runtime.lastError.message);
          }
          resolve();
        });
      } catch (e) {
        console.warn('[ASM] Storage write error:', e);
        resolve();
      }
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ── Settings cache ── */
  let _settingsCache = null;
  let _settingsCacheTime = 0;
  const CACHE_TTL = 2000; // 2s

  /* ── Profile ── */
  async function getProfile() {
    const raw = await storageGet(KEYS.PROFILE);
    return { ...DEFAULT_PROFILE, ...(raw || {}) };
  }

  async function saveProfile(profile) {
    await storageSet({ [KEYS.PROFILE]: profile });
  }

  /* ── Items ── */
  async function getItems() {
    const raw = await storageGet(KEYS.ITEMS);
    return Array.isArray(raw) ? raw : [];
  }

  async function addItem(text, source = 'manual') {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    const items = await getItems();

    // Duplicate detection — case-insensitive exact match
    const isDuplicate = items.some(i => i.text && i.text.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return { duplicate: true };

    const item = {
      id: generateId(),
      text: trimmed,
      source,
      timestamp: Date.now(),
      tags: [],
      pinned: false
    };

    items.unshift(item);

    // Enforce max items (keep pinned, trim oldest unpinned)
    if (items.length > MAX_ITEMS) {
      const pinned = items.filter(i => i.pinned);
      const unpinned = items.filter(i => !i.pinned);
      const kept = [...pinned, ...unpinned.slice(0, MAX_ITEMS - pinned.length)];
      await storageSet({ [KEYS.ITEMS]: kept });
      return item;
    }

    await storageSet({ [KEYS.ITEMS]: items });
    return item;
  }

  async function updateItem(id, updates) {
    const items = await getItems();
    const idx = items.findIndex(x => x.id === id);
    if (idx === -1) return false;

    if (typeof updates === 'string') {
      items[idx].text = updates.trim();
    } else {
      Object.assign(items[idx], updates);
    }
    items[idx].updatedAt = Date.now();
    await storageSet({ [KEYS.ITEMS]: items });
    return true;
  }

  async function deleteItem(id) {
    const items = await getItems();
    await storageSet({ [KEYS.ITEMS]: items.filter(x => x.id !== id) });
  }

  async function clearItems() {
    await storageSet({ [KEYS.ITEMS]: [] });
  }

  async function reorderItems(orderedIds) {
    const items = await getItems();
    const map = Object.fromEntries(items.map(i => [i.id, i]));
    const reordered = orderedIds.map(id => map[id]).filter(Boolean);
    const remaining = items.filter(i => !orderedIds.includes(i.id));
    await storageSet({ [KEYS.ITEMS]: [...reordered, ...remaining] });
  }

  /* ── Settings ── */
  async function getSettings() {
    const now = Date.now();
    if (_settingsCache && (now - _settingsCacheTime) < CACHE_TTL) {
      return { ..._settingsCache }; // Return copy to prevent mutation
    }
    const raw = await storageGet(KEYS.SETTINGS);
    const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
    // Deep merge platforms
    merged.platforms = { ...DEFAULT_SETTINGS.platforms, ...(raw?.platforms || {}) };
    _settingsCache = merged;
    _settingsCacheTime = now;
    return { ...merged }; // Return copy
  }

  async function saveSettings(settings) {
    await storageSet({ [KEYS.SETTINGS]: settings });
    _settingsCache = { ...settings };
    _settingsCacheTime = Date.now();
  }

  function invalidateSettingsCache() {
    _settingsCache = null;
    _settingsCacheTime = 0;
  }

  /* ── Export / Import ── */
  async function exportData() {
    const [profile, items, settings] = await Promise.all([getProfile(), getItems(), getSettings()]);
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profile,
      items,
      settings
    }, null, 2);
  }

  async function importData(jsonStr) {
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }

    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid data structure');
    }

    const payload = {};

    // Validate and sanitize profile
    if (data.profile && typeof data.profile === 'object') {
      const p = {};
      for (const key of Object.keys(DEFAULT_PROFILE)) {
        p[key] = typeof data.profile[key] === 'string' ? data.profile[key].slice(0, 500) : '';
      }
      payload[KEYS.PROFILE] = p;
    }

    // Validate and sanitize items
    if (Array.isArray(data.items)) {
      const validItems = data.items
        .filter(i => i && typeof i === 'object' && typeof i.text === 'string' && i.text.trim())
        .slice(0, MAX_ITEMS)
        .map(i => ({
          id: typeof i.id === 'string' ? i.id : generateId(),
          text: i.text.trim().slice(0, 1000),
          source: typeof i.source === 'string' ? i.source.slice(0, 30) : 'imported',
          timestamp: typeof i.timestamp === 'number' ? i.timestamp : Date.now(),
          tags: Array.isArray(i.tags) ? i.tags.filter(t => typeof t === 'string').slice(0, 5) : [],
          pinned: i.pinned === true
        }));
      payload[KEYS.ITEMS] = validItems;
    }

    // Validate and sanitize settings
    if (data.settings && typeof data.settings === 'object') {
      const s = { ...DEFAULT_SETTINGS };
      for (const key of ['injectEnabled', 'compactMode', 'autoDetect', 'saveSelection', 'showTokenCount', 'tokenSavingPrompt', 'focusMode', 'tokenIndicator']) {
        if (typeof data.settings[key] === 'boolean') s[key] = data.settings[key];
      }
      if (typeof data.settings.darkMode === 'string' && ['light', 'dark', 'system'].includes(data.settings.darkMode)) {
        s.darkMode = data.settings.darkMode;
      }
      if (data.settings.platforms && typeof data.settings.platforms === 'object') {
        for (const plat of Object.keys(DEFAULT_SETTINGS.platforms)) {
          if (typeof data.settings.platforms[plat] === 'boolean') {
            s.platforms[plat] = data.settings.platforms[plat];
          }
        }
      }
      payload[KEYS.SETTINGS] = s;
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('No valid data found in file');
    }

    await storageSet(payload);
    invalidateSettingsCache();
    return true;
  }

  /* ── Build Memory String ── */
  async function buildMemoryString(compact = false) {
    const [profile, items] = await Promise.all([getProfile(), getItems()]);
    const lines = [];

    if (profile.name)        lines.push(`Name: ${profile.name}`);
    if (profile.goal)        lines.push(`Goal: ${profile.goal}`);
    if (profile.skills)      lines.push(`Skills: ${profile.skills}`);
    if (profile.preferences) lines.push(`Preferences: ${profile.preferences}`);
    if (profile.customNotes) lines.push(`Notes: ${profile.customNotes}`);

    if (items.length > 0) {
      const pinned = items.filter(i => i.pinned);
      const unpinned = items.filter(i => !i.pinned);
      const limit = compact ? 3 : 8;
      const selected = [...pinned, ...unpinned].slice(0, Math.max(limit, pinned.length));

      if (compact) {
        lines.push(`Saved: ${selected.map(i => i.text).join(' | ')}`);
      } else {
        const itemLines = selected.map(i => `- ${i.text}`).join('\n');
        lines.push(`Saved context:\n${itemLines}`);
      }
    }

    if (lines.length === 0) return null;

    if (compact) {
      return `[Memory: ${lines.join(' | ')}]\n\n`;
    }
    return `[User Context — injected by AI Smart Memory]\n${lines.join('\n')}\n[End Context]\n\n`;
  }

  /* ── V2: Smart Build (delegates to ContextEngine if available) ── */
  async function buildMemoryStringV2(userText, overrides = {}) {
    const [profile, items, settings] = await Promise.all([getProfile(), getItems(), getSettings()]);
    if (typeof ContextEngine !== 'undefined') {
      return ContextEngine.build(userText, profile, items, settings, overrides);
    }
    // Fallback to legacy
    return buildMemoryString(settings.compactMode);
  }

  /* ── V2: Get system prompt ── */
  function getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  return {
    getProfile, saveProfile,
    getItems, addItem, updateItem, deleteItem, clearItems, reorderItems,
    getSettings, saveSettings, invalidateSettingsCache,
    exportData, importData, buildMemoryString, buildMemoryStringV2,
    getSystemPrompt, MAX_ITEMS
  };
})();