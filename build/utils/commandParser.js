/**
 * commandParser.js — V2.5 PRO
 * Parses slash commands from user input before sending.
 * Commands control memory injection behavior per-message.
 * 
 * Supported commands:
 *   /no-memory    → disable all memory injection for this message
 *   /only-profile → inject only profile data (no saved items)
 *   /strict       → ultra-minimal: profile name + pinned only
 *   /explain      → allow full explanation (disables token-saving prompt)
 *   /detail       → full detailed answer + full memory context
 *   /code         → code mode: include explanations with code
 *   /reset        → revert to default behavior (no overrides)
 *   /temp <text>  → add temporary session memory
 *
 * Usage: CommandParser.parse(inputText) → { cleanText, overrides, tempMemory }
 */

const CommandParser = (() => {
  'use strict';

  // All recognized commands and their override effects
  const COMMANDS = {
    '/no-memory': {
      skipInjection: true,
      skipSystemPrompt: true
    },
    '/only-profile': {
      onlyProfile: true
    },
    '/strict': {
      mode: 'strict'
    },
    '/explain': {
      skipSystemPrompt: true,
      mode: 'normal'
    },
    '/detail': {
      skipSystemPrompt: true,
      mode: 'detail'
    },
    '/code': {
      skipSystemPrompt: true,
      codeMode: true
    },
    '/reset': {
      // Empty = use all defaults
    }
  };

  // Non-global regex patterns (avoids .lastIndex state issues)
  const CMD_NAMES = 'no-memory|only-profile|strict|explain|detail|code|reset';

  /**
   * Parse slash commands from user input text.
   * @param {string} text — raw user input
   * @returns {{ cleanText: string, overrides: object, tempMemory: string[] }}
   */
  function parse(text) {
    if (!text || typeof text !== 'string') {
      return { cleanText: '', overrides: {}, tempMemory: [] };
    }

    const overrides = {};
    const tempMemory = [];

    // Extract /temp commands first (they capture text after them)
    // Use non-global regex executed in a loop via matchAll for safety
    const tempPattern = new RegExp(`(?:^|\\s)/temp\\s+(.+?)(?=\\s*/(?:${CMD_NAMES}|temp)\\b|$)`, 'gi');
    for (const match of text.matchAll(tempPattern)) {
      const captured = match[1].trim();
      if (captured) {
        tempMemory.push(captured);
      }
    }

    // Remove /temp <text> from input
    let processed = text.replace(new RegExp(`(?:^|\\s)/temp\\s+(.+?)(?=\\s*/(?:${CMD_NAMES}|temp)\\b|$)`, 'gi'), '');

    // Extract standard commands and merge overrides
    const cmdPattern = new RegExp(`(?:^|\\s)(/(?:${CMD_NAMES}))(?=\\s|$)`, 'gi');
    for (const match of processed.matchAll(cmdPattern)) {
      const cmd = match[1].toLowerCase();
      const effect = COMMANDS[cmd];
      if (effect) {
        Object.assign(overrides, effect);
      }
    }

    // Remove standard commands from text
    let cleanText = processed.replace(new RegExp(`(?:^|\\s)(/(?:${CMD_NAMES}))(?=\\s|$)`, 'gi'), '').trim();

    // Normalize whitespace (collapse multiple spaces)
    cleanText = cleanText.replace(/\s{2,}/g, ' ').trim();

    return { cleanText, overrides, tempMemory };
  }

  /**
   * Check if text contains any commands (quick test).
   * @param {string} text
   * @returns {boolean}
   */
  function hasCommands(text) {
    if (!text) return false;
    const testPattern = new RegExp(`(?:^|\\s)/(?:${CMD_NAMES}|temp\\s)`, 'i');
    return testPattern.test(text);
  }

  /**
   * Get a human-readable list of supported commands.
   * @returns {Array<{command: string, description: string}>}
   */
  function getCommandList() {
    return [
      { command: '/no-memory',    description: 'Skip memory injection for this message' },
      { command: '/only-profile', description: 'Inject only your profile (no saved notes)' },
      { command: '/strict',       description: 'Ultra-minimal context (name + pinned only)' },
      { command: '/explain',      description: 'Allow full explanation (disables short-answer mode)' },
      { command: '/detail',       description: 'Detailed answer with full memory context' },
      { command: '/code',         description: 'Code mode — include explanations with code output' },
      { command: '/reset',        description: 'Use default behavior (no overrides)' },
      { command: '/temp <text>',  description: 'Add temporary memory for this session only' }
    ];
  }

  return { parse, hasCommands, getCommandList };
})();
