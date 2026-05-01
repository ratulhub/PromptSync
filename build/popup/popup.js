/**
 * popup.js — V2.5 PRO
 * Drives all popup UI interactions.
 * Features: Quick Controls, dark mode, search, tags, pin, drag-reorder,
 * memory preview, char counters, 4-tab navigation, help tab.
 */

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* ═══════════════════════════
   TOAST
═══════════════════════════ */
let popupToastTimeout = null;
function showPopupToast(msg, duration = 2500) {
  const el = $('#js-popup-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(popupToastTimeout);
  popupToastTimeout = setTimeout(() => el.classList.remove('visible'), duration);
}

/* ═══════════════════════════
   HELPERS
═══════════════════════════ */
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* State */
let currentSearchQuery = '';
let currentTagFilter = 'all';

/* ═══════════════════════════
   DARK MODE
═══════════════════════════ */
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  let resolved = mode;
  if (mode === 'system') resolved = getSystemTheme();
  document.documentElement.setAttribute('data-theme', resolved);
}

async function initTheme() {
  const settings = await MemoryStorage.getSettings();
  applyTheme(settings.darkMode || 'system');

  // Listen for system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
    const s = await MemoryStorage.getSettings();
    if (s.darkMode === 'system') applyTheme('system');
  });

  $('#js-theme-toggle').addEventListener('click', async () => {
    const s = await MemoryStorage.getSettings();
    const cycle = { light: 'dark', dark: 'system', system: 'light' };
    s.darkMode = cycle[s.darkMode] || 'dark';
    await MemoryStorage.saveSettings(s);
    applyTheme(s.darkMode);
    const labels = { light: 'Light mode', dark: 'Dark mode', system: 'System theme' };
    showPopupToast(labels[s.darkMode]);
  });
}

/* ═══════════════════════════
   TABS (4-tab with animation)
═══════════════════════════ */
function initTabs() {
  const tabs   = $$('.tab');
  const panels = $$('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t   => t.classList.toggle('tab--active', t === tab));
      panels.forEach(p => p.classList.toggle('tab-panel--active', p.id === `tab-${target}`));
    });
  });
}

/* ═══════════════════════════
   CHARACTER COUNTER
═══════════════════════════ */
function initCharCounters() {
  $$('.field__input').forEach(input => {
    const counter = $(`.field__counter[data-for="${input.id}"]`);
    if (!counter) return;

    const max = parseInt(input.getAttribute('maxlength')) || 999;

    function update() {
      const len = input.value.length;
      counter.textContent = `${len}/${max}`;
      counter.classList.toggle('near-limit', len >= max * 0.8);
      counter.classList.toggle('at-limit', len >= max);
    }

    input.addEventListener('input', update);
    input.addEventListener('focus', update);
    update(); // Initial
  });
}

