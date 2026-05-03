/**
 * popup.js — v3.1.1 PRO
 * Drives all popup UI: profiles, modes, template, commands, settings, decay.
 */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

let popupToastTimeout = null;
function showPopupToast(msg, d = 2500) {
  const el = $('#js-popup-toast'); if (!el) return;
  el.textContent = msg; el.classList.add('visible');
  clearTimeout(popupToastTimeout);
  popupToastTimeout = setTimeout(() => el.classList.remove('visible'), d);
}
function escapeHTML(s) { const d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
function formatDate(ts) { if (!ts) return ''; return new Date(ts).toLocaleDateString(undefined, { month:'short', day:'numeric' }); }

let currentSearchQuery = '';
let currentTagFilter = 'all';

/* ═══════════════════════
   THEME
═══════════════════════ */
function getSystemTheme() { return window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'; }
function applyTheme(m) { document.documentElement.setAttribute('data-theme', m==='system' ? getSystemTheme() : m); }
async function initTheme() {
  const s = await MemoryStorage.getSettings();
  applyTheme(s.darkMode || 'system');
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', async () => {
    const st = await MemoryStorage.getSettings();
    if (st.darkMode === 'system') applyTheme('system');
  });
  $('#js-theme-toggle').addEventListener('click', async () => {
    const st = await MemoryStorage.getSettings();
    st.darkMode = { light:'dark', dark:'system', system:'light' }[st.darkMode] || 'dark';
    await MemoryStorage.saveSettings(st);
    applyTheme(st.darkMode);
    showPopupToast({ light:'Light mode', dark:'Dark mode', system:'System theme' }[st.darkMode]);
  });
}

/* ═══════════════════════
   TABS
═══════════════════════ */
function initTabs() {
  const tabs = $$('.tab'), panels = $$('.tab-panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.toggle('tab--active', x === t));
    panels.forEach(p => p.classList.toggle('tab-panel--active', p.id === `tab-${t.dataset.tab}`));
  }));
}

/* ═══════════════════════
   CHAR COUNTERS
═══════════════════════ */
function initCharCounters() {
  $$('.field__input').forEach(inp => {
    const c = $(`.field__counter[data-for="${inp.id}"]`); if (!c) return;
    const max = parseInt(inp.getAttribute('maxlength')) || 999;
    const upd = () => { c.textContent = `${inp.value.length}/${max}`; c.classList.toggle('near-limit', inp.value.length >= max*0.8); };
    inp.addEventListener('input', upd); upd();
  });
}

/* ═══════════════════════
   QUICK CONTROLS
═══════════════════════ */
async function initQuickControls() {
  const s = await MemoryStorage.getSettings();
  const inj = $('#qc-inject'); const sh = $('#qc-short'); const md = $('#qc-mode');
  if (inj) inj.checked = s.injectEnabled;
  if (sh) sh.checked = s.tokenSavingPrompt !== false;
  if (md) md.value = s.injectionMode || 'normal';
  if (inj) inj.addEventListener('change', async () => {
    const st = await MemoryStorage.getSettings(); st.injectEnabled = inj.checked;
    await MemoryStorage.saveSettings(st); const si = $('#s-inject'); if (si) si.checked = inj.checked;
    updateStatusBadge(); showPopupToast(st.injectEnabled ? 'Memory ON' : 'Memory OFF');
  });
  if (sh) sh.addEventListener('change', async () => {
    const st = await MemoryStorage.getSettings(); st.tokenSavingPrompt = sh.checked;
    await MemoryStorage.saveSettings(st); const si = $('#s-token-saving'); if (si) si.checked = sh.checked;
    showPopupToast(sh.checked ? 'Short answers ON' : 'Short answers OFF');
  });
  if (md) md.addEventListener('change', async () => {
    const st = await MemoryStorage.getSettings(); st.injectionMode = md.value; st.compactMode = md.value==='compact';
    await MemoryStorage.saveSettings(st); showPopupToast(`Mode: ${md.value}`); updatePreview(); updateTokenBar();
  });
}

