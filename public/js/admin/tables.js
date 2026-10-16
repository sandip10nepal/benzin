/**
 * Benzin Hospitality OS — Table Management & Server Assignment
 * Native ES Module: tables.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml, escapeJs, refreshIcons } from './utils.js';
import { updateOrderStatus, fulfillOrder } from './kds.js';

let isFetchingTables = false;

/**
 * Fetch and render table floor overview.
 */
export async function renderTablesPage(force = false) {
  if (isFetchingTables) return;
  isFetchingTables = true;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/tables/overview?_t=${Date.now()}`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tables)) {
        state.tablesList = data.tables;
      }
    }
  } catch (err) {
    console.warn('Error fetching tables overview:', err);
  } finally {
    isFetchingTables = false;
    updateTablesStatsAndFilters();
    renderTablesGrid();
  }
}

/**
 * Update table floor stats and filter badge counts.
 */
export function updateTablesStatsAndFilters() {
  const myId = localStorage.getItem('benzin_user_id') || '';
  const myName = (localStorage.getItem('benzin_user_name') || '').toLowerCase();

  const total = state.tablesList.length;
  const newOrders = state.tablesList.filter(t => t.status === 'new_order').length;
  const inProgress = state.tablesList.filter(t => t.status === 'in_progress').length;
  const ready = state.tablesList.filter(t => t.status === 'ready').length;
  const available = state.tablesList.filter(t => t.status === 'available').length;
  const activeOrders = state.tablesList.filter(t => t.status !== 'available').length;
  const myAssigned = state.tablesList.filter(t => {
    if (t.status === 'available') return false;
    if (myId && t.assigned_server_id === myId) return true;
    if (myName && t.assigned_server_name && t.assigned_server_name.toLowerCase() === myName) return true;
    return false;
  }).length;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl('statTotalTables', total);
  setEl('statNewOrders', newOrders);
  setEl('statInProgress', inProgress);
  setEl('statReady', ready);
  setEl('statAvailable', available);

  setEl('tblFilterCount-all', total);
  setEl('tblFilterCount-active', activeOrders);
  setEl('tblFilterCount-my', myAssigned);
  setEl('tblFilterCount-available', available);
}

/**
 * Switch table filter tab ('all' | 'active' | 'my' | 'available').
 */
export function setTablesFilter(filter) {
  state.activeTableFilter = filter;
  ['all', 'active', 'my', 'available'].forEach(f => {
    const btn = document.getElementById(`tblFilterBtn-${f}`);
    if (btn) {
      if (f === filter) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderTablesGrid();
}

/**
 * Render table floor grid with cards and server assignments.
 */
export function renderTablesGrid() {
  const container = document.getElementById('tablesGridContainer');
  if (!container) return;

  const myId = localStorage.getItem('benzin_user_id') || '';
  const myName = (localStorage.getItem('benzin_user_name') || '').trim();
  const myRole = (localStorage.getItem('benzin_user_role') || 'server').toLowerCase();
  const isManager = myRole === 'owner' || myRole === 'manager' || myRole === 'platform_admin' || myRole === 'admin';
  const canAssign = isManager || myRole === 'host';

  const searchInput = document.getElementById('tableSearchInput');
  const query = (searchInput?.value || '').toLowerCase().trim();

  const filtered = state.tablesList.filter(t => {
    // Filter by tab
    if (state.activeTableFilter === 'active') {
      if (t.status === 'available') return false;
    } else if (state.activeTableFilter === 'my') {
      if (t.status === 'available') return false;
      const isMine = (myId && t.assigned_server_id === myId) || 
                     (myName && t.assigned_server_name && t.assigned_server_name.toLowerCase() === myName.toLowerCase());
      if (!isMine) return false;
    } else if (state.activeTableFilter === 'available') {
      if (t.status !== 'available') return false;
    }

    // Filter by search query
    if (query) {
      const isPatioTable = /^p\d+/i.test(t.label || '') || (t.label || '').toLowerCase().includes('patio');
      const matchPatioQuery = (query === 'patio' || query === 'p') && isPatioTable;
      const matchLabel = (t.label || '').toLowerCase().includes(query);
      const matchServer = (t.assigned_server_name || '').toLowerCase().includes(query);
      const matchNick = (t.customer_nickname || (t.active_order?.customerName) || '').toLowerCase().includes(query);
      const matchItems = (t.items_summary || '').toLowerCase().includes(query);
      if (!matchLabel && !matchServer && !matchNick && !matchItems && !matchPatioQuery) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 60px 20px; text-align: center; color: var(--muted); background: var(--card); border: 1.5px dashed var(--line); border-radius: 16px;">
        <i data-lucide="layout-grid" style="width: 44px; height: 44px; margin-bottom: 12px; opacity: 0.4;"></i>
        <div style="font-size: 16px; font-weight: 700; color: var(--cream); margin-bottom: 4px;">No Tables Found</div>
        <div style="font-size: 13px;">No tables match the selected filter "${escapeHtml(state.activeTableFilter)}".</div>
      </div>
    `;
    refreshIcons();
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isAvailable = t.status === 'available';
    const orderId = t.active_order_id || (t.active_order?.id || t.active_order?._id);
    const serverName = t.assigned_server_name || '';
    const isAssignedToMe = (myId && t.assigned_server_id === myId) || 
                           (myName && serverName && serverName.toLowerCase() === myName.toLowerCase());

    let statusPillClass = 'table-pill-available';
    let statusLabel = '🟢 Available';
    if (t.status === 'new_order') {
      statusPillClass = 'table-pill-new';
      statusLabel = '🔥 New Order';
    } else if (t.status === 'in_progress') {
      statusPillClass = 'table-pill-progress';
      statusLabel = '👨‍🍳 In Progress';
    } else if (t.status === 'ready') {
      statusPillClass = 'table-pill-ready';
      statusLabel = '🔔 Ready';
    } else if (t.status === 'completed') {
      statusPillClass = 'table-pill-completed';
      statusLabel = '✅ Completed';
    }

    let timeDisplay = '';
    if (t.order_placed_at) {
      try {
        const d = new Date(t.order_placed_at);
        const hours = d.getHours();
        const mins = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedH = (hours % 12 || 12).toString().padStart(2, '0');
        const diffMins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
        timeDisplay = `${formattedH}:${mins} ${ampm} (${diffMins}m ago)`;
      } catch (_) {}
    }

    const isPatio = /^p\d+/i.test(t.label || '') || (t.label || '').toLowerCase().includes('patio');
    const badgeText = isPatio ? 'PATIO' : 'TABLE';
    const badgeColor = isPatio ? '#38bdf8' : 'var(--gold)';

    return `
      <div class="table-card ${!isAvailable ? 'has-order' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; color: ${badgeColor};">${badgeText}</div>
            <h3 style="font-size: 20px; font-weight: 900; margin: 0; color: var(--cream);">${escapeHtml(t.label)}</h3>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="${statusPillClass}">${statusLabel}</span>
            ${isManager && t.table_id && !t.table_id.startsWith('dynamic-') ? `
              <button class="btn" onclick="openEditTableModal('${escapeJs(t.table_id)}', '${escapeJs(t.label)}', ${t.table_number || 0}, ${t.capacity || 4})" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--muted);" title="Edit Table Details">
                <i data-lucide="edit-2" style="width: 11px; height: 11px;"></i>
              </button>
            ` : ''}
          </div>
        </div>

        ${isAvailable ? `
          <div style="padding: 24px 10px; text-align: center; color: var(--muted); font-size: 13px;">
            <i data-lucide="check-circle-2" style="width: 28px; height: 28px; margin-bottom: 6px; opacity: 0.35;"></i>
            <div style="font-weight: 700; color: var(--cream);">Available</div>
            <div style="font-size: 11px; opacity: 0.6; margin-top: 2px;">Table is clean and open for guests</div>
            ${isManager && t.table_id && !t.table_id.startsWith('dynamic-') ? `
              <div style="margin-top: 10px;">
                <button class="btn" onclick="openEditTableModal('${escapeJs(t.table_id)}', '${escapeJs(t.label)}', ${t.table_number || 0}, ${t.capacity || 4})" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; color: var(--gold); border-color: rgba(229,177,58,0.3);">
                  ⚙️ Manage Table
                </button>
              </div>
            ` : ''}
          </div>
        ` : `
          <div style="background: rgba(0,0,0,0.25); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 12px; font-weight: 800; color: var(--cream);">
                👤 ${escapeHtml(t.customer_nickname || (t.active_order?.customerName) || 'Guest')}
              </span>
              ${timeDisplay ? `
                <span style="font-size: 11px; color: var(--muted); font-weight: 600;">
                  🕒 ${escapeHtml(timeDisplay)}
                </span>
              ` : ''}
            </div>

            <div style="font-size: 12px; font-weight: 700; color: #f3f4f6; margin-bottom: 6px; line-height: 1.4;">
              🍽️ ${escapeHtml(t.items_summary || 'Customer order active')}
            </div>

            ${t.active_order?.grandTotal !== undefined ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 5px; margin-top: 5px;">
                <span>Total: $${Number(t.active_order.grandTotal).toFixed(2)}</span>
                <span style="font-weight: 800; color: ${Number(t.active_order.totalDue || 0) <= 0 ? 'var(--success)' : 'var(--gold)'};">
                  ${Number(t.active_order.totalDue || 0) <= 0 ? 'PAID' : `Due: $${Number(t.active_order.totalDue).toFixed(2)}`}
                </span>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 10px; background: var(--card2); border-radius: 8px; border: 1px solid var(--border);">
            <span style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase;">Server</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              ${serverName ? `
                <span style="font-size: 13px; font-weight: 800; color: ${isAssignedToMe ? 'var(--success)' : 'var(--cream)'}; display: flex; align-items: center; gap: 4px;">
                  👤 ${escapeHtml(serverName)}
                  ${isAssignedToMe ? '<span style="font-size: 10px; background: rgba(34,197,94,0.2); border: 1px solid var(--success); padding: 1px 6px; border-radius: 10px; margin-left: 2px;">YOU</span>' : ''}
                </span>
              ` : `
                <span style="font-size: 12px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
                  ⚠️ Unassigned
                </span>
              `}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 6px;">
              ${!serverName ? `
                ${canAssign ? `
                  <button class="btn btn-primary" onclick="openReassignModal('${orderId}', '${escapeJs(t.label)}', '', 'Unassigned')" style="flex: 1; background: #0066FF; font-weight: 800; font-size: 12px; padding: 8px; border-radius: 8px;" title="Manager/Host: Assign staff">
                    <i data-lucide="user-plus" style="width: 13px; height: 13px; margin-right: 4px;"></i> Assign Staff
                  </button>
                ` : `
                  <div style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--muted); text-align: center; font-weight: 700;">
                    Unassigned (Staff will assign)
                  </div>
                `}
              ` : isAssignedToMe ? `
                <button class="btn" style="flex: 1; background: rgba(34,197,94,0.15); border: 1.5px solid var(--success); color: var(--success); font-weight: 800; font-size: 12px; padding: 8px; cursor: default; border-radius: 8px;">
                  <i data-lucide="check" style="width: 13px; height: 13px; margin-right: 4px;"></i> Assigned to me
                </button>
                ${canAssign ? `
                  <button class="btn" onclick="unassignTableOrder('${orderId}')" style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #f87171; font-size: 11px; font-weight: 700; padding: 8px 10px; border-radius: 8px;" title="Release / Unassign table">
                    Release
                  </button>
                  <button class="btn" onclick="openReassignModal('${orderId}', '${escapeJs(t.label)}', '${escapeJs(t.assigned_server_id)}', '${escapeJs(serverName)}')" style="padding: 8px 10px; font-size: 12px;" title="Reassign to another staff">
                    <i data-lucide="users" style="width: 13px; height: 13px;"></i>
                  </button>
                ` : ''}
              ` : `
                <div style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--muted); text-align: center; font-weight: 700;">
                  Assigned to ${escapeHtml(serverName)}
                </div>
                ${canAssign ? `
                  <button class="btn" onclick="openReassignModal('${orderId}', '${escapeJs(t.label)}', '${escapeJs(t.assigned_server_id)}', '${escapeJs(serverName)}')" style="padding: 8px 10px; font-size: 12px; background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; color: #60a5fa;" title="Reassign to staff">
                    Reassign
                  </button>
                  <button class="btn" onclick="unassignTableOrder('${orderId}')" style="padding: 8px 8px; font-size: 11px; color: #f87171; border: 1px solid #ef4444;" title="Unassign server">
                    ✕
                  </button>
                ` : ''}
              `}
            </div>

            <div style="display: flex; gap: 6px;">
              ${t.status === 'new_order' ? `
                <button class="btn" onclick="quickUpdateTableStatus('${orderId}', 'preparing')" style="flex: 1; background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; color: #60a5fa; font-weight: 800; font-size: 11px; padding: 6px;">
                  👨‍🍳 Start Prep
                </button>
              ` : t.status === 'in_progress' ? `
                <button class="btn" onclick="quickUpdateTableStatus('${orderId}', 'ready')" style="flex: 1; background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; color: #fbbf24; font-weight: 800; font-size: 11px; padding: 6px;">
                  🔔 Mark Ready
                </button>
              ` : t.status === 'ready' ? `
                <button class="btn btn-primary" onclick="quickFulfillTableOrder('${orderId}')" style="flex: 1; background: var(--success); border-color: var(--success); font-weight: 800; font-size: 11px; padding: 6px;">
                  ✅ Mark Served
                </button>
              ` : `
                <button class="btn" onclick="quickResetTable('${orderId}')" style="flex: 1; background: rgba(16,185,129,0.15); border: 1px solid var(--success); color: #34d399; font-weight: 800; font-size: 11px; padding: 6px;" title="Reset table to Available">
                  🔄 Reset Table
                </button>
              `}
            </div>
          </div>
        `}
      </div>
    `;
  }).join('');

  refreshIcons();
}

/**
 * Assign a staff member to a table's active order.
 */
export async function assignTableOrder(orderId, targetId, targetName) {
  if (!orderId) return;
  try {
    const myId = localStorage.getItem('benzin_user_id') || '';
    const myName = localStorage.getItem('benzin_user_name') || 'Server';
    const server_id = targetId || myId;
    const server_name = targetName || myName;

    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/${orderId}/assign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ server_id, server_name })
    });
    const data = await res.json();
    if (res.status === 409) {
      alert(`⚠️ ${data.message || 'This table is already assigned to another server.'}`);
    } else if (!res.ok || !data.success) {
      alert(`Could not assign table: ${data.message || data.error || 'Server error'}`);
    }
    await renderTablesPage(true);
    if (typeof window.fetchOrders === 'function') await window.fetchOrders(true);
  } catch (err) {
    alert('Error assigning table: ' + err.message);
  }
}

/**
 * Unassign staff from table order.
 */
export async function unassignTableOrder(orderId) {
  if (!orderId) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/${orderId}/unassign`, {
      method: 'POST',
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(`Could not unassign table: ${data.message || data.error || 'Server error'}`);
    }
    await renderTablesPage(true);
    if (typeof window.fetchOrders === 'function') await window.fetchOrders(true);
  } catch (err) {
    alert('Error unassigning table: ' + err.message);
  }
}