/* ═══════════════════════════
   QUICK CONTROLS
═══════════════════════════ */
async function initQuickControls() {
  const settings = await MemoryStorage.getSettings();

  const injectToggle = $('#qc-inject');
  const shortToggle  = $('#qc-short');
  const modeSelect   = $('#qc-mode');

  if (injectToggle) injectToggle.checked = settings.injectEnabled;
  if (shortToggle)  shortToggle.checked  = settings.tokenSavingPrompt !== false;
  if (modeSelect)   modeSelect.value     = settings.injectionMode || 'normal';

  // Auto-save on change
  if (injectToggle) {
    injectToggle.addEventListener('change', async () => {
      const s = await MemoryStorage.getSettings();
      s.injectEnabled = injectToggle.checked;
      await MemoryStorage.saveSettings(s);
      // Also sync with settings tab
      const settingsToggle = $('#s-inject');
      if (settingsToggle) settingsToggle.checked = injectToggle.checked;
      await updateStatusBadge();
      showPopupToast(s.injectEnabled ? 'Memory ON ✨' : 'Memory OFF ⏸');
    });
  }

  if (shortToggle) {
    shortToggle.addEventListener('change', async () => {
      const s = await MemoryStorage.getSettings();
      s.tokenSavingPrompt = shortToggle.checked;
      await MemoryStorage.saveSettings(s);
      // Sync with settings tab
      const settingsToggle = $('#s-token-saving');
      if (settingsToggle) settingsToggle.checked = shortToggle.checked;
      showPopupToast(s.tokenSavingPrompt ? 'Short answers ON' : 'Short answers OFF');
    });
  }

  if (modeSelect) {
    modeSelect.addEventListener('change', async () => {
      const s = await MemoryStorage.getSettings();
      s.injectionMode = modeSelect.value;
      // If strict or compact is selected, sync compactMode too
      s.compactMode = modeSelect.value === 'compact';
      await MemoryStorage.saveSettings(s);
      // Sync with settings tab
      const compactToggle = $('#s-compact');
      if (compactToggle) compactToggle.checked = s.compactMode;
      showPopupToast(`Mode: ${modeSelect.value.charAt(0).toUpperCase() + modeSelect.value.slice(1)}`);
      updatePreview();
      updateTokenBar();
    });
  }
}

/* ═══════════════════════════
   PROFILE TAB
═══════════════════════════ */
async function initProfileTab() {
  const profile  = await MemoryStorage.getProfile();
  const settings = await MemoryStorage.getSettings();

  $('#f-name').value        = profile.name        || '';
  $('#f-goal').value        = profile.goal        || '';
  $('#f-skills').value      = profile.skills      || '';
  $('#f-preferences').value = profile.preferences || '';
  $('#f-notes').value       = profile.customNotes || '';

  const tokenBar = $('#js-token-bar');
  if (tokenBar) tokenBar.style.display = settings.showTokenCount ? 'flex' : 'none';

  updateTokenBar();

  $$('.field__input').forEach(el => el.addEventListener('input', updateTokenBar));

  $('#js-save-profile').addEventListener('click', async () => {
    const data = {
      name:        $('#f-name').value.trim(),
      goal:        $('#f-goal').value.trim(),
      skills:      $('#f-skills').value.trim(),
      preferences: $('#f-preferences').value.trim(),
      customNotes: $('#f-notes').value.trim()
    };
    await MemoryStorage.saveProfile(data);
    updateTokenBar();
    updatePreview();

    const msg = $('#js-save-msg');
    msg.textContent = 'Saved ✓';
    msg.classList.add('visible');
    setTimeout(() => msg.classList.remove('visible'), 2000);
    showPopupToast('Profile saved ✓');
  });
}

/* ═══════════════════════════
   MEMORY PREVIEW
═══════════════════════════ */
async function updatePreview() {
  const box = $('#js-preview-box');
  if (!box || box.style.display === 'none') return;

  const settings = await MemoryStorage.getSettings();
  const preview = await MemoryStorage.buildMemoryString(settings.compactMode);
  box.textContent = preview || '(No memory data — fill in your profile or add notes)';
}

function initPreview() {
  const toggleBtn = $('#js-preview-toggle');
  const box = $('#js-preview-box');
  if (!toggleBtn || !box) return;

  toggleBtn.addEventListener('click', async () => {
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
    if (isHidden) await updatePreview();
  });
}

/* ═══════════════════════════
   TOKEN BAR
═══════════════════════════ */
let tokenBarDebounce = null;