/* ═══════════════════════
   PROFILES
═══════════════════════ */
async function initProfileSwitcher() {
  const sel = $('#js-profile-select');
  const profiles = await MemoryStorage.getProfiles();
  const settings = await MemoryStorage.getSettings();
  sel.innerHTML = '';
  for (const [key, p] of Object.entries(profiles)) {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = key.charAt(0).toUpperCase() + key.slice(1) + (p.name ? ` (${p.name})` : '');
    sel.appendChild(opt);
  }
  sel.value = settings.activeProfile || 'default';
  sel.addEventListener('change', async () => {
    await MemoryStorage.switchProfile(sel.value);
    await loadProfileForm(sel.value);
    showPopupToast(`Profile: ${sel.value}`); updatePreview(); updateTokenBar();
  });
  $('#js-profile-new').addEventListener('click', async () => {
    const n = prompt('New profile name:'); if (!n?.trim()) return;
    const key = await MemoryStorage.createProfile(n.trim());
    await initProfileSwitcher();
    sel.value = key; await MemoryStorage.switchProfile(key);
    await loadProfileForm(key); showPopupToast(`Created: ${n.trim()}`);
  });
  $('#js-profile-delete').addEventListener('click', async () => {
    const current = sel.value;
    if (current === 'default') { showPopupToast('Cannot delete default profile'); return; }
    if (!confirm(`Delete profile "${current}"?`)) return;
    await MemoryStorage.deleteProfile(current);
    await initProfileSwitcher(); await loadProfileForm('default');
    showPopupToast('Profile deleted');
  });
}

async function loadProfileForm(profileName) {
  const p = await MemoryStorage.getProfile(profileName);
  $('#f-name').value = p.name || '';
  $('#f-role').value = p.role || '';
  $('#f-goals').value = p.goals || p.goal || '';
  $('#f-skills').value = p.skills || '';
  $('#f-preferences').value = p.preferences || '';
  $('#f-notes').value = p.customNotes || '';
  initCharCounters(); updateTokenBar();
}

async function initProfileTab() {
  await initProfileSwitcher();
  const settings = await MemoryStorage.getSettings();
  await loadProfileForm(settings.activeProfile || 'default');
  const tokenBar = $('#js-token-bar');
  if (tokenBar) tokenBar.style.display = settings.showTokenCount !== false ? 'flex' : 'none';
  $$('.field__input', $('#tab-profile')).forEach(el => el.addEventListener('input', updateTokenBar));
  $('#js-save-profile').addEventListener('click', async () => {
    const data = {
      name: $('#f-name').value.trim(), role: $('#f-role').value.trim(),
      goals: $('#f-goals').value.trim(), skills: $('#f-skills').value.trim(),
      preferences: $('#f-preferences').value.trim(), customNotes: $('#f-notes').value.trim()
    };
    await MemoryStorage.saveProfile(data);
    updateTokenBar(); updatePreview();
    const msg = $('#js-save-msg'); msg.textContent = 'Saved ✓'; msg.classList.add('visible');
    setTimeout(() => msg.classList.remove('visible'), 2000); showPopupToast('Profile saved ✓');
  });
}

/* ═══════════════════════
   PREVIEW
═══════════════════════ */
async function updatePreview() {
  const box = $('#js-preview-box');
  if (!box || box.style.display === 'none') return;
  const settings = await MemoryStorage.getSettings();
  const preview = await MemoryStorage.buildMemoryString(settings.compactMode);
  box.textContent = preview || '(No memory data)';
}
function initPreview() {
  const btn = $('#js-preview-toggle'); const box = $('#js-preview-box');
  if (!btn || !box) return;
  btn.addEventListener('click', async () => {
    const h = box.style.display === 'none';
    box.style.display = h ? 'block' : 'none'; btn.textContent = h ? 'Hide' : 'Show';
    if (h) await updatePreview();
  });
}

/* ═══════════════════════
   TOKEN BAR
═══════════════════════ */
let tokenBarDebounce = null;
async function updateTokenBar() {
  clearTimeout(tokenBarDebounce);
  tokenBarDebounce = setTimeout(async () => {
    const settings = await MemoryStorage.getSettings();
    if (!settings.showTokenCount && settings.showTokenCount !== undefined) return;
    const profile = { name:$('#f-name')?.value||'', role:$('#f-role')?.value||'', goals:$('#f-goals')?.value||'', skills:$('#f-skills')?.value||'', preferences:$('#f-preferences')?.value||'', customNotes:$('#f-notes')?.value||'' };
    const items = await MemoryStorage.getItems();
    let chunks = Object.values(profile).filter(Boolean);
    if (items.length > 0) {
      const en = items.filter(i => i.enabled !== false);
      const pinned = en.filter(i => i.pinned);
      const unpinned = en.filter(i => !i.pinned);
      const sel = [...pinned, ...unpinned].slice(0, Math.max(8, pinned.length));
      chunks.push(...sel.map(i => i.text));
    }
    const tokens = typeof Tokenizer !== 'undefined' ? Tokenizer.estimate(chunks.join(' ')) : 0;
    const maxT = 800; const pct = Math.min(100, (tokens/maxT)*100);
    const valEl = $('#js-token-value'); const fillEl = $('#js-token-fill');
    if (valEl) valEl.textContent = tokens > 0 ? (typeof Tokenizer !== 'undefined' ? Tokenizer.format(tokens) : `~${tokens}`) : '—';
    if (fillEl) { fillEl.style.width = `${pct}%`; fillEl.className = `token-bar__fill ${tokens > 0 ? 'level-' + (tokens<200?'low':tokens<500?'medium':'high') : ''}`; }
  }, 100);
}

