/**
 * commandParser.js — v3.1.1 PRO
 * Parses slash commands from user input.
 * Supports built-in commands + user-defined custom commands.
 *
 * Built-in: /no-memory, /only-profile, /strict, /explain, /detail, /code, /reset, /temp, /mode, /short
 * Custom:   user-defined commands mapping to predefined actions
 */

const CommandParser = (() => {
  'use strict';

  const BUILTIN_COMMANDS = {
    '/no-memory':    { skipInjection: true, skipSystemPrompt: true },
    '/only-profile': { onlyProfile: true },
    '/strict':       { mode: 'strict' },
    '/explain':      { skipSystemPrompt: true, mode: 'normal' },
    '/detail':       { skipSystemPrompt: true, mode: 'detail' },
    '/code':         { skipSystemPrompt: true, codeMode: true, taskRole: 'developer' },
    '/reset':        {},
    '/short':        { taskRole: 'short' },
    '/research':     { taskRole: 'researcher', oneTimeRole: true },
    '/dev':          { taskRole: 'developer', oneTimeRole: true },
    '/design':       { taskRole: 'designer', oneTimeRole: true },
    '/business':     { taskRole: 'business', oneTimeRole: true },
    '/writer':       { taskRole: 'writer', oneTimeRole: true }
  };

  const BUILTIN_NAMES = 'no-memory|only-profile|strict|explain|detail|code|reset|short|research|dev|design|business|writer';

  // Custom commands loaded from storage (set externally)
  let customCommands = [];

  /**
   * Load custom commands from storage.
   * Called during init.
   */
  async function loadCustomCommands() {
    if (typeof MemoryStorage !== 'undefined') {
      try {
        customCommands = await MemoryStorage.getCustomCommands();
      } catch { customCommands = []; }
    }
  }

  /**
   * Set custom commands directly (for popup context).
   */
  function setCustomCommands(cmds) {
    customCommands = Array.isArray(cmds) ? cmds : [];
  }

  /**
   * Build the full command name regex dynamically.
   */
  function buildCmdNames() {
    const customNames = customCommands
      .filter(c => c.enabled !== false && c.name)
      .map(c => c.name.replace(/^\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    return customNames ? `${BUILTIN_NAMES}|${customNames}` : BUILTIN_NAMES;
  }

  /**
   * Get the override effect for a custom command by name.
   */
  function getCustomEffect(cmdName) {
    const name = cmdName.replace(/^\//, '');
    const cmd = customCommands.find(c =>
      c.enabled !== false && c.name.replace(/^\//, '').toLowerCase() === name.toLowerCase()
    );
    if (!cmd) return null;

    const effect = {};
    if (cmd.actions) {
      if (cmd.actions.taskMode) effect.taskMode = cmd.actions.taskMode;
      if (cmd.actions.disableMemory) { effect.skipInjection = true; effect.skipSystemPrompt = true; }
      if (cmd.actions.enableMemory === false) effect.skipInjection = true;
      if (cmd.actions.mode) effect.mode = cmd.actions.mode;
      if (cmd.actions.skipSystemPrompt) effect.skipSystemPrompt = true;
      if (cmd.actions.instruction) effect.customInstruction = cmd.actions.instruction;
    }
    return effect;
  }

  /**
   * Parse slash commands from user input text.
   */
  function parse(text) {
    if (!text || typeof text !== 'string') {
      return { cleanText: '', overrides: {}, tempMemory: [], modeSwitch: null };
    }

    const overrides = {};
    const tempMemory = [];
    let modeSwitch = null;
    const allCmds = buildCmdNames();

    // Extract /temp commands
    const tempPattern = new RegExp(`(?:^|\\s)/temp\\s+(.+?)(?=\\s*/(?:${allCmds}|temp|mode)\\b|$)`, 'gi');
    for (const match of text.matchAll(tempPattern)) {
      const captured = match[1].trim();
      if (captured) tempMemory.push(captured);
    }

    // Remove /temp <text>
    let processed = text.replace(new RegExp(`(?:^|\\s)/temp\\s+(.+?)(?=\\s*/(?:${allCmds}|temp|mode)\\b|$)`, 'gi'), '');

    // Extract /role <name>
    const rolePattern = /(?:^|\s)\/role\s+([\w-]+)/gi;
    for (const match of processed.matchAll(rolePattern)) {
      modeSwitch = match[1].toLowerCase();
    }
    processed = processed.replace(/(?:^|\s)\/role\s+[\w-]+/gi, '');

    // Extract standard + custom commands
    const cmdPattern = new RegExp(`(?:^|\\s)(/(?:${allCmds}))(?=\\s|$)`, 'gi');
    for (const match of processed.matchAll(cmdPattern)) {
      const cmd = match[1].toLowerCase();
      // Check built-in first
      const builtinEffect = BUILTIN_COMMANDS[cmd];
      if (builtinEffect) {
        Object.assign(overrides, builtinEffect);
      } else {
        // Check custom commands
        const customEffect = getCustomEffect(cmd);
        if (customEffect) Object.assign(overrides, customEffect);
      }
    }

    // Remove commands from text
    let cleanText = processed.replace(new RegExp(`(?:^|\\s)(/(?:${allCmds}))(?=\\s|$)`, 'gi'), '').trim();
    cleanText = cleanText.replace(/\s{2,}/g, ' ').trim();

    // If /role was used, set it in overrides too
    if (modeSwitch) overrides.taskRole = modeSwitch;

    return { cleanText, overrides, tempMemory, modeSwitch };
  }

  /**
   * Quick test if text contains any commands.
   */
  function hasCommands(text) {
    if (!text) return false;
    const allCmds = buildCmdNames();
    return new RegExp(`(?:^|\\s)/(?:${allCmds}|temp\\s|role\\s)`, 'i').test(text);
  }

  /**
   * Get human-readable list of all commands.
   */
  function getCommandList() {
    const list = [
      { command: '/no-memory',    description: 'Skip memory injection for this message' },
      { command: '/only-profile', description: 'Inject only your profile (no saved notes)' },
      { command: '/strict',       description: 'Ultra-minimal context (name + pinned only)' },
      { command: '/explain',      description: 'Allow full explanation' },
      { command: '/detail',       description: 'Full context + detailed answer' },
      { command: '/code',         description: 'Code mode — coding assistant' },
      { command: '/short',        description: 'Force short-answer mode' },
      { command: '/role <name>',  description: 'Switch task role (researcher/developer/etc)' },
      { command: '/reset',        description: 'Revert to default behavior' },
      { command: '/temp <text>',  description: 'Add session-only temporary memory' }
    ];

    // Add custom commands
    for (const cmd of customCommands) {
      if (cmd.enabled !== false && cmd.name) {
        list.push({
          command: cmd.name.startsWith('/') ? cmd.name : `/${cmd.name}`,
          description: cmd.description || 'Custom command',
          custom: true
        });
      }
    }
    return list;
  }

  return { parse, hasCommands, getCommandList, loadCustomCommands, setCustomCommands };
})();