async function updateTokenBar() {
  clearTimeout(tokenBarDebounce);
  tokenBarDebounce = setTimeout(async () => {
    const settings = await MemoryStorage.getSettings();
    const tokenBar = $('#js-token-bar');
    if (!tokenBar || !settings.showTokenCount) return;

    const profile = {
      name:        $('#f-name')?.value        || '',
      goal:        $('#f-goal')?.value        || '',
      skills:      $('#f-skills')?.value      || '',
      preferences: $('#f-preferences')?.value || '',
      customNotes: $('#f-notes')?.value       || ''
    };

    const items = await MemoryStorage.getItems();
    let textChunks = Object.values(profile).filter(Boolean);

    if (items.length > 0) {
      const pinned = items.filter(i => i.pinned);
      const unpinned = items.filter(i => !i.pinned);
      const limit = settings.compactMode ? 3 : 8;
      const selected = [...pinned, ...unpinned].slice(0, Math.max(limit, pinned.length));
      textChunks.push(...selected.map(i => i.text));
    }

    const text = textChunks.join(' ');
    const tokens = Tokenizer.estimate(text);
    const lv     = Tokenizer.level(tokens);
    const maxTokens = 800;
    const fillPc = maxTokens > 0 ? Math.min(100, (tokens / maxTokens) * 100) : 0;

    const valEl  = $('#js-token-value');
    const fillEl = $('#js-token-fill');

    if (valEl) {
      valEl.textContent = tokens > 0 ? Tokenizer.format(tokens) : '—';
      valEl.className   = `token-bar__value ${tokens > 0 ? 'level-' + lv : ''}`;
    }
    if (fillEl) {
      fillEl.style.width = `${fillPc}%`;
      fillEl.className   = `token-bar__fill ${tokens > 0 ? 'level-' + lv : ''}`;
    }
  }, 100);
}

/* ═══════════════════════════
   STATUS BADGE
═══════════════════════════ */
async function updateStatusBadge() {
  const settings = await MemoryStorage.getSettings();
  const badge    = $('#js-status-badge');
  if (!badge) return;

  if (settings.injectEnabled) {
    badge.classList.remove('inactive');
    $('.badge__label', badge).textContent = 'Active';
    badge.title = 'Memory injection is ON';
  } else {
    badge.classList.add('inactive');
    $('.badge__label', badge).textContent = 'Paused';
    badge.title = 'Memory injection is OFF';
  }
}

/* ═══════════════════════════
   SAVED TAB
═══════════════════════════ */
async function initSavedTab() {
  await renderItems();
  bindSavedTabEvents();
  initSearch();
  await initTagFilters();
}

/* ── Search ── */
function initSearch() {
  const input = $('#js-search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    currentSearchQuery = input.value.toLowerCase().trim();
    renderItems();
  });
}

/* ── Tag Filters ── */
async function initTagFilters() {
  await rebuildTagFilters();
}

async function rebuildTagFilters() {
  const container = $('#js-tag-filters');
  if (!container) return;

  const items = await MemoryStorage.getItems();
  const allTags = new Set();
  items.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(t => allTags.add(t));
    }
  });

  if (allTags.size === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = '';

  // "All" chip
  const allChip = document.createElement('button');
  allChip.className = `tag-chip ${currentTagFilter === 'all' ? 'tag-chip--active' : ''}`;
  allChip.dataset.tag = 'all';
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => {
    currentTagFilter = 'all';
    rebuildTagFilters();
    renderItems();
  });
  container.appendChild(allChip);

  // Tag chips
  for (const tag of allTags) {
    const chip = document.createElement('button');
    chip.className = `tag-chip ${currentTagFilter === tag ? 'tag-chip--active' : ''}`;
    chip.dataset.tag = tag;
    chip.textContent = tag;
    chip.addEventListener('click', () => {
      currentTagFilter = tag;
      rebuildTagFilters();
      renderItems();
    });
    container.appendChild(chip);
  }
}