/* ═══════════════════════
   STATUS
═══════════════════════ */
async function updateStatusBadge() {
  const s = await MemoryStorage.getSettings();
  const badge = $('#js-status-badge'); if (!badge) return;
  badge.classList.toggle('inactive', !s.injectEnabled);
  $('.badge__label', badge).textContent = s.injectEnabled ? 'Active' : 'Paused';
}

/* ═══════════════════════
   SAVED TAB
═══════════════════════ */
async function initSavedTab() {
  await renderItems(); bindSavedTabEvents(); initSearch(); await initTagFilters();
  await checkDecay();
}
function initSearch() {
  const inp = $('#js-search-input'); if (!inp) return;
  inp.addEventListener('input', () => { currentSearchQuery = inp.value.toLowerCase().trim(); renderItems(); });
}
async function initTagFilters() { await rebuildTagFilters(); }
async function rebuildTagFilters() {
  const c = $('#js-tag-filters'); if (!c) return;
  const items = await MemoryStorage.getItems();
  const tags = new Set(); items.forEach(i => (i.tags||[]).forEach(t => tags.add(t)));
  if (tags.size === 0) { c.style.display = 'none'; return; }
  c.style.display = 'flex'; c.innerHTML = '';
  const mk = (tag, label) => {
    const b = document.createElement('button');
    b.className = `tag-chip ${currentTagFilter===tag?'tag-chip--active':''}`;
    b.textContent = label; b.addEventListener('click', () => { currentTagFilter = tag; rebuildTagFilters(); renderItems(); });
    c.appendChild(b);
  };
  mk('all', 'All'); tags.forEach(t => mk(t, t));
}

async function renderItems() {
  let items = await MemoryStorage.getItems();
  const list = $('#js-item-list'); const empty = $('#js-empty-state');
  const footer = $('#js-list-footer'); const countEl = $('#js-item-count');
  if (countEl) countEl.textContent = items.length > 0 ? items.length : '';
  if (currentSearchQuery) items = items.filter(i => i.text.toLowerCase().includes(currentSearchQuery));
  if (currentTagFilter !== 'all') items = items.filter(i => i.tags?.includes(currentTagFilter));
  list.innerHTML = '';
  if (items.length === 0) {
    empty.style.display = 'block'; footer.style.display = 'none';
    empty.querySelector('.empty-state__text').innerHTML = currentSearchQuery || currentTagFilter !== 'all' ? 'No matching notes.' : 'No saved notes yet.<br>Select text on any AI page or add one above.';
    return;
  }
  empty.style.display = 'none'; footer.style.display = 'block';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `item-card${item.pinned?' item-card--pinned':''}${item.enabled===false?' item-card--disabled':''}`;
    li.dataset.itemId = item.id; li.draggable = true;
    li.innerHTML = buildItemHTML(item);
    list.appendChild(li); bindItemEvents(li, item); bindDragEvents(li);
  });
  updateTokenBar();
}

