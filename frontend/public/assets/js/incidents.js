/* ================================================================
   INCIDENT ACTIONS — calls real API when incident ID is available
   ================================================================ */

function _incidentToken() {
  return '';  // Auth via HttpOnly cookie
}

async function _apiResolve(incidentId, action, btn) {
  const token = _incidentToken();
  try {
    const res = await fetch(`/api/incidents/${incidentId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ note: null }),
    });
    if (res.status === 401) { logout(); return false; }
    return res.ok;
  } catch(e) {
    return false;
  }
}

function _applyConfirmUI(row) {
  const pills = row.querySelectorAll('.pill, .status-pill');
  pills.forEach(p => { p.className = 'pill p-green'; p.textContent = 'Confirmed'; });
  const cells = row.querySelectorAll('td');
  if (cells.length >= 8) {
    cells[7].style.color = 'var(--blue)';
    cells[7].style.fontWeight = '600';
    cells[7].textContent = '✓';
    cells[8].innerHTML = '<div style="display:flex;gap:5px"><button class="act-btn ab-dismiss">View</button></div>';
  }
  row.style.background = 'var(--green-lt)';
  setTimeout(() => row.style.background = '', 800);
}

function _applyDismissUI(row) {
  const pills = row.querySelectorAll('.pill, .status-pill');
  pills.forEach(p => { p.className = 'pill p-red'; p.textContent = 'Dismissed'; });
  const cells = row.querySelectorAll('td');
  if (cells.length >= 8) {
    cells[7].style.color = 'var(--text-muted)';
    cells[7].textContent = '—';
    cells[8].innerHTML = '<div style="display:flex;gap:5px"><button class="act-btn ab-dismiss">View</button></div>';
  }
  row.style.background = 'var(--bg-raised)';
  setTimeout(() => row.style.background = '', 600);
}

async function confirmInc(btn) {
  const row = btn.closest('tr') || btn.closest('.inc-item');
  if (!row) return;
  btn.disabled = true;

  const incidentId = row.dataset.incidentId;
  if (incidentId) {
    const ok = await _apiResolve(incidentId, 'confirm', btn);
    if (ok) {
      _applyConfirmUI(row);
      addToast('Violation Confirmed', 'Incident logged and forwarded to safety management.', 'info');
      updateSidebarBadges && updateSidebarBadges();
    } else {
      btn.disabled = false;
    }
  } else {
    // Fallback: no API id yet (static demo row)
    _applyConfirmUI(row);
    addToast('Violation Confirmed', 'Incident logged and forwarded to safety management.', 'info');
  }
}

async function dismissInc(btn) {
  const row = btn.closest('tr') || btn.closest('.inc-item');
  if (!row) return;
  btn.disabled = true;

  const incidentId = row.dataset.incidentId;
  if (incidentId) {
    const ok = await _apiResolve(incidentId, 'dismiss', btn);
    if (ok) {
      _applyDismissUI(row);
      updateSidebarBadges && updateSidebarBadges();
    } else {
      btn.disabled = false;
    }
  } else {
    _applyDismissUI(row);
  }
}
