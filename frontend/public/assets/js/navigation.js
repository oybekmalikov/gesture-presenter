/* ================================================================
   NAVIGATION (Dynamic SPA Loader)
   ================================================================ */

const pageCache = {};

// Joriy tildagi tarjimani qaytaradi; topilmasa — kalitni qaytaradi
function t(key) {
  const dict = (typeof _translationsCache !== 'undefined' && _translationsCache[currentLang])
    || (typeof DICTIONARY !== 'undefined' && DICTIONARY[currentLang] && DICTIONARY[currentLang].strings)
    || {};
  return dict[key] || key;
}

function cleanupCurrentPage() {
  try {
    if (window.destroySSZCameras) window.destroySSZCameras();
    if (window.destroySSZDashboard) window.destroySSZDashboard();
    if (window.destroySSZAnalytics) window.destroySSZAnalytics();
    if (window.destroySSZIncidents) window.destroySSZIncidents();
    if (window.destroySSZReports) window.destroySSZReports();
  } catch (err) {
    console.warn('Cleanup warning:', err);
  }
}

async function switchPage(id, e) {
  if (e) e.preventDefault();

  // 0. Cleanup previous page lifecycle
  cleanupCurrentPage();

  // 1. Update active states in sidebar
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('nav-' + id);
  if (nav) nav.classList.add('active');

  // 2. Fetch HTML fragment
  const container = document.getElementById('app-content');

  if (!pageCache[id]) {
    try {
      const res = await fetch(`pages/${id}.html`);
      if (!res.ok) throw new Error('Page not found');
      pageCache[id] = await res.text();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div style="padding:40px;color:var(--red)">${t('Failed to load module')}: ${id}</div>`;
      return;
    }
  }

  // 3. Inject HTML
  container.innerHTML = pageCache[id];

  const injectedPage = container.querySelector('.page');
  if (injectedPage) {
    injectedPage.classList.add('active');
  }

  // 4. Re-apply translations for static HTML before dynamic content loads
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }

  // 5. Trigger page-specific logic (async API calls inside)
  initPageLogic(id);

  // 6. Re-apply translations once more after a short delay so dynamically
  //    rendered API content (tables, pills, labels) also gets translated.
  //    The t() helper already covers render functions; this catches anything else.
  setTimeout(() => {
    if (typeof applyTranslations === 'function') applyTranslations();
  }, 400);
}

async function _authFetch(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 401) { if (document.documentElement.style.visibility !== 'hidden') logout(); return null; }
  if (!res.ok) return null;
  return res.json();
}

function _typeLabel(type) {
  const map = {
    no_helmet: 'No Helmet', no_vest: 'No Vest', zone_violation: 'Zone Violation',
    fire: 'Fire', smoke: 'Smoke', unknown_person: 'Unknown Person', restricted_area: 'Restricted Area'
  };
  return t(map[type] || type);
}

function _typeTag(type) {
  const colors = {
    no_helmet: 't-red', no_vest: 't-red', fire: 't-orange', smoke: 't-amber',
    zone_violation: 't-amber', unknown_person: 't-blue', restricted_area: 't-amber'
  };
  return colors[type] || 't-slate';
}

function _severityClass(sev) {
  return { high: 'sev-h', medium: 'sev-m', low: 'sev-l' }[sev] || 'sev-l';
}

function _statusPill(status) {
  const map = { pending: 'p-amber', confirmed: 'p-green', dismissed: 'p-red' };
  const labels = { pending: 'Pending', confirmed: 'Confirmed', dismissed: 'Dismissed' };
  return `<span class="pill ${map[status] || 'p-slate'}">${t(labels[status] || status)}</span>`;
}

function _fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function _renderIncidentsTable(incidents) {
  if (!incidents || !incidents.length) {
    return `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">${t('No incidents found')}</td></tr>`;
  }
  return incidents.map(inc => {
    const actionBtns = inc.status === 'pending'
      ? `<button class="act-btn ab-confirm" onclick="confirmInc(this)">${t('Confirm')}</button><button class="act-btn ab-dismiss" onclick="dismissInc(this)">${t('False Alarm')}</button>`
      : `<button class="act-btn ab-dismiss">${t('View')}</button>`;
    const opCell = inc.operator_id
      ? `<span style="color:var(--blue);font-weight:600">✓</span>`
      : `<span style="color:var(--text-dim)">—</span>`;
    const conf = Math.round((inc.ai_confidence || 0) * 100);
    const confColor = conf >= 85 ? 'var(--red)' : conf >= 70 ? 'var(--amber)' : 'var(--blue)';
    return `<tr data-incident-id="${inc.id}">
      <td class="mono">${_esc(inc.incident_ref || '#' + inc.id)}</td>
      <td><span class="tag ${_typeTag(inc.type)}">${_typeLabel(inc.type)}</span></td>
      <td class="mono">${_esc(inc.camera_id)}</td>
      <td>${_esc(inc.location || '—')}</td>
      <td class="mono" style="color:var(--text-muted)">${_fmtTime(inc.detected_at)}</td>
      <td>${conf}%<div class="conf-strip"><div class="conf-fill" style="width:${conf}%;background:${confColor}"></div></div></td>
      <td>${_statusPill(inc.status)}</td>
      <td>${opCell}</td>
      <td><div style="display:flex;gap:5px">${actionBtns}</div></td>
    </tr>`;
  }).join('');
}

function _renderDashboardPending(incidents) {
  if (!incidents || !incidents.length) {
    return '<div style="padding:16px;color:var(--text-muted);font-size:13px;text-align:center">No pending incidents</div>';
  }
  const typeIcons = {
    no_helmet: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 7v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    fire: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 3C8 3 5 6 5 9.5C5 11.4 6.3 13 8 13s3-1.6 3-3.5C11 6 8 3 8 3z" stroke="currentColor" stroke-width="1.4"/></svg>`,
    zone_violation: `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M6 4V3a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.4"/></svg>`,
    no_vest: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 7v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    smoke: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
    unknown_person: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 2a3 3 0 100 6 3 3 0 000-6zm-5 9c0-2 2.24-3.5 5-3.5s5 1.5 5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    restricted_area: `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M6 4V3a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.4"/></svg>`,
  };
  const iconColors = { no_helmet: 'ii-red', fire: 'ii-orange', zone_violation: 'ii-amber', no_vest: 'ii-red', smoke: 'ii-amber', unknown_person: 'ii-blue', restricted_area: 'ii-amber' };

  return incidents.slice(0, 7).map(inc => {
    const conf = Math.round((inc.ai_confidence || 0) * 100);
    const icon = typeIcons[inc.type] || typeIcons.no_helmet;
    const iconCls = iconColors[inc.type] || 'ii-slate';
    const sevCls = _severityClass(inc.severity);
    return `<div class="inc-item" data-incident-id="${inc.id}">
      <div class="inc-sev ${sevCls}"></div>
      <div class="inc-ico ${iconCls}">${icon}</div>
      <div class="inc-body">
        <div class="inc-title">${_typeLabel(inc.type)} — ${inc.camera_id}</div>
        <div class="inc-meta">${inc.location || '—'} · AI: ${conf}%</div>
      </div>
      <div class="inc-right">
        <div class="inc-time">${_fmtTime(inc.detected_at)}</div>
        <div class="inc-acts">
          <div class="act-btn ab-confirm" onclick="confirmInc(this)">✓</div>
          <div class="act-btn ab-dismiss" onclick="dismissInc(this)">✗</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function _camStatusPill(status) {
  const map = { online: 'p-green', offline: 'p-slate', alert: 'p-red', warning: 'p-amber' };
  const labels = { online: 'Online', offline: 'Offline', alert: 'Alert', warning: 'Warning' };
  return `<span class="pill ${map[status] || 'p-slate'}">${t(labels[status] || status)}</span>`;
}

function _zoneTag(zone) {
  const colors = { 'Zone A': 't-blue', 'Zone B': 't-red', 'Zone C': 't-amber', 'Zone D': 't-slate' };
  return `<span class="tag ${colors[zone] || 't-blue'}">${zone}</span>`;
}

function _renderCamerasTable(cameras) {
  if (!cameras || !cameras.length) {
    return `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">${t('No cameras found')}</td></tr>`;
  }
  return cameras.map(cam => {
    const conf = Math.round((cam.confidence || 0) * 100);
    const confColor = cam.status === 'alert' ? 'var(--red)' : cam.status === 'warning' ? 'var(--amber)' : '';
    const lastEvt = cam.last_event_at ? _fmtTime(cam.last_event_at) : '—';
    const lastEvtColor = cam.status === 'alert' ? 'color:var(--red);font-weight:600' : 'color:var(--text-muted)';
    const uptimeColor = cam.uptime_pct >= 90 ? 'var(--green)' : 'var(--amber)';
    return `<tr>
      <td class="mono" style="font-weight:600;color:var(--slate)">${_esc(cam.camera_id)}</td>
      <td>${_esc(cam.location)}</td>
      <td>${_zoneTag(_esc(cam.zone))}</td>
      <td>${_camStatusPill(cam.status)}</td>
      <td style="color:var(--text-muted)">${_esc(cam.ai_mode || '—')}</td>
      <td class="mono" style="${lastEvtColor}">${lastEvt}</td>
      <td>${conf}%<div class="conf-strip"><div class="conf-fill" style="width:${conf}%;${confColor ? 'background:' + confColor : ''}"></div></div></td>
      <td class="mono" style="color:${uptimeColor};font-weight:600">${cam.uptime_pct ? cam.uptime_pct.toFixed(1) + '%' : '—'}</td>
      <td><div style="display:flex;gap:5px"><button class="act-btn ab-confirm" onclick="openModal()">${t('View')}</button><button class="act-btn ab-dismiss">${t('Config')}</button></div></td>
    </tr>`;
  }).join('');
}

// ================================================================
//  USER MANAGEMENT helpers
// ================================================================

async function _authPost(url, body) {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { if (document.documentElement.style.visibility !== 'hidden') logout(); return null; }
  if (res.status === 204) return {};
  return res.ok ? res.json() : res.json().then(j => Promise.reject(new Error(j.detail || 'Xato'))).catch(e => { throw e; });
}

async function _authPatch(url, body) {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { if (document.documentElement.style.visibility !== 'hidden') logout(); return null; }
  if (res.status === 204) return {};
  return res.ok ? res.json() : res.json().then(j => Promise.reject(new Error(j.detail || 'Xato'))).catch(e => { throw e; });
}

async function _authDelete(url) {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { },
  });
  if (res.status === 401) { if (document.documentElement.style.visibility !== 'hidden') logout(); return null; }
  return res.ok;
}