function buildItemHTML(item) {
  const prioClass = `priority-dot priority-dot--${item.priority||'medium'}`;
  const tagsH = (item.tags||[]).map(t => `<span class="item-card__tag">${escapeHTML(t)}</span>`).join('');
  const enabledIcon = item.enabled !== false ? '✅' : '⬜';
  return `
    <div class="item-card__header">
      <span class="${prioClass}" title="${item.priority||'medium'} priority"></span>
      <div class="item-card__text">${escapeHTML(item.text)}</div>
    </div>
    <textarea class="item-card__edit-area" rows="3"></textarea>
    <div class="item-card__footer">
      <div class="item-card__meta">
        <span class="item-card__drag-handle" title="Drag">⋮⋮</span>
        <span class="item-card__source">${escapeHTML(item.source||'manual')}</span>${tagsH}
        <span>${formatDate(item.lastUsed||item.timestamp)}</span>
      </div>
      <div class="item-card__actions">
        <button class="icon-btn js-item-enable" title="Toggle">${enabledIcon}</button>
        <button class="icon-btn icon-btn--pin js-item-pin${item.pinned?' pinned':''}" title="${item.pinned?'Unpin':'Pin'}">${item.pinned?'📌':'📍'}</button>
        <select class="priority-select-mini js-item-priority">
          <option value="high"${item.priority==='high'?' selected':''}>High</option>
          <option value="medium"${item.priority==='medium'||!item.priority?' selected':''}>Med</option>
          <option value="low"${item.priority==='low'?' selected':''}>Low</option>
        </select>
        <button class="icon-btn js-item-edit" title="Edit">✎</button>
        <button class="icon-btn js-item-save" title="Save" style="display:none">✓</button>
        <button class="icon-btn js-item-cancel" title="Cancel" style="display:none">✕</button>
        <button class="icon-btn icon-btn--danger js-item-delete" title="Delete">🗑</button>
      </div>
    </div>`;
}

function bindItemEvents(li, item) {
  const editBtn = li.querySelector('.js-item-edit'), saveBtn = li.querySelector('.js-item-save');
  const cancelBtn = li.querySelector('.js-item-cancel'), deleteBtn = li.querySelector('.js-item-delete');
  const pinBtn = li.querySelector('.js-item-pin'), textarea = li.querySelector('.item-card__edit-area');
  const enableBtn = li.querySelector('.js-item-enable'), prioSel = li.querySelector('.js-item-priority');
  textarea.value = item.text;

  editBtn.addEventListener('click', () => {
    li.classList.add('item-card--editing'); textarea.value = item.text; textarea.focus();
    editBtn.style.display='none'; saveBtn.style.display=''; cancelBtn.style.display='';
  });
  cancelBtn.addEventListener('click', () => {
    li.classList.remove('item-card--editing'); textarea.value = item.text;
    editBtn.style.display=''; saveBtn.style.display='none'; cancelBtn.style.display='none';
  });
  saveBtn.addEventListener('click', async () => {
    const t = textarea.value.trim(); if (!t) return;
    await MemoryStorage.updateItem(item.id, t); item.text = t;
    li.querySelector('.item-card__text').textContent = t;
    li.classList.remove('item-card--editing');
    editBtn.style.display=''; saveBtn.style.display='none'; cancelBtn.style.display='none';
    showPopupToast('Updated'); updateTokenBar(); updatePreview();
  });
  deleteBtn.addEventListener('click', async () => {
    li.style.opacity='0'; li.style.transition='opacity 0.15s';
    setTimeout(async () => { await MemoryStorage.deleteItem(item.id); await renderItems(); await rebuildTagFilters(); updatePreview(); }, 150);
  });
  pinBtn.addEventListener('click', async () => {
    item.pinned = !item.pinned; await MemoryStorage.updateItem(item.id, { pinned: item.pinned });
    await renderItems(); showPopupToast(item.pinned ? 'Pinned 📌' : 'Unpinned'); updatePreview();
  });
  enableBtn.addEventListener('click', async () => {
    item.enabled = item.enabled === false ? true : false;
    await MemoryStorage.updateItem(item.id, { enabled: item.enabled });
    await renderItems(); showPopupToast(item.enabled ? 'Enabled' : 'Disabled');
  });
  prioSel.addEventListener('change', async () => {
    item.priority = prioSel.value;
    await MemoryStorage.updateItem(item.id, { priority: item.priority });
    await renderItems(); showPopupToast(`Priority: ${item.priority}`);
  });
}

