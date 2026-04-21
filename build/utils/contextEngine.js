/**
 * contextEngine.js — V2.5 PRO
 * Smart context selection engine. Replaces static memory injection
 * with intelligent, keyword-based memory selection.
 *
 * Pipeline: User Input → Analyze → Select Memory → Optimize → Build String
 *
 * Memory priority: pinned > profile > keyword-relevant > others
 * Modes: normal, compact, strict, detail
 *
 * Usage:
 *   ContextEngine.build(userText, profile, items, settings, overrides) → string
 *   ContextEngine.addTempMemory(text)
 *   ContextEngine.clearSession()
 */

const ContextEngine = (() => {
  'use strict';

  // Session-scoped temporary memory (lives until URL change or manual clear)
  let sessionMemory = [];

  // Item limits per mode
  const MODE_LIMITS = {
    strict:  { items: 1, profileFields: ['name'], includeRelevant: false },
    compact: { items: 3, profileFields: ['name', 'goal', 'skills'], includeRelevant: true },
    normal:  { items: 5, profileFields: ['name', 'goal', 'skills', 'preferences', 'customNotes'], includeRelevant: true },
    detail:  { items: 8, profileFields: ['name', 'goal', 'skills', 'preferences', 'customNotes'], includeRelevant: true }
  };

  // Stop words to exclude from keyword matching (supports basic unicode via regex)
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
    'through', 'after', 'over', 'between', 'out', 'against', 'during',
    'without', 'before', 'under', 'around', 'among', 'it', 'its',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
    'you', 'your', 'he', 'she', 'they', 'them', 'his', 'her', 'what',
    'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'if', 'then',
    'so', 'than', 'too', 'very', 'just', 'but', 'and', 'or', 'not', 'no',
    'nor', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'only', 'own', 'same', 'also', 'any', 'much', 'many'
  ]);

  /**
   * Extract meaningful keywords from text.
   * Supports unicode characters (not just ASCII).
   * @param {string} text
   * @returns {string[]} — lowercased keywords
   */
  function extractKeywords(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')  // Strip punctuation (unicode-aware)
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i); // Deduplicate
  }

  /**
   * Score an item's relevance to the user's input keywords.
   * @param {object} item — { text, pinned, ... }
   * @param {string[]} keywords — extracted from user input
   * @returns {number} — relevance score (0+)
   */
  function scoreItem(item, keywords) {
    if (!item.text || keywords.length === 0) return 0;
    const itemWords = item.text.toLowerCase().split(/\s+/);
    let score = 0;
    for (const kw of keywords) {
      for (const word of itemWords) {
        if (word.includes(kw) || kw.includes(word)) {
          score += 1;
        }
      }
    }
    // Bonus for pinned items
    if (item.pinned) score += 3;
    return score;
  }

  /**
   * Select the best items to include based on user input and mode.
   * @param {string} userText — what the user typed
   * @param {object[]} items — all saved items
   * @param {string} mode — 'strict' | 'compact' | 'normal' | 'detail'
   * @param {object} overrides — from CommandParser
   * @returns {object[]} — selected items
   */
  function selectItems(userText, items, mode, overrides) {
    // /only-profile means no items at all
    if (overrides.onlyProfile) return [];

    const config = MODE_LIMITS[mode] || MODE_LIMITS.normal;
    const maxItems = config.items;

    if (!items || items.length === 0) return [];

    const pinned = items.filter(i => i.pinned);
    const unpinned = items.filter(i => !i.pinned);

    // In strict mode, only return pinned items (up to limit)
    if (mode === 'strict' || !config.includeRelevant) {
      return pinned.slice(0, maxItems);
    }

    // Extract keywords and score unpinned items
    const keywords = extractKeywords(userText);

    if (keywords.length === 0) {
      // No keywords — return pinned + newest unpinned
      return [...pinned, ...unpinned].slice(0, maxItems);
    }

    // Score and sort unpinned by relevance
    const scored = unpinned.map(item => ({
      item,
      score: scoreItem(item, keywords)
    }));

    // Sort by score descending, then by timestamp (newer first)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.timestamp || 0) - (a.item.timestamp || 0);
    });

    // Take relevant items (score > 0 preferred)
    const relevant = scored
      .filter(s => s.score > 0)
      .map(s => s.item);

    // Fill remaining slots with recent items if needed
    const remainingSlots = maxItems - pinned.length;
    let selected;
    if (relevant.length >= remainingSlots) {
      selected = relevant.slice(0, remainingSlots);
    } else {
      // Fill with relevant first, then recent non-relevant
      const nonRelevant = scored
        .filter(s => s.score === 0)
        .map(s => s.item)
        .slice(0, remainingSlots - relevant.length);
      selected = [...relevant, ...nonRelevant];
    }

    // Pinned always included (prepended, deduped)
    const pinnedIds = new Set(pinned.map(i => i.id));
    const dedupedSelected = selected.filter(i => !pinnedIds.has(i.id));

    return [...pinned, ...dedupedSelected].slice(0, Math.max(maxItems, pinned.length));
  }

  /**
   * Build the profile string based on mode.
   * @param {object} profile
   * @param {string} mode
   * @returns {string[]} — lines
   */
  function buildProfileLines(profile, mode) {
    const config = MODE_LIMITS[mode] || MODE_LIMITS.normal;
    const lines = [];
    const fieldMap = {
      name: 'Name',
      goal: 'Goal',
      skills: 'Skills',
      preferences: 'Preferences',
      customNotes: 'Notes'
    };

    for (const field of config.profileFields) {
      if (profile[field]) {
        lines.push(`${fieldMap[field]}: ${profile[field]}`);
      }
    }
    return lines;
  }

  /**
   * Build the complete context string for injection.
   * @param {string} userText — the user's message (cleaned of commands)
   * @param {object} profile — user profile
   * @param {object[]} items — all saved items
   * @param {object} settings — extension settings
   * @param {object} overrides — from CommandParser
   * @returns {string|null} — the memory string to prepend, or null if empty
   */
  function build(userText, profile, items, settings, overrides = {}) {
    // Determine mode
    let mode = 'normal';
    if (overrides.mode) {
      mode = overrides.mode;
    } else if (settings.injectionMode && settings.injectionMode !== 'normal') {
      mode = settings.injectionMode;
    } else if (settings.focusMode) {
      mode = 'compact';
    } else if (settings.compactMode) {
      mode = 'compact';
    }

    // Build profile section
    const profileLines = buildProfileLines(profile || {}, mode);

    // Select items
    const selectedItems = selectItems(userText, items, mode, overrides);

    // Build session memory lines
    const tempLines = sessionMemory.map(t => `- ${t}`);

    // Assemble
    const lines = [];

    if (profileLines.length > 0) {
      lines.push(...profileLines);
    }

    if (selectedItems.length > 0) {
      if (mode === 'strict' || mode === 'compact') {
        // Compact: single line, pipe-separated
        lines.push(`Context: ${selectedItems.map(i => i.text).join(' | ')}`);
      } else {
        // Normal/detail: bullet list
        lines.push('Saved context:');
        selectedItems.forEach(i => lines.push(`- ${i.text}`));
      }
    }

    if (tempLines.length > 0) {
      lines.push('Session notes:');
      lines.push(...tempLines);
    }

    if (lines.length === 0) return null;

    // Wrap in markers
    if (mode === 'strict' || mode === 'compact') {
      return `[Memory: ${lines.join(' | ')}]\n\n`;
    }
    return `[User Context — injected by AI Smart Memory]\n${lines.join('\n')}\n[End Context]\n\n`;
  }

  /**
   * Estimate token count of what would be injected.
   * Uses the Tokenizer if available.
   * @param {string} userText
   * @param {object} profile
   * @param {object[]} items
   * @param {object} settings
   * @param {object} overrides
   * @returns {number}
   */
  function estimateTokens(userText, profile, items, settings, overrides = {}) {
    const contextStr = build(userText, profile, items, settings, overrides);
    if (!contextStr) return 0;
    if (typeof Tokenizer !== 'undefined') {
      return Tokenizer.estimate(contextStr);
    }
    // Fallback rough estimate
    return Math.round(contextStr.length / 4);
  }

  /* ── Session memory management ── */
  function addTempMemory(text) {
    if (!text || typeof text !== 'string') return;
    const trimmed = text.trim();
    if (trimmed && !sessionMemory.includes(trimmed)) {
      sessionMemory.push(trimmed);
      // Limit to 10 session items
      if (sessionMemory.length > 10) {
        sessionMemory = sessionMemory.slice(-10);
      }
    }
  }

  function clearSession() {
    sessionMemory = [];
  }

  function getSessionMemory() {
    return [...sessionMemory];
  }

  // Auto-clear session on page unload (if in content script context)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      sessionMemory = [];
    });
  }

  return {
    build,
    estimateTokens,
    extractKeywords,
    addTempMemory,
    clearSession,
    getSessionMemory
  };
})();