/* ── Render Items ── */
async function renderItems() {
  let items  = await MemoryStorage.getItems();
  const list   = $('#js-item-list');
  const empty  = $('#js-empty-state');
  const footer = $('#js-list-footer');
  const countEl = $('#js-item-count');

  // Update item count
  if (countEl) {
    countEl.textContent = items.length > 0 ? items.length : '';
  }

  // Filter by search
  if (currentSearchQuery) {
    items = items.filter(i => i.text.toLowerCase().includes(currentSearchQuery));
  }

  // Filter by tag
  if (currentTagFilter !== 'all') {
    items = items.filter(i => i.tags && i.tags.includes(currentTagFilter));
  }

  list.innerHTML = '';
  if (items.length === 0) {
    empty.style.display  = 'block';
    footer.style.display = 'none';

    if (currentSearchQuery || currentTagFilter !== 'all') {
      empty.querySelector('.empty-state__text').innerHTML = 'No matching notes found.';
    } else {
      empty.querySelector('.empty-state__text').innerHTML = 'No saved notes yet.<br>Select text on any AI page or add one above.';
    }
    return;
  }
  empty.style.display  = 'none';
  footer.style.display = 'block';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `item-card${item.pinned ? ' item-card--pinned' : ''}`;
    li.dataset.itemId = item.id;
    li.draggable = true;
    li.innerHTML = buildItemHTML(item);
    list.appendChild(li);
    bindItemEvents(li, item);
    bindDragEvents(li);
  });

  updateTokenBar();
}

function buildItemHTML(item) {
  const date   = formatDate(item.timestamp);
  const source = item.source || 'manual';
  const text   = escapeHTML(item.text); // For display only
  const tagsHTML = (item.tags || []).map(t => `<span class="item-card__tag">${escapeHTML(t)}</span>`).join('');
  const pinIcon = item.pinned ? '📌' : '📍';
  const pinClass = item.pinned ? ' pinned' : '';

  return `
    <div class="item-card__text">${text}</div>
    <textarea class="item-card__edit-area" rows="3"></textarea>
    <div class="item-card__footer">
      <div class="item-card__meta">
        <span class="item-card__drag-handle" title="Drag to reorder">⋮⋮</span>
        <span class="item-card__source">${escapeHTML(source)}</span>
        ${tagsHTML}
        <span>${date}</span>
      </div>
      <div class="item-card__actions">
        <button class="icon-btn icon-btn--pin js-item-pin${pinClass}" title="${item.pinned ? 'Unpin' : 'Pin'}">${pinIcon}</button>
        <button class="icon-btn js-item-edit" title="Edit">✎</button>
        <button class="icon-btn js-item-save" title="Save edit" style="display:none">✓</button>
        <button class="icon-btn js-item-cancel" title="Cancel" style="display:none">✕</button>
        <button class="icon-btn icon-btn--danger js-item-delete" title="Delete">🗑</button>
      </div>
    </div>`;
}

function bindItemEvents(li, item) {
  const editBtn   = li.querySelector('.js-item-edit');
  const saveBtn   = li.querySelector('.js-item-save');
  const cancelBtn = li.querySelector('.js-item-cancel');
  const deleteBtn = li.querySelector('.js-item-delete');
  const pinBtn    = li.querySelector('.js-item-pin');
  const textarea  = li.querySelector('.item-card__edit-area');

  // FIX: Set textarea value to raw text (not HTML-escaped) to prevent entity stacking
  textarea.value = item.text;

  editBtn.addEventListener('click', () => {
    li.classList.add('item-card--editing');
    textarea.value = item.text; // Always reset to raw text
    textarea.focus();
    editBtn.style.display = 'none'; saveBtn.style.display = ''; cancelBtn.style.display = '';
  });

  cancelBtn.addEventListener('click', () => {
    li.classList.remove('item-card--editing');
    textarea.value = item.text;
    editBtn.style.display = ''; saveBtn.style.display = 'none'; cancelBtn.style.display = 'none';
  });

  saveBtn.addEventListener('click', async () => {
    const newText = textarea.value.trim();
    if (!newText) return;
    await MemoryStorage.updateItem(item.id, newText);
    item.text = newText; // Update local reference
    li.querySelector('.item-card__text').textContent = newText;
    li.classList.remove('item-card--editing');
    editBtn.style.display = ''; saveBtn.style.display = 'none'; cancelBtn.style.display = 'none';
    showPopupToast('Note updated');
    updateTokenBar();
    updatePreview();
  });

  deleteBtn.addEventListener('click', async () => {
    li.style.opacity = '0';
    li.style.transition = 'opacity 0.15s ease';
    setTimeout(async () => {
      await MemoryStorage.deleteItem(item.id);
      await renderItems();
      await rebuildTagFilters();
      updatePreview();
    }, 150);
  });

  pinBtn.addEventListener('click', async () => {
    item.pinned = !item.pinned;
    await MemoryStorage.updateItem(item.id, { pinned: item.pinned });
    await renderItems();
    showPopupToast(item.pinned ? 'Note pinned 📌' : 'Note unpinned');
    updateTokenBar();
    updatePreview();
  });
}

