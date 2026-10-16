/**
 * Benzin Hospitality OS — Kitchen Display System & Order Management
 * Native ES Module: kds.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml, escapeJs, refreshIcons } from './utils.js';

/**
 * Consolidate and deduplicate order line items for clean ticket display.
 */
export function consolidateItems(itemList) {
  if (!itemList || !Array.isArray(itemList)) return [];
  const map = new Map();
  itemList.forEach(item => {
    if (!item) return;
    let nameStr = typeof item === 'string' ? item : (item.name || item.item?.name || item.flavor?.name || item.title || 'Item');
    const modsList = Array.isArray(item.modifiers) ? item.modifiers : (Array.isArray(item.selectedModifiers) ? item.selectedModifiers : (Array.isArray(item.item?.modifiers) ? item.item.modifiers : []));
    const modStr = modsList.map(m => m.optionName || m.name || m.label).filter(Boolean).join(' · ');
    const rawNote = item.notes || item.note || item.item?.note || item.item?.notes || '';
    let noteStr = [rawNote, modStr && !rawNote.includes(modStr) ? modStr : ''].filter(Boolean).join(' · ');
    
    // If name is generic Soft Drinks, enrich it with the selected flavor if available
    if ((nameStr.toLowerCase().includes('soft drink') || nameStr.toLowerCase().includes('soda')) && noteStr) {
      const cleanNote = noteStr.replace(/^Choice:\s*/i, '').trim();
      if (cleanNote) {
        nameStr = `${nameStr} (${cleanNote})`;
      }
    }

    const normKey = `${nameStr}:::${noteStr}`.trim().toLowerCase();
    const existing = map.get(normKey);
    const itemQty = Number(item.qty || item.quantity) || 1;

    if (existing) {
      existing.qty += itemQty;
    } else {
      map.set(normKey, {
        name: nameStr,
        price: item.price !== undefined ? Number(item.price) : (item.item?.price !== undefined ? Number(item.item.price) : 0),
        qty: itemQty,
        notes: noteStr,
        modifiers: modsList,
        emoji: item.emoji || item.item?.emoji || ''
      });
    }
  });
  return Array.from(map.values());
}

/**
 * Open the cash collection modal with computed balances.
 */
export function openCollectCashModal(orderId, grandTotal, totalPaid, totalDue) {
  document.getElementById('payOrderId').value = orderId;
  document.getElementById('payTotalDueVal').value = totalDue;
  document.getElementById('payGrandTotalText').innerText = `$${Number(grandTotal || 0).toFixed(2)}`;
  document.getElementById('payAlreadyPaidText').innerText = `$${Number(totalPaid || 0).toFixed(2)}`;
  document.getElementById('payRemainingDueText').innerText = `$${Number(totalDue || 0).toFixed(2)}`;
  document.getElementById('cashTenderedInput').value = Number(totalDue || 0).toFixed(2);
  calculateCashChange();
  document.getElementById('collectCashModal').style.display = 'flex';
}

/**
 * Close the cash collection modal.
 */
export function closeCollectCashModal() {
  document.getElementById('collectCashModal').style.display = 'none';
}

/**
 * Calculate change due based on cash tendered vs amount due.
 */
export function calculateCashChange() {
  const due = parseFloat(document.getElementById('payTotalDueVal').value) || 0;
  const tendered = parseFloat(document.getElementById('cashTenderedInput').value) || 0;
  const change = Math.max(0, tendered - due);
  document.getElementById('cashChangeAmount').innerText = `$${change.toFixed(2)}`;
}

/**
 * Submit cash payment to the server and update live balances.
 */
