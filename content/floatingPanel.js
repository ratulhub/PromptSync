/**
 * floatingPanel.js — v3.0 PRO
 * Combined token badge + expandable floating panel.
 * Modes: badge-only, full-panel, hidden.
 * Features: memory toggle, mode switch, token details, draggable, collapsible.
 */

const FloatingPanel = (() => {
  'use strict';

  const PLATFORM_LIMITS = {
    chatgpt: 128000, claude: 200000, gemini: 1000000, perplexity: 16000, deepseek: 64000
  };

  let platform = null;
  let contextLimit = 128000;
  let sessionTokens = 0;
  let currentInputTokens = 0;
  let currentMemoryTokens = 0;
  let panelEl = null;
  let isExpanded = false;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let panelMode = 'badge'; // 'badge' | 'panel' | 'hidden'
  let outsideHandler = null;
  let posInterval = null;

  function init(plat) {
    platform = plat;
    contextLimit = PLATFORM_LIMITS[plat] || 128000;
    sessionTokens = 0;
    currentInputTokens = 0;
    currentMemoryTokens = 0;
    loadAndInject();
  }

  async function loadAndInject() {
    try {
      if (typeof MemoryStorage !== 'undefined') {
        const settings = await MemoryStorage.getSettings();
        if (!settings.floatingPanel?.visible) { panelMode = 'hidden'; return; }
        panelMode = settings.floatingPanel?.mode || 'badge';
      }
    } catch {}
    injectPanel();
  }

  function injectPanel() {
    destroy();
    if (panelMode === 'hidden') return;

    panelEl = document.createElement('div');
    panelEl.id = 'asm-fp';
    panelEl.className = 'asm-fp';

    // ── Badge (always visible unless hidden) ──
    const badge = document.createElement('div');
    badge.className = 'asm-fp__badge';
    badge.id = 'asm-fp-badge';

    const badgeIcon = document.createElement('span');
    badgeIcon.className = 'asm-fp__badge-icon';
    badgeIcon.textContent = '●';

    const badgeText = document.createElement('span');
    badgeText.className = 'asm-fp__badge-text';
    badgeText.id = 'asm-fp-badge-text';
    badgeText.textContent = '0 tok';

    badge.appendChild(badgeIcon);
    badge.appendChild(badgeText);

    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isDragging) return;
      toggleExpand();
    });

    // ── Expanded Panel ──
    const panel = document.createElement('div');
    panel.className = 'asm-fp__panel';
    panel.id = 'asm-fp-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'asm-fp__header';

    const title = document.createElement('span');
    title.className = 'asm-fp__title';
    title.textContent = 'PromptSync';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'asm-fp__close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      collapse();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'asm-fp__controls';

    // Memory toggle
    const memRow = document.createElement('div');
    memRow.className = 'asm-fp__row';
    const memLabel = document.createElement('span');
    memLabel.textContent = 'Memory';
    const memToggle = document.createElement('label');
    memToggle.className = 'asm-fp__toggle';
    const memInput = document.createElement('input');
    memInput.type = 'checkbox';
    memInput.id = 'asm-fp-mem';
    memInput.checked = true;
    const memTrack = document.createElement('span');
    memTrack.className = 'asm-fp__toggle-track';
    memToggle.appendChild(memInput);
    memToggle.appendChild(memTrack);
    memRow.appendChild(memLabel);
    memRow.appendChild(memToggle);

    memInput.addEventListener('change', async () => {
      try {
        const s = await MemoryStorage.getSettings();
        s.injectEnabled = memInput.checked;
        await MemoryStorage.saveSettings(s);
        showMiniToast(memInput.checked ? 'Memory ON' : 'Memory OFF');
      } catch {}
    });

    // Mode select
    const modeRow = document.createElement('div');
    modeRow.className = 'asm-fp__row';
    const modeLabel = document.createElement('span');
    modeLabel.textContent = 'Mode';
    const modeSelect = document.createElement('select');
    modeSelect.className = 'asm-fp__select';
    modeSelect.id = 'asm-fp-mode';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Default';
    modeSelect.appendChild(defaultOpt);

    // Populate modes async
    populateModes(modeSelect);

    modeSelect.addEventListener('change', async () => {
      try {
        await MemoryStorage.setActiveMode(modeSelect.value);
        showMiniToast(modeSelect.value ? `Mode: ${modeSelect.value}` : 'Default mode');
      } catch {}
    });

    modeRow.appendChild(modeLabel);
    modeRow.appendChild(modeSelect);

    controls.appendChild(memRow);
    controls.appendChild(modeRow);

    // Token details
    const tokenDetails = document.createElement('div');
    tokenDetails.className = 'asm-fp__tokens';
    tokenDetails.id = 'asm-fp-tokens';
    tokenDetails.innerHTML = `
      <div class="asm-fp__token-row"><span>Input</span><span id="asm-fp-t-input">0</span></div>
      <div class="asm-fp__token-row"><span>Memory</span><span id="asm-fp-t-mem">0</span></div>
      <div class="asm-fp__token-row"><span>Session</span><span id="asm-fp-t-session">0</span></div>
      <div class="asm-fp__token-row asm-fp__token-row--bar">
        <div class="asm-fp__bar"><div class="asm-fp__bar-fill" id="asm-fp-bar"></div></div>
        <span id="asm-fp-t-pct">0%</span>
      </div>
    `;

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'asm-fp__reset';
    resetBtn.textContent = 'Reset session';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetSession();
      showMiniToast('Session reset');
    });

    // Mini toast
    const miniToast = document.createElement('div');
    miniToast.className = 'asm-fp__toast';
    miniToast.id = 'asm-fp-toast';

    panel.appendChild(header);
    panel.appendChild(controls);
    panel.appendChild(tokenDetails);
    panel.appendChild(resetBtn);
    panel.appendChild(miniToast);

    panelEl.appendChild(badge);
    panelEl.appendChild(panel);

    // Dragging
    setupDrag(badge);

    // Outside click
    outsideHandler = (e) => {
      if (isExpanded && panelEl && !panelEl.contains(e.target)) collapse();
    };
    document.addEventListener('click', outsideHandler);

    document.body.appendChild(panelEl);

    // Position
    restorePosition();
    updateDisplay();
    loadInitialState();

    // Periodic repositioning safety
    posInterval = setInterval(() => {
      if (!panelEl) return;
      const rect = panelEl.getBoundingClientRect();
      if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) {
        panelEl.style.right = '16px';
        panelEl.style.bottom = '80px';
        panelEl.style.left = 'auto';
        panelEl.style.top = 'auto';
      }
    }, 5000);
  }

  async function populateModes(select) {
    try {
      const modes = await MemoryStorage.getTaskModes();
      const settings = await MemoryStorage.getSettings();
      for (const [key, mode] of Object.entries(modes)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = mode.name || key;
        select.appendChild(opt);
      }
      if (settings.activeMode) select.value = settings.activeMode;
    } catch {}
  }

  async function loadInitialState() {
    try {
      const s = await MemoryStorage.getSettings();
      const memInput = document.getElementById('asm-fp-mem');
      if (memInput) memInput.checked = s.injectEnabled;
    } catch {}
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
    if (panelEl) {
      panelEl.classList.toggle('asm-fp--expanded', isExpanded);
    }
  }

  function collapse() {
    isExpanded = false;
    if (panelEl) panelEl.classList.remove('asm-fp--expanded');
  }

  /* ── Drag ── */
  function setupDrag(handle) {
    let moved = false;
    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = false;
      moved = false;
      const rect = panelEl.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      const onMove = (me) => {
        if (!moved && (Math.abs(me.clientX - e.clientX) > 3 || Math.abs(me.clientY - e.clientY) > 3)) {
          moved = true;
          isDragging = true;
        }
        if (!moved) return;
        const x = me.clientX - dragOffset.x;
        const y = me.clientY - dragOffset.y;
        panelEl.style.left = `${Math.max(0, Math.min(x, window.innerWidth - 60))}px`;
        panelEl.style.top = `${Math.max(0, Math.min(y, window.innerHeight - 40))}px`;
        panelEl.style.right = 'auto';
        panelEl.style.bottom = 'auto';
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (moved) savePosition();
        setTimeout(() => { isDragging = false; }, 50);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  async function savePosition() {
    if (!panelEl || typeof MemoryStorage === 'undefined') return;
    const rect = panelEl.getBoundingClientRect();
    try {
      await MemoryStorage.savePanelPosition({
        left: rect.left, top: rect.top
      });
    } catch {}
  }

  async function restorePosition() {
    if (!panelEl || typeof MemoryStorage === 'undefined') return;
    try {
      const pos = await MemoryStorage.getPanelPosition();
      if (pos && pos.left !== undefined) {
        panelEl.style.left = `${Math.max(0, Math.min(pos.left, window.innerWidth - 60))}px`;
        panelEl.style.top = `${Math.max(0, Math.min(pos.top, window.innerHeight - 40))}px`;
        panelEl.style.right = 'auto';
        panelEl.style.bottom = 'auto';
        return;
      }
    } catch {}
    // Default position
    panelEl.style.right = '16px';
    panelEl.style.bottom = '80px';
  }

  let miniToastTimer = null;
  function showMiniToast(msg) {
    const el = document.getElementById('asm-fp-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('asm-fp__toast--visible');
    clearTimeout(miniToastTimer);
    miniToastTimer = setTimeout(() => el.classList.remove('asm-fp__toast--visible'), 1800);
  }

  /* ── Token updates ── */
  function updateInput(inputTokens, memoryTokens) {
    currentInputTokens = inputTokens || 0;
    currentMemoryTokens = memoryTokens || 0;
    updateDisplay();
  }

  function addToSession(tokens) {
    sessionTokens += tokens || 0;
    updateDisplay();
  }

  function resetSession() {
    sessionTokens = 0;
    currentInputTokens = 0;
    currentMemoryTokens = 0;
    updateDisplay();
  }

  function updateDisplay() {
    const totalInput = currentInputTokens + currentMemoryTokens;
    const totalSession = sessionTokens + totalInput;
    const pct = contextLimit > 0 ? Math.min(100, (totalSession / contextLimit) * 100) : 0;

    // Badge
    const badgeText = document.getElementById('asm-fp-badge-text');
    if (badgeText) {
      badgeText.textContent = `${fmtNum(totalInput)} tok`;
    }

    // Panel details
    const inEl = document.getElementById('asm-fp-t-input');
    if (inEl) inEl.textContent = fmtNum(currentInputTokens);
    const memEl = document.getElementById('asm-fp-t-mem');
    if (memEl) memEl.textContent = fmtNum(currentMemoryTokens);
    const sesEl = document.getElementById('asm-fp-t-session');
    if (sesEl) sesEl.textContent = fmtNum(totalSession);
    const pctEl = document.getElementById('asm-fp-t-pct');
    if (pctEl) pctEl.textContent = `${pct.toFixed(1)}%`;

    const barEl = document.getElementById('asm-fp-bar');
    if (barEl) {
      barEl.style.width = `${Math.min(100, pct)}%`;
      barEl.className = 'asm-fp__bar-fill';
      if (pct < 25) barEl.classList.add('asm-fp__bar--green');
      else if (pct < 60) barEl.classList.add('asm-fp__bar--yellow');
      else barEl.classList.add('asm-fp__bar--red');
    }
  }

  function setVisible(visible) {
    if (panelEl) panelEl.style.display = visible ? '' : 'none';
  }

  function getUsageLevel() {
    const total = sessionTokens + currentInputTokens + currentMemoryTokens;
    const pct = contextLimit > 0 ? (total / contextLimit) * 100 : 0;
    return { isHigh: pct > 75, isMedium: pct > 40, percentage: pct, total, limit: contextLimit };
  }

  function destroy() {
    if (panelEl) { panelEl.remove(); panelEl = null; }
    if (outsideHandler) { document.removeEventListener('click', outsideHandler); outsideHandler = null; }
    if (posInterval) { clearInterval(posInterval); posInterval = null; }
    isExpanded = false;
  }

  function fmtNum(n) {
    if (n < 1000) return String(n);
    if (n < 10000) return (n / 1000).toFixed(1) + 'k';
    return Math.round(n / 1000) + 'k';
  }

  return {
    init, updateInput, addToSession, resetSession, setVisible,
    getUsageLevel, destroy, showMiniToast, PLATFORM_LIMITS
  };
})();