/* ── Drag ── */
let draggedItem = null;
function bindDragEvents(li) {
  li.addEventListener('dragstart', e => { draggedItem = li; li.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
  li.addEventListener('dragend', () => { li.classList.remove('dragging'); $$('.item-card.drag-over').forEach(el => el.classList.remove('drag-over')); draggedItem = null; });
  li.addEventListener('dragover', e => { e.preventDefault(); if (draggedItem && draggedItem !== li) li.classList.add('drag-over'); });
  li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
  li.addEventListener('drop', async e => {
    e.preventDefault(); li.classList.remove('drag-over');
    if (!draggedItem || draggedItem === li) return;
    const list = $('#js-item-list');
    const cards = [...list.querySelectorAll('.item-card')];
    if (cards.indexOf(draggedItem) < cards.indexOf(li)) list.insertBefore(draggedItem, li.nextSibling);
    else list.insertBefore(draggedItem, li);
    const ids = [...list.querySelectorAll('.item-card')].map(el => el.dataset.itemId);
    await MemoryStorage.reorderItems(ids); showPopupToast('Reordered');
  });
}

function bindSavedTabEvents() {
  const addBtn = $('#js-add-item-btn'), form = $('#js-add-item-form');
  const saveBtn = $('#js-add-item-save'), cancelBtn = $('#js-add-item-cancel');
  const textEl = $('#js-add-item-text'), tagEl = $('#js-add-item-tag');
  const prioEl = $('#js-add-item-priority'), clearBtn = $('#js-clear-all');

  addBtn.addEventListener('click', () => { form.style.display = form.style.display==='none'?'':'none'; if (form.style.display!=='none') textEl.focus(); });
  cancelBtn.addEventListener('click', () => { form.style.display='none'; textEl.value=''; tagEl.value=''; });
  saveBtn.addEventListener('click', async () => {
    const text = textEl.value.trim(); if (!text) return;
    // Security check
    if (typeof SecurityGuard !== 'undefined') {
      const s = await MemoryStorage.getSettings();
      if (s.security?.detectSensitive) {
        const scan = SecurityGuard.scan(text);
        if (scan.hasSensitive) {
          if (!confirm(`⚠ Sensitive data detected: ${scan.matches.map(m=>m.type).join(', ')}. Save anyway?`)) return;
        }
      }
    }
    const result = await MemoryStorage.addItem(text, 'manual');
    if (result?.duplicate) { showPopupToast('Duplicate detected'); return; }
    const tag = tagEl.value.trim().toLowerCase();
    if (tag && result?.id) await MemoryStorage.updateItem(result.id, { tags: [tag] });
    if (prioEl.value !== 'medium' && result?.id) await MemoryStorage.updateItem(result.id, { priority: prioEl.value });
    textEl.value=''; tagEl.value=''; form.style.display='none';
    await renderItems(); await rebuildTagFilters(); showPopupToast('Saved ✓'); updatePreview();
  });
  textEl.addEventListener('keydown', e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) saveBtn.click(); });
  clearBtn.addEventListener('click', async () => {
    if (!confirm('Clear all notes?')) return;
    await MemoryStorage.clearItems(); await renderItems(); await rebuildTagFilters(); showPopupToast('Cleared'); updatePreview();
  });
}

async function checkDecay() {
  try {
    const candidates = await MemoryStorage.getDecayCandidates();
    const banner = $('#js-decay-banner');
    if (candidates.length > 0 && banner) {
      banner.style.display = 'flex';
      banner.querySelector('span').innerHTML = `💤 ${candidates.length} memory note${candidates.length>1?'s':''} unused. <button class="btn-link" id="js-decay-review">Review</button>`;
      setTimeout(() => {
        const rb = $('#js-decay-review');
        if (rb) rb.addEventListener('click', async () => {
          if (confirm(`Remove ${candidates.length} unused memories?`)) {
            await MemoryStorage.bulkDeleteItems(candidates.map(c => c.id));
            await renderItems(); showPopupToast('Unused memories removed');
            banner.style.display = 'none';
          }
        });
      }, 0);
    }
  } catch {}
}

