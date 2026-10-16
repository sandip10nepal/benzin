/**
 * Benzin Hospitality OS — Shared Admin Utilities
 * Native ES Module: utils.js
 */

/**
 * Escape HTML characters to protect against XSS injection in dynamic DOM rendering.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape JavaScript characters for safe insertion into single or double-quoted inline attributes.
 */
export function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Format numeric value as USD currency string: "$XX.XX"
 */
export function formatCurrency(val) {
  const num = Number(val) || 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Format ISO date string into friendly time: "7:45 PM"
 */
export function formatTime(isoString) {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (_) {
    return '--:--';
  }
}

/**
 * Format ISO date string into friendly date: "Oct 16, 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return '--';
  }
}

/**
 * Trigger audio chime when a new unfulfilled ticket arrives.
 */
export function playOrderChime() {
  try {
    const chime = document.getElementById('orderChime');
    if (chime) {
      chime.currentTime = 0;
      chime.play().catch(() => {});
    }
  } catch (_) {}
}

/**
 * Re-scan DOM to render Lucide vector icons.
 */
export function refreshIcons() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch (_) {}
}