function _umRolePill(role) {
  const r = (role || '').toLowerCase().trim();
  const cls = (r === 'admin' || r === 'administrator') ? 'p-red'
    : r === 'safety operator' ? 'p-blue'
    : r === 'moderator' ? 'p-amber'
    : 'p-slate';
  return `<span class="pill ${cls}">${_esc(role)}</span>`;
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _isAdmin() {
  return ['admin', 'administrator'].includes(((window._me || {}).role || '').toLowerCase().trim());
}

async function _umLoadOperators() {
  const tbody = document.querySelector('#page-user-mgmt .tbl tbody');
  if (!tbody) return;
  const operators = await _authFetch('/api/operators');
  if (!operators) return;

  const isAdmin = _isAdmin();
  const colCount = isAdmin ? 7 : 6;

  if (!operators.length) {
    tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-muted);padding:32px">${t('No operators found')}</td></tr>`;
    return;
  }

  tbody.innerHTML = operators.map(op => {
    const initials = _esc(op.initials || op.username.slice(0, 2).toUpperCase());
    const lastActive = op.last_login ? _fmtTime(op.last_login) : '—';
    const toggleLabel = op.is_active ? t('Suspend') : t('Activate');
    const toggleCls = op.is_active ? 'ab-dismiss' : 'ab-confirm';
    const actionsCell = isAdmin ? `<td><div style="display:flex;gap:5px">
        <button class="act-btn ab-confirm" onclick="_umOpenEditModal(${op.id})">${t('Edit')}</button>
        <button class="act-btn ${toggleCls}" onclick="_umToggle(${op.id}, this)">${toggleLabel}</button>
      </div></td>` : '';
    return `<tr data-op-id="${op.id}">
      <td><div style="display:flex;align-items:center;gap:8px">
        <div class="op-av" style="width:28px;height:28px;font-size:11px">${initials}</div>
        <div>
          <div style="font-weight:600;font-size:13px">${_esc(op.full_name)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${_esc(op.username)}</div>
          ${op.prof ? `<div style="font-size:11px;color:var(--text-dim)">${_esc(op.prof)}</div>` : ''}
        </div>
      </div></td>
      <td>${_umRolePill(op.role)}</td>
      <td style="font-size:12px;color:var(--text-muted)">${_esc(op.shift || '—')}</td>
      <td><span class="pill p-${op.is_active ? 'green">Active' : 'slate">Inactive'}</span></td>
      <td class="mono" style="color:var(--text-muted)">${lastActive}</td>
      <td style="font-size:11px;color:var(--text-dim)">${_esc(op.tab_num || '—')}</td>
      ${actionsCell}
    </tr>`;
  }).join('');

  const statCards = document.querySelectorAll('#page-user-mgmt .stat-card');
  const sv0 = statCards[0]?.querySelector('.stat-val');
  const sv1 = statCards[1]?.querySelector('.stat-val');
  if (sv0) sv0.textContent = operators.length;
  if (sv1) sv1.textContent = operators.filter(o => o.is_active).length;
}

