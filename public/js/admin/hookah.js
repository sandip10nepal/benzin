/**
 * Benzin Hospitality OS — Hookah Configuration & Flavor Inventory
 * Native ES Module: hookah.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml, refreshIcons } from './utils.js';

/**
 * Switch sub-tab within the Hookah configuration modal.
 */
export function switchHookahTab(tab) {
  state.activeHookahTab = tab;
  ['bases', 'flavors', 'addons', 'packages'].forEach(t => {
    const btn = document.getElementById(`hkTabBtn-${t}`);
    const panel = document.getElementById(`hkTab-${t}`);
    if (btn) {
      if (t === tab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (panel) {
      panel.style.display = (t === tab) ? 'block' : 'none';
    }
  });
}

/**
 * Open hookah configuration modal and fetch current venue settings.
 */
export async function openHookahConfigModal() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/menu/hookah-config`, { headers });
    const data = await res.json();
    if (data.success && data.hookah_config) {
      state.currentHookahConfig = data.hookah_config;
      if (!state.currentHookahConfig.flavors) state.currentHookahConfig.flavors = [];
    }
  } catch (err) {
    console.warn('Could not fetch hookah config, using defaults:', err);
  }
  const weightInput = document.getElementById('hkTotalFlavorWeight');
  if (weightInput) {
    weightInput.value = state.currentHookahConfig.total_flavor_weight || 20;
  }
  updateFlavorWeightPreview();
  renderHookahConfigTabs();
  switchHookahTab(state.activeHookahTab || 'bases');
  const modal = document.getElementById('hookahConfigModal');
  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

/**
 * Live preview of bowl weight distribution by percentages.
 */
export function updateFlavorWeightPreview() {
  const input = document.getElementById('hkTotalFlavorWeight');
  const val = Math.max(1, parseFloat(input?.value || '20') || 20);
  const pillsCont = document.getElementById('flavorWeightPreviewPills');
  if (!pillsCont) return;
  const examples = [
    { pct: 100, label: '100%' },
    { pct: 50, label: '50/50 mix' },
    { pct: 70, label: '70/30 (70%)' },
    { pct: 30, label: '70/30 (30%)' },
    { pct: 25, label: '25%' }
  ];
  pillsCont.innerHTML = examples.map(e => {
    const g = ((e.pct / 100) * val).toFixed(1).replace(/\.0$/, '');
    return `<span style="background: var(--card2); border: 1px solid var(--line); border-radius: 6px; padding: 3px 8px; font-weight: 700;">${e.label}: <span style="color:var(--gold); font-weight: 800;">${g}g</span></span>`;
  }).join('');
}

/**
 * Close hookah configuration modal.
 */
export function closeHookahConfigModal() {
  const modal = document.getElementById('hookahConfigModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Render lists in all hookah config tabs (bases, flavors, add-ons, packages).
 * Preserves Ice Base and Ice Hose configurations and pricing.
 */
export function renderHookahConfigTabs() {
  // 1. Bases
  const basesCont = document.getElementById('hkBasesListContainer');
  if (basesCont) {
    const bases = state.currentHookahConfig.bases || [];
    if (bases.length === 0) {
      basesCont.innerHTML = `<div style="text-align:center; padding:16px; color:var(--muted); font-size:12px;">No custom bases configured. Default bases will be used.</div>`;
    } else {
      basesCont.innerHTML = bases.map((b, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card2); border:1px solid var(--line); border-radius:10px; padding:10px 14px;">
          <div style="flex:1;">
            <div style="font-weight:800; font-size:13px; color:var(--cream);">${escapeHtml(b.name)}</div>
            <div style="font-size:11px; color:var(--gold); font-weight:700;">${(b.price || 0) > 0 ? `+$${Number(b.price).toFixed(2)}` : 'Included ($0.00)'}</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--muted); cursor:pointer;">
              <input type="checkbox" ${b.available !== false ? 'checked' : ''} onchange="toggleHookahBaseAvail(${i}, this.checked)" style="accent-color:var(--gold);">
              Available
            </label>
            <button class="btn btn-danger" onclick="deleteHookahBase(${i})" style="padding:4px 8px; font-size:11px;">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  // 2. Flavors
  const flavCont = document.getElementById('hkFlavorsListContainer');
  if (flavCont) {
    const flavors = state.currentHookahConfig.flavors || [];
    if (flavors.length === 0) {
      flavCont.innerHTML = `<div style="text-align:center; padding:16px; color:var(--muted); font-size:12px;">No hookah flavors found in inventory. Add flavors using the form above.</div>`;
    } else {
      flavCont.innerHTML = flavors.map((f, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card2); border:1px solid var(--line); border-radius:10px; padding:10px 14px;">
          <div style="flex:1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight:800; font-size:13px; color:var(--cream);">${escapeHtml(f.fullName || f.name)}</span>
              <span style="font-size:11px; padding: 2px 6px; border-radius: 4px; background: rgba(59,130,246,0.15); color: #60a5fa; font-weight: 700;">${escapeHtml(f.brand || f.category || 'Hookah')}</span>
            </div>
            <div style="font-size:11px; color: ${(f.stock || 0) > 0 ? 'var(--teal)' : 'var(--danger)'}; font-weight:700; margin-top: 3px;">
              ⚖️ ${(f.stock || 0)}g in stock ${(f.stock || 0) <= 0 ? '(OUT OF STOCK)' : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--muted); cursor:pointer;">
              <input type="checkbox" ${f.available !== false && (f.stock || 0) > 0 ? 'checked' : ''} onchange="toggleHookahFlavorAvail('${f.id || f.inventory_id}', this.checked)" style="accent-color:var(--teal);">
              Available
            </label>
            <button class="btn btn-danger" onclick="deleteHookahFlavor('${f.id || f.inventory_id}')" style="padding:4px 8px; font-size:11px;" title="Delete flavor from inventory">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Add-ons (Preserves Ice Base & Ice Hose)
  const addonsCont = document.getElementById('hkAddonsListContainer');
  if (addonsCont) {
    const addons = state.currentHookahConfig.addons || [];
    if (addons.length === 0) {
      addonsCont.innerHTML = `<div style="text-align:center; padding:16px; color:var(--muted); font-size:12px;">No add-ons configured.</div>`;
    } else {
      addonsCont.innerHTML = addons.map((a, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card2); border:1px solid var(--line); border-radius:10px; padding:10px 14px;">
          <div style="flex:1;">
            <div style="font-weight:800; font-size:13px; color:var(--cream);">${escapeHtml(a.name)}</div>
            <div style="font-size:11px; color:#60a5fa; font-weight:700;">+$${Number(a.price || 0).toFixed(2)} (Manual Customer Selection Only)</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--muted); cursor:pointer;">
              <input type="checkbox" ${a.available !== false ? 'checked' : ''} onchange="toggleHookahAddonAvail(${i}, this.checked)" style="accent-color:#0066FF;">
              Available
            </label>
            <button class="btn btn-danger" onclick="deleteHookahAddon(${i})" style="padding:4px 8px; font-size:11px;">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  // 4. Packages
  const packages = state.currentHookahConfig.packages || [];
  const dakuPkg = packages.find(p => p.id === 'daku' || (p.name && p.name.toLowerCase().includes('daku'))) || packages[0];
  if (dakuPkg) {
    const nameInput = document.getElementById('hkDakuName');
    const priceInput = document.getElementById('hkDakuPrice');
    const descInput = document.getElementById('hkDakuDesc');
    const activeCheck = document.getElementById('hkDakuActive');
    const imageInput = document.getElementById('hkDakuImage');
    if (nameInput) nameInput.value = dakuPkg.name || 'Daku';
    if (priceInput) priceInput.value = dakuPkg.price || 65;
    if (descInput) descInput.value = dakuPkg.description || 'Unlimited head refill';
    if (activeCheck) activeCheck.checked = dakuPkg.active !== false;
    if (imageInput) imageInput.value = dakuPkg.image_url || '';
  }
}

export function toggleHookahBaseAvail(i, val) {
  if (state.currentHookahConfig.bases && state.currentHookahConfig.bases[i]) {
    state.currentHookahConfig.bases[i].available = val;
  }
}

export async function toggleHookahFlavorAvail(flavorId, isAvailable) {
  try {
    const headers = getAuthHeaders();
    await fetch(`${API_URL}/api/orders/inventory/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ingredientId: flavorId, active: isAvailable })
    });
    if (typeof window.loadData === 'function') await window.loadData();
  } catch (err) {
    console.warn('Could not update flavor availability:', err);
  }
}

