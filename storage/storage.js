/**
 * storage.js — v3.1.1 PRO
 * Central data layer with profiles, task modes, templates, and advanced settings.
 * All data in api.storage.local — never leaves the device.
 */

const MemoryStorage = (() => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  'use strict';

  const KEYS = {
    PROFILE:   'asm_profile',
    PROFILES:  'asm_profiles',
    ITEMS:     'asm_items',
    SETTINGS:  'asm_settings',
    MODES:     'asm_task_modes',
    ROLES:     'asm_roles',
    COMMANDS:  'asm_custom_commands',
    TEMPLATE:  'asm_template',
    PANEL_POS: 'asm_panel_position'
  };

  const MAX_ITEMS = 100;

  /* ── Defaults ── */
  const DEFAULT_PROFILE = {
    name: '', role: '', goals: '', skills: '', preferences: '', customNotes: ''
  };

  const DEFAULT_SETTINGS = {
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
    activeProfile:     'default',
    activeMode:        '',
    activeRole:        '',
    roleInjectionMode: 'AUTO',
    injectionPosition: 'TOP',
    enableStyleBlock:  true,
    styleInstructions: '* Be direct\n* Avoid unnecessary explanation\n* Focus on quality output',
    persistentRole:    true,
    previewBeforeSend: false,
    platforms: {
      chatgpt: true, claude: true, gemini: true, perplexity: true, deepseek: true
    },
    responseControl: {
      enabled: true,
      text: 'IMPORTANT:\n• Keep answer short\n• No extra explanation\n• Only give what is asked',
      perMessage: false
    },
    security: {
      detectSensitive: true
    },
    decay: {
      enabled: true,
      days: 7
    },
    advanced: {
      injectionDelay: 0,
      maxMemories: 8,
      strictMode: false,
      debugMode: false,
      maxTokenLimit: 4000
    },
    autoSwitch: {
      enabled: false,
      mappings: {}
    },
    floatingPanel: {
      mode: 'badge',
      visible: true
    }
  };

  const DEFAULT_TEMPLATE = {
    format: '[USER CONTEXT START]\nName: {user_name}\nRole: {user_role}\nGoals: {user_goals}\n\nRelevant Memory:\n{memories}\n\nInstruction:\n{instruction}\n[USER CONTEXT END]',
    sections: {
      name: true,
      role: true,
      goals: true,
      memory: true,
      instruction: true
    }
  };

  const DEFAULT_ROLES = {
    researcher: {
      name: 'Researcher Mode',
      instruction: 'You are an apex researcher. Think deeply, analyze critically, and provide structured, evidence-based insights. Focus on accuracy, depth, and clarity.',
      builtin: true
    },
    developer: {
      name: 'Developer Mode',
      instruction: 'You are a highly experienced software engineer. Provide clean, optimized, production-ready code. Avoid unnecessary explanation unless asked.',
      builtin: true
    },
    designer: {
      name: 'Designer Mode',
      instruction: 'You are a professional UI/UX designer. Focus on modern, clean, user-friendly design with strong visual hierarchy and usability.',
      builtin: true
    },
    business: {
      name: 'Business Mode',
      instruction: 'You are a strategic business expert. Provide practical, market-focused, and actionable insights.',
      builtin: true
    },
    writer: {
      name: 'Writer Mode',
      instruction: 'You are a professional writer. Write clearly, naturally, and engagingly like a human.',
      builtin: true
    }
  };

  const DEFAULT_CUSTOM_COMMANDS = [];

  const SYSTEM_PROMPT = 'Answer as short as possible. No explanation unless asked. Direct answer only.';

  /* ── Helpers ── */
  function storageGet(key) {
    return new Promise(resolve => {
      try {
        api.storage.local.get(key, r => {
          if (api.runtime.lastError) {
            console.warn('[ASM] Storage get error:', api.runtime.lastError.message);
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
    return new Promise(resolve => {
      try {
        api.storage.local.set(obj, () => {
          if (api.runtime.lastError) {
            console.warn('[ASM] Storage set error:', api.runtime.lastError.message);
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
  const CACHE_TTL = 2000;

  /* ═══════════════════════
     PROFILES
  ═══════════════════════ */
  async function getProfiles() {
    const raw = await storageGet(KEYS.PROFILES);
    if (raw && typeof raw === 'object') return raw;
    return { default: { ...DEFAULT_PROFILE } };
  }

  async function saveProfiles(profiles) {
    await storageSet({ [KEYS.PROFILES]: profiles });
  }

  async function getProfile(profileName) {
    const profiles = await getProfiles();
    const settings = await getSettings();
    const name = profileName || settings.activeProfile || 'default';
    return { ...DEFAULT_PROFILE, ...(profiles[name] || profiles.default || {}) };
  }

  async function saveProfile(profile, profileName) {
    const profiles = await getProfiles();
    const settings = await getSettings();
    const name = profileName || settings.activeProfile || 'default';
    profiles[name] = profile;
    await saveProfiles(profiles);
    // Legacy compat
    await storageSet({ [KEYS.PROFILE]: profile });
  }

  async function switchProfile(name) {
    const settings = await getSettings();
    settings.activeProfile = name;
    await saveSettings(settings);
    invalidateSettingsCache();
    return await getProfile(name);
  }

  async function createProfile(name, data) {
    const profiles = await getProfiles();
    const key = name.toLowerCase().replace(/\s+/g, '_');
    profiles[key] = { ...DEFAULT_PROFILE, ...(data || {}) };
    await saveProfiles(profiles);
    return key;
  }

  async function deleteProfile(name) {
    if (name === 'default') return false;
    const profiles = await getProfiles();
    delete profiles[name];
    await saveProfiles(profiles);
    const settings = await getSettings();
    if (settings.activeProfile === name) {
      settings.activeProfile = 'default';
      await saveSettings(settings);
    }
    return true;
  }

  async function getProfileForDomain(hostname) {
    const settings = await getSettings();
    if (!settings.autoSwitch?.enabled) return null;
    const mappings = settings.autoSwitch?.mappings || {};
    for (const [domain, profileName] of Object.entries(mappings)) {
      if (hostname.includes(domain)) return profileName;
    }
    return null;
  }

  /* ═══════════════════════
     ITEMS (Memory Notes)
  ═══════════════════════ */
  async function getItems() {
    const raw = await storageGet(KEYS.ITEMS);
    const items = Array.isArray(raw) ? raw : [];
    return migrateItems(items);
  }

  function migrateItems(items) {
    let changed = false;
    const migrated = items.map(item => {
      const m = { ...item };
      if (!Array.isArray(m.keywords)) { m.keywords = extractAutoKeywords(m.text || ''); changed = true; }
      if (!m.priority) { m.priority = 'medium'; changed = true; }
      if (!m.lastUsed) { m.lastUsed = m.timestamp || Date.now(); changed = true; }
      if (typeof m.enabled !== 'boolean') { m.enabled = true; changed = true; }
      return m;
    });
    if (changed) {
      storageSet({ [KEYS.ITEMS]: migrated }).catch(() => {});
    }
    return migrated;
  }

  function extractAutoKeywords(text) {
    if (!text) return [];
    const stop = new Set(['the','a','an','is','are','was','were','i','my','to','of','in','for','on','it','and','or','but','not','you','we','he','she','they','this','that','be','have','has','do','does','did','will','would','can','could','should','may','with','at','by','from','as']);
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 2 && !stop.has(w))
      .filter((w, i, a) => a.indexOf(w) === i)
      .slice(0, 10);
  }

  async function addItem(text, source = 'manual') {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    const items = await getItems();
    const isDuplicate = items.some(i => i.text && i.text.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return { duplicate: true };

    const item = {
      id: generateId(),
      text: trimmed,
      source,
      timestamp: Date.now(),
      lastUsed: Date.now(),
      tags: [],
      keywords: extractAutoKeywords(trimmed),
      priority: 'medium',
      pinned: false,
      enabled: true
    };

    items.unshift(item);
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
      items[idx].keywords = extractAutoKeywords(updates.trim());
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

  async function bulkDeleteItems(ids) {
    const idSet = new Set(ids);
    const items = await getItems();
    await storageSet({ [KEYS.ITEMS]: items.filter(x => !idSet.has(x.id)) });
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

  async function updateLastUsed(id) {
    const items = await getItems();
    const item = items.find(x => x.id === id);
    if (item) {
      item.lastUsed = Date.now();
      await storageSet({ [KEYS.ITEMS]: items });
    }
  }

  async function getDecayCandidates() {
    const settings = await getSettings();
    if (!settings.decay?.enabled) return [];
    const days = settings.decay?.days || 7;
    const threshold = Date.now() - (days * 24 * 60 * 60 * 1000);
    const items = await getItems();
    return items.filter(i => !i.pinned && i.lastUsed < threshold);
  }

  /* ═══════════════════════
     ROLES
  ═══════════════════════ */
  async function getRoles() {
    const raw = await storageGet(KEYS.ROLES);
    return (raw && typeof raw === 'object') ? { ...DEFAULT_ROLES, ...raw } : { ...DEFAULT_ROLES };
  }

  async function saveRoles(roles) {
    await storageSet({ [KEYS.ROLES]: roles });
  }

  async function setActiveRole(roleName) {
    const settings = await getSettings();
    settings.activeRole = roleName;
    await saveSettings(settings);
  }

  async function getActiveRole() {
    const settings = await getSettings();
    if (!settings.activeRole) return null;
    const roles = await getRoles();
    return roles[settings.activeRole] || null;
  }

  /* ═══════════════════════
     TASK MODES (Legacy)
  ═══════════════════════ */
  async function getTaskModes() {
    const raw = await storageGet(KEYS.MODES);
    return (raw && typeof raw === 'object') ? raw : {};
  }

  async function saveTaskModes(modes) {
    await storageSet({ [KEYS.MODES]: modes });
  }

  async function setActiveMode(modeName) {
    const settings = await getSettings();
    settings.activeMode = modeName;
    await saveSettings(settings);
  }

  async function getActiveMode() {
    const settings = await getSettings();
    if (!settings.activeMode) return null;
    const modes = await getTaskModes();
    return modes[settings.activeMode] || null;
  }

  /* ═══════════════════════
     CUSTOM COMMANDS
  ═══════════════════════ */
  async function getCustomCommands() {
    const raw = await storageGet(KEYS.COMMANDS);
    return Array.isArray(raw) ? raw : [...DEFAULT_CUSTOM_COMMANDS];
  }

  async function saveCustomCommands(commands) {
    await storageSet({ [KEYS.COMMANDS]: commands });
  }

  /* ═══════════════════════
     INJECTION TEMPLATE
  ═══════════════════════ */
  async function getTemplate() {
    const raw = await storageGet(KEYS.TEMPLATE);
    return (raw && typeof raw === 'object') ? { ...DEFAULT_TEMPLATE, ...raw, sections: { ...DEFAULT_TEMPLATE.sections, ...(raw.sections || {}) } } : { ...DEFAULT_TEMPLATE };
  }

  async function saveTemplate(template) {
    await storageSet({ [KEYS.TEMPLATE]: template });
  }

  /* ═══════════════════════
     PANEL POSITION
  ═══════════════════════ */
  async function getPanelPosition() {
    return await storageGet(KEYS.PANEL_POS) || null;
  }

  async function savePanelPosition(pos) {
    await storageSet({ [KEYS.PANEL_POS]: pos });
  }

  /* ═══════════════════════
     SETTINGS
  ═══════════════════════ */
  async function getSettings() {
    const now = Date.now();
    if (_settingsCache && (now - _settingsCacheTime) < CACHE_TTL) {
      return JSON.parse(JSON.stringify(_settingsCache));
    }
    const raw = await storageGet(KEYS.SETTINGS);
    const merged = deepMerge(DEFAULT_SETTINGS, raw || {});
    _settingsCache = merged;
    _settingsCacheTime = now;
    return JSON.parse(JSON.stringify(merged));
  }

  async function saveSettings(settings) {
    await storageSet({ [KEYS.SETTINGS]: settings });
    _settingsCache = JSON.parse(JSON.stringify(settings));
    _settingsCacheTime = Date.now();
  }

  function invalidateSettingsCache() {
    _settingsCache = null;
    _settingsCacheTime = 0;
  }

  function deepMerge(target, source) {
    const out = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
        out[key] = deepMerge(target[key], source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  /* ═══════════════════════
     EXPORT / IMPORT
  ═══════════════════════ */
  async function exportData() {
    const [profiles, items, settings, roles, commands, template] = await Promise.all([
      getProfiles(), getItems(), getSettings(), getRoles(), getCustomCommands(), getTemplate()
    ]);
    return JSON.stringify({
      version: '3.0',
      exportedAt: new Date().toISOString(),
      profiles,
      items,
      settings,
      roles,
      commands,
      template
    }, null, 2);
  }

  async function importData(jsonStr) {
    let data;
    try { data = JSON.parse(jsonStr); } catch { throw new Error('Invalid JSON format'); }
    if (typeof data !== 'object' || data === null) throw new Error('Invalid data structure');

    const payload = {};

    // Profile(s)
    if (data.profiles && typeof data.profiles === 'object') {
      payload[KEYS.PROFILES] = data.profiles;
      // Set legacy profile to default
      if (data.profiles.default) payload[KEYS.PROFILE] = data.profiles.default;
    } else if (data.profile && typeof data.profile === 'object') {
      payload[KEYS.PROFILES] = { default: data.profile };
      payload[KEYS.PROFILE] = data.profile;
    }

    // Items
    if (Array.isArray(data.items)) {
      payload[KEYS.ITEMS] = data.items
        .filter(i => i && typeof i === 'object' && typeof i.text === 'string' && i.text.trim())
        .slice(0, MAX_ITEMS)
        .map(i => ({
          id: typeof i.id === 'string' ? i.id : generateId(),
          text: i.text.trim().slice(0, 1000),
          source: typeof i.source === 'string' ? i.source.slice(0, 30) : 'imported',
          timestamp: typeof i.timestamp === 'number' ? i.timestamp : Date.now(),
          lastUsed: typeof i.lastUsed === 'number' ? i.lastUsed : Date.now(),
          tags: Array.isArray(i.tags) ? i.tags.filter(t => typeof t === 'string').slice(0, 5) : [],
          keywords: Array.isArray(i.keywords) ? i.keywords : extractAutoKeywords(i.text),
          priority: ['high','medium','low'].includes(i.priority) ? i.priority : 'medium',
          pinned: i.pinned === true,
          enabled: i.enabled !== false
        }));
    }

    // Settings
    if (data.settings && typeof data.settings === 'object') {
      payload[KEYS.SETTINGS] = deepMerge(DEFAULT_SETTINGS, data.settings);
    }

    // Roles
    if (data.roles && typeof data.roles === 'object') {
      payload[KEYS.ROLES] = { ...DEFAULT_ROLES, ...data.roles };
    }

    // Custom commands
    if (Array.isArray(data.commands)) {
      payload[KEYS.COMMANDS] = data.commands;
    }

    // Template
    if (data.template && typeof data.template === 'object') {
      payload[KEYS.TEMPLATE] = { ...DEFAULT_TEMPLATE, ...data.template };
    }

    if (Object.keys(payload).length === 0) throw new Error('No valid data found');
    await storageSet(payload);
    invalidateSettingsCache();
    return true;
  }

  /* ═══════════════════════
     BUILD MEMORY STRING (Legacy compat)
  ═══════════════════════ */
  async function buildMemoryString(compact = false) {
    const [profile, items] = await Promise.all([getProfile(), getItems()]);
    const lines = [];
    if (profile.name)        lines.push(`Name: ${profile.name}`);
    if (profile.role)        lines.push(`Role: ${profile.role}`);
    if (profile.goals)       lines.push(`Goals: ${profile.goals}`);
    if (profile.skills)      lines.push(`Skills: ${profile.skills}`);
    if (profile.preferences) lines.push(`Preferences: ${profile.preferences}`);
    if (profile.customNotes) lines.push(`Notes: ${profile.customNotes}`);
    const enabled = items.filter(i => i.enabled !== false);
    if (enabled.length > 0) {
      const pinned = enabled.filter(i => i.pinned);
      const unpinned = enabled.filter(i => !i.pinned);
      const limit = compact ? 3 : 8;
      const selected = [...pinned, ...unpinned].slice(0, Math.max(limit, pinned.length));
      if (compact) {
        lines.push(`Saved: ${selected.map(i => i.text).join(' | ')}`);
      } else {
        lines.push(`Saved context:\n${selected.map(i => `- ${i.text}`).join('\n')}`);
      }
    }
    if (lines.length === 0) return null;
    if (compact) return `[Memory: ${lines.join(' | ')}]\n\n`;
    return `[User Context — injected by PromptSync]\n${lines.join('\n')}\n[End Context]\n\n`;
  }

  async function buildMemoryStringV2(userText, overrides = {}) {
    const [profile, items, settings] = await Promise.all([getProfile(), getItems(), getSettings()]);
    if (typeof ContextEngine !== 'undefined') {
      return ContextEngine.build(userText, profile, items, settings, overrides);
    }
    return buildMemoryString(settings.compactMode);
  }

  function getSystemPrompt() { return SYSTEM_PROMPT; }

  return {
    // Profiles
    getProfile, saveProfile, getProfiles, saveProfiles,
    switchProfile, createProfile, deleteProfile, getProfileForDomain,
    // Items
    getItems, addItem, updateItem, deleteItem, bulkDeleteItems,
    clearItems, reorderItems, updateLastUsed, getDecayCandidates,
    // Settings
    getSettings, saveSettings, invalidateSettingsCache,
    // Roles
    getRoles, saveRoles, setActiveRole, getActiveRole,
    // Task Modes (Legacy)
    getTaskModes, saveTaskModes, setActiveMode, getActiveMode,
    // Custom Commands
    getCustomCommands, saveCustomCommands,
    // Template
    getTemplate, saveTemplate,
    // Panel position
    getPanelPosition, savePanelPosition,
    // Export/Import
    exportData, importData,
    // Legacy
    buildMemoryString, buildMemoryStringV2, getSystemPrompt,
    MAX_ITEMS, DEFAULT_PROFILE, DEFAULT_TEMPLATE, DEFAULT_ROLES
  };
})();