/* ================================================================
   TOAST SYSTEM
   ================================================================ */
let toastIdx = 10;

function _esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

function addToast(title, body, type) {
  const dock = document.getElementById('toastDock');
  const id = 'toast-' + (++toastIdx);
  const cls = type === 'info' ? 'toast-info' : type === 'warn' ? 'toast-warn' : 'toast-danger';
  const el = document.createElement('div');
  el.id = id;
  el.className = `toast ${cls}`;
  el.innerHTML = `
    <div class="toast-hd">
      <div class="toast-dot"></div>
      <div class="toast-title">${_esc(title)}</div>
      <button class="toast-x" onclick="removeToast('${_esc(id)}')">×</button>
    </div>
    <div class="toast-body">${_esc(body)}</div>
  `;
  dock.prepend(el);
  setTimeout(() => removeToast(id), 6000);
}
function removeToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('removing');
  setTimeout(() => el && el.remove(), 220);
}