export function toggleHookahAddonAvail(i, val) {
  if (state.currentHookahConfig.addons && state.currentHookahConfig.addons[i]) {
    state.currentHookahConfig.addons[i].available = val;
  }
}

export function addHookahBaseRow() {
  const nameInput = document.getElementById('newHkBaseName');
  const priceInput = document.getElementById('newHkBasePrice');
  const name = (nameInput?.value || '').trim();
  const price = parseFloat(priceInput?.value || '0') || 0;
  if (!name) {
    alert('Please enter a base name');
    return;
  }
  if (!state.currentHookahConfig.bases) state.currentHookahConfig.bases = [];
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  state.currentHookahConfig.bases.push({ id, name, price, available: true });
  nameInput.value = '';
  if (priceInput) priceInput.value = '';
  renderHookahConfigTabs();
}

export function deleteHookahBase(index) {
  if (state.currentHookahConfig.bases) {
    state.currentHookahConfig.bases.splice(index, 1);
    renderHookahConfigTabs();
  }
}

export async function addHookahFlavorRow() {
  const nameInput = document.getElementById('newHkFlavorName');
  const brandInput = document.getElementById('newHkFlavorBrand');
  const stockInput = document.getElementById('newHkFlavorStock');
  const name = (nameInput?.value || '').trim();
  const brand = (brandInput?.value || '').trim();
  const stock = parseFloat(stockInput?.value || '500') || 500;
  if (!name) {
    alert('Please enter a flavor name');
    return;
  }
  const fullName = brand ? `${brand} - ${name}` : name;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/inventory/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: fullName,
        category: 'INVCAT_1862EED65A2E',
        unit: 'g',
        stock,
        reorder_threshold: 100
      })
    });
    const data = await res.json();
    if (data.success) {
      nameInput.value = '';
      if (brandInput) brandInput.value = '';
      if (stockInput) stockInput.value = '500';
      if (typeof window.loadData === 'function') await window.loadData();
      await openHookahConfigModal();
    } else {
      alert('Could not add flavor: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Error adding flavor: ' + err.message);
  }
}

