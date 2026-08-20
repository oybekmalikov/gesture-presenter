/**
 * SafeGuard API Client
 */
const API_BASE_URL = (window.SAFEGUARD_API_URL || '') + '/api';
const WS_BASE_URL  = (window.SAFEGUARD_WS_URL  || (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host) + '/ws';

const API = {
  // ── Helpers ────────────────────────────────────────
  getHeaders() {
    return {};
  }`
    };
  },

  // ── Analytics ──────────────────────────────────────
  async getDashboardStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        credentials: 'include'
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('API Error (getDashboardStats):', err);
      return null;
    }
  },

  async getHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/health`, {
        credentials: 'include'
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('API Error (getHealth):', err);
      return null;
    }
  },

  // ── WebSockets ─────────────────────────────────────
  connectLiveEvents() {
    const token = localStorage.getItem('safeguard_token');
    if (!token) return;
    const ws = new WebSocket(`${WS_BASE_URL}/events?token=${encodeURIComponent(token)}`);
    
    ws.onopen = () => {
      console.log('✅ Connected to SafeGuard Live Events');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleLiveEvent(data);
      } catch (err) {
        // keep-alive pings can be ignored
      }
    };

    ws.onclose = () => {
      console.warn('❌ WebSocket closed. Reconnecting in 5s...');
      setTimeout(() => this.connectLiveEvents(), 5000);
    };
  },

  handleLiveEvent(data) {
    if (data.event === 'incident_confirmed') {
      addToast(
        `Update: ${data.incident_ref} confirmed`,
        `Operator ${data.operator} confirmed the incident on ${data.camera_id}.`,
        'warn'
      );
    } else if (data.event === 'incident_dismissed') {
      addToast(
        `Update: ${data.incident_ref} dismissed`,
        `Operator ${data.operator} marked incident as false alarm.`,
        'ok'
      );
    } else if (data.event === 'new_incident') {
      addToast(
        `AI ALERT: ${data.camera_id}`,
        `Confidence: ${(data.confidence * 100).toFixed(1)}%. Immediate review required.`,
        'danger'
      );
    }
  }
};

// ── INIT ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Connect WebSocket
  API.connectLiveEvents();

  // 2. Fetch and render dashboard stats
  const stats = await API.getDashboardStats();
  if (stats) {
    const actCamsEl = document.querySelector('.card:nth-child(1) .card-val');
    const violEl = document.querySelector('.card:nth-child(2) .card-val');
    const compEl = document.querySelector('.card:nth-child(3) .card-val');
    
    if (actCamsEl) actCamsEl.textContent = `${stats.active_cameras} / ${stats.total_cameras}`;
    if (violEl) violEl.textContent = stats.violations_today;
    if (compEl) compEl.textContent = `${stats.compliance_pct}%`;
  }
});