export async function submitCashPayment() {
  const orderId = document.getElementById('payOrderId').value;
  const due = parseFloat(document.getElementById('payTotalDueVal').value) || 0;
  const tendered = parseFloat(document.getElementById('cashTenderedInput').value) || 0;

  if (isNaN(tendered) || tendered <= 0) {
    alert('Please enter a valid cash tendered amount');
    return;
  }

  if (tendered < due) {
    if (!confirm(`Cash tendered ($${tendered.toFixed(2)}) is less than remaining due ($${due.toFixed(2)}). Process partial payment?`)) {
      return;
    }
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/collect-cash`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId, amount: Math.min(tendered, due) })
    });
    const data = await res.json();
    if (data.success) {
      closeCollectCashModal();
      if (typeof window.loadData === 'function') await window.loadData();
      if (state.activeTab === 'sales' && typeof window.renderSalesPage === 'function') {
        await window.renderSalesPage();
      }
    } else {
      alert('Could not record cash payment: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error recording payment: ' + err.message);
  }
}

/**
 * Render individual KDS ticket card.
 * Preserves Hookah Ice Base, Ice Hose, server requests, readiness badges, and staff badges.
 */
export function renderTicketCard(order, isFulfilled = false) {
  const isFulfilledOrder = Boolean(isFulfilled || order.status === 'fulfilled' || order.status === 'completed' || order.closedSession || (order.fulfilledDepartments && order.fulfilledDepartments.length > 0));
  const orderId = order.id || order._id || 'ORD-000';
  const displayId = String(orderId).slice(-6).toUpperCase();
  const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

  const cleanTable = String(order.table || order.table_id || '?').replace(/^table[\s-_]*/i, '').trim() || '?';
  
  // ── SPECIAL RENDERING FOR SERVER CALL ASSISTANCE REQUESTS ──
  if (order.kind === 'server_request' || order.requestType) {
    const reqLabels = {
      server: 'Server Assistance Needed 🛎️',
      coals: 'Hookah Coal Refill 🔥',
      water: 'Ice Water Refresh 💧',
      utensils: 'Plates & Utensils 🍽️',
      check: 'Bill / Check Requested 💳',
    };
    const reqTitle = order.notes || order.note || reqLabels[order.requestType] || 'Server Assistance Needed 🛎️';
    const assignedName = order.assigned_server_name || order.assignedServerName || order.server_name || order.serverName || (order.metadata && order.metadata.server_name);
    return `
      <div class="ticket-card server-call-ticket ${isFulfilledOrder ? 'fulfilled' : ''}" style="border: 2px solid ${isFulfilledOrder ? 'var(--border)' : '#e11d48'}; box-shadow: ${isFulfilledOrder ? 'none' : '0 0 24px rgba(225,29,72,0.28)'};">
        <div class="ticket-header" style="background: ${isFulfilledOrder ? 'transparent' : 'rgba(225,29,72,0.12)'}; padding: 8px 12px; border-radius: 8px; margin-bottom: 12px;">
          <div>
            <div class="ticket-title" style="color: ${isFulfilledOrder ? 'var(--muted)' : '#f43f5e'}; font-size: 19px; font-weight: 900; letter-spacing: 0.5px;">
              🛎️ Table ${cleanTable} <span style="font-size:12px; color:var(--muted);">#${displayId}</span>
            </div>
            <div class="ticket-meta">👤 Table ${cleanTable} • 🕒 ${timeStr}${assignedName ? ` • 🍽️ Served by: <strong style="color:var(--cream);">${escapeHtml(assignedName)}</strong>` : ''}</div>
          </div>
          <span class="ticket-badge" style="background: ${isFulfilledOrder ? 'var(--muted)' : '#e11d48'}; color: #fff; font-weight: 900; padding: 4px 10px; border-radius: 6px; font-size: 11px;">
            ${isFulfilledOrder ? 'DISMISSED' : 'CALL SERVER'}
          </span>
        </div>
        ${isFulfilledOrder ? `
          <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:6px 12px; font-size:12px;">
            <span style="color:var(--success); font-weight:800; display:flex; align-items:center; gap:6px;">
              <i data-lucide="user-check" style="width:14px; height:14px;"></i> Served by: <strong style="color:var(--cream); font-size:13px; font-weight:900;">${escapeHtml(assignedName || 'Staff')}</strong>
            </span>
            <span style="font-size:10px; background:rgba(34,197,94,0.2); color:var(--success); border:1px solid rgba(34,197,94,0.4); padding:2px 7px; border-radius:10px; font-weight:800; text-transform:uppercase;">Archived</span>
          </div>
        ` : ''}
        <div style="background: rgba(255,255,255,0.03); border: 1.5px solid ${isFulfilledOrder ? 'rgba(255,255,255,0.08)' : 'rgba(225,29,72,0.3)'}; border-radius: 12px; padding: 18px 14px; text-align: center; margin-bottom: 14px;">
          <div style="font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 6px;">${reqTitle}</div>
          <div style="font-size: 13px; color: var(--gold); font-weight: 700;">Customer at Table ${cleanTable} is waiting for staff</div>
        </div>
        <div class="ticket-actions">
          ${!isFulfilledOrder ? `
            <button class="btn btn-primary" onclick="fulfillOrder('${orderId}')" style="background:#10b981; border-color:#10b981; font-weight:900; flex:1; padding:12px; font-size:14px; display:flex; align-items:center; justify-content:center; gap:8px;">
              <i data-lucide="check-circle" style="width:18px;height:18px;"></i> Complete / Dismiss
            </button>
          ` : `
            <div style="color:var(--muted); font-size:12px; text-align:center; width:100%; padding:6px 0; font-weight:700;">✓ Request Completed • Handled by: <strong>${escapeHtml(assignedName || 'Staff')}</strong></div>
          `}
        </div>
      </div>
    `;
  }

  // Consolidate hookahs, food, and drinks from both specialized arrays and generic items array
  let rawHookahs = Array.isArray(order.hookahs) ? [...order.hookahs] : [];
  let rawFood = Array.isArray(order.food) ? [...order.food] : [];
  let rawDrinks = Array.isArray(order.drinks) ? [...order.drinks] : [];

  const isHookahFn = (it) => {
    const cat = (it.category || '').toLowerCase();
    const name = (it.name || '').toLowerCase();
    return cat === 'hookah' || name.includes('hookah') || it.emoji === '💨' || it.emoji === '🧪';
  };
  const isDrinkFn = (it) => {
    const cat = (it.category || '').toLowerCase();
    const name = (it.name || '').toLowerCase();
    return cat === 'drinks' || cat === 'beverage' || name.includes('drink') || name.includes('water') || name.includes('cola') || name.includes('soda') || name.includes('red bull') || it.emoji === '🥤' || it.emoji === '🍹' || it.emoji === '🍸';
  };

  rawFood = rawFood.filter(it => !isHookahFn(it) && !isDrinkFn(it));
  rawDrinks = rawDrinks.filter(it => isDrinkFn(it) && !isHookahFn(it));
  rawHookahs = rawHookahs.filter(it => isHookahFn(it));

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach(it => {
      const isHookah = isHookahFn(it);
      const isDrink = isDrinkFn(it);
      
      if (isHookah) {
        const alreadyInHookahs = rawHookahs.some(h => (h.flavor?.name || h.name) === it.name);
        if (!alreadyInHookahs) {
          rawHookahs.push({
            flavor: { name: it.name, id: it.id },
            name: it.name,
            qty: it.qty || it.quantity || 1,
            price: it.price || 0,
            modifiers: it.modifiers,
            notes: it.notes || it.note || (it.modifiers ? it.modifiers.map(m => m.optionName || m.name).join(' · ') : '')
          });
        }
      } else if (isDrink) {
        rawFood = rawFood.filter(f => (f.item?.name || f.name) !== it.name);
        const alreadyInDrinks = rawDrinks.some(d => (d.item?.name || d.name) === it.name);
        if (!alreadyInDrinks) {
          rawDrinks.push({
            item: { name: it.name, price: it.price, emoji: it.emoji },
            name: it.name,
            qty: it.qty || it.quantity || 1,
            modifiers: it.modifiers,
            note: it.notes || it.note
          });
        }
      } else {
        const alreadyInFood = rawFood.some(f => (f.item?.name || f.name) !== it.name);
        if (!alreadyInFood) {
          rawFood.push({
            item: { name: it.name, price: it.price, emoji: it.emoji },
            name: it.name,
            qty: it.qty || it.quantity || 1,
            modifiers: it.modifiers,
            note: it.notes || it.note
          });
        }
      }
    });
  }

  // Ensure rawFood never contains any soft drinks or beverage items
  rawFood = rawFood.filter(f => {
    const fName = String(f.item?.name || f.name || '').toLowerCase();
    const fCat = String(f.category || f.category_id || f.item?.category || '').toLowerCase();
    const isDrink = fCat === 'drinks' || fCat === 'beverages' || fCat.includes('drink') || fCat.includes('beverage') || fCat.includes('soft') || fName.includes('cola') || fName.includes('coca') || fName.includes('coke') || fName.includes('sprite') || fName.includes('fanta') || fName.includes('ginger ale') || fName.includes('pepper') || fName.includes('soda') || fName.includes('water') || fName.includes('juice') || fName.includes('tea') || fName.includes('chai') || fName.includes('coffee') || fName.includes('red bull') || f.emoji === '🥤' || f.emoji === '🍹' || f.item?.emoji === '🥤' || f.item?.emoji === '🍹';
    return !isDrink;
  });

  const foodItems = consolidateItems(rawFood);
  const drinkItems = consolidateItems(rawDrinks);
  const hookahItems = consolidateItems(rawHookahs);

  const fulDeps = order.fulfilledDepartments || [];
  const foodDone = fulDeps.includes('food');
  const barDone = fulDeps.includes('bar');
  const hookahDone = fulDeps.includes('hookah');

  let readinessBadges = '';
  if (foodItems.length > 0) readinessBadges += `<span style="background:${foodDone ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}; color:${foodDone ? 'var(--success)' : 'var(--danger)'}; border:1px solid ${foodDone ? 'var(--success)' : 'var(--danger)'}; border-radius:4px; padding:1px 5px; font-size:9px; font-weight:700;">${foodDone ? '✅ Food Ready' : '⏳ Food Pending'}</span> `;
  if (drinkItems.length > 0) readinessBadges += `<span style="background:${barDone ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}; color:${barDone ? 'var(--success)' : 'var(--danger)'}; border:1px solid ${barDone ? 'var(--success)' : 'var(--danger)'}; border-radius:4px; padding:1px 5px; font-size:9px; font-weight:700;">${barDone ? '✅ Bar Ready' : '⏳ Bar Pending'}</span> `;
  if (hookahItems.length > 0) readinessBadges += `<span style="background:${hookahDone ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}; color:${hookahDone ? 'var(--success)' : 'var(--danger)'}; border:1px solid ${hookahDone ? 'var(--success)' : 'var(--danger)'}; border-radius:4px; padding:1px 5px; font-size:9px; font-weight:700;">${hookahDone ? '✅ Hookah Ready' : '⏳ Hookah Pending'}</span>`;

  const subtotal = order.subtotal !== undefined ? Number(order.subtotal) : (order.total || 0);
  const taxAmount = Number(order.taxAmount || order.tax_amount || 0);
  const gratuityAmount = Number(order.gratuityAmount || order.gratuity_amount || order.tipAmount || order.tip_amount || 0);
  const grandTotal = Number(order.grandTotal !== undefined ? order.grandTotal : (order.grand_total !== undefined ? order.grand_total : (order.total || 0)));
  const totalPaid = Number(order.totalPaid) || (order.paymentStatus === 'paid' || order.payment_status === 'paid' ? grandTotal : 0);
  const totalDue = order.totalDue !== undefined ? Number(order.totalDue) : Math.max(0, grandTotal - totalPaid);
  const isFullyPaid = totalDue <= 0.01 || order.paymentStatus === 'paid' || order.payment_status === 'paid';

  let billingStatusBadge = '';
  if (isFullyPaid) {
    billingStatusBadge = `<span style="background:rgba(34,197,94,0.15); color:var(--success); border:1px solid var(--success); border-radius:4px; padding:1px 5px; font-size:9px; font-weight:800;">💵 PAID IN FULL ($${grandTotal.toFixed(2)})</span>`;
  } else if (totalPaid > 0) {
    billingStatusBadge = `<span style="background:rgba(229,177,58,0.15); color:var(--gold); border:1px solid var(--gold); border-radius:4px; padding:1px 5px; font-size:9px; font-weight:800;">💳 PARTIAL (Paid: $${totalPaid.toFixed(2)}, Due: $${totalDue.toFixed(2)})</span>`;
  } else {
    billingStatusBadge = `<span style="background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid var(--danger); border-radius:4px; padding:1px 5px; font-size:9px; font-weight:800;">🔴 UNPAID (Due: $${totalDue.toFixed(2)})</span>`;
  }

  let itemsHtml = '';
  if (foodItems.length > 0) {
    itemsHtml += `<div class="ticket-item-group-title">🍔 KITCHEN</div>`;
    foodItems.forEach(item => {
      const qtyTag = item.qty > 1 ? `<span style="color:var(--gold); font-weight:900;">x${item.qty}</span>` : '';
      itemsHtml += `<div class="ticket-item-line"><span>${item.name} ${qtyTag}</span></div>`;
      if (item.notes) itemsHtml += `<div class="ticket-item-note">Note: ${item.notes}</div>`;
    });
  }
  if (drinkItems.length > 0) {
    itemsHtml += `<div class="ticket-item-group-title">🍸 BAR</div>`;
    drinkItems.forEach(item => {
      const qtyTag = item.qty > 1 ? `<span style="color:var(--gold); font-weight:900;">x${item.qty}</span>` : '';
      itemsHtml += `<div class="ticket-item-line"><span>${item.name} ${qtyTag}</span></div>`;
      if (item.notes) itemsHtml += `<div class="ticket-item-note">Note: ${item.notes}</div>`;
    });
  }
  if (hookahItems.length > 0) {
    itemsHtml += `<div class="ticket-item-group-title">💨 HOOKAH</div>`;
    hookahItems.forEach(item => {
      const qtyTag = item.qty > 1 ? `<span style="color:var(--gold); font-weight:900;">x${item.qty}</span>` : '';
      const noteText = (item.notes || '') + ' ' + (item.note || '');
      const modsList = Array.isArray(item.modifiers) ? item.modifiers : [];
      const modText = modsList.map(m => m.optionName || m.name || '').join(' ');
      const fullText = (noteText + ' ' + modText + ' ' + item.name).toLowerCase();

      // Hookah requirements: preserve both Ice Base and Ice Hose options
      const hasIceBase = fullText.includes('ice base') || modsList.some(m => (m.optionName || m.name || m.id || '').toLowerCase().includes('ice_base') || (m.optionName || m.name || '').toLowerCase().includes('ice base'));
      const hasIceHose = fullText.includes('ice hose') || modsList.some(m => (m.optionName || m.name || m.id || '').toLowerCase().includes('ice_hose') || (m.optionName || m.name || '').toLowerCase().includes('ice hose'));

      let enhancementPills = '';
      if (hasIceBase) {
        enhancementPills += `<span style="display:inline-flex; align-items:center; gap:3px; background:rgba(0,153,255,0.22); color:#38BDF8; border:1.5px solid #0099FF; border-radius:6px; padding:2px 7px; font-size:11px; font-weight:900; margin-left:6px; vertical-align:middle; text-shadow:0 0 8px rgba(0,153,255,0.4);">🧊 ICE BASE</span>`;
      }
      if (hasIceHose) {
        enhancementPills += `<span style="display:inline-flex; align-items:center; gap:3px; background:rgba(20,184,166,0.22); color:#2DD4BF; border:1.5px solid #14B8A6; border-radius:6px; padding:2px 7px; font-size:11px; font-weight:900; margin-left:6px; vertical-align:middle; text-shadow:0 0 8px rgba(20,184,166,0.4);">❄️ ICE HOSE</span>`;
      }

      itemsHtml += `<div class="ticket-item-line" style="display:flex; align-items:center; flex-wrap:wrap; gap:4px; margin-bottom:4px;"><span>💨 <strong>${item.name}</strong> ${qtyTag}</span> ${enhancementPills}</div>`;
      if (item.notes) itemsHtml += `<div class="ticket-item-note" style="color:#FBBF24; font-weight:700; margin-bottom:6px;">📝 Note: ${item.notes}</div>`;
    });
  }

  const assignedName = order.assigned_server_name || order.assignedServerName || order.server_name || order.serverName || (order.metadata && order.metadata.server_name);
  const assignedId = order.assigned_server_id || order.assignedServerId || order.server_id || order.serverId;
  const myId = localStorage.getItem('benzin_user_id') || '';
  const myName = localStorage.getItem('benzin_user_name') || 'Me';
  const myRole = (localStorage.getItem('benzin_user_role') || 'server').toLowerCase();
  const canAssign = ['owner', 'manager', 'platform_admin', 'admin', 'host', 'server'].includes(myRole);

  let serverBadgeHtml = '';
  if (!isFulfilledOrder) {
    if (!assignedName) {
      serverBadgeHtml = `
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(245,158,11,0.12); border:1px dashed #f59e0b; border-radius:8px; padding:4px 10px; font-size:11px;">
          <span style="color:#f59e0b; font-weight:800;">👤 Server: <em>Unassigned</em></span>
          ${canAssign ? `<button class="btn btn-primary" onclick="openReassignModal('${orderId}', '${cleanTable}', '', 'Unassigned')" style="background:#0066FF; padding:3px 9px; font-size:11px; font-weight:800; border-radius:6px; min-height:unset;">Assign Server</button>` : `<span style="font-size:11px; color:var(--muted); font-weight:700;">Awaiting Assignment</span>`}
        </div>
      `;
    } else if (assignedId === myId || assignedName === myName) {
      serverBadgeHtml = `
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(16,185,129,0.15); border:1px solid #10B981; border-radius:8px; padding:4px 10px; font-size:11px;">
          <span style="color:#10B981; font-weight:800;">✓ Assigned to me (${escapeHtml(assignedName)})</span>
          ${canAssign ? `<button class="btn" onclick="unassignTableOrder('${orderId}')" style="padding:2px 8px; font-size:11px; color:var(--danger); border-color:rgba(239,68,68,0.3); min-height:unset;">Release</button>` : ''}
        </div>
      `;
    } else {
      serverBadgeHtml = `
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background:var(--card2); border:1px solid var(--line); border-radius:8px; padding:4px 10px; font-size:11px;">
          <span style="color:var(--cream); font-weight:800;">👤 Server: <strong>${escapeHtml(assignedName)}</strong></span>
          ${canAssign ? `<button class="btn" onclick="openReassignModal('${orderId}', '${cleanTable}', '${escapeJs(assignedId)}', '${escapeJs(assignedName)}')" style="padding:2px 8px; font-size:11px; color:#60a5fa; border-color:rgba(59,130,246,0.3); min-height:unset;">Reassign</button>` : `<span style="font-size:11px; color:var(--muted); font-weight:700;">Assigned</span>`}
        </div>
      `;
    }
  } else {
    // FULFILLED / ARCHIVED TICKET: Display server who served clearly
    if (assignedName) {
      serverBadgeHtml = `
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:6px 12px; font-size:12px;">
          <span style="color:var(--success); font-weight:800; display:flex; align-items:center; gap:6px;">
            <i data-lucide="user-check" style="width:14px; height:14px;"></i> Served by: <strong style="color:var(--cream); font-size:13px; font-weight:900;">${escapeHtml(assignedName)}</strong>
          </span>
          <span style="font-size:10px; background:rgba(34,197,94,0.2); color:var(--success); border:1px solid rgba(34,197,94,0.4); padding:2px 7px; border-radius:10px; font-weight:800; text-transform:uppercase;">Archived</span>
        </div>
      `;
    } else {
      serverBadgeHtml = `
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:6px 12px; font-size:12px;">
          <span style="color:#f59e0b; font-weight:800; display:flex; align-items:center; gap:6px;">
            <i data-lucide="user" style="width:14px; height:14px;"></i> Served by: <strong style="color:var(--cream); font-size:13px; font-weight:900;">Staff</strong>
          </span>
          <button class="btn btn-primary" onclick="assignTableOrder('${orderId}')" style="background:#0066FF; padding:3px 9px; font-size:11px; font-weight:800; border-radius:6px; min-height:unset;">Assign Server</button>
        </div>
      `;
    }
  }

  return `
    <div class="ticket-card ${isFulfilledOrder ? 'fulfilled' : ''}">
      <div class="ticket-header">
        <div>
          <div class="ticket-title">Table ${cleanTable} <span style="font-size:12px; color:var(--muted);">#${displayId}</span></div>
          <div class="ticket-meta">👤 ${escapeHtml(order.customerNickname || order.customerName || 'Guest')} • 🕒 ${timeStr}${assignedName ? ` • 🍽️ Served by: <strong style="color:var(--cream);">${escapeHtml(assignedName)}</strong>` : ''}</div>
        </div>
        <span class="ticket-badge ${isFulfilledOrder ? 'badge-fulfilled' : order.status === 'ready' ? 'badge-ready' : order.status === 'preparing' ? 'badge-preparing' : 'badge-pending'}">${(order.status || 'PENDING').toUpperCase()}</span>
      </div>
      ${serverBadgeHtml}
      <div style="margin-bottom:6px; display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
        ${readinessBadges}
        ${billingStatusBadge}
      </div>
      <div class="ticket-items">${itemsHtml}</div>
      ${order.notes ? `<div class="ticket-note">📝 ${order.notes}</div>` : ''}
      <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border); font-size:11px; color:var(--muted);">
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span>Sales Tax (8.25%)</span>
          <span>$${taxAmount.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span>Gratuity (18%)</span>
          <span>$${gratuityAmount.toFixed(2)}</span>
        </div>
      </div>
      <div class="ticket-total-row" style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
        <span style="font-weight:700;">TOTAL DUE</span>
        <span style="font-weight:900; color:${isFullyPaid ? 'var(--success)' : 'var(--gold)'};">$${totalDue.toFixed(2)}</span>
      </div>
      <div class="ticket-actions">
        ${!isFulfilledOrder ? `
          <button class="btn" onclick="updateOrderStatus('${orderId}', 'preparing')" style="background:rgba(59,130,246,0.15); border-color:#3B82F6; color:#60A5FA; font-weight:800; font-size:11px; padding:4px 8px;">👨‍🍳 Prep</button>
          <button class="btn" onclick="updateOrderStatus('${orderId}', 'ready')" style="background:rgba(245,158,11,0.15); border-color:#F59E0B; color:#FBBF24; font-weight:800; font-size:11px; padding:4px 8px;">🔔 Ready</button>
          <button class="btn btn-primary" onclick="fulfillOrder('${orderId}')" style="background:var(--success); border-color:var(--success); font-weight:800; font-size:11px; padding:4px 8px;"><i data-lucide="check-circle" style="width:13px;height:13px;"></i> Serve</button>
        ` : ''}
        <button class="btn" style="background:rgba(229,177,58,0.15); border-color:var(--gold); color:var(--gold); font-weight:800; font-size:11px; padding:4px 8px;" onclick="openCollectCashModal('${orderId}', ${grandTotal}, ${totalPaid}, ${totalDue})">💵 Pay Cash</button>
        <button class="btn" style="font-size:11px; padding:4px 8px;" onclick="printTicket('${orderId}')"><i data-lucide="printer" style="width:13px;height:13px;"></i> Print</button>
      </div>
    </div>
  `;
}

/**
 * Render active and archived KDS tickets grid.
 */
export function renderOrders() {
  const kdsContainer = document.getElementById('ticketsGrid');
  const archiveContainer = document.getElementById('archiveTicketsGrid');

  const activeOrders = state.orders.filter(o => {
    const isFulfilled = o.status === 'fulfilled' || o.status === 'completed' || o.closedSession;
    const hasFulfilledDeps = o.fulfilledDepartments && o.fulfilledDepartments.length > 0;
    return !isFulfilled && !hasFulfilledDeps;
  });

  const archivedOrders = state.orders.filter(o => {
    const isFulfilled = o.status === 'fulfilled' || o.status === 'completed' || o.closedSession;
    const hasFulfilledDeps = o.fulfilledDepartments && o.fulfilledDepartments.length > 0;
    return isFulfilled || hasFulfilledDeps;
  });

  if (kdsContainer) {
    if (activeOrders.length === 0) {
      kdsContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 60px; text-align: center; color: var(--muted); font-size: 16px;">
        <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
        <div>No active live tickets. New orders will appear here automatically in real time!</div>
      </div>`;
    } else {
      kdsContainer.innerHTML = activeOrders.map(o => renderTicketCard(o, false)).join('');
    }
  }

  if (archiveContainer) {
    if (archivedOrders.length === 0) {
      archiveContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 60px; text-align: center; color: var(--muted); font-size: 16px;">
        <i data-lucide="archive" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
        <div>Archive is currently empty. Fulfilled tickets will be stored here.</div>
      </div>`;
    } else {
      archiveContainer.innerHTML = archivedOrders.map(o => renderTicketCard(o, true)).join('');
    }
  }

  refreshIcons();
}

/**
 * Mark order as fulfilled / served.
 */
export async function fulfillOrder(orderId) {
  try {
    const headers = getAuthHeaders();
    const myId = localStorage.getItem('benzin_user_id') || '';
    const myName = localStorage.getItem('benzin_user_name') || '';
    const res = await fetch(`${API_URL}/api/orders/fulfill`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        orderId, 
        department: 'all',
        server_id: myId,
        server_name: myName
      })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.loadData === 'function') await window.loadData();
      if (typeof window.loadServiceRequests === 'function') await window.loadServiceRequests();
    } else {
      alert('Could not fulfill order: ' + (data.message || data.error || 'Error'));
    }
  } catch (err) {
    alert('Error fulfilling order: ' + err.message);
  }
}

/**
 * Update order lifecycle status (e.g. preparing, ready).
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const headers = getAuthHeaders();
    const myId = localStorage.getItem('benzin_user_id') || '';
    const myName = localStorage.getItem('benzin_user_name') || '';
    const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        status,
        server_id: myId,
        server_name: myName
      })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not update order status: ' + (data.message || data.error || 'Error'));
    }
  } catch (err) {
    alert('Error updating order status: ' + err.message);
  }
}

/**
 * Print order ticket receipt.
 */
export function printTicket(orderId) {
  const order = state.orders.find(o => String(o.id) === String(orderId) || String(o._id) === String(orderId));
  if (!order) return;
  const printArea = document.getElementById('print-area');
  if (!printArea) return;
  printArea.innerHTML = `
    <div style="font-family: monospace; width: 3in; padding: 10px; background: #fff; color: #000;">
      <h2 style="text-align: center; margin-bottom: 5px;">CAVALLI</h2>
      <div style="text-align: center; font-size: 11px; margin-bottom: 10px;">Order #${String(orderId).slice(-6).toUpperCase()}</div>
      <hr style="border-top: 1px dashed #000; margin: 5px 0;">
      <div><strong>Table:</strong> Table ${String(order.table || order.table_id || '?').replace(/^table[\s-_]*/i, '').trim() || '?'}</div>
      <div><strong>Guest:</strong> ${order.customerName || 'Guest'}</div>
      ${(order.assigned_server_name || order.assignedServerName) ? `<div><strong>Server:</strong> ${escapeHtml(order.assigned_server_name || order.assignedServerName)}</div>` : ''}
      <hr style="border-top: 1px dashed #000; margin: 5px 0;">
      ${(order.items || []).map(i => `<div>${i.qty || 1}x ${i.name} - $${((i.price || 0) * (i.qty || 1)).toFixed(2)}</div>`).join('')}
      <hr style="border-top: 1px dashed #000; margin: 5px 0;">
      <div style="display: flex; justify-content: space-between; font-size: 11px;">
        <span>Subtotal:</span>
        <span>$${(order.subtotal !== undefined ? Number(order.subtotal) : (order.total || 0)).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px;">
        <span>Sales Tax (8.25%):</span>
        <span>$${Number(order.taxAmount || order.tax_amount || 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px;">
        <span>Gratuity (18%):</span>
        <span>$${Number(order.gratuityAmount || order.gratuity_amount || order.tipAmount || order.tip_amount || 0).toFixed(2)}</span>
      </div>
      <hr style="border-top: 1px dashed #000; margin: 5px 0;">
      <div style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>TOTAL DUE:</span>
        <span>$${(order.totalDue !== undefined ? Number(order.totalDue) : (order.grandTotal || order.total || 0)).toFixed(2)}</span>
      </div>
    </div>
  `;
  window.print();
}

/**
 * Permanently clear fulfilled orders from archive.
 */
export async function clearArchive() {
  if (!confirm('Permanently clear all fulfilled orders from the history archive?')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/archive/clear`, { method: 'POST', headers });
    const data = await res.json();
    if (data.success) {
      state.orders = state.orders.filter(o => o.status !== 'fulfilled' && o.status !== 'completed' && !o.closedSession);
      renderOrders();
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not clear archive: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Error clearing archive: ' + err.message);
  }
}
