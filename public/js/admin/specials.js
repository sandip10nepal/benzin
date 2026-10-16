/**
 * Benzin Hospitality OS — Daily & Weekly Restaurant Specials
 * Native ES Module: specials.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml } from './utils.js';

/**
 * Open specials modal and fetch active specials list from backend.
 */
export async function openSpecialsModal() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/menu/specials`, { headers });
    const data = await res.json();
    if (data.success && Array.isArray(data.specials)) {
      state.currentSpecials = data.specials;
    }
  } catch (err) {
    console.warn('Could not load specials:', err);
  }

  // Populate select with menu items
  const select = document.getElementById('specialsCatalogSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Select an item from Menu Catalog --</option>' +
      (state.menuItems || []).map(item => `
        <option value="${item.id || item._id}">${escapeHtml(item.name)} — $${(Number(item.price) || 0).toFixed(2)}</option>
      `).join('');
  }

  renderSpecialsList();
  const modal = document.getElementById('specialsModal');
  if (modal) modal.style.display = 'flex';
}

/**
 * Close specials modal.
 */
export function closeSpecialsModal() {
  const modal = document.getElementById('specialsModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Render items inside the specials management modal.
 */
export function renderSpecialsList() {
  const cont = document.getElementById('specialsListContainer');
  if (!cont) return;

  if (!Array.isArray(state.currentSpecials) || state.currentSpecials.length === 0) {
    cont.innerHTML = `
      <div style="text-align:center; padding:24px; color:var(--muted); background:var(--card2); border:1.5px dashed var(--line); border-radius:12px;">
        <div style="font-size:14px; font-weight:700; color:var(--cream); margin-bottom:4px;">No Specials Configured</div>
        <div style="font-size:12px;">Select items from the catalog above to feature as restaurant specials.</div>
      </div>
    `;
    return;
  }

  cont.innerHTML = state.currentSpecials.map((s, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card2); border:1px solid var(--line); border-radius:10px; padding:10px 14px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <button class="btn" onclick="moveSpecial(${i}, -1)" ${i === 0 ? 'disabled' : ''} style="padding:2px 6px; font-size:10px; min-height:unset;">▲</button>
          <button class="btn" onclick="moveSpecial(${i}, 1)" ${i === state.currentSpecials.length - 1 ? 'disabled' : ''} style="padding:2px 6px; font-size:10px; min-height:unset;">▼</button>
        </div>
        <div>
          <div style="font-weight:800; font-size:13px; color:var(--cream);">${escapeHtml(s.title || s.name || 'Special Item')}</div>
          <div style="font-size:11px; color:#c084fc; font-weight:700;">${escapeHtml(s.subtitle || "Chef's Special")} • $${(Number(s.price) || 0).toFixed(2)}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--muted); cursor:pointer;">
          <input type="checkbox" ${s.active !== false ? 'checked' : ''} onchange="toggleSpecialActive(${i}, this.checked)" style="accent-color:#a855f7;">
          Active
        </label>
        <button class="btn btn-danger" onclick="removeSpecial(${i})" style="padding:4px 8px; font-size:11px;">✕</button>
      </div>
    </div>
  `).join('');
}

export function toggleSpecialActive(i, val) {
  if (state.currentSpecials[i]) {
    state.currentSpecials[i].active = val;
  }
}

export function moveSpecial(i, dir) {
  const target = i + dir;
  if (target < 0 || target >= state.currentSpecials.length) return;
  const temp = state.currentSpecials[i];
  state.currentSpecials[i] = state.currentSpecials[target];
  state.currentSpecials[target] = temp;
  state.currentSpecials.forEach((s, idx) => { s.sort_order = idx + 1; });
  renderSpecialsList();
}

export function removeSpecial(i) {
  state.currentSpecials.splice(i, 1);
  state.currentSpecials.forEach((s, idx) => { s.sort_order = idx + 1; });
  renderSpecialsList();
}

export function addSelectedMenuToSpecials() {
  const select = document.getElementById('specialsCatalogSelect');
  const subInput = document.getElementById('specialSubtitleInput');
  const itemId = select?.value;
  if (!itemId) {
    alert('Please select a menu item to feature');
    return;
  }

  const item = (state.menuItems || []).find(i => String(i.id || i._id) === String(itemId));
  if (!item) {
    alert('Selected item not found');
    return;
  }

  const subtitle = (subInput?.value || '').trim() || "Chef's Special";
  const id = `special_${Date.now()}`;
  state.currentSpecials.push({
    id,
    item_id: item.id || item._id,
    title: item.name,
    subtitle,
    price: item.price || 0,
    image_url: item.image_url || item.imageUrl || '',
    sort_order: state.currentSpecials.length + 1,
    active: true
  });

  select.value = '';
  if (subInput) subInput.value = '';
  renderSpecialsList();
}

/**
 * Save restaurant specials to backend API.
 */
export async function saveSpecials() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/menu/specials`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ specials: state.currentSpecials })
    });
    const data = await res.json();
    if (data.success) {
      alert('✓ Specials saved successfully!');
      closeSpecialsModal();
      if (typeof window.loadMenuItems === 'function') await window.loadMenuItems();
    } else {
      alert('Could not save specials: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Error saving specials: ' + err.message);
  }
}
