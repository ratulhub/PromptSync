/**
 * tokenTracker.js — V2.5 PRO
 * Real-time token usage tracking with in-page UI widget.
 * Injects a small, non-intrusive token indicator near the AI input box.
 *
 * Features:
 *   - Session token tracking (input + estimated output)
 *   - Color-coded progress bar (green/yellow/red)
 *   - Auto-reset on URL change (new chat)
 *   - Manual reset button
 *   - Platform-specific positioning
 *   - ResizeObserver-based repositioning (replaces setInterval)
 *
 * Usage:
 *   TokenTracker.init(platform, inputFinder) — initialize and inject UI
 *   TokenTracker.updateInput(tokens)          — update current input token count
 *   TokenTracker.addToSession(tokens)         — add tokens to session total
 *   TokenTracker.resetSession()               — reset session counter
 *   TokenTracker.destroy()                    — remove UI and cleanup
 */

const TokenTracker = (() => {
  'use strict';

  // Platform context window sizes (tokens)
  const PLATFORM_LIMITS = {
    chatgpt:    128000,
    claude:     200000,
    gemini:     1000000,
    perplexity: 16000,
    deepseek:   64000
  };

  // State
  let platform = null;
  let contextLimit = 128000;
  let sessionTokens = 0;
  let currentInputTokens = 0;
  let currentMemoryTokens = 0;
  let widgetEl = null;
  let isExpanded = false;
  let isVisible = true;
  let inputFinderFn = null;
  let positionInterval = null;
  let outsideClickHandler = null;
  let resizeObserver = null;
  let retryCount = 0;
  const MAX_RETRIES = 5;

  /**
   * Initialize the token tracker.
   * @param {string} plat — platform name
   * @param {Function} inputFinder — function that returns the input element
   */
  function init(plat, inputFinder) {
    platform = plat;
    contextLimit = PLATFORM_LIMITS[plat] || 128000;
    inputFinderFn = inputFinder;
    sessionTokens = 0;
    currentInputTokens = 0;
    currentMemoryTokens = 0;
    retryCount = 0;

    injectWidgetWithRetry();
  }

  /**
   * Attempt to inject widget, with retry logic for late-loading input fields.
   */
  function injectWidgetWithRetry() {
    const input = inputFinderFn ? inputFinderFn() : null;
    if (input) {
      injectWidget();
      startPositionTracking();
    } else if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(injectWidgetWithRetry, 1000);
    }
  }

  /**
   * Create and inject the token indicator widget.
   */
  function injectWidget() {
    // Remove existing widget if any
    destroy();

    widgetEl = document.createElement('div');
    widgetEl.id = 'asm-token-widget';
    widgetEl.className = 'asm-token-widget';

    // Build inner HTML safely
    const inner = document.createElement('div');
    inner.className = 'asm-token-widget__compact';

    // Token text
    const tokenText = document.createElement('span');
    tokenText.className = 'asm-token-widget__text';
    tokenText.id = 'asm-tw-text';
    tokenText.textContent = '~0 tokens';

    // Progress bar container
    const barWrap = document.createElement('div');
    barWrap.className = 'asm-token-widget__bar';

    const barFill = document.createElement('div');
    barFill.className = 'asm-token-widget__bar-fill';
    barFill.id = 'asm-tw-fill';

    barWrap.appendChild(barFill);
    inner.appendChild(tokenText);
    inner.appendChild(barWrap);

    // Expand panel
    const expandPanel = document.createElement('div');
    expandPanel.className = 'asm-token-widget__expand';
    expandPanel.id = 'asm-tw-expand';

    const sessionRow = document.createElement('div');
    sessionRow.className = 'asm-token-widget__row';
    sessionRow.innerHTML = '';

    const sessionLabel = document.createElement('span');
    sessionLabel.textContent = 'Session:';
    const sessionVal = document.createElement('span');
    sessionVal.id = 'asm-tw-session';
    sessionVal.textContent = '0';
    sessionRow.appendChild(sessionLabel);
    sessionRow.appendChild(sessionVal);

    const memoryRow = document.createElement('div');
    memoryRow.className = 'asm-token-widget__row';
    const memLabel = document.createElement('span');
    memLabel.textContent = 'Memory:';
    const memVal = document.createElement('span');
    memVal.id = 'asm-tw-memory';
    memVal.textContent = '0';
    memoryRow.appendChild(memLabel);
    memoryRow.appendChild(memVal);

    const limitRow = document.createElement('div');
    limitRow.className = 'asm-token-widget__row';
    const limLabel = document.createElement('span');
    limLabel.textContent = 'Limit:';
    const limVal = document.createElement('span');
    limVal.id = 'asm-tw-limit';
    limVal.textContent = formatNumber(contextLimit);
    limitRow.appendChild(limLabel);
    limitRow.appendChild(limVal);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'asm-token-widget__reset';
    resetBtn.textContent = 'Reset session';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetSession();
    });

    expandPanel.appendChild(sessionRow);
    expandPanel.appendChild(memoryRow);
    expandPanel.appendChild(limitRow);
    expandPanel.appendChild(resetBtn);

    widgetEl.appendChild(inner);
    widgetEl.appendChild(expandPanel);

    // Toggle expand on click
    inner.addEventListener('click', (e) => {
      e.stopPropagation();
      isExpanded = !isExpanded;
      expandPanel.classList.toggle('asm-token-widget__expand--visible', isExpanded);
      widgetEl.classList.toggle('asm-token-widget--expanded', isExpanded);
    });

    // Close expand on outside click
    outsideClickHandler = () => {
      if (isExpanded) {
        isExpanded = false;
        expandPanel.classList.remove('asm-token-widget__expand--visible');
        widgetEl.classList.remove('asm-token-widget--expanded');
      }
    };
    document.addEventListener('click', outsideClickHandler);

    document.body.appendChild(widgetEl);
    updateDisplay();
  }

  /**
   * Position the widget near the input element.
   */
  function positionWidget() {
    if (!widgetEl || !inputFinderFn) return;
    const input = inputFinderFn();
    if (!input) return;

    const rect = input.getBoundingClientRect();

    // Position above the input, right-aligned
    const top = rect.top - 32;
    const right = window.innerWidth - rect.right;

    // Only reposition if the input is visible
    if (rect.height === 0 || rect.width === 0) return;

    widgetEl.style.position = 'fixed';
    widgetEl.style.top = `${Math.max(4, top)}px`;
    widgetEl.style.right = `${Math.max(4, right)}px`;
    widgetEl.style.left = 'auto';
    widgetEl.style.bottom = 'auto';
  }

  /**
   * Start tracking input element position changes.
   * Uses ResizeObserver + scroll listener for responsive repositioning.
   */
  function startPositionTracking() {
    positionWidget();

    // Use ResizeObserver if available for efficient layout tracking
    if (typeof ResizeObserver !== 'undefined' && inputFinderFn) {
      const input = inputFinderFn();
      if (input) {
        resizeObserver = new ResizeObserver(() => {
          requestAnimationFrame(positionWidget);
        });
        resizeObserver.observe(input);
        // Also observe body for general layout changes
        resizeObserver.observe(document.body);
      }
    }

    // Fallback: reposition on scroll and resize events
    window.addEventListener('scroll', positionWidget, { passive: true });
    window.addEventListener('resize', positionWidget, { passive: true });

    // Safety fallback interval (much less frequent than before)
    positionInterval = setInterval(positionWidget, 5000);
  }

  /**
   * Update the display with current token data.
   */
  function updateDisplay() {
    if (!widgetEl) return;

    const totalInput = currentInputTokens + currentMemoryTokens;
    const totalSession = sessionTokens + totalInput;
    // Guard against NaN/Infinity when contextLimit is 0
    const pct = (contextLimit > 0) ? Math.min(100, (totalSession / contextLimit) * 100) : 0;

    // Text
    const textEl = document.getElementById('asm-tw-text');
    if (textEl) {
      textEl.textContent = `~${formatNumber(totalInput)} / ${formatShort(contextLimit)} (${pct.toFixed(1)}%)`;
    }

    // Progress bar
    const fillEl = document.getElementById('asm-tw-fill');
    if (fillEl) {
      fillEl.style.width = `${Math.min(100, pct)}%`;
      // Color based on percentage
      fillEl.classList.remove('asm-tw-green', 'asm-tw-yellow', 'asm-tw-red');
      if (pct < 25) {
        fillEl.classList.add('asm-tw-green');
      } else if (pct < 60) {
        fillEl.classList.add('asm-tw-yellow');
      } else {
        fillEl.classList.add('asm-tw-red');
      }
    }

    // Expanded panel
    const sessionEl = document.getElementById('asm-tw-session');
    if (sessionEl) sessionEl.textContent = formatNumber(totalSession);

    const memEl = document.getElementById('asm-tw-memory');
    if (memEl) memEl.textContent = formatNumber(currentMemoryTokens);
  }

  /**
   * Update current input token count (called on typing).
   * @param {number} inputTokens — tokens from user's typed text
   * @param {number} memoryTokens — tokens from injected memory
   */
  function updateInput(inputTokens, memoryTokens) {
    currentInputTokens = inputTokens || 0;
    currentMemoryTokens = memoryTokens || 0;
    updateDisplay();
  }

  /**
   * Add tokens to session total (called after message sent).
   * @param {number} tokens
   */
  function addToSession(tokens) {
    sessionTokens += tokens || 0;
    updateDisplay();
  }

  /**
   * Reset session counter.
   */
  function resetSession() {
    sessionTokens = 0;
    currentInputTokens = 0;
    currentMemoryTokens = 0;
    updateDisplay();
  }

  /**
   * Set visibility of the widget.
   * @param {boolean} visible
   */
  function setVisible(visible) {
    isVisible = visible;
    if (widgetEl) {
      widgetEl.style.display = visible ? '' : 'none';
    }
  }

  /**
   * Check if session token usage is high.
   * @returns {{ isHigh: boolean, percentage: number }}
   */
  function getUsageLevel() {
    const total = sessionTokens + currentInputTokens + currentMemoryTokens;
    const pct = (total / contextLimit) * 100;
    return {
      isHigh: pct > 75,
      isMedium: pct > 40,
      percentage: pct,
      total,
      limit: contextLimit
    };
  }

  /**
   * Destroy the widget and cleanup.
   */
  function destroy() {
    if (widgetEl) {
      widgetEl.remove();
      widgetEl = null;
    }
    if (positionInterval) {
      clearInterval(positionInterval);
      positionInterval = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    window.removeEventListener('scroll', positionWidget);
    window.removeEventListener('resize', positionWidget);
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler);
      outsideClickHandler = null;
    }
    isExpanded = false;
  }

  /* ── Formatters ── */
  function formatNumber(n) {
    if (n < 1000) return String(n);
    if (n < 10000) return (n / 1000).toFixed(1) + 'k';
    return Math.round(n / 1000) + 'k';
  }

  function formatShort(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(0) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return String(n);
  }

  return {
    init,
    updateInput,
    addToSession,
    resetSession,
    setVisible,
    getUsageLevel,
    destroy,
    PLATFORM_LIMITS
  };
})();