/**
 * Reset table to available state.
 */
export async function quickResetTable(orderId) {
  if (!orderId) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/${orderId}/reset-table`, {
      method: 'POST',
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(`Could not reset table: ${data.message || data.error || 'Server error'}`);
    }
    await renderTablesPage(true);
    if (typeof window.fetchOrders === 'function') await window.fetchOrders(true);
  } catch (err) {
    alert('Error resetting table: ' + err.message);
  }
}

/**
 * Quick status update from tables floor view.
 */
export async function quickUpdateTableStatus(orderId, status) {
  if (!orderId) return;
  await updateOrderStatus(orderId, status);
  await renderTablesPage(true);
}

/**
 * Quick order fulfillment from tables floor view.
 */
export async function quickFulfillTableOrder(orderId) {
  if (!orderId) return;
  await fulfillOrder(orderId);
  await renderTablesPage(true);
}

/**
 * Open reassign server modal.
 */
export async function openReassignModal(orderId, tableLabel, currentServerId, currentServerName) {
  const modal = document.getElementById('reassignTableModal');
  const sub = document.getElementById('reassignModalSub');
  const orderIdInput = document.getElementById('reassignOrderId');
  const select = document.getElementById('reassignServerSelect');
  if (!modal || !select) return;

  orderIdInput.value = orderId;
  if (sub) {
    sub.innerText = `Assign staff to ${tableLabel} (Currently: ${currentServerName || 'Unassigned'})`;
  }

  if (state.employeesList.length === 0) {
    try {
      const restCode = localStorage.getItem('benzin_restaurant_code') || '4821';
      const r = await fetch(`${API_URL}/api/auth/staff-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_code: restCode })
      });
      const d = await r.json();
      if (d.success && Array.isArray(d.staff)) {
        state.employeesList = d.staff;
      }
    } catch (_) {}
  }

  select.innerHTML = state.employeesList.map(e => {
    const eid = e.id || e._id;
    const isSelected = (currentServerId && eid === currentServerId) || 
                       (currentServerName && e.name && e.name.toLowerCase() === currentServerName.toLowerCase());
    return `<option value="${eid}" ${isSelected ? 'selected' : ''}>${escapeHtml(e.name)} (${e.role || 'Staff'})</option>`;
  }).join('');

  modal.style.display = 'flex';
}