export async function deleteHookahFlavor(flavorId) {
  if (!confirm('Are you sure you want to delete this flavor from inventory?')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/inventory/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ingredientId: flavorId })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.loadData === 'function') await window.loadData();
      await openHookahConfigModal();
    } else {
      alert('Could not delete flavor: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Error deleting flavor: ' + err.message);
  }
}

export function addHookahAddonRow() {
  const nameInput = document.getElementById('newHkAddonName');
  const priceInput = document.getElementById('newHkAddonPrice');
  const name = (nameInput?.value || '').trim();
  const price = parseFloat(priceInput?.value || '0') || 0;
  if (!name) {
    alert('Please enter an add-on name');
    return;
  }
  if (!state.currentHookahConfig.addons) state.currentHookahConfig.addons = [];
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  state.currentHookahConfig.addons.push({ id, name, price, available: true });
  nameInput.value = '';
  if (priceInput) priceInput.value = '';
  renderHookahConfigTabs();
}

export function deleteHookahAddon(index) {
  if (state.currentHookahConfig.addons) {
    state.currentHookahConfig.addons.splice(index, 1);
    renderHookahConfigTabs();
  }
}

/**
 * Save updated hookah configuration to backend API.
 */
export async function saveHookahConfig() {
  try {
    const weightVal = parseFloat(document.getElementById('hkTotalFlavorWeight')?.value || '20') || 20;
    if (weightVal <= 0) {
      alert('Total Hookah Flavor Weight must be a positive number of grams.');
      return;
    }
    state.currentHookahConfig.total_flavor_weight = weightVal;

    const name = document.getElementById('hkDakuName')?.value.trim() || 'Daku';
    const price = parseFloat(document.getElementById('hkDakuPrice')?.value || '65') || 65;
    const description = document.getElementById('hkDakuDesc')?.value.trim() || 'Unlimited head refill';
    const active = document.getElementById('hkDakuActive')?.checked !== false;
    const image_url = document.getElementById('hkDakuImage')?.value.trim() || '';

    state.currentHookahConfig.packages = [{
      id: 'daku',
      name,
      price,
      description,
      image_url,
      includes_refill: true,
      active
    }];

    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/menu/hookah-config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(state.currentHookahConfig)
    });
    const data = await res.json();
    if (data.success) {
      alert('✓ Hookah configuration saved successfully!');
      closeHookahConfigModal();
    } else {
      console.error('Save hookah config error:', data.error);
      const errMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error || data.message || 'Server error');
      alert('Could not save hookah config: ' + errMsg);
    }
  } catch (err) {
    alert('Error saving hookah config: ' + err.message);
  }
}