/* ═══════════════════════
   ROLES TAB
═══════════════════════ */
let rolesTabBound = false;
async function initRolesTab() {
  await renderRoles();
  await refreshActiveRoleSelector();
  await renderCustomCommands();

  // Bind event listeners only once
  if (rolesTabBound) return;
  rolesTabBound = true;

  $('#js-role-save').addEventListener('click', async () => {
    const name = $('#js-role-name').value.trim();
    const inst = $('#js-role-instruction').value.trim();
    if (!name || !inst) { showPopupToast('Name and instruction required'); return; }
    const key = name.toLowerCase().replace(/\s+/g, '_');
    const roles = await MemoryStorage.getRoles();
    roles[key] = { name, instruction: inst, builtin: false };
    await MemoryStorage.saveRoles(roles);
    $('#js-role-name').value = ''; $('#js-role-instruction').value = '';
    await renderRoles(); await refreshActiveRoleSelector();
    showPopupToast(`Role "${name}" created`);
  });

  // Active role selector
  const activeSel = $('#js-active-role');
  activeSel.addEventListener('change', async () => {
    await MemoryStorage.setActiveRole(activeSel.value);
    showPopupToast(activeSel.value ? `Active: ${activeSel.value}` : 'Default mode');
  });

  // Custom commands
  $('#js-cmd-save').addEventListener('click', async () => {
    const name = $('#js-cmd-name').value.trim();
    const desc = $('#js-cmd-desc').value.trim();
    if (!name) { showPopupToast('Command name required'); return; }
    const cmd = {
      name: name.startsWith('/') ? name : `/${name}`,
      description: desc || 'Custom command',
      enabled: true,
      actions: {
        disableMemory: $('#js-cmd-disable-mem').checked,
        skipSystemPrompt: $('#js-cmd-skip-sys').checked,
        taskMode: $('#js-cmd-role').value || undefined, // keep taskMode key for backwards compatibility or change to role
        instruction: $('#js-cmd-instruction').value.trim() || undefined
      }
    };
    const cmds = await MemoryStorage.getCustomCommands();
    cmds.push(cmd); await MemoryStorage.saveCustomCommands(cmds);
    $('#js-cmd-name').value=''; $('#js-cmd-desc').value=''; $('#js-cmd-instruction').value='';
    $('#js-cmd-disable-mem').checked=false; $('#js-cmd-skip-sys').checked=false; $('#js-cmd-role').value='';
    await renderCustomCommands(); showPopupToast(`Command ${cmd.name} added`);
  });
}

async function refreshActiveRoleSelector() {
  const activeSel = $('#js-active-role');
  const roles = await MemoryStorage.getRoles();
  const settings = await MemoryStorage.getSettings();
  activeSel.innerHTML = '<option value="">None (Default)</option>';
  for (const [key, m] of Object.entries(roles)) {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = m.name || key;
    activeSel.appendChild(opt);
  }
  activeSel.value = settings.activeRole || '';
}

async function renderRoles() {
  const roles = await MemoryStorage.getRoles();
  const list = $('#js-role-list');
  list.innerHTML = '';
  for (const [key, m] of Object.entries(roles)) {
    const card = document.createElement('div');
    card.className = 'mode-card';
    card.innerHTML = `
      <div class="mode-card__header">
        <span class="mode-card__name">${escapeHTML(m.name||key)}${m.builtin?' <span class="mode-card__badge">Built-in</span>':''}</span>
        <div class="mode-card__actions">
          ${!m.builtin ? `<button class="icon-btn icon-btn--danger js-mode-delete" data-key="${key}">🗑</button>` : ''}
        </div>
      </div>
      <div class="mode-card__text">${escapeHTML(m.instruction)}</div>
    `;
    list.appendChild(card);
  }
  // Bind delete
  $$('.js-mode-delete', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      const roles = await MemoryStorage.getRoles();
      delete roles[key]; await MemoryStorage.saveRoles(roles);
      await renderRoles(); showPopupToast('Role deleted');
      const s = await MemoryStorage.getSettings();
      if (s.activeRole === key) { s.activeRole = ''; await MemoryStorage.saveSettings(s); }
      await refreshActiveRoleSelector();
    });
  });
}

async function renderCustomCommands() {
  const cmds = await MemoryStorage.getCustomCommands();
  const list = $('#js-cmd-list');
  list.innerHTML = '';
  if (cmds.length === 0) { list.innerHTML = '<div class="empty-mini">No custom commands yet.</div>'; return; }
  cmds.forEach((cmd, i) => {
    const row = document.createElement('div');
    row.className = 'cmd-row';
    const actions = [];
    if (cmd.actions?.disableMemory) actions.push('No memory');
    if (cmd.actions?.taskMode) actions.push(`Mode: ${cmd.actions.taskMode}`);
    if (cmd.actions?.instruction) actions.push('Custom instruction');
    row.innerHTML = `
      <div><code>${escapeHTML(cmd.name)}</code> <span class="cmd-row__desc">${escapeHTML(cmd.description||'')}</span></div>
      <div class="cmd-row__meta">${actions.join(' · ') || 'No actions'}</div>
      <button class="icon-btn icon-btn--danger js-cmd-delete" data-idx="${i}">🗑</button>
    `;
    list.appendChild(row);
  });
  $$('.js-cmd-delete', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const cmds = await MemoryStorage.getCustomCommands();
      cmds.splice(parseInt(btn.dataset.idx), 1);
      await MemoryStorage.saveCustomCommands(cmds);
      await renderCustomCommands(); showPopupToast('Command deleted');
    });
  });
}

