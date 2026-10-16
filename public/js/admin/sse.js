/**
 * Benzin Hospitality OS — Real-Time SSE Stream & Order Sync
 * Native ES Module: sse.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { playOrderChime } from './utils.js';
import { renderOrders } from './kds.js';
import { renderTablesPage } from './tables.js';
import { fetchMenuCategories, loadMenuItems } from './menu.js';
import { fetchInventoryCategories, renderInventoryPage } from './inventory.js';
import { loadServiceRequests } from './service-requests.js';

let isFetchingOrders = false;

/**
 * Fetch authoritative live orders from backend with optimistic diff comparison.
 */
export async function fetchOrders(silent = true) {
  if (isFetchingOrders) return;
  isFetchingOrders = true;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders?_t=${Date.now()}`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const incomingOrders = data.orders;
        const existingIdSet = new Set(state.orders.map(o => o.id || o._id));

        // Detect newly placed unfulfilled tickets
        const hasNewUnfulfilled = incomingOrders.some(o => 
          !existingIdSet.has(o.id || o._id) && 
          o.status !== 'fulfilled' && 
          o.status !== 'completed' && 
          !o.closedSession
        );

        // Fast structural change comparison
        const serializeState = (arr) => arr.map(o => `${o.id || o._id}:${o.status}:${o.paymentStatus}:${o.assigned_server_id || ''}:${o.assigned_server_name || o.assignedServerName || ''}:${(o.fulfilledDepartments || []).join(',')}`).join('|');
        const stateChanged = incomingOrders.length !== state.orders.length || serializeState(incomingOrders) !== serializeState(state.orders);

        if (stateChanged || state.orders.length === 0) {
          state.orders = incomingOrders;
          renderOrders();
          if (state.activeTab === 'tables') {
            renderTablesPage();
          }

          if (hasNewUnfulfilled && silent) {
            playOrderChime();
          }
        }
      }
    }
  } catch (err) {
    if (!silent) console.error('Error fetching live orders:', err);
  } finally {
    isFetchingOrders = false;
  }
}

/**
 * Initial bulk data bootstrap for venue dashboard.
 */
export async function loadData() {
  try {
    const headers = getAuthHeaders();
    const storedVenueName = localStorage.getItem('benzin_restaurant_name');
    const nameEl = document.getElementById('currentRestaurantName');
    if (storedVenueName && nameEl) {
      nameEl.innerText = storedVenueName;
    }

    const restCode = localStorage.getItem('benzin_restaurant_code');
    if (restCode) {
      fetch(`${API_URL}/api/auth/staff-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_code: restCode })
      }).then(r => r.json()).then(data => {
        if (data.success && data.restaurant) {
          localStorage.setItem('benzin_restaurant_name', data.restaurant.name);
          if (nameEl) nameEl.innerText = data.restaurant.name;
        }
      }).catch(_ => {});
    }

    await Promise.all([
      fetchMenuCategories(),
      fetchInventoryCategories(),
      loadMenuItems()
    ]);

    const [_, invRes] = await Promise.all([
      fetchOrders(false),
      fetch(`${API_URL}/api/orders/inventory`, { headers })
    ]);

    const invData = await invRes.json();
    if (invData.success) {
      state.inventory = invData.inventory || invData.rawMaterials || {};
      renderInventoryPage();
    }

    // Load Hookah Station Coal Refill Requests
    await loadServiceRequests();
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
}

/**
 * Establish resilient Server-Sent Events (SSE) connection with automatic reconnect.
 */
export function connectSSE() {
  if (state.sseEventSource) {
    try { state.sseEventSource.close(); } catch (e) {}
    state.sseEventSource = null;
  }

  const token = localStorage.getItem('benzin_jwt_token') || '';
  const restId = localStorage.getItem('benzin_restaurant_id') || 'RES_EED4E9D266DF';
  const slug = localStorage.getItem('benzin_selected_slug') || 'cavalli';

  let sseUrl = `${API_URL}/api/orders/live?restaurant_id=${encodeURIComponent(restId)}&restaurant_slug=${encodeURIComponent(slug)}`;
  if (token) sseUrl += `&token=${encodeURIComponent(token)}`;

  console.log('📡 [SSE] Connecting to live order stream:', sseUrl);
  try {
    state.sseEventSource = new EventSource(sseUrl);
  } catch (err) {
    console.warn('⚠️ [SSE] Could not initialize EventSource:', err);
    return;
  }

  state.sseEventSource.onopen = function() {
    console.log('✅ [SSE] Real-time stream connected');
  };

  state.sseEventSource.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('📡 [SSE] Real-time event received:', data);

      if (data.type === 'ping') return;

      if (data.type === 'archive_cleared') {
        state.orders = state.orders.filter(o => o.status !== 'fulfilled' && o.status !== 'completed' && !o.closedSession);
        renderOrders();
        if (state.activeTab === 'tables') renderTablesPage();
        fetchOrders(true);
        return;
      }

      // Immediate optimistic merge into local ticket array for instant rendering
      const incomingOrder = data.order || (data.items || data.food || data.drinks || data.hookahs ? data : null);
      if (incomingOrder && (incomingOrder.id || incomingOrder._id)) {
        const incId = incomingOrder.id || incomingOrder._id;
        const existingIdx = state.orders.findIndex(o => (o.id || o._id) === incId);
        if (existingIdx >= 0) {
          state.orders[existingIdx] = { ...state.orders[existingIdx], ...incomingOrder };
        } else {
          state.orders.unshift(incomingOrder);
          playOrderChime();
        }
        renderOrders();
        if (state.activeTab === 'tables') renderTablesPage();
      } else if (
        data.type === 'order_created' || 
        data.type === 'new_order' || 
        data.type === 'order_updated' || 
        data.type === 'table_assigned' ||
        data.type === 'table_unassigned' ||
        data.type === 'table_reset' ||
        data.type === 'table_created' ||
        data.type === 'table_updated' ||
        data.type === 'table_deleted' ||
        data.type === 'server_request' || 
        data.kind === 'server_request' ||
        data.type === 'coal_refill_request' ||
        data.type === 'coal_refill_updated'
      ) {
        if (state.activeTab === 'tables') renderTablesPage();
        playOrderChime();
      }

      // Concurrently trigger background fetch to ensure authoritative persistence
      fetchOrders(true);
      if (data.type === 'coal_refill_request' || data.type === 'coal_refill_updated' || data.type === 'server_call') {
        loadServiceRequests();
      }
    } catch (err) {
      console.warn('Error processing SSE event:', err);
    }
  };

  state.sseEventSource.onerror = function() {
    console.warn('⚠️ [SSE] Connection lost. Reconnecting in 3 seconds...');
    try { state.sseEventSource.close(); } catch (e) {}
    state.sseEventSource = null;
    setTimeout(connectSSE, 3000);
  };
}