async function _umToggle(opId, btn) {
  btn.disabled = true;
  try {
    await _authPatch(`/api/operators/${opId}/toggle`, {});
    await _umLoadOperators();
  } catch (e) {
    if (typeof addToast === 'function') addToast('Error', e.message, 'danger');
    btn.disabled = false;
  }
}

function _umCloseModal() {
  const el = document.getElementById('_umModal');
  if (el) el.remove();
}

function _umModal(title, bodyHtml, onSubmit) {
  _umCloseModal();
  const overlay = document.createElement('div');
  overlay.id = '_umModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);padding:16px';
  overlay.innerHTML = `
    <div style="background:var(--card-bg,#1e293b);border:1px solid var(--border,#334155);border-radius:16px;padding:28px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.5)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h3 style="margin:0;font-size:17px;font-weight:700;color:var(--text)">${_esc(title)}</h3>
        <button onclick="_umCloseModal()" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>
      <form id="_umForm">${bodyHtml}</form>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) _umCloseModal(); });
  document.body.appendChild(overlay);
  const form = document.getElementById('_umForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    await onSubmit(form);
  });
}

const ROLES = ['Safety Operator', 'Administrator', 'Guard', 'Analyst'];
const SHIFTS = ['A', 'B', 'C', 'D'];

function _umFieldStyle(extra) {
  return `style="width:100%;background:var(--input-bg,#0f172a);border:1px solid var(--border,#334155);border-radius:10px;padding:10px 14px;color:var(--text,#f1f5f9);font-size:14px;box-sizing:border-box;${extra || ''}"`;
}

function _umLabelStyle() {
  return `style="display:block;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px"`;
}

function _umField(label, inputHtml) {
  return `<div style="margin-bottom:14px"><label ${_umLabelStyle()}>${label}</label>${inputHtml}</div>`;
}

function _umSelect(name, options, selected) {
  const opts = options.map(o => `<option value="${_esc(o)}" ${o === selected ? 'selected' : ''}>${_esc(o)}</option>`).join('');
  return `<select name="${name}" ${_umFieldStyle()}>${opts}</select>`;
}

function _umSubmitRow(label) {
  return `<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
    <button type="button" onclick="_umCloseModal()" style="padding:9px 20px;border-radius:10px;border:1px solid var(--border,#334155);background:none;color:var(--text-muted);font-size:13px;cursor:pointer">${t('Cancel')}</button>
    <button type="submit" id="_umSubmitBtn" style="padding:9px 20px;border-radius:10px;background:var(--blue,#3b82f6);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer">${label}</button>
  </div>`;
}

async function _umOpenEditModal(opId) {
  const op = await _authFetch(`/api/operators/${opId}`);
  if (!op) return;

  const body = `
    ${_umField('Full Name', `<input name="full_name" value="${_esc(op.full_name)}" required ${_umFieldStyle()}>`)}
    ${_umField('Role', _umSelect('role', ROLES, op.role))}
    ${_umField('Shift', _umSelect('shift', SHIFTS, op.shift))}
    ${_umField('New Password (leave blank to keep)', `<input name="password" type="password" minlength="6" autocomplete="new-password" placeholder="••••••" ${_umFieldStyle()}>`)}
    <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">FIO: ${_esc(op.full_name)} · Tab: ${_esc(op.tab_num || '—')} · ${_esc(op.prof || '')}</div>
    ${_umSubmitRow(t('Save'))}`;

  _umModal(t('Edit Operator'), body, async form => {
    const btn = document.getElementById('_umSubmitBtn');
    btn.disabled = true; btn.textContent = '...';
    const data = Object.fromEntries(new FormData(form));
    const payload = { full_name: data.full_name, role: data.role, shift: data.shift };
    if (data.password) payload.password = data.password;
    try {
      await _authPatch(`/api/operators/${opId}`, payload);
      _umCloseModal();
      await _umLoadOperators();
    } catch (e) {
      if (typeof addToast === 'function') addToast('Error', e.message, 'danger');
      btn.disabled = false; btn.textContent = t('Save');
    }
  });
}

function _umOpenAddModal() {
  let _searchResults = [];
  let _selectedEmp = null;

  const body = `
    <p style="font-size:13px;color:var(--text-muted);margin:-8px 0 18px">FIO yoki tabel raqami bilan xodimni Oracle dan qidiring</p>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <input id="_umSearchQ" type="text" placeholder="Ivanov yoki 12345" ${_umFieldStyle('flex:1')} onkeydown="if(event.key==='Enter'){event.preventDefault();_umDoSearch()}">
      <button type="button" onclick="_umDoSearch()" style="padding:10px 16px;border-radius:10px;background:var(--blue,#3b82f6);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap" id="_umSearchBtn">Izlash</button>
    </div>
    <div id="_umSearchResults" style="margin-bottom:14px"></div>
    <div id="_umEmpInfo" style="margin-bottom:14px"></div>
    <div id="_umRoleShiftFields" style="display:none">
      ${_umField('Domen login', `<input name="domain_login" type="text" required placeholder="masalan: rakhimov" autocomplete="off" ${_umFieldStyle()}>`)}
      ${_umField('Role', _umSelect('role', ROLES, 'Safety Operator'))}
      ${_umField('Shift', _umSelect('shift', SHIFTS, 'A'))}
      ${_umField('Password (optional — leave blank for LDAP)', `<input name="password" type="password" minlength="6" autocomplete="new-password" placeholder="Domain paroli ishlatiladi" ${_umFieldStyle()}>`)}
    </div>
    ${_umSubmitRow('Qo\'shish')}`;

  _umModal('Yangi operator qo\'shish', body, async form => {
    if (!_selectedEmp) { if (typeof addToast === 'function') addToast('', 'Avval xodimni tanlang', 'warn'); return; }
    const data = Object.fromEntries(new FormData(form));
    const login = (data.domain_login || '').trim().toLowerCase();
    if (!login) { if (typeof addToast === 'function') addToast('', 'Domen loginini kiriting', 'warn'); return; }
    const btn = document.getElementById('_umSubmitBtn');
    btn.disabled = true; btn.textContent = '...';
    const payload = {
      username: login,
      role: data.role || 'Safety Operator',
      shift: data.shift || 'A',
      fio: _selectedEmp.fio || null,
      tab_num: _selectedEmp.tab_num ? String(_selectedEmp.tab_num) : null,
      prof: _selectedEmp.prof || null,
      ent_name: _selectedEmp.ent_name || null,
    };
    if (data.password) payload.password = data.password;
    try {
      await _authPost('/api/operators', payload);
      _umCloseModal();
      await _umLoadOperators();
    } catch (e) {
      if (typeof addToast === 'function') addToast('Error', e.message, 'danger');
      btn.disabled = false; btn.textContent = "Qo'shish";
    }
  });

  // expose helpers to onclick handlers
  window._umDoSearch = async function() {
    const q = (document.getElementById('_umSearchQ') || {}).value || '';
    if (q.trim().length < 2) return;
    const btn = document.getElementById('_umSearchBtn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    const resultsEl = document.getElementById('_umSearchResults');
    const empEl = document.getElementById('_umEmpInfo');
    if (empEl) empEl.innerHTML = '';
    _selectedEmp = null;
    document.getElementById('_umRoleShiftFields').style.display = 'none';
    try {
      const res = await _authFetch(`/api/operators/oracle/search?q=${encodeURIComponent(q.trim())}`);
      _searchResults = res || [];
      if (!_searchResults.length) {
        if (resultsEl) resultsEl.innerHTML = `<div style="font-size:13px;color:var(--text-muted);padding:10px 0">Xodim topilmadi</div>`;
      } else {
        if (resultsEl) resultsEl.innerHTML = `
          <div style="border:1px solid var(--border,#334155);border-radius:10px;overflow:hidden;max-height:180px;overflow-y:auto">
            ${_searchResults.map((emp, i) => `
              <div onclick="_umSelectEmp(${i})" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border,#334155);${emp.fired ? 'opacity:.5' : ''}">
                <div style="font-weight:600;font-size:13px;color:var(--text)">${_esc(emp.fio)} ${emp.fired ? '<span style="color:var(--red);font-size:11px">(Ishdan ketgan)</span>' : ''}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                  ${emp.tab_num ? 'Tab: ' + _esc(emp.tab_num) + ' · ' : ''}${_esc(emp.prof || '')}${emp.ent_name ? ' · ' + _esc(emp.ent_name) : ''}
                </div>
              </div>`).join('')}
          </div>`;
      }
    } catch(e) {
      if (resultsEl) resultsEl.innerHTML = `<div style="color:var(--red);font-size:13px">${_esc(e.message)}</div>`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Izlash'; }
    }
  };

  window._umSelectEmp = function(i) {
    const emp = _searchResults[i];
    if (!emp || emp.fired) return;
    _selectedEmp = emp;
    const resultsEl = document.getElementById('_umSearchResults');
    const empEl = document.getElementById('_umEmpInfo');
    if (resultsEl) resultsEl.innerHTML = '';
    if (empEl) empEl.innerHTML = `
      <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:10px;padding:12px 14px">
        <div style="font-weight:700;font-size:14px;color:var(--text)">${_esc(emp.fio)}</div>
        ${emp.tab_num ? `<div style="font-size:11px;color:var(--green,#22c55e);font-family:monospace;margin-top:2px">Tab: ${_esc(emp.tab_num)}</div>` : ''}
        ${emp.prof ? `<div style="font-size:12px;color:var(--text-muted);margin-top:3px">${_esc(emp.prof)}</div>` : ''}
        ${emp.ent_name ? `<div style="font-size:11px;color:var(--text-dim)">${_esc(emp.ent_name)}</div>` : ''}
      </div>`;
    document.getElementById('_umRoleShiftFields').style.display = 'block';
  };
}

// ================================================================
//  END USER MANAGEMENT helpers
// ================================================================

// Map of page-specific initialization functions
function initPageLogic(id) {
  if (id === 'dashboard') {
    _authFetch('/api/analytics/dashboard').then(stats => {
      if (!stats) return;
      const actCamsEl = document.querySelector('.card:nth-child(1) .card-val');
      const violEl = document.querySelector('.card:nth-child(2) .card-val');
      const compEl = document.querySelector('.card:nth-child(3) .card-val');
      if (actCamsEl) actCamsEl.textContent = `${stats.active_cameras} / ${stats.total_cameras}`;
      if (violEl) violEl.textContent = stats.violations_today;
      if (compEl) compEl.textContent = `${stats.compliance_pct}%`;

      // Update stat cards with real data
      const statCards = document.querySelectorAll('.stat-card');
      if (statCards.length >= 6) {
        const q = (i, sel) => statCards[i]?.querySelector(sel);
        if (q(0, '.stat-val')) q(0, '.stat-val').textContent = stats.active_cameras;
        if (q(0, '.stat-meta')) q(0, '.stat-meta').innerHTML = `of ${stats.total_cameras} total`;
        if (q(1, '.stat-val')) q(1, '.stat-val').textContent = stats.violations_today;
        if (q(2, '.stat-val')) q(2, '.stat-val').textContent = stats.pending_review;
        if (q(3, '.stat-val')) q(3, '.stat-val').textContent = stats.confirmed_today;
        if (q(4, '.stat-val')) q(4, '.stat-val').textContent = stats.false_alarms;
        if (q(5, '.stat-val')) q(5, '.stat-val').innerHTML = `${stats.compliance_pct}<span style="font-size:18px;font-weight:700">%</span>`;
      }
    });

    // Load pending incidents into the right panel
    _authFetch('/api/incidents?status=pending&limit=7').then(incidents => {
      const incList = document.querySelector('.inc-list');
      if (incList && incidents) {
        incList.innerHTML = _renderDashboardPending(incidents);
      }
      // Update pending badge in panel header
      const badge = document.querySelector('.card-hd .nav-badge.nb-red');
      if (badge && incidents) {
        badge.textContent = incidents.length + ' NEW';
      }
    });
  }

  if (id === 'user-mgmt') {
    _umLoadOperators();

    // Admin bo'lsa — Actions ustuni va Add User tugmasini ko'rsatamiz
    const isAdmin = _isAdmin();
    if (isAdmin) {
      const thead = document.getElementById('um-thead');
      if (thead) {
        const th = document.createElement('th');
        th.textContent = 'Actions';
        thead.appendChild(th);
      }
      const actionsBar = document.getElementById('um-actions');
      if (actionsBar) actionsBar.style.display = '';
      const addBtn = document.getElementById('um-add-btn');
      if (addBtn) addBtn.onclick = () => _umOpenAddModal();
    }
  }

  if (id === 'cameras') {
    _authFetch('/api/cameras').then(cameras => {
      const tbody = document.querySelector('#page-cameras .tbl tbody');
      if (tbody && cameras) {
        tbody.innerHTML = _renderCamerasTable(cameras);
      }
      // Update sub-header count
      if (cameras) {
        const onlineCount = cameras.filter(c => c.status !== 'offline').length;
        const offlineCount = cameras.filter(c => c.status === 'offline').length;
        const sub = document.querySelector('#page-cameras .pg-sub');
        if (sub) {
          sub.textContent = `${cameras.length} cameras registered — ${onlineCount} online · ${offlineCount} offline`;
        }
      }
    });

    // Filter controls for cameras
    setTimeout(() => {
      const selects = document.querySelectorAll('#page-cameras .f-select');
      selects.forEach(sel => {
        sel.addEventListener('change', () => {
          const zone = selects[0] && selects[0].value !== 'All Zones' ? selects[0].value : null;
          const status = selects[1] && selects[1].value !== 'All Status' ? selects[1].value.toLowerCase() : null;
          let url = '/api/cameras?';
          if (zone) url += 'zone=' + encodeURIComponent(zone) + '&';
          if (status) url += 'status=' + status;
          _authFetch(url).then(cameras => {
            const tbody = document.querySelector('#page-cameras .tbl tbody');
            if (tbody && cameras) tbody.innerHTML = _renderCamerasTable(cameras);
          });
        });
      });
    }, 100);
  }

  if (id === 'incidents') {
    _authFetch('/api/incidents?limit=50').then(incidents => {
      const tbody = document.querySelector('#page-incidents .tbl tbody');
      if (tbody && incidents) {
        tbody.innerHTML = _renderIncidentsTable(incidents);
      }
      _authFetch('/api/incidents/stats').then(stats => {
        if (!stats) return;
        const sub = document.querySelector('#page-incidents .pg-sub');
        if (sub) {
          sub.textContent = `${stats.total} detections total — ${stats.confirmed} confirmed · ${stats.dismissed} dismissed as false alarms`;
        }
      });
    });

    setTimeout(() => {
      const selects = document.querySelectorAll('#page-incidents .f-select');
      selects.forEach(sel => {
        sel.addEventListener('change', () => {
          const typeVal = selects[0] && selects[0].value !== 'All Types' ? selects[0].value.toLowerCase().replace(/ /g,'_') : null;
          const statusVal = selects[1] && selects[1].value !== 'All Status' ? selects[1].value.toLowerCase() : null;
          let url = '/api/incidents?limit=50';
          if (typeVal) url += '&type=' + typeVal;
          if (statusVal) url += '&status=' + statusVal;
          _authFetch(url).then(incidents => {
            const tbody = document.querySelector('#page-incidents .tbl tbody');
            if (tbody && incidents) tbody.innerHTML = _renderIncidentsTable(incidents);
          });
        });
      });
    }, 100);
  }

  if (id === 'analytics') {
    Promise.all([
      _authFetch('/api/analytics/violations/by-type'),
      _authFetch('/api/analytics/compliance'),
      _authFetch('/api/analytics/violations/by-zone'),
      _authFetch('/api/analytics/trend/hourly'),
    ]).then(([byType, compliance, byZone, trend]) => {
      // Update compliance bars from real data
      if (compliance && compliance.items) {
        const rows = document.querySelectorAll('#page-analytics .comp-row');
        compliance.items.forEach((item, i) => {
          if (rows[i]) {
            const fill = rows[i].querySelector('.comp-fill');
            const pct  = rows[i].querySelector('.comp-pct');
            if (fill) fill.style.width = item.pct + '%';
            if (pct)  pct.textContent  = item.pct + '%';
          }
        });
        const overall = document.querySelector('#page-analytics .g-pct');
        if (overall && compliance.overall != null) overall.textContent = compliance.overall + '%';
      }

      // Violation types bar chart
      if (byType && byType.length) {
        const bars = document.querySelectorAll('#page-analytics .bc-bar');
        const maxCount = Math.max(...byType.map(r => r.count), 1);
        byType.slice(0, bars.length).forEach((row, i) => {
          if (bars[i]) bars[i].style.height = Math.round(row.count / maxCount * 90) + '%';
        });
      }
    });
  }

  if (id === 'settings') {
    // Load current operator info into settings profile section
    _authFetch('/api/auth/me').then(op => {
      if (!op) return;
      const nameEl = document.querySelector('#page-settings .settings-username');
      const roleEl = document.querySelector('#page-settings .settings-role');
      if (nameEl) nameEl.textContent = op.full_name;
      if (roleEl) roleEl.textContent = op.role;
    });
  }
}

// Initial load is handled by index.html (SSO flow or already-logged-in check)
