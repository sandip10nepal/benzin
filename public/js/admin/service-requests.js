/**
 * Benzin Hospitality OS — Hookah Coal Refills & Service Requests
 * Native ES Module: service-requests.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';

/**
 * Load active hookah coal refill and table service requests.
 */
export async function loadServiceRequests() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/service-requests?station=hookah`, { headers });
    const data = await res.json();
    if (data.success) {
      state.serviceRequests = data.requests || [];
      renderHookahRequests();
    }
  } catch (err) {
    console.warn('Error loading service requests:', err);
  }
}

/**
 * Update service request status (e.g. IN_PROGRESS, COMPLETED).
 */
export async function updateServiceRequestStatus(id, status) {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/service-requests/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      await loadServiceRequests();
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not update request: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Error updating request status: ' + err.message);
  }
}

/**
 * Render hookah coal refill queue cards.
 */
export function renderHookahRequests() {
  const section = document.getElementById('hookahStationQueueSection');
  const grid = document.getElementById('hookahRequestsGrid');
  const badge = document.getElementById('hookahQueueBadge');
  const userRole = (localStorage.getItem('benzin_user_role') || 'owner').toLowerCase();
  const isHookahStaff = userRole === 'hookah_maker' || userRole === 'owner' || userRole === 'manager' || userRole === 'admin';

  if (!section || !grid) return;

  if (!isHookahStaff) {
    section.style.display = 'none';
    return;
  }

  const activeList = state.serviceRequests.filter(r => r.status !== 'completed' && r.status !== 'COMPLETED' && r.status !== 'cancelled' && r.status !== 'CANCELLED');
  if (badge) badge.innerText = `${activeList.length} ACTIVE`;

  if (activeList.length === 0 && userRole !== 'hookah_maker') {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  if (activeList.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--muted); font-size: 14px; background: rgba(255,255,255,0.02); border-radius: 8px;">
      ✓ All hookah coal refills completed. New table requests will appear here in real time!
    </div>`;
    return;
  }

  grid.innerHTML = activeList.map(r => {
    const timeStr = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
    const isPending = r.status === 'pending' || r.status === 'PENDING';
    const statusColor = isPending ? '#f59e0b' : '#3b82f6';
    const statusLabel = isPending ? 'PENDING' : 'IN PROGRESS';

    return `
      <div class="ticket-card" style="border: 2px solid #ff5a1f; box-shadow: 0 0 20px rgba(255,90,31,0.22); margin-bottom: 0;">
        <div class="ticket-header" style="background: rgba(255,90,31,0.12); padding: 8px 12px; border-radius: 8px; margin-bottom: 12px;">
          <div>
            <div class="ticket-title" style="color: #ff5a1f; font-size: 19px; font-weight: 900;">
              🔥 Table ${r.table_number || r.table_id || '?'}
            </div>
            <div class="ticket-meta">👤 ${r.customer_name || 'Guest'} • 🕒 ${timeStr}</div>
          </div>
          <span class="ticket-badge" style="background: ${statusColor}; color: #fff; font-weight: 900; padding: 4px 10px; border-radius: 6px; font-size: 11px;">
            ${statusLabel}
          </span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,90,31,0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px;">
          <div style="font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 4px;">COAL REFILL REQUEST</div>
          <div style="font-size: 13px; color: var(--gold); font-weight: 700;">${r.note || 'Fresh coals needed for hookah'}</div>
          ${r.session_id ? `<div style="font-size: 11px; color: var(--muted); margin-top: 6px;">Session: ${r.session_id}</div>` : ''}
        </div>
        <div class="ticket-actions" style="display: flex; gap: 8px;">
          ${isPending ? `
            <button class="btn touch-target" onclick="updateServiceRequestStatus('${r._id || r.id}', 'IN_PROGRESS')" style="background: #3b82f6; color: #fff; font-weight: 900; flex: 1; padding: 10px; font-size: 13px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
              ⏳ In Progress
            </button>
          ` : ''}
          <button class="btn btn-primary touch-target" onclick="updateServiceRequestStatus('${r._id || r.id}', 'COMPLETED')" style="background: #10b981; border-color: #10b981; font-weight: 900; flex: 1; padding: 10px; font-size: 13px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            ✅ Mark Done
          </button>
        </div>
      </div>
    `;
  }).join('');
}