/* ═══════════════════════
   SETTINGS TAB
═══════════════════════ */
async function initSettingsTab() {
  const s = await MemoryStorage.getSettings();
  const tpl = await MemoryStorage.getTemplate();

  // Toggles
  $('#s-inject').checked = s.injectEnabled;
  $('#s-token-saving').checked = s.tokenSavingPrompt !== false;
  $('#s-selection').checked = s.saveSelection;
  $('#s-autodetect').checked = s.autoDetect;
  $('#s-security').checked = s.security?.detectSensitive !== false;
  $('#s-panel').checked = s.floatingPanel?.visible !== false;
  $('#s-decay').checked = s.decay?.enabled !== false;
  $('#s-decay-days').value = s.decay?.days || 7;
  $('#s-autoswitch').checked = s.autoSwitch?.enabled || false;
  $('#s-inj-delay').value = s.advanced?.injectionDelay || 0;
  $('#s-max-mem').value = s.advanced?.maxMemories || 8;
  $('#s-debug').checked = s.advanced?.debugMode || false;

  $('#s-inj-pos').value = s.injectionPosition || 'TOP';
  $('#s-role-mode').value = s.roleInjectionMode || 'AUTO';
  $('#s-persist-role').checked = s.persistentRole !== false;
  $('#s-preview-send').checked = s.previewBeforeSend || false;
  $('#s-style-toggle').checked = s.enableStyleBlock !== false;
  $('#s-style-instr').value = s.styleInstructions || '* Be direct\n* Avoid unnecessary explanation\n* Focus on quality output';

  // Template
  $('#js-template-format').value = tpl.format;
  $('#tpl-name').checked = tpl.sections?.name !== false;
  $('#tpl-role').checked = tpl.sections?.role !== false;
  $('#tpl-goals').checked = tpl.sections?.goals !== false;
  $('#tpl-memory').checked = tpl.sections?.memory !== false;
  $('#tpl-instruction').checked = tpl.sections?.instruction !== false;

  $('#js-template-save').addEventListener('click', async () => {
    const newTpl = {
      format: $('#js-template-format').value,
      sections: {
        name: $('#tpl-name').checked, role: $('#tpl-role').checked, goals: $('#tpl-goals').checked,
        memory: $('#tpl-memory').checked, instruction: $('#tpl-instruction').checked
      }
    };
    await MemoryStorage.saveTemplate(newTpl); showPopupToast('Template saved ✓');
  });

  // Response control
  $('#s-response-ctrl').checked = s.responseControl?.enabled !== false;
  $('#js-response-text').value = s.responseControl?.text || '';

  // Platform toggles
  ['chatgpt','claude','gemini','perplexity','deepseek'].forEach(p => {
    const t = $(`#p-${p}`); if (t) { t.checked = s.platforms?.[p] !== false; updatePlatformDot(p, t.checked); }
  });

  // Auto-switch mappings
  await renderAutoSwitchMappings();
  $('#js-as-add').addEventListener('click', async () => {
    const domain = $('#js-as-domain').value.trim();
    const profile = $('#js-as-profile').value;
    if (!domain || !profile) { showPopupToast('Domain and profile required'); return; }
    const st = await MemoryStorage.getSettings();
    if (!st.autoSwitch) st.autoSwitch = { enabled: true, mappings: {} };
    st.autoSwitch.mappings[domain] = profile;
    await MemoryStorage.saveSettings(st);
    $('#js-as-domain').value = '';
    await renderAutoSwitchMappings(); showPopupToast('Mapping added');
  });

  // Auto-save on change
  $$('input[type="checkbox"]', $('#tab-settings')).forEach(cb => cb.addEventListener('change', () => saveAllSettings()));
  $$('input[type="number"]', $('#tab-settings')).forEach(inp => inp.addEventListener('change', () => saveAllSettings()));
  $$('select', $('#tab-settings')).forEach(sel => sel.addEventListener('change', () => saveAllSettings()));
  $('#js-response-text').addEventListener('blur', () => saveAllSettings());
  $('#s-style-instr').addEventListener('blur', () => saveAllSettings());

  // Export/Import
  $('#js-export').addEventListener('click', async () => {
    const json = await MemoryStorage.exportData();
    const blob = new Blob([json], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `promptsync-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href); showPopupToast('Exported ✓');
  });
  $('#js-import').addEventListener('click', () => $('#js-import-file').click());
  $('#js-import-file').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        await MemoryStorage.importData(ev.target.result);
        showPopupToast('Imported ✓');
        location.reload();
      } catch (err) { showPopupToast('Import failed: ' + err.message); }
    };
    reader.readAsText(file); e.target.value = '';
  });
}

async function renderAutoSwitchMappings() {
  const c = $('#js-autoswitch-mappings'); c.innerHTML = '';
  const s = await MemoryStorage.getSettings();
  const mappings = s.autoSwitch?.mappings || {};
  const profiles = await MemoryStorage.getProfiles();

  // Populate profile select
  const profSel = $('#js-as-profile');
  profSel.innerHTML = '<option value="">Select profile</option>';
  for (const key of Object.keys(profiles)) {
    const opt = document.createElement('option'); opt.value = key; opt.textContent = key;
    profSel.appendChild(opt);
  }

  for (const [domain, profile] of Object.entries(mappings)) {
    const row = document.createElement('div');
    row.className = 'autoswitch-row';
    row.innerHTML = `<span>${escapeHTML(domain)} → <strong>${escapeHTML(profile)}</strong></span>
      <button class="icon-btn icon-btn--danger js-as-delete" data-domain="${escapeHTML(domain)}">✕</button>`;
    c.appendChild(row);
  }
  $$('.js-as-delete', c).forEach(btn => {
    btn.addEventListener('click', async () => {
      const st = await MemoryStorage.getSettings();
      delete st.autoSwitch.mappings[btn.dataset.domain];
      await MemoryStorage.saveSettings(st);
      await renderAutoSwitchMappings(); showPopupToast('Mapping removed');
    });
  });
}

function updatePlatformDot(p, on) {
  const d = $(`#dot-${p}`); if (d) { d.classList.toggle('platform-dot--on', on); d.classList.toggle('platform-dot--off', !on); }
}

async function saveAllSettings() {
  const platforms = {};
  ['chatgpt','claude','gemini','perplexity','deepseek'].forEach(p => {
    const t = $(`#p-${p}`); if (t) { platforms[p] = t.checked; updatePlatformDot(p, t.checked); }
  });
  const current = await MemoryStorage.getSettings();
  const settings = {
    ...current,
    injectEnabled: $('#s-inject').checked,
    tokenSavingPrompt: $('#s-token-saving').checked,
    saveSelection: $('#s-selection').checked,
    autoDetect: $('#s-autodetect').checked,
    platforms,
    security: { detectSensitive: $('#s-security').checked },
    floatingPanel: { ...current.floatingPanel, visible: $('#s-panel').checked },
    decay: { enabled: $('#s-decay').checked, days: parseInt($('#s-decay-days').value) || 7 },
    autoSwitch: { ...current.autoSwitch, enabled: $('#s-autoswitch').checked },
    injectionPosition: $('#s-inj-pos').value,
    roleInjectionMode: $('#s-role-mode').value,
    persistentRole: $('#s-persist-role').checked,
    previewBeforeSend: $('#s-preview-send').checked,
    enableStyleBlock: $('#s-style-toggle').checked,
    styleInstructions: $('#s-style-instr').value,
    responseControl: { ...current.responseControl, enabled: $('#s-response-ctrl').checked, text: $('#js-response-text').value },
    advanced: {
      injectionDelay: parseInt($('#s-inj-delay').value) || 0,
      maxMemories: parseInt($('#s-max-mem').value) || 8,
      debugMode: $('#s-debug').checked
    }
  };
  await MemoryStorage.saveSettings(settings);
  updateStatusBadge();
  // Sync quick controls
  const qi = $('#qc-inject'); if (qi) qi.checked = settings.injectEnabled;
  const qs = $('#qc-short'); if (qs) qs.checked = settings.tokenSavingPrompt;
}

/* ═══════════════════════
   HELP TAB
═══════════════════════ */
async function initHelpTab() {
  // Build command list
  const list = $('#js-help-commands');
  if (list && typeof CommandParser !== 'undefined') {
    try { await CommandParser.loadCustomCommands(); } catch {}
    const cmds = CommandParser.getCommandList();
    list.innerHTML = cmds.map(c =>
      `<div class="cmd-reference__item"><code>${escapeHTML(c.command)}</code><span>${escapeHTML(c.description)}${c.custom?' (custom)':''}</span></div>`
    ).join('');
  }
}

/* ═══════════════════════
   INIT
═══════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();
  initTabs();
  initCharCounters();
  initPreview();
  await Promise.all([
    initQuickControls(), initProfileTab(), initSavedTab(),
    initRolesTab(), initSettingsTab(), initHelpTab(), updateStatusBadge()
  ]);
});