/**
 * Close reassign server modal.
 */
export function closeReassignModal() {
  const modal = document.getElementById('reassignTableModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Submit server reassignment for selected order.
 */
export async function submitReassignModal() {
  const orderIdInput = document.getElementById('reassignOrderId');
  const select = document.getElementById('reassignServerSelect');
  if (!orderIdInput || !select) return;

  const orderId = orderIdInput.value;
  const serverId = select.value;
  const serverName = select.options[select.selectedIndex]?.text?.split(' (')[0] || select.value;

  closeReassignModal();
  await assignTableOrder(orderId, serverId, serverName);
}

/**
 * Open modal to add new dining table or patio booth.
 */
export function openAddTableModal() {
  const modal = document.getElementById('addTableModal');
  if (!modal) return;
  let nextNum = 1;
  if (Array.isArray(state.tablesList) && state.tablesList.length > 0) {
    const maxNum = state.tablesList.reduce((m, t) => {
      const num = t.table_number || t.number || 0;
      return num < 100 ? Math.max(m, num) : m;
    }, 0);
    nextNum = maxNum + 1;
  }
  const numInput = document.getElementById('addTableNumber');
  const labelInput = document.getElementById('addTableLabel');
  const capInput = document.getElementById('addTableCapacity');
  if (numInput) numInput.value = nextNum;
  if (labelInput) labelInput.value = `Table ${nextNum}`;
  if (capInput) capInput.value = '4';
  modal.style.display = 'flex';
  refreshIcons();
}

/**
 * Close add table modal.
 */
export function closeAddTableModal() {
  const modal = document.getElementById('addTableModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Submit creation of a new table.
 */
export async function submitAddTable() {
  const numInput = document.getElementById('addTableNumber');
  const labelInput = document.getElementById('addTableLabel');
  const capInput = document.getElementById('addTableCapacity');

  const rawNum = (numInput?.value || '').trim();
  const rawLabel = (labelInput?.value || '').trim();
  const capacity = parseInt(capInput?.value, 10) || 4;

  if (!rawNum && !rawLabel) {
    alert('Please enter a table number or label (e.g. 15, P1, VIP-2).');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/tables`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ number: rawNum, label: rawLabel, capacity })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(`Could not create table: ${data.message || data.error || 'Server error'}`);
      return;
    }
    closeAddTableModal();
    await renderTablesPage(true);
  } catch (err) {
    alert('Error creating table: ' + err.message);
  }
}

/**
 * Open edit table modal.
 */
export function openEditTableModal(tableId, label, number, capacity) {
  const modal = document.getElementById('editTableModal');
  const idInput = document.getElementById('editTableId');
  const numInput = document.getElementById('editTableNumber');
  const labelInput = document.getElementById('editTableLabel');
  const capInput = document.getElementById('editTableCapacity');
  const sub = document.getElementById('editTableModalSub');
  if (!modal) return;

  const isPatio = /^p\d+/i.test(label || '') || (label || '').toLowerCase().includes('patio');
  const displayNum = isPatio ? label : (number && number < 100 ? number : label);

  if (idInput) idInput.value = tableId;
  if (numInput) numInput.value = displayNum || '';
  if (labelInput) labelInput.value = label || '';
  if (capInput) capInput.value = capacity || 4;
  if (sub) sub.innerText = `Editing ${label || 'Table ' + number}`;

  modal.style.display = 'flex';
  refreshIcons();
}

/**
 * Close edit table modal.
 */
export function closeEditTableModal() {
  const modal = document.getElementById('editTableModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Submit table update changes.
 */
export async function submitEditTable() {
  const idInput = document.getElementById('editTableId');
  const numInput = document.getElementById('editTableNumber');
  const labelInput = document.getElementById('editTableLabel');
  const capInput = document.getElementById('editTableCapacity');

  const tableId = idInput?.value;
  if (!tableId) return;

  const rawNum = (numInput?.value || '').trim();
  const rawLabel = (labelInput?.value || '').trim();
  const capacity = parseInt(capInput?.value, 10) || 4;

  if (!rawNum && !rawLabel) {
    alert('Please enter a valid table number or label.');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/tables/${tableId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ number: rawNum, label: rawLabel, capacity })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(`Could not update table: ${data.message || data.error || 'Server error'}`);
      return;
    }
    closeEditTableModal();
    await renderTablesPage(true);
  } catch (err) {
    alert('Error updating table: ' + err.message);
  }
}

/**
 * Delete table permanently from the floor plan.
 */
export async function submitDeleteTableFromModal() {
  const idInput = document.getElementById('editTableId');
  const labelInput = document.getElementById('editTableLabel');
  const tableId = idInput?.value;
  const label = labelInput?.value || 'this table';
  if (!tableId) return;

  if (!confirm(`Are you sure you want to delete ${label}?\n\nThis will remove it from the floor.`)) {
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/tables/${tableId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(`Could not delete table: ${data.message || data.error || 'Server error'}`);
      return;
    }
    closeEditTableModal();
    await renderTablesPage(true);
  } catch (err) {
    alert('Error deleting table: ' + err.message);
  }
}
