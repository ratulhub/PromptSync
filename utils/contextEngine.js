/**
 * contextEngine.js — v3.0 PRO
 * Smart context selection with customizable templates, task modes,
 * response control, and keyword-based memory matching.
 */

const ContextEngine = (() => {
  'use strict';

  let sessionMemory = [];

  const MODE_LIMITS = {
    strict:  { items: 1, profileFields: ['name'], includeRelevant: false },
    compact: { items: 3, profileFields: ['name', 'role', 'goals', 'skills'], includeRelevant: true },
    normal:  { items: 5, profileFields: ['name', 'role', 'goals', 'skills', 'preferences', 'customNotes'], includeRelevant: true },
    detail:  { items: 8, profileFields: ['name', 'role', 'goals', 'skills', 'preferences', 'customNotes'], includeRelevant: true }
  };

  const STOP_WORDS = new Set([
    'the','a','an','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','can','shall',
    'to','of','in','for','on','with','at','by','from','as','into','about','like',
    'through','after','over','between','out','against','during','without','before',
    'under','around','among','it','its','this','that','these','those','i','me','my',
    'we','our','you','your','he','she','they','them','his','her','what','which','who',
    'whom','how','when','where','why','if','then','so','than','too','very','just',
    'but','and','or','not','no','nor','all','each','every','both','few','more','most',
    'other','some','such','only','own','same','also','any','much','many'
  ]);

  function extractKeywords(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i);
  }

  function scoreItem(item, keywords) {
    if (!item.text || keywords.length === 0) return 0;
    const itemWords = item.text.toLowerCase().split(/\s+/);
    const itemKw = item.keywords || [];
    let score = 0;

    for (const kw of keywords) {
      // Match against text words
      for (const word of itemWords) {
        if (word.includes(kw) || kw.includes(word)) score += 1;
      }
      // Bonus: match against extracted keywords
      for (const ik of itemKw) {
        if (ik === kw) score += 2;
      }
    }

    // Priority bonus
    if (item.priority === 'high') score += 4;
    else if (item.priority === 'medium') score += 1;
    // Pinned bonus
    if (item.pinned) score += 3;
    return score;
  }

  function selectItems(userText, items, mode, overrides, maxMemories) {
    if (overrides.onlyProfile) return [];
    const config = MODE_LIMITS[mode] || MODE_LIMITS.normal;
    const maxItems = Math.min(config.items, maxMemories || config.items);

    // Filter to enabled items only
    const enabled = (items || []).filter(i => i.enabled !== false);
    if (enabled.length === 0) return [];

    const pinned = enabled.filter(i => i.pinned);
    const unpinned = enabled.filter(i => !i.pinned);

    if (mode === 'strict' || !config.includeRelevant) {
      return pinned.slice(0, maxItems);
    }

    const keywords = extractKeywords(userText);
    if (keywords.length === 0) {
      return [...pinned, ...unpinned].slice(0, maxItems);
    }

    const scored = unpinned.map(item => ({ item, score: scoreItem(item, keywords) }));
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.timestamp || 0) - (a.item.timestamp || 0);
    });

    const relevant = scored.filter(s => s.score > 0).map(s => s.item);
    const remainingSlots = maxItems - pinned.length;
    let selected;
    if (relevant.length >= remainingSlots) {
      selected = relevant.slice(0, remainingSlots);
    } else {
      const nonRelevant = scored.filter(s => s.score === 0).map(s => s.item).slice(0, remainingSlots - relevant.length);
      selected = [...relevant, ...nonRelevant];
    }

    const pinnedIds = new Set(pinned.map(i => i.id));
    const dedupedSelected = selected.filter(i => !pinnedIds.has(i.id));
    return [...pinned, ...dedupedSelected].slice(0, Math.max(maxItems, pinned.length));
  }

  /**
   * Build context using the customizable template system.
   */
  async function buildWithTemplate(userText, profile, items, settings, overrides, template) {
    const mode = overrides.mode || (settings.injectionMode !== 'normal' ? settings.injectionMode : (settings.focusMode ? 'compact' : 'normal'));
    const maxMem = settings.advanced?.maxMemories || 8;
    const sections = template?.sections || { name: true, role: true, goals: true, memory: true, instruction: true };
    const selectedItems = selectItems(userText, items, mode, overrides, maxMem);

    // Update lastUsed on selected items asynchronously
    if (typeof MemoryStorage !== 'undefined') {
      selectedItems.forEach(item => {
        MemoryStorage.updateLastUsed(item.id).catch(() => {});
      });
    }

    // Build profile parts
    const profileParts = {};
    if (sections.name && profile.name)   profileParts.user_name = profile.name;
    if (sections.role && profile.role)    profileParts.user_role = profile.role;
    if (sections.goals) {
      profileParts.user_goals = profile.goals || profile.goal || '';
    }

    // Build memories string
    let memoriesStr = '';
    if (sections.memory && selectedItems.length > 0) {
      if (mode === 'strict' || mode === 'compact') {
        memoriesStr = selectedItems.map(i => i.text).join(' | ');
      } else {
        memoriesStr = selectedItems.map(i => `• ${i.text}`).join('\n');
      }
    }

    // Build instruction
    let instructionStr = '';
    if (sections.instruction) {
      // Task mode instruction
      if (overrides.taskMode && typeof MemoryStorage !== 'undefined') {
        try {
          const modes = await MemoryStorage.getTaskModes();
          const taskMode = modes[overrides.taskMode];
          if (taskMode) instructionStr = taskMode.instruction;
        } catch {}
      } else if (typeof MemoryStorage !== 'undefined') {
        try {
          const activeMode = await MemoryStorage.getActiveMode();
          if (activeMode) instructionStr = activeMode.instruction;
        } catch {}
      }

      // Custom instruction from command override
      if (overrides.customInstruction) {
        instructionStr = instructionStr ? `${instructionStr}\n${overrides.customInstruction}` : overrides.customInstruction;
      }

      // Response control (global)
      if (!overrides.skipSystemPrompt && settings.responseControl?.enabled && settings.responseControl?.text) {
        instructionStr = instructionStr ? `${instructionStr}\n\n${settings.responseControl.text}` : settings.responseControl.text;
      }
    }

    // Session memory
    const tempLines = sessionMemory.map(t => `• ${t}`).join('\n');

    // Use template format or build default
    let format = template?.format || '[USER CONTEXT START]\nName: {user_name}\nRole: {user_role}\nGoals: {user_goals}\n\nRelevant Memory:\n{memories}\n\nInstruction:\n{instruction}\n[USER CONTEXT END]';

    // Replace placeholders
    let output = format
      .replace('{user_name}', profileParts.user_name || '')
      .replace('{user_role}', profileParts.user_role || '')
      .replace('{user_goals}', profileParts.user_goals || '')
      .replace('{memories}', memoriesStr || '(none)')
      .replace('{instruction}', instructionStr || '• Keep answers short\n• No explanation unless asked\n• Focus on user\'s goal');

    // Clean up empty lines from missing sections
    if (!sections.name || !profileParts.user_name) output = output.replace(/^Name:\s*\n?/m, '');
    if (!sections.role || !profileParts.user_role) output = output.replace(/^Role:\s*\n?/m, '');
    if (!sections.goals || !profileParts.user_goals) output = output.replace(/^Goals:\s*\n?/m, '');

    // Add session notes if any
    if (tempLines) {
      output = output.replace('[USER CONTEXT END]', `\nSession Notes:\n${tempLines}\n[USER CONTEXT END]`);
    }

    // Clean multiple blank lines
    output = output.replace(/\n{3,}/g, '\n\n').trim();

    if (output === '[USER CONTEXT START]\n[USER CONTEXT END]') return null;
    return output + '\n\n';
  }

  /**
   * Main build function — uses template if available.
   */
  async function build(userText, profile, items, settings, overrides = {}) {
    // Try template-based build
    if (typeof MemoryStorage !== 'undefined') {
      try {
        const template = await MemoryStorage.getTemplate();
        return await buildWithTemplate(userText, profile, items, settings, overrides, template);
      } catch (e) {
        console.warn('[ASM] Template build failed, using fallback:', e);
      }
    }

    // Fallback to simple build
    return buildSimple(userText, profile, items, settings, overrides);
  }

  /** Simple fallback build (no template, no async) */
  function buildSimple(userText, profile, items, settings, overrides = {}) {
    let mode = 'normal';
    if (overrides.mode) mode = overrides.mode;
    else if (settings.injectionMode && settings.injectionMode !== 'normal') mode = settings.injectionMode;
    else if (settings.focusMode) mode = 'compact';

    const config = MODE_LIMITS[mode] || MODE_LIMITS.normal;
    const lines = [];
    const fieldMap = { name:'Name', role:'Role', goals:'Goals', goal:'Goals', skills:'Skills', preferences:'Preferences', customNotes:'Notes' };

    for (const field of config.profileFields) {
      const val = profile[field];
      if (val) lines.push(`${fieldMap[field] || field}: ${val}`);
    }

    const selectedItems = selectItems(userText, items, mode, overrides, settings.advanced?.maxMemories || 8);
    if (selectedItems.length > 0) {
      if (mode === 'strict' || mode === 'compact') {
        lines.push(`Context: ${selectedItems.map(i => i.text).join(' | ')}`);
      } else {
        lines.push('Saved context:');
        selectedItems.forEach(i => lines.push(`• ${i.text}`));
      }
    }

    const tempLines = sessionMemory.map(t => `• ${t}`);
    if (tempLines.length > 0) {
      lines.push('Session notes:');
      lines.push(...tempLines);
    }

    if (lines.length === 0) return null;

    if (mode === 'strict' || mode === 'compact') {
      return `[Memory: ${lines.join(' | ')}]\n\n`;
    }
    return `[USER CONTEXT START]\n${lines.join('\n')}\n[USER CONTEXT END]\n\n`;
  }

  function estimateTokens(userText, profile, items, settings, overrides = {}) {
    // Use simple sync build for estimation
    const contextStr = buildSimple(userText, profile, items, settings, overrides);
    if (!contextStr) return 0;
    if (typeof Tokenizer !== 'undefined') return Tokenizer.estimate(contextStr);
    return Math.round(contextStr.length / 4);
  }

  /* ── Session memory ── */
  function addTempMemory(text) {
    if (!text || typeof text !== 'string') return;
    const trimmed = text.trim();
    if (trimmed && !sessionMemory.includes(trimmed)) {
      sessionMemory.push(trimmed);
      if (sessionMemory.length > 10) sessionMemory = sessionMemory.slice(-10);
    }
  }

  function clearSession() { sessionMemory = []; }
  function getSessionMemory() { return [...sessionMemory]; }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => { sessionMemory = []; });
  }

  return {
    build, buildSimple, estimateTokens, extractKeywords,
    addTempMemory, clearSession, getSessionMemory
  };
})();