/* ── Drag & Drop Reorder ── */
let draggedItem = null;

function bindDragEvents(li) {
  li.addEventListener('dragstart', (e) => {
    draggedItem = li;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', li.dataset.itemId);
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    $$('.item-card.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedItem = null;
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem !== li) {
      li.classList.add('drag-over');
    }
  });

  li.addEventListener('dragleave', () => {
    li.classList.remove('drag-over');
  });

  li.addEventListener('drop', async (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    if (!draggedItem || draggedItem === li) return;

    const list = $('#js-item-list');
    const allCards = [...list.querySelectorAll('.item-card')];
    const fromIndex = allCards.indexOf(draggedItem);
    const toIndex = allCards.indexOf(li);

    if (fromIndex < toIndex) {
      list.insertBefore(draggedItem, li.nextSibling);
    } else {
      list.insertBefore(draggedItem, li);
    }

    // Save new order
    const orderedIds = [...list.querySelectorAll('.item-card')].map(el => el.dataset.itemId);
    await MemoryStorage.reorderItems(orderedIds);
    showPopupToast('Order updated');
  });
}

function bindSavedTabEvents() {
  const addBtn    = $('#js-add-item-btn');
  const addForm   = $('#js-add-item-form');
  const addSave   = $('#js-add-item-save');
  const addCancel = $('#js-add-item-cancel');
  const addText   = $('#js-add-item-text');
  const addTag    = $('#js-add-item-tag');
  const clearAll  = $('#js-clear-all');

  addBtn.addEventListener('click', () => {
    addForm.style.display = addForm.style.display === 'none' ? '' : 'none';
    if (addForm.style.display !== 'none') addText.focus();
  });

  addCancel.addEventListener('click', () => {
    addForm.style.display = 'none';
    addText.value = '';
    addTag.value = '';
  });

  addSave.addEventListener('click', async () => {
    const text = addText.value.trim();
    if (!text) return;

    const result = await MemoryStorage.addItem(text, 'manual');

    if (result?.duplicate) {
      showPopupToast('Already saved — duplicate detected');
      return;
    }

    // Add tag if provided
    const tag = addTag.value.trim().toLowerCase();
    if (tag && result?.id) {
      await MemoryStorage.updateItem(result.id, { tags: [tag] });
    }

    addText.value = ''; addTag.value = ''; addForm.style.display = 'none';
    await renderItems();
    await rebuildTagFilters();
    showPopupToast('Note saved ✓');
    updatePreview();
  });

  addText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addSave.click();
  });

  clearAll.addEventListener('click', async () => {
    if (!confirm('Clear all saved notes? This cannot be undone.')) return;
    await MemoryStorage.clearItems();
    await renderItems();
    await rebuildTagFilters();
    showPopupToast('All notes cleared');
    updatePreview();
  });
}

