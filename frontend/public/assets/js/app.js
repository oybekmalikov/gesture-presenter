/* ================================================================
   THEME TOGGLE
   ================================================================ */
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const sunIcon = document.getElementById('icon-sun');
  const moonIcon = document.getElementById('icon-moon');

  if (isDark) {
    root.removeAttribute('data-theme');
    if (sunIcon)  sunIcon.style.display  = 'block';
    if (moonIcon) moonIcon.style.display = 'none';
    localStorage.setItem('safeguard_theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
    if (sunIcon)  sunIcon.style.display  = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
    localStorage.setItem('safeguard_theme', 'dark');
  }
}

// Apply saved theme immediately (prevents flash)
(function() {
  if (localStorage.getItem('safeguard_theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

// Sync icon state after DOM ready
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('safeguard_theme') === 'dark') {
    const sun  = document.getElementById('icon-sun');
    const moon = document.getElementById('icon-moon');
    if (sun)  sun.style.display  = 'none';
    if (moon) moon.style.display = 'block';
  }
});


/* ================================================================
   SIDEBAR BADGE UPDATES (30-second polling)
   The full implementation lives in index.html inline script.
   ================================================================ */
setInterval(() => { if (typeof updateSidebarBadges === 'function') updateSidebarBadges(); }, 30000);


/* ================================================================
   LIVE CLOCK
   ================================================================ */
function tick() {
  const t = new Date().toTimeString().slice(0, 8);
  document.querySelectorAll('.cam-time').forEach(el => el.textContent = t);
  const mt = document.getElementById('modalTs');
  if (mt) mt.textContent = t;
}
tick();
setInterval(tick, 1000);


/* ================================================================
   USER MANAGEMENT
   ================================================================ */
function openAddUserModal() {
  if (typeof window._umOpenAddModal === 'function') {
    window._umOpenAddModal();
  }
}

function exportUsersCSV() {
  if (typeof window._umExportCSV === 'function') {
    window._umExportCSV();
  }
}

/* ================================================================
   ANIMATED BAR FILLS (run on load)
   ================================================================ */
window.addEventListener('load', () => {
  document.querySelectorAll('.comp-fill, .hbar-fill, .h-fill').forEach(el => {
    const target = el.style.width;
    el.style.width = '0';
    requestAnimationFrame(() => {
      setTimeout(() => { el.style.width = target; }, 100);
    });
  });
});
