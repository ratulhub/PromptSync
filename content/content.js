/**
 * content.js — v3.0 PRO
 * Core content script for PromptSync.
 * Runs on ChatGPT, Claude, Gemini, Perplexity, DeepSeek.
 *
 * Pipeline: Input → Parse Commands → Build Context (Engine) → Inject → Track Tokens
 * Features: smart injection, commands, task modes, floating panel, security, auto-detect
 */

(function () {
  'use strict';
  if (window.__asm_content_loaded) return;
  window.__asm_content_loaded = true;

  /* ═══════════════════════
     PLATFORM DETECTION
  ═══════════════════════ */
  const PLATFORM = (() => {
    const h = location.hostname;
    if (h.includes('openai.com') || h.includes('chatgpt.com')) return 'chatgpt';
    if (h.includes('claude.ai'))          return 'claude';
    if (h.includes('gemini.google.com'))  return 'gemini';
    if (h.includes('perplexity.ai'))      return 'perplexity';
    if (h.includes('deepseek.com'))       return 'deepseek';
    return 'unknown';
  })();

  if (PLATFORM === 'unknown') return;
  if (typeof MemoryStorage === 'undefined') { console.warn('[ASM] MemoryStorage not found'); return; }

  /* ═══════════════════════
     SELECTORS
  ═══════════════════════ */
  const CONFIG = {
    chatgpt: {
      inputs: ['#prompt-textarea','div.ProseMirror[contenteditable="true"]','div[contenteditable="true"][data-placeholder]','div[contenteditable="true"]','textarea[placeholder]'],
      sends: ['button[data-testid="send-button"]','button[aria-label="Send message"]','button[aria-label*="Send"]','form button[type="submit"]']
    },
    claude: {
      inputs: ['div.ProseMirror[contenteditable="true"]','div[enterkeyhint="enter"][contenteditable="true"]','div[contenteditable="true"][data-placeholder]','div[contenteditable="true"]'],
      sends: ['button[aria-label="Send Message"]','button[aria-label="Send message"]','button[data-testid="send-button"]','button[aria-label*="Send"]']
    },
    gemini: {
      inputs: ['rich-textarea div[contenteditable="true"]','div[contenteditable="true"][role="textbox"]','.ql-editor[contenteditable="true"]','div[contenteditable="true"]'],
      sends: ['button.send-button','button[aria-label="Send message"]','button[data-testid="send-button"]','button[aria-label*="Send"]','button[mat-icon-button]']
    },
    perplexity: {
      inputs: ['textarea[placeholder*="Ask"]','textarea[placeholder]','textarea','div[contenteditable="true"]'],
      sends: ['button[aria-label="Submit"]','button[aria-label*="Send"]','button[type="submit"]','button[aria-label="Search"]']
    },
    deepseek: {
      inputs: ['textarea#chat-input','textarea[placeholder]','textarea','div[contenteditable="true"]'],
      sends: ['div[role="button"][class*="send"]','button[data-testid="send-button"]','div[role="button"][aria-label*="Send"]','button[aria-label*="Send"]']
    }
  };

  const cfg = CONFIG[PLATFORM];

  /* ═══════════════════════
     AUTO-DETECT PATTERNS
  ═══════════════════════ */
  const DETECT_PATTERNS = [
    /\bI(?:'m| am) (?:a |an )?([\w][\w\s]{2,30})\b/i,
    /\bI(?:'m| am) learning\b(.{5,60})/i,
    /\bI(?:'m| am) working (?:on|with)\b(.{5,60})/i,
    /\bmy (?:name|goal|skill|focus) is\b(.{3,60})/i,
    /\bI (?:prefer|want|like|use)\b(.{5,60})/i
  ];

  /* ═══════════════════════
     STATE
  ═══════════════════════ */
  let alreadyInjectedThisSend = false;
  let isReDispatchingClick = false;
  let isReDispatchingEnter = false;
  let floatBtn = null;
  let toastTimeout = null;
  let lastUrl = location.href;
  let inputObserverTarget = null;
  let initRetryCount = 0;
  let tokenCalcDebounce = null;
  let detectDebounce = null;
  let lastDetectedText = '';
  const MAX_INIT_RETRIES = 30;
  let debugMode = false;

  /* ═══════════════════════
     ELEMENT FINDERS
  ═══════════════════════ */
  function findFirst(selectors) {
    for (const sel of selectors) {
      try { const el = document.querySelector(sel); if (el) return el; } catch {}
    }
    return null;
  }
  function getInput() { return findFirst(cfg.inputs); }
  function getSendBtn() { return findFirst(cfg.sends); }

  function getInputText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || '';
    return el.innerText || el.textContent || '';
  }

  function hasInjectionMarker(text) {
    if (text.includes('[USER CONTEXT START]') || text.includes('[USER CONTEXT END]') || text.includes('[Memory:') || text.includes('[ROLE]') || text.includes('[STYLE]')) {
      return true;
    }
    const lower = text.toLowerCase();
    if (/^(act as|you are an?|imagine you are)\b/i.test(lower)) return true;
    return false;
  }

  /* ═══════════════════════
     TEXT INJECTION
  ═══════════════════════ */
  function prependTextToEditor(el, prefix) {
    el.focus();
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const original = el.value;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSetter) nativeSetter.call(el, prefix + original);
      else el.value = prefix + original;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
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
    } catch {
      el.innerText = prefix + el.innerText;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
  }

  function appendTextToEditor(el, suffix) {
    el.focus();
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const original = el.value;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSetter) nativeSetter.call(el, original + suffix);
      else el.value = original + suffix;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      if (!document.execCommand('insertText', false, suffix)) {
        const textNode = document.createTextNode(suffix);
        el.appendChild(textNode);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      }
    } catch {
      el.innerText = el.innerText + suffix;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
  }

  function setEditorText(el, text) {
    el.focus();
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSetter) nativeSetter.call(el, text);
      else el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      if (!document.execCommand('insertText', false, text)) {
        el.innerText = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      }
    } catch {
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
  }

  /* ═══════════════════════
     PLATFORM CHECK + AUTO-SWITCH
  ═══════════════════════ */
  async function checkPlatformEnabled() {
    try {
      const settings = await MemoryStorage.getSettings();
      return settings.platforms?.[PLATFORM] !== false;
    } catch { return true; }
  }

  async function checkAutoSwitch() {
    try {
      const profileName = await MemoryStorage.getProfileForDomain(location.hostname);
      if (profileName) {
        await MemoryStorage.switchProfile(profileName);
        if (debugMode) console.log(`[ASM] Auto-switched to profile: ${profileName}`);
      }
    } catch {}
  }

  /* ═══════════════════════
     INJECTION PIPELINE
  ═══════════════════════ */
  async function injectMemory(el) {
    const rawText = getInputText(el);
    if (alreadyInjectedThisSend) return rawText;

    try {
      if (!(await checkPlatformEnabled())) return rawText;
      const settings = await MemoryStorage.getSettings();
      if (!settings.injectEnabled) return rawText;
      debugMode = settings.advanced?.debugMode || false;

      if (!rawText.trim()) return rawText;
      if (hasInjectionMarker(rawText)) { alreadyInjectedThisSend = true; return rawText; }

      alreadyInjectedThisSend = true;

      // Injection delay
      const delay = settings.advanced?.injectionDelay || 0;
      if (delay > 0) await new Promise(r => setTimeout(r, delay));

      // Step 1: Parse commands
      let cleanText = rawText.trim();
      let overrides = {};

      if (typeof CommandParser !== 'undefined') {
        await CommandParser.loadCustomCommands();
        if (CommandParser.hasCommands(rawText)) {
          const parsed = CommandParser.parse(rawText);
          cleanText = parsed.cleanText;
          overrides = parsed.overrides;

          if (parsed.tempMemory.length > 0 && typeof ContextEngine !== 'undefined') {
            parsed.tempMemory.forEach(t => ContextEngine.addTempMemory(t));
            showToast('Session note added', 'info');
          }

          if (cleanText !== rawText.trim()) {
            setEditorText(el, cleanText);
            await new Promise(r => setTimeout(r, 50));
          }
        }
      }

      // Step 2: Skip?
      if (overrides.skipInjection) {
        showToast('Memory skipped', 'info');
        return rawText;
      }
      if (!cleanText.trim()) return rawText;

      // Step 3: Build context
      let prefix = '';
      if (typeof ContextEngine !== 'undefined') {
        prefix = await MemoryStorage.buildMemoryStringV2(cleanText, overrides) || '';
      } else {
        prefix = await MemoryStorage.buildMemoryString(settings.compactMode) || '';
      }

      // Step 4: System prompt (legacy token saving logic)
      if (settings.tokenSavingPrompt && !overrides.skipSystemPrompt && !overrides.taskRole && !settings.activeRole) {
        const sysPrompt = MemoryStorage.getSystemPrompt();
        prefix = `[System: ${sysPrompt}]\n${prefix}`;
      }

      if (!prefix) return rawText;

      if (debugMode) {
        console.log('[ASM] Injection prefix:', prefix);
        console.log('[ASM] Overrides:', overrides);
      }

      // Step 5: Inject
      if (settings.injectionPosition === 'BOTTOM') {
        appendTextToEditor(el, '\n\n' + prefix.trim());
      } else {
        prependTextToEditor(el, prefix);
      }

      // Step 5.5: Persistent Role Handling
      if (overrides.taskRole && settings.persistentRole !== false) {
        settings.activeRole = overrides.taskRole;
        await MemoryStorage.saveSettings(settings);
      } else if (settings.persistentRole === false && settings.activeRole) {
        settings.activeRole = '';
        await MemoryStorage.saveSettings(settings);
      }

      // Step 6: Token tracking
      if (typeof Tokenizer !== 'undefined' && typeof FloatingPanel !== 'undefined') {
        const totalTokens = Tokenizer.estimate(prefix + cleanText);
        FloatingPanel.addToSession(totalTokens);
      }

      showToast(settings.previewBeforeSend ? 'Context injected (Preview) ✓' : 'Context injected ✓', 'info');
      
      if (settings.previewBeforeSend) {
        return 'PREVIEW';
      }
      return true;
    } catch (err) {
      console.warn('[ASM] Injection failed:', err);
      return rawText || true;
    }
  }

  /* ═══════════════════════
     INTERCEPTS
  ═══════════════════════ */
  function handleSendClick(e) {
    if (isReDispatchingClick) return;
    const sendBtn = getSendBtn();
    if (!sendBtn) return;
    if (!sendBtn.contains(e.target) && e.target !== sendBtn) return;
    if (alreadyInjectedThisSend) return;
    const input = getInput();
    if (!input) return;
    const text = getInputText(input).trim();
    if (!text || hasInjectionMarker(text)) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    injectMemory(input).then((res) => {
      if (res === 'PREVIEW') {
        alreadyInjectedThisSend = true;
        // Do NOT dispatch send button click
        return;
      }
      if (res) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            isReDispatchingClick = true;
            const freshBtn = getSendBtn();
            if (freshBtn) freshBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            setTimeout(() => {
              isReDispatchingClick = false;
              setTimeout(() => { alreadyInjectedThisSend = false; }, 300);
            }, 50);
          }, 100);
        });
      }
    });
  }

  function handleKeydown(e) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (isReDispatchingEnter) return;
    const input = getInput();
    if (!input || (!input.contains(e.target) && e.target !== input)) return;
    if (alreadyInjectedThisSend) return;
    const text = getInputText(input).trim();
    if (!text || hasInjectionMarker(text)) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    injectMemory(input).then((res) => {
      if (res === 'PREVIEW') {
        alreadyInjectedThisSend = true;
        // Do NOT dispatch enter/send
        return;
      }
      if (res) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            isReDispatchingEnter = true;
            const sendBtn = getSendBtn();
            if (sendBtn) sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            else input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            setTimeout(() => {
              isReDispatchingEnter = false;
              setTimeout(() => { alreadyInjectedThisSend = false; }, 300);
            }, 50);
          }, 100);
        });
      }
    });
  }

  function handleSendFinished(e) {
    const sendBtn = getSendBtn();
    if (!sendBtn || (!sendBtn.contains(e.target) && e.target !== sendBtn)) return;
    setTimeout(() => { alreadyInjectedThisSend = false; }, 1000);
  }

  function watchForInputClear() {
    setInterval(() => {
      if (!alreadyInjectedThisSend) return;
      const input = getInput();
      if (!input) return;
      if (!getInputText(input).trim()) alreadyInjectedThisSend = false;
    }, 500);
  }

  document.addEventListener('click', handleSendClick, true);
  document.addEventListener('keydown', handleKeydown, true);
  document.addEventListener('click', handleSendFinished, false);

  /* ═══════════════════════
     TOAST
  ═══════════════════════ */
  function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    let toast = document.getElementById('asm-toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'asm-toast'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.className = `asm-toast asm-toast--${type} asm-toast--visible`;
    toastTimeout = setTimeout(() => toast.classList.remove('asm-toast--visible'), 2800);
  }

  /* ═══════════════════════
     FLOAT BUTTON + SELECTION SAVE
  ═══════════════════════ */
  function createFloatBtn() {
    if (floatBtn) return;
    floatBtn = document.createElement('button');
    floatBtn.id = 'asm-float-btn';
    floatBtn.textContent = '＋ Save to PromptSync';
    floatBtn.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = window.getSelection()?.toString().trim();
      if (!text) return;
      hideFloatBtn();

      // Security check
      if (typeof SecurityGuard !== 'undefined') {
        try {
          const settings = await MemoryStorage.getSettings();
          if (settings.security?.detectSensitive) {
            const scan = SecurityGuard.scan(text);
            if (scan.hasSensitive) {
              showToast('Sensitive data detected. Not saved.', 'error');
              return;
            }
          }
        } catch {}
      }

      try {
        const result = await MemoryStorage.addItem(text, 'selection');
        showToast(result?.duplicate ? 'Already saved ✓' : 'Saved to Memory ✓', result?.duplicate ? 'info' : 'success');
      } catch { showToast('Save failed', 'error'); }
    });
    document.body.appendChild(floatBtn);
  }

  function showFloatBtn(x, y) {
    if (!floatBtn) createFloatBtn();
    floatBtn.style.left = `${Math.min(x, window.innerWidth - 168)}px`;
    floatBtn.style.top = `${Math.max(8, y - 42)}px`;
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

  /* ═══════════════════════
     AUTO-DETECT
  ═══════════════════════ */
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

        // Security check
        if (typeof SecurityGuard !== 'undefined') {
          try {
            const settings = await MemoryStorage.getSettings();
            if (settings.security?.detectSensitive && SecurityGuard.quickCheck(snippet)) return;
          } catch {}
        }

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
    strong.textContent = '💡 Save to PromptSync?';
    textDiv.appendChild(strong);
    const span = document.createElement('span');
    span.textContent = `"${text.length > 60 ? text.slice(0, 57) + '…' : text}"`;
    textDiv.appendChild(span);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'asm-suggest__actions';

    const yesBtn = document.createElement('button');
    yesBtn.id = 'asm-suggest-yes';
    yesBtn.textContent = 'Save';
    yesBtn.addEventListener('click', async () => {
      try {
        const result = await MemoryStorage.addItem(text, 'auto-detect');
        showToast(result?.duplicate ? 'Already saved ✓' : 'Saved ✓', 'info');
      } catch { showToast('Save failed', 'error'); }
      banner.remove();
    });

    const editBtn = document.createElement('button');
    editBtn.id = 'asm-suggest-edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      const input = document.createElement('textarea');
      input.className = 'asm-suggest__edit-input';
      input.value = text;
      input.rows = 2;
      textDiv.innerHTML = '';
      textDiv.appendChild(input);
      input.focus();
      yesBtn.onclick = async () => {
        const edited = input.value.trim();
        if (edited) {
          await MemoryStorage.addItem(edited, 'auto-detect');
          showToast('Saved ✓');
        }
        banner.remove();
      };
    });

    const noBtn = document.createElement('button');
    noBtn.id = 'asm-suggest-no';
    noBtn.textContent = 'Dismiss';
    noBtn.addEventListener('click', () => banner.remove());

    actionsDiv.appendChild(yesBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(noBtn);
    banner.appendChild(textDiv);
    banner.appendChild(actionsDiv);
    document.body.appendChild(banner);
    setTimeout(() => { if (banner.isConnected) banner.remove(); }, 8000);
  }

  /* ═══════════════════════
     REAL-TIME TOKEN CALC
  ═══════════════════════ */
  async function calculateTokensForInput() {
    const input = getInput();
    if (!input) return;
    const text = getInputText(input).trim();
    if (!text) {
      if (typeof FloatingPanel !== 'undefined') FloatingPanel.updateInput(0, 0);
      return;
    }
    if (typeof Tokenizer === 'undefined' || typeof FloatingPanel === 'undefined') return;

    try {
      const settings = await MemoryStorage.getSettings();
      if (!settings.floatingPanel?.visible) return;

      const inputTokens = Tokenizer.estimate(text);
      let memTokens = 0;
      if (settings.injectEnabled) {
        let overrides = {};
        let cleanText = text;
        if (typeof CommandParser !== 'undefined' && CommandParser.hasCommands(text)) {
          const parsed = CommandParser.parse(text);
          cleanText = parsed.cleanText;
          overrides = parsed.overrides;
        }
        if (!overrides.skipInjection) {
          if (typeof ContextEngine !== 'undefined') {
            const [profile, items] = await Promise.all([MemoryStorage.getProfile(), MemoryStorage.getItems()]);
            const contextStr = ContextEngine.buildSimple(cleanText, profile, items, settings, overrides);
            memTokens = contextStr ? Tokenizer.estimate(contextStr) : 0;
          }
          if (settings.tokenSavingPrompt && !overrides.skipSystemPrompt) {
            memTokens += Tokenizer.estimate(MemoryStorage.getSystemPrompt()) + 10;
          }
        }
      }
      FloatingPanel.updateInput(inputTokens, memTokens);
    } catch (err) {
      if (debugMode) console.warn('[ASM] Token calc error:', err);
    }
  }

  /* ═══════════════════════
     INPUT OBSERVER
  ═══════════════════════ */
  const inputObserver = new MutationObserver(() => {
    const input = getInput();
    if (!input) return;
    const text = getInputText(input).trim();
    if (!text) return;
    clearTimeout(detectDebounce);
    detectDebounce = setTimeout(() => runAutoDetect(text), 1500);
    clearTimeout(tokenCalcDebounce);
    tokenCalcDebounce = setTimeout(calculateTokensForInput, 300);
  });

  let boundInputListener = null;
  let boundInputElement = null;

  function attachInputEventListener(input) {
    if (boundInputElement === input) return;
    if (boundInputElement && boundInputListener) boundInputElement.removeEventListener('input', boundInputListener);
    boundInputElement = input;
    boundInputListener = () => {
      const text = getInputText(input).trim();
      if (text) {
        clearTimeout(detectDebounce);
        detectDebounce = setTimeout(() => runAutoDetect(text), 1500);
      }
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
    const tryAttach = () => {
      const input = getInput();
      if (input && input !== inputObserverTarget) {
        inputObserverTarget = input;
        inputObserver.observe(input, { characterData: true, childList: true, subtree: true });
        attachInputEventListener(input);
        return;
      }
      if (++retries < 10) setTimeout(tryAttach, 500);
    };
    setTimeout(tryAttach, 300);
  }

  /* ═══════════════════════
     SPA NAVIGATION
  ═══════════════════════ */
  function onNavigate() {
    alreadyInjectedThisSend = false;
    isReDispatchingClick = false;
    isReDispatchingEnter = false;
    if (typeof FloatingPanel !== 'undefined') FloatingPanel.resetSession();
    if (typeof ContextEngine !== 'undefined') ContextEngine.clearSession();
    lastDetectedText = '';
    inputObserver.disconnect();
    inputObserverTarget = null;
    clearTimeout(detectDebounce);
    clearTimeout(tokenCalcDebounce);
    reattachInputObserver();
    checkAutoSwitch();
  }

  setInterval(() => {
    if (location.href !== lastUrl) { lastUrl = location.href; onNavigate(); }
  }, 800);
  window.addEventListener('popstate', () => setTimeout(onNavigate, 200));

  /* ═══════════════════════
     GLOBAL DOM OBSERVER
  ═══════════════════════ */
  let globalObserver = null;
  let globalDebounce = null;

  function startGlobalObserver() {
    if (globalObserver) return;
    globalObserver = new MutationObserver(() => {
      clearTimeout(globalDebounce);
      globalDebounce = setTimeout(() => {
        const input = getInput();
        if (input && input !== inputObserverTarget) {
          inputObserverTarget = input;
          inputObserver.disconnect();
          inputObserver.observe(input, { characterData: true, childList: true, subtree: true });
          attachInputEventListener(input);
        }
      }, 300);
    });
    if (document.body) globalObserver.observe(document.body, { childList: true, subtree: true });
  }

  /* ═══════════════════════
     MESSAGE LISTENER
  ═══════════════════════ */
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_TOAST' && msg.message) showToast(msg.message, msg.toastType || 'success');
  });

  /* ═══════════════════════
     FLOATING PANEL INIT
  ═══════════════════════ */
  async function initFloatingPanel() {
    if (typeof FloatingPanel === 'undefined') return;
    try {
      const settings = await MemoryStorage.getSettings();
      if (!settings.floatingPanel?.visible) return;
      FloatingPanel.init(PLATFORM);
    } catch (err) {
      console.warn('[ASM] FloatingPanel init error:', err);
    }
  }

  /* ═══════════════════════
     INIT
  ═══════════════════════ */
  function init() {
    const input = getInput();
    if (input) {
      inputObserverTarget = input;
      inputObserver.observe(input, { characterData: true, childList: true, subtree: true });
      attachInputEventListener(input);
      watchForInputClear();
      startGlobalObserver();
      initFloatingPanel();
      checkAutoSwitch();
      console.log(`[PromptSync] v3.0 PRO ready on ${PLATFORM}`);
      return true;
    }
    return false;
  }

  function retryInit() {
    if (init()) return;
    if (++initRetryCount >= MAX_INIT_RETRIES) {
      watchForInputClear();
      startGlobalObserver();
      initFloatingPanel();
      checkAutoSwitch();
      return;
    }
    setTimeout(retryInit, 500);
  }

  if (!init()) {
    const domObs = new MutationObserver(() => { if (init()) domObs.disconnect(); });
    if (document.body) domObs.observe(document.body, { childList: true, subtree: true });
    else document.addEventListener('DOMContentLoaded', () => { if (!init()) domObs.observe(document.body, { childList: true, subtree: true }); });
    setTimeout(retryInit, 1000);
    setTimeout(() => {
      domObs.disconnect();
      if (!inputObserverTarget) { watchForInputClear(); startGlobalObserver(); initFloatingPanel(); checkAutoSwitch(); }
    }, 15000);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(reattachInputObserver, 300);
  });

})();