/* ═══════════════════════════
   SETTINGS TAB
═══════════════════════════ */
async function initSettingsTab() {
  const settings = await MemoryStorage.getSettings();

  $('#s-inject').checked     = settings.injectEnabled;
  $('#s-compact').checked    = settings.compactMode;
  $('#s-selection').checked  = settings.saveSelection;
  $('#s-autodetect').checked = settings.autoDetect;
  $('#s-tokens').checked     = settings.showTokenCount;

  // PRO toggles
  $('#s-token-saving').checked = settings.tokenSavingPrompt !== false;
  $('#s-focus').checked        = settings.focusMode === true;
  $('#s-indicator').checked    = settings.tokenIndicator !== false;

  // Platform toggles
  const platformIds = ['chatgpt', 'claude', 'gemini', 'perplexity', 'deepseek'];
  platformIds.forEach(p => {
    const toggle = $(`#p-${p}`);
    if (toggle) {
      toggle.checked = settings.platforms?.[p] !== false;
      updatePlatformDot(p, toggle.checked);
    }
  });

  // Settings checkboxes — auto-save
  $$('input[type="checkbox"]', $('#tab-settings')).forEach(cb => {
    cb.addEventListener('change', () => saveSettings());
  });

  // Export
  $('#js-export').addEventListener('click', async () => {
    const json = await MemoryStorage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ai-smart-memory-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showPopupToast('Memory exported ✓');
  });

  // Import
  $('#js-import').addEventListener('click', () => $('#js-import-file').click());
  $('#js-import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await MemoryStorage.importData(ev.target.result);
        showPopupToast('Memory imported ✓');
        await initProfileTab();
        await renderItems();
        await rebuildTagFilters();
        await updateStatusBadge();
        await initQuickControls(); // Sync QC after import
        updatePreview();
      } catch (err) {
        showPopupToast('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

function updatePlatformDot(platform, isOn) {
  const dot = $(`#dot-${platform}`);
  if (dot) {
    dot.classList.toggle('platform-dot--on', isOn);
    dot.classList.toggle('platform-dot--off', !isOn);
  }
}

async function saveSettings() {
  const platformIds = ['chatgpt', 'claude', 'gemini', 'perplexity', 'deepseek'];
  const platforms = {};
  platformIds.forEach(p => {
    const toggle = $(`#p-${p}`);
    if (toggle) {
      platforms[p] = toggle.checked;
      updatePlatformDot(p, toggle.checked);
    }
  });

  const currentSettings = await MemoryStorage.getSettings();

  const settings = {
    injectEnabled:     $('#s-inject').checked,
    compactMode:       $('#s-compact').checked,
    saveSelection:     $('#s-selection').checked,
    autoDetect:        $('#s-autodetect').checked,
    showTokenCount:    $('#s-tokens').checked,
    tokenSavingPrompt: $('#s-token-saving').checked,
    focusMode:         $('#s-focus').checked,
    tokenIndicator:    $('#s-indicator').checked,
    injectionMode:     currentSettings.injectionMode || 'normal',
    darkMode:          currentSettings.darkMode || 'system',
    platforms
  };

  await MemoryStorage.saveSettings(settings);
  await updateStatusBadge();
  await updateTokenBar();
  updatePreview();

  // Sync Quick Controls
  const qcInject = $('#qc-inject');
  const qcShort  = $('#qc-short');
  const qcMode   = $('#qc-mode');
  if (qcInject) qcInject.checked = settings.injectEnabled;
  if (qcShort)  qcShort.checked  = settings.tokenSavingPrompt;
  if (qcMode)   qcMode.value     = settings.compactMode ? 'compact' : settings.injectionMode;

  const tokenBar = $('#js-token-bar');
  if (tokenBar) tokenBar.style.display = settings.showTokenCount ? 'flex' : 'none';
}

/* ═══════════════════════════
   INIT
═══════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();
  initTabs();
  initCharCounters();
  initPreview();
  await Promise.all([
    initQuickControls(),
    initProfileTab(),
    initSavedTab(),
    initSettingsTab(),
    updateStatusBadge()
  ]);
});