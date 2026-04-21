/**
 * content.js — V2 PRO
 * Core content script for AI Smart Memory.
 * Runs on ChatGPT, Claude, Gemini, Perplexity, and DeepSeek pages.
 *
 * V2 Features:
 *   - Smart context injection via ContextEngine
 *   - Command system via CommandParser (/no-memory, /strict, /explain, etc.)
 *   - Token-saving system prompt injection
 *   - Real-time token tracking via TokenTracker
 *   - Auto token optimization (memory trimming)
 *   - Session-scoped temporary memory
 *   - Text selection save + auto-detect suggestions
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  //  GUARD: Prevent double-loading
  // ═══════════════════════════════════════════════
  if (window.__asm_content_loaded) return;
  window.__asm_content_loaded = true;

  // ═══════════════════════════════════════════════
  //  PLATFORM DETECTION
  // ═══════════════════════════════════════════════
  const PLATFORM = (() => {
    const h = location.hostname;
    if (h.includes('openai.com') || h.includes('chatgpt.com')) return 'chatgpt';
    if (h.includes('claude.ai'))                                return 'claude';
    if (h.includes('gemini.google.com'))                        return 'gemini';
    if (h.includes('perplexity.ai'))                            return 'perplexity';
    if (h.includes('deepseek.com'))                             return 'deepseek';
    return 'unknown';
  })();

  if (PLATFORM === 'unknown') return;

  // Guard: MemoryStorage must be loaded
  if (typeof MemoryStorage === 'undefined') {
    console.warn('[ASM] MemoryStorage not found — aborting.');
    return;
  }

  // ═══════════════════════════════════════════════
  //  PLATFORM-SPECIFIC SELECTORS
  // ═══════════════════════════════════════════════
  const CONFIG = {
    chatgpt: {
      inputs: [
        '#prompt-textarea',
        'div.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
        'textarea[placeholder]'
      ],
      sends: [
        'button[data-testid="send-button"]',
        'button[aria-label="Send message"]',
        'button[aria-label*="Send"]',
        'form button[type="submit"]'
      ]
    },
    claude: {
      inputs: [
        'div.ProseMirror[contenteditable="true"]',
        'div[enterkeyhint="enter"][contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]'
      ],
      sends: [
        'button[aria-label="Send Message"]',
        'button[aria-label="Send message"]',
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]'
      ]
    },
    gemini: {
      inputs: [
        'rich-textarea div[contenteditable="true"]',
        'div[contenteditable="true"][role="textbox"]',
        '.ql-editor[contenteditable="true"]',
        'div[contenteditable="true"]'
      ],
      sends: [
        'button.send-button',
        'button[aria-label="Send message"]',
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'button[mat-icon-button]'
      ]
    },
    perplexity: {
      inputs: [
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sends: [
        'button[aria-label="Submit"]',
        'button[aria-label*="Send"]',
        'button[type="submit"]',
        'button[aria-label="Search"]'
      ]
    },
    deepseek: {
      inputs: [
        'textarea#chat-input',
        'textarea[placeholder]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sends: [
        'div[role="button"][class*="send"]',
        'button[data-testid="send-button"]',
        'div[role="button"][aria-label*="Send"]',
        'button[aria-label*="Send"]'
      ]
    }
  };

  const cfg = CONFIG[PLATFORM];

  // ═══════════════════════════════════════════════
  //  AUTO-DETECT PATTERNS
  // ═══════════════════════════════════════════════
  const DETECT_PATTERNS = [
    /\bI(?:'m| am) (?:a |an )?([\w][\w\s]{2,30})\b/i,
    /\bI(?:'m| am) learning\b(.{5,60})/i,
    /\bI(?:'m| am) working (?:on|with)\b(.{5,60})/i,
    /\bI(?:'m| am) (?:a |an )?beginner\b/i,
    /\bmy (?:name|goal|skill|focus) is\b(.{3,60})/i,
    /\bI (?:prefer|want|like|use)\b(.{5,60})/i,
    /\bI(?:'ve| have) been\b(.{5,60})/i
  ];

  // ═══════════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════════
  let alreadyInjectedThisSend = false;
  let isReDispatchingClick    = false;
  let isReDispatchingEnter    = false;
  let floatBtn                = null;
  let toastTimeout            = null;
  let lastUrl                 = location.href;
  let inputObserverTarget     = null;
  let initRetryCount          = 0;
  let tokenCalcDebounce       = null;
  let detectDebounce          = null;
  let lastDetectedText        = '';
  const MAX_INIT_RETRIES      = 30;

  // ═══════════════════════════════════════════════
  //  ELEMENT FINDERS
  // ═══════════════════════════════════════════════
  function findFirst(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch { /* invalid selector */ }
    }
    return null;
  }

  function getInput()   { return findFirst(cfg.inputs); }
  function getSendBtn() { return findFirst(cfg.sends); }

  function getInputText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    return el.innerText || el.textContent || '';
  }

  // ═══════════════════════════════════════════════
  //  INJECTION MARKER CHECK
  // ═══════════════════════════════════════════════
  function hasInjectionMarker(text) {
    return text.includes('[User Context') ||
           text.includes('[Memory:') ||
           text.includes('[End Context]');
  }

  // ═══════════════════════════════════════════════
  //  TEXT INJECTION (Prepends to editor)
  // ═══════════════════════════════════════════════
  function prependTextToEditor(el, prefix) {
    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const original = el.value;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(el, prefix + original);
      } else {
        el.value = prefix + original;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Contenteditable (React/ProseMirror compat)
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      if (!document.execCommand('insertText', false, prefix)) {
        const textNode = document.createTextNode(prefix);
        el.insertBefore(textNode, el.firstChild);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      }
    } catch (_) {
      el.innerText = prefix + el.innerText;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
  }

  /**
   * Replace the entire input content (used when commands need stripping).
   */
  function setEditorText(el, text) {
    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Contenteditable
    try {
      // Select all content and replace
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);

      if (!document.execCommand('insertText', false, text)) {
        el.innerText = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      }
    } catch (_) {
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
  }

  // ═══════════════════════════════════════════════
  //  PLATFORM CHECK
  // ═══════════════════════════════════════════════
  async function checkPlatformEnabled() {
    try {
      const settings = await MemoryStorage.getSettings();
      return settings.platforms?.[PLATFORM] !== false;
    } catch { return true; }
  }

  // ═══════════════════════════════════════════════
  //  V2: SMART INJECTION PIPELINE
  // ═══════════════════════════════════════════════
  /**
   * The core injection flow:
   * 1. Get user text
   * 2. Parse commands → { cleanText, overrides, tempMemory }
   * 3. If /no-memory → skip injection, just set cleanText
   * 4. Build context via ContextEngine
   * 5. Prepend system prompt (if enabled and not overridden)
   * 6. Prepend everything to input
   * 7. Update TokenTracker
   */
  async function injectMemory(el) {
    if (alreadyInjectedThisSend) return false;

    try {
      if (!(await checkPlatformEnabled())) return false;

      const settings = await MemoryStorage.getSettings();
      if (!settings.injectEnabled) return false;

      const rawText = getInputText(el);
      if (!rawText.trim()) return false;

      // Avoid double-injection
      if (hasInjectionMarker(rawText)) {
        alreadyInjectedThisSend = true;
        return false;
      }

      alreadyInjectedThisSend = true;

      // ── Step 1: Parse commands ──
      let cleanText = rawText.trim();
      let overrides = {};

      if (typeof CommandParser !== 'undefined' && CommandParser.hasCommands(rawText)) {
        const parsed = CommandParser.parse(rawText);
        cleanText = parsed.cleanText;
        overrides = parsed.overrides;

        // Handle /temp commands — add to session memory
        if (parsed.tempMemory.length > 0 && typeof ContextEngine !== 'undefined') {
          parsed.tempMemory.forEach(t => ContextEngine.addTempMemory(t));
          showToast('Session note added ✦', 'info');
        }

        // If commands were found, we need to replace the input text
        // with the clean version (commands stripped)
        if (cleanText !== rawText.trim()) {
          setEditorText(el, cleanText);
          // Small delay for DOM to update
          await new Promise(r => setTimeout(r, 50));
        }
      }

      // ── Step 2: Check if injection should be skipped ──
      if (overrides.skipInjection) {
        // /no-memory: skip injection entirely
        showToast('Memory skipped ⏭', 'info');
        return true;
      }

      if (!cleanText.trim()) return false;

      // ── Step 3: Build context ──
      let prefix = '';

      if (typeof ContextEngine !== 'undefined') {
        // V2: Smart context engine
        prefix = await MemoryStorage.buildMemoryStringV2(cleanText, overrides) || '';
      } else {
        // V1 fallback
        prefix = await MemoryStorage.buildMemoryString(settings.compactMode) || '';
      }

      // ── Step 4: System prompt (token-saving) ──
      if (settings.tokenSavingPrompt && !overrides.skipSystemPrompt) {
        const sysPrompt = MemoryStorage.getSystemPrompt();
        prefix = `[System: ${sysPrompt}]\n${prefix}`;
      }

      if (!prefix) return false;

      // ── Step 5: Auto token optimization ──
      if (typeof Tokenizer !== 'undefined' && typeof TokenTracker !== 'undefined') {
        const usage = TokenTracker.getUsageLevel();
        if (usage.isHigh) {
          // High usage — notify user
          showToast('⚠ High token usage — memory trimmed', 'info');
        }
      }

      // ── Step 6: Inject ──
      prependTextToEditor(el, prefix);

      // ── Step 7: Update token tracker ──
      if (typeof Tokenizer !== 'undefined' && typeof TokenTracker !== 'undefined') {
        const totalTokens = Tokenizer.estimate(prefix + cleanText);
        TokenTracker.addToSession(totalTokens);
      }

      showToast('Memory injected ✨', 'info');
      return true;

    } catch (err) {
      console.warn('[ASM] Injection failed:', err);
      return false;
    }
  }

  // ═══════════════════════════════════════════════
  //  INTERCEPT: BUTTON CLICK (Capture phase)
  // ═══════════════════════════════════════════════
  function handleSendClick(e) {
    if (isReDispatchingClick) return;

    const sendBtn = getSendBtn();
    if (!sendBtn) return;
    if (!sendBtn.contains(e.target) && e.target !== sendBtn) return;
    if (alreadyInjectedThisSend) return;

    const input = getInput();
    if (!input) return;

    const currentText = getInputText(input).trim();
    if (!currentText) return;
    if (hasInjectionMarker(currentText)) return;

    // Block the click, inject, then re-click
    e.stopImmediatePropagation();
    e.preventDefault();

    injectMemory(input).then(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          isReDispatchingClick = true;
          const freshBtn = getSendBtn();
          if (freshBtn) {
            freshBtn.dispatchEvent(new MouseEvent('click', {
              bubbles: true, cancelable: true, view: window
            }));
          }
          setTimeout(() => {
            isReDispatchingClick = false;
            // Shortened timeout, rely on watchForInputClear for main reset
            setTimeout(() => { alreadyInjectedThisSend = false; }, 300);
          }, 50);
        }, 100);
      });
    });
  }

  // ═══════════════════════════════════════════════
  //  INTERCEPT: ENTER KEY
  // ═══════════════════════════════════════════════
  function handleKeydown(e) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (isReDispatchingEnter) return;

    const input = getInput();
    if (!input) return;
    if (!input.contains(e.target) && e.target !== input) return;
    if (alreadyInjectedThisSend) return;

    const currentText = getInputText(input).trim();
    if (!currentText) return;
    if (hasInjectionMarker(currentText)) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    injectMemory(input).then(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          isReDispatchingEnter = true;

          const sendBtn = getSendBtn();
          if (sendBtn) {
            sendBtn.dispatchEvent(new MouseEvent('click', {
              bubbles: true, cancelable: true, view: window
            }));
          } else {
            input.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
              bubbles: true, cancelable: true
            }));
          }

          setTimeout(() => {
            isReDispatchingEnter = false;
            // Shortened timeout, rely on watchForInputClear for main reset
            setTimeout(() => { alreadyInjectedThisSend = false; }, 300);
          }, 50);
        }, 100);
      });
    });
  }

  // ═══════════════════════════════════════════════
  //  RESET on message sent
  // ═══════════════════════════════════════════════
  function handleSendFinished(e) {
    const sendBtn = getSendBtn();
    if (!sendBtn) return;
    if (!sendBtn.contains(e.target) && e.target !== sendBtn) return;
    setTimeout(() => { alreadyInjectedThisSend = false; }, 1000);
  }

  function watchForInputClear() {
    setInterval(() => {
      if (!alreadyInjectedThisSend) return;
      const input = getInput();
      if (!input) return;
      if (!getInputText(input).trim()) {
        alreadyInjectedThisSend = false;
      }
    }, 500);
  }

  document.addEventListener('click',   handleSendClick,    true);
  document.addEventListener('keydown', handleKeydown,      true);
  document.addEventListener('click',   handleSendFinished, false);

  // ═══════════════════════════════════════════════
  //  TOAST NOTIFICATION
  // ═══════════════════════════════════════════════
  function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    let toast = document.getElementById('asm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'asm-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className   = `asm-toast asm-toast--${type} asm-toast--visible`;
    toastTimeout = setTimeout(() => { toast.classList.remove('asm-toast--visible'); }, 2800);
  }

  // ═══════════════════════════════════════════════
  //  FLOATING BUTTON & SELECTION SAVE
  // ═══════════════════════════════════════════════
  function createFloatBtn() {
    if (floatBtn) return;
    floatBtn = document.createElement('button');
    floatBtn.id          = 'asm-float-btn';
    floatBtn.textContent = '＋ Save to Memory';
    floatBtn.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = window.getSelection()?.toString().trim();
      if (!text) return;
      hideFloatBtn();

      try {
        const result = await MemoryStorage.addItem(text, 'selection');
        if (result?.duplicate) {
          showToast('Already saved ✓', 'info');
        } else {
          showToast('Saved to Memory ✓');
        }
      } catch (err) {
        showToast('Save failed', 'error');
      }
    });
    document.body.appendChild(floatBtn);
  }

  function showFloatBtn(x, y) {
    if (!floatBtn) createFloatBtn();
    floatBtn.style.left = `${Math.min(x, window.innerWidth - 168)}px`;
    floatBtn.style.top  = `${Math.max(8, y - 42)}px`;
    floatBtn.style.opacity = '1';
    floatBtn.style.pointerEvents = 'auto';
    floatBtn.style.transform = 'translateY(0)';
  }

  function hideFloatBtn() {
    if (!floatBtn) return;
    floatBtn.style.opacity = '0';
    floatBtn.style.pointerEvents = 'none';
    floatBtn.style.transform = 'translateY(4px)';
  }

  document.addEventListener('mouseup', async (e) => {
    setTimeout(async () => {
      try {
        const settings = await MemoryStorage.getSettings();
        if (!settings.saveSelection) { hideFloatBtn(); return; }
      } catch { hideFloatBtn(); return; }

      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!text || text.length < 10) { hideFloatBtn(); return; }
      if (floatBtn && floatBtn.contains(e.target)) return;

      try {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        showFloatBtn(rect.left + window.scrollX + rect.width / 2 - 80, rect.top + window.scrollY);
      } catch { hideFloatBtn(); }
    }, 50);
  });

  document.addEventListener('mousedown', (e) => {
    if (floatBtn && !floatBtn.contains(e.target)) hideFloatBtn();
  });

  // ═══════════════════════════════════════════════
  //  AUTO-DETECT SUGGESTIONS
  // ═══════════════════════════════════════════════
  async function runAutoDetect(text) {
    try {
      const settings = await MemoryStorage.getSettings();
      if (!settings.autoDetect || text === lastDetectedText) return;
    } catch { return; }

    for (const pattern of DETECT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const snippet = match[0].trim().slice(0, 120);
        if (snippet.length < 10) continue;
        lastDetectedText = text;
        showAutoDetectSuggestion(snippet);
        return;
      }
    }
  }

  function showAutoDetectSuggestion(text) {
    let banner = document.getElementById('asm-suggest');
    if (banner) banner.remove();

    banner = document.createElement('div');
    banner.id = 'asm-suggest';

    const textDiv = document.createElement('div');
    textDiv.className = 'asm-suggest__text';

    const strong = document.createElement('strong');
    strong.textContent = 'Save to Memory?';
    textDiv.appendChild(strong);

    const span = document.createElement('span');
    const displayText = text.length > 60 ? text.slice(0, 57) + '…' : text;
    span.textContent = `"${displayText}"`;
    textDiv.appendChild(span);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'asm-suggest__actions';

    const yesBtn = document.createElement('button');
    yesBtn.id = 'asm-suggest-yes';
    yesBtn.textContent = 'Save';
    yesBtn.addEventListener('click', async () => {
      try {
        const result = await MemoryStorage.addItem(text, 'auto-detect');
        if (result?.duplicate) {
          showToast('Already saved ✓', 'info');
        } else {
          showToast('Saved to Memory ✓');
        }
      } catch { showToast('Save failed', 'error'); }
      banner.remove();
    });

    const noBtn = document.createElement('button');
    noBtn.id = 'asm-suggest-no';
    noBtn.textContent = 'Dismiss';
    noBtn.addEventListener('click', () => banner.remove());

    actionsDiv.appendChild(yesBtn);
    actionsDiv.appendChild(noBtn);
    banner.appendChild(textDiv);
    banner.appendChild(actionsDiv);
    document.body.appendChild(banner);

    setTimeout(() => { if (banner.isConnected) banner.remove(); }, 8000);
  }

  // ═══════════════════════════════════════════════
  //  V2: REAL-TIME TOKEN CALCULATION (debounced)
  // ═══════════════════════════════════════════════
  async function calculateTokensForInput() {
    const input = getInput();
    if (!input) return;

    const text = getInputText(input).trim();
    if (!text) {
      if (typeof TokenTracker !== 'undefined') {
        TokenTracker.updateInput(0, 0);
      }
      return;
    }

    if (typeof Tokenizer === 'undefined' || typeof TokenTracker === 'undefined') return;

    try {
      const settings = await MemoryStorage.getSettings();
      if (!settings.tokenIndicator) return;

      // Estimate user input tokens
      const inputTokens = Tokenizer.estimate(text);

      // Estimate memory tokens (what would be injected)
      let memTokens = 0;
      if (settings.injectEnabled) {
        let overrides = {};
        let cleanText = text;

        // Parse commands if present
        if (typeof CommandParser !== 'undefined' && CommandParser.hasCommands(text)) {
          const parsed = CommandParser.parse(text);
          cleanText = parsed.cleanText;
          overrides = parsed.overrides;
        }

        if (!overrides.skipInjection) {
          if (typeof ContextEngine !== 'undefined') {
            const [profile, items] = await Promise.all([
              MemoryStorage.getProfile(),
              MemoryStorage.getItems()
            ]);
            const contextStr = ContextEngine.build(cleanText, profile, items, settings, overrides);
            memTokens = contextStr ? Tokenizer.estimate(contextStr) : 0;
          } else {
            const memStr = await MemoryStorage.buildMemoryString(settings.compactMode);
            memTokens = memStr ? Tokenizer.estimate(memStr) : 0;
          }

          // Add system prompt tokens if enabled
          if (settings.tokenSavingPrompt && !overrides.skipSystemPrompt) {
            memTokens += Tokenizer.estimate(MemoryStorage.getSystemPrompt()) + 10; // +10 for wrapper
          }
        }
      }

      TokenTracker.updateInput(inputTokens, memTokens);
    } catch (err) {
      console.warn('[ASM] Token calc error:', err);
    }
  }

  // ═══════════════════════════════════════════════
  //  INPUT OBSERVER (MutationObserver + input events)
  // ═══════════════════════════════════════════════
  const inputObserver = new MutationObserver(() => {
    const input = getInput();
    if (!input) return;
    const text = getInputText(input).trim();
    if (!text) return;

    // Auto-detect
    clearTimeout(detectDebounce);
    detectDebounce = setTimeout(() => runAutoDetect(text), 1500);

    // V2: Token calculation
    clearTimeout(tokenCalcDebounce);
    tokenCalcDebounce = setTimeout(calculateTokensForInput, 300);
  });

  let boundInputListener = null;
  let boundInputElement = null;

  function attachInputEventListener(input) {
    if (boundInputElement === input) return;

    if (boundInputElement && boundInputListener) {
      boundInputElement.removeEventListener('input', boundInputListener);
    }

    boundInputElement = input;
    boundInputListener = () => {
      const text = getInputText(input).trim();

      // Auto-detect
      if (text) {
        clearTimeout(detectDebounce);
        detectDebounce = setTimeout(() => runAutoDetect(text), 1500);
      }

      // V2: Token calculation
      clearTimeout(tokenCalcDebounce);
      tokenCalcDebounce = setTimeout(calculateTokensForInput, 300);
    };
    input.addEventListener('input', boundInputListener);
  }

  function reattachInputObserver() {
    inputObserver.disconnect();
    inputObserverTarget = null;

    if (boundInputElement && boundInputListener) {
      boundInputElement.removeEventListener('input', boundInputListener);
      boundInputElement = null;
      boundInputListener = null;
    }

    let retries = 0;
    const maxRetries = 10;
    const tryAttach = () => {
      const input = getInput();
      if (input && input !== inputObserverTarget) {
        inputObserverTarget = input;
        inputObserver.observe(input, { characterData: true, childList: true, subtree: true });
        attachInputEventListener(input);
        return;
      }
      retries++;
      if (retries < maxRetries) {
        setTimeout(tryAttach, 500);
      }
    };
    setTimeout(tryAttach, 300);
  }

  // ═══════════════════════════════════════════════
  //  SPA NAVIGATION HANDLER
  // ═══════════════════════════════════════════════
  function onNavigate() {
    alreadyInjectedThisSend = false;
    isReDispatchingClick = false;
    isReDispatchingEnter = false;

    // V2: Reset session tokens & temp memory on navigation
    if (typeof TokenTracker !== 'undefined') {
      TokenTracker.resetSession();
    }
    if (typeof ContextEngine !== 'undefined') {
      ContextEngine.clearSession();
    }

    // Clear auto-detect state
    lastDetectedText = '';

    // Disconnect memory leaking input observers
    inputObserver.disconnect();
    inputObserverTarget = null;
    clearTimeout(detectDebounce);
    clearTimeout(tokenCalcDebounce);

    reattachInputObserver();
  }

  // Poll for URL changes
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onNavigate();
    }
  }, 800);

  window.addEventListener('popstate', () => {
    setTimeout(onNavigate, 200);
  });

  // ═══════════════════════════════════════════════
  //  GLOBAL DOM OBSERVER
  // ═══════════════════════════════════════════════
  let globalObserver = null;
  let globalObserverDebounce = null;

  function startGlobalObserver() {
    if (globalObserver) return;

    globalObserver = new MutationObserver(() => {
      clearTimeout(globalObserverDebounce);
      globalObserverDebounce = setTimeout(() => {
        const input = getInput();
        if (input && input !== inputObserverTarget) {
          inputObserverTarget = input;
          inputObserver.disconnect();
          inputObserver.observe(input, { characterData: true, childList: true, subtree: true });
          attachInputEventListener(input);
        }
      }, 300);
    });

    if (document.body) {
      globalObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ═══════════════════════════════════════════════
  //  MESSAGE LISTENER
  // ═══════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_TOAST' && msg.message) {
      showToast(msg.message, msg.toastType || 'success');
    }
  });

  // ═══════════════════════════════════════════════
  //  V2: TOKEN TRACKER INITIALIZATION
  // ═══════════════════════════════════════════════
  async function initTokenTracker() {
    if (typeof TokenTracker === 'undefined') return;

    try {
      const settings = await MemoryStorage.getSettings();
      if (!settings.tokenIndicator) return;

      TokenTracker.init(PLATFORM, getInput);
      TokenTracker.setVisible(true);
    } catch (err) {
      console.warn('[ASM] TokenTracker init error:', err);
    }
  }

  // ═══════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════
  function init() {
    const input = getInput();
    if (input) {
      inputObserverTarget = input;
      inputObserver.observe(input, { characterData: true, childList: true, subtree: true });
      attachInputEventListener(input);
      watchForInputClear();
      startGlobalObserver();
      initTokenTracker();
      console.log(`[AI Smart Memory] V2 PRO ready on ${PLATFORM}`);
      return true;
    }
    return false;
  }

  function retryInit() {
    if (init()) return;

    initRetryCount++;
    if (initRetryCount >= MAX_INIT_RETRIES) {
      watchForInputClear();
      startGlobalObserver();
      initTokenTracker();
      console.log(`[AI Smart Memory] Waiting for input on ${PLATFORM}...`);
      return;
    }

    setTimeout(retryInit, 500);
  }

  if (!init()) {
    const domObserver = new MutationObserver(() => {
      if (init()) {
        domObserver.disconnect();
      }
    });

    if (document.body) {
      domObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (!init()) {
          domObserver.observe(document.body, { childList: true, subtree: true });
        }
      });
    }

    setTimeout(retryInit, 1000);

    setTimeout(() => {
      domObserver.disconnect();
      if (!inputObserverTarget) {
        watchForInputClear();
        startGlobalObserver();
        initTokenTracker();
      }
    }, 15000);
  }

  // Re-attach on tab focus
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => reattachInputObserver(), 300);
    }
  });

})();