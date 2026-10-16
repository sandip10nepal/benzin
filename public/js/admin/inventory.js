/**
 * Benzin Hospitality OS — Stock & Inventory Management
 * Native ES Module: inventory.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml, refreshIcons } from './utils.js';

/**
 * Render inventory grid based on active category sub-tab and search filter.
 */
export function renderInventoryPage() {
  const gridContainer = document.getElementById('inventoryGridSquare');
  if (!gridContainer) return;

  const itemsList = Object.values(state.inventory || {});

  renderInventoryCategoryTabs();

  const searchInput = document.getElementById('inventorySearchInput');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

  let filtered = itemsList;

  if (state.activeInventorySubTab) {
    const activeCatObj = (state.inventoryCategories || []).find(cat => (cat._id || cat.id) === state.activeInventorySubTab || cat.id === state.activeInventorySubTab);
    const catTitle = (activeCatObj?.title || '').toLowerCase();
    const catId = (state.activeInventorySubTab || '').toLowerCase();

    filtered = filtered.filter(item => {
      const c = (item.category || '').toLowerCase();
      const cId = (item.category_id || '').toLowerCase();

      // Exact ID match
      if (c === catId || cId === catId) return true;

      // Hookah category match
      if (catId.includes('hookah') || catId.includes('shisha') || catTitle.includes('hookah') || catTitle.includes('shisha') || catTitle.includes('flavour') || catTitle.includes('flavor')) {
        return c === catId || cId === catId || c.includes('shisha') || c.includes('hookah') || c.includes('flavour') || c.includes('flavor') || item.unit === 'g';
      }

      // Food category match
      if (catId.includes('food') || catId.includes('kitchen') || catId.includes('raw') || catTitle.includes('food') || catTitle.includes('kitchen') || catTitle.includes('raw')) {
        return c === catId || cId === catId || c.includes('food') || c.includes('kitchen') || c.includes('raw');
      }

      // Drinks category match
      if (catId.includes('drink') || catId.includes('beverage') || catId.includes('liquor') || catTitle.includes('drink') || catTitle.includes('beverage') || catTitle.includes('liquor')) {
        return c === catId || cId === catId || c.includes('drink') || c.includes('beverage') || c.includes('liquor') || c.includes('tea') || c.includes('coffee') || item.unit === 'bottle' || item.unit === 'can';
      }

      return c === catId || cId === catId || (catTitle && (c === catTitle || c.includes(catTitle)));
    });
  }

  if (query) {
    filtered = filtered.filter(item => {
      return (item.name || '').toLowerCase().includes(query) ||
             (item.brand || '').toLowerCase().includes(query) ||
             (item.category || '').toLowerCase().includes(query) ||
             (item.unit || '').toLowerCase().includes(query);
    });
  }

  if (filtered.length === 0) {
    gridContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 50px; text-align: center; color: var(--muted); font-size: 15px;">No inventory stock items found.</div>`;
    return;
  }

  gridContainer.innerHTML = filtered.map(item => {
    const id = item.id || item._id || item.name;
    const stock = Number(item.stock || 0);
    const minAlert = Number(item.reorder_threshold || 100);
    const unit = item.unit || 'g';
    const isLow = stock <= minAlert;

    const escapedItemObj = encodeURIComponent(JSON.stringify(item));

    return `
      <div class="inventory-card" style="background: var(--card); border: 1.5px solid ${isLow ? 'var(--danger)' : 'var(--line)'}; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
            <div style="font-weight: 800; color: var(--cream); font-size: 16px; word-break: break-word;">${item.name}</div>
            <span style="font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 20px; text-transform: uppercase; white-space: nowrap; background: ${isLow ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}; color: ${isLow ? 'var(--danger)' : 'var(--success)'}; border: 1px solid ${isLow ? 'var(--danger)' : 'var(--success)'};">
              ${isLow ? 'LOW STOCK' : 'IN STOCK'}
            </span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
            ${item.brand ? `<span style="background: rgba(139,92,246,0.18); color: #C4B5FD; border: 1px solid #8B5CF6; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase;">🏷️ ${escapeHtml(item.brand)}</span>` : ''}
            <span style="background: rgba(229,177,58,0.1); color: var(--gold); border: 1px solid var(--gold); border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${(item.category || 'general').toUpperCase()}</span>
            <span style="font-size: 11px; color: var(--muted); font-weight: 600;">Threshold: ${minAlert}${unit}</span>
          </div>
          <div style="font-size: 26px; font-weight: 900; color: ${isLow ? 'var(--danger)' : 'var(--cream)'}; margin-bottom: 16px;">
            ${stock} <span style="font-size: 14px; color: var(--muted); font-weight: 700;">${unit}</span>
          </div>
        </div>

        <div>
          <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <button class="btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 11px; font-weight: 800; background: rgba(34,197,94,0.15); border-color: var(--success); color: var(--success);" onclick="adjustInventory('${id}', 10, 'add')">+10</button>
            <button class="btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 11px; font-weight: 800; background: rgba(34,197,94,0.15); border-color: var(--success); color: var(--success);" onclick="adjustInventory('${id}', 50, 'add')">+50</button>
            <button class="btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 11px; font-weight: 800; background: rgba(239,68,68,0.15); border-color: var(--danger); color: var(--danger);" onclick="adjustInventory('${id}', 10, 'remove')">-10</button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn" style="flex: 1; justify-content: center; padding: 6px 10px; font-size: 11px; font-weight: 800;" onclick="openEditInventoryModalFromObj('${escapedItemObj}')">
              <i data-lucide="edit-2" style="width: 13px; height: 13px;"></i> Edit
            </button>
            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 11px;" onclick="deleteInventoryItem('${id}')" title="Delete stock item">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
}

/**
 * Switch category sub-tab on the inventory view.
 */
export function switchInventorySubTab(tab) {
  state.activeInventorySubTab = tab;
  renderInventoryPage();
}

/**
 * Quick increment/decrement stock quantity.
 */
export async function adjustInventory(itemId, amount, action) {
  try {
    const headers = getAuthHeaders();
    const role = (localStorage.getItem('benzin_user_role') || 'owner').toLowerCase();
    const res = await fetch(`${API_URL}/api/orders/inventory/adjust`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ingredientId: itemId, amount, type: action === 'add' || action === 'increase' ? 'increase' : 'decrease', role })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not update inventory: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error adjusting inventory: ' + err.message);
  }
}

/**
 * Open modal to add brand new stock item.
 */
export function openAddInventoryModal() {
  document.getElementById('invNewName').value = '';
  document.getElementById('invNewBrand').value = '';
  document.getElementById('invNewStock').value = '';
  document.getElementById('invNewMinAlert').value = '200';
  populateInventoryCategoryDropdowns(state.activeInventorySubTab || 'INVCAT_1862EED65A2E');
  document.getElementById('invNewUnit').value = 'g';
  document.getElementById('addInventoryModal').style.display = 'flex';
}

/**
 * Close add inventory modal.
 */
export function closeAddInventoryModal() {
  document.getElementById('addInventoryModal').style.display = 'none';
}

/**
 * Open modal to edit existing stock item.
 */
export function openEditInventoryModalFromObj(escapedObjStr) {
  try {
    const item = JSON.parse(decodeURIComponent(escapedObjStr));
    const id = item.id || item._id || '';
    const liveItem = (state.inventory && (state.inventory[id] || Object.values(state.inventory).find(i => (i.id || i._id) === id))) || item;
    
    let brandVal = (liveItem.brand || item.brand || '').trim();
    if (!brandVal) {
      const n = (item.name || '').toLowerCase();
      if (n.includes('al fakher') || n.includes('alfakher')) brandVal = 'Al Fakher';
      else if (n.includes('adalya') || n.includes('adaliya') || n.includes('bagdadi') || n.includes('lady killer') || n.includes('love 66') || n.includes('mi amor') || n.includes('berlin night')) brandVal = 'Adalya';
      else if (n.includes('afzal') || n.includes('pan raas') || n.includes('paan raas') || n.includes('pan ras')) brandVal = 'Afzal';
      else if (n.includes('starbuzz') || n.includes('blue mist')) brandVal = 'Starbuzz';
      else if (n.includes('serbetli') || n.includes('sarbeti')) brandVal = 'Serbetli';
      else if (n.includes('fumari')) brandVal = 'Fumari';
      else if (n.includes('savacco')) brandVal = 'Savacco';
      else if (n.includes('overdozz')) brandVal = 'Overdozz';
      else if (n.includes('eternal smoke')) brandVal = 'Eternal Smoke';
    }

    document.getElementById('invEditId').value = id;
    document.getElementById('invEditName').value = liveItem.name || item.name || '';
    document.getElementById('invEditBrand').value = brandVal;
    populateInventoryCategoryDropdowns(liveItem.category_id || liveItem.category || item.category_id || item.category || state.activeInventorySubTab || 'INVCAT_1862EED65A2E');
    document.getElementById('invEditUnit').value = liveItem.unit || item.unit || 'g';
    document.getElementById('invEditStock').value = liveItem.stock !== undefined ? liveItem.stock : (item.stock !== undefined ? item.stock : 0);
    document.getElementById('invEditMinAlert').value = liveItem.reorder_threshold !== undefined ? liveItem.reorder_threshold : (item.reorder_threshold !== undefined ? item.reorder_threshold : 100);
    document.getElementById('editInventoryModal').style.display = 'flex';
  } catch (err) {
    console.error('Error opening edit inventory modal:', err);
  }
}

/**
 * Close edit inventory modal.
 */
export function closeEditInventoryModal() {
  document.getElementById('editInventoryModal').style.display = 'none';
}

/**
 * Save updated stock item changes.
 */
export async function saveEditInventoryItem() {
  const ingredientId = document.getElementById('invEditId').value;
  const name = document.getElementById('invEditName').value.trim();
  const brand = document.getElementById('invEditBrand').value.trim();
  const category = document.getElementById('invEditCategory').value.trim();
  const unit = document.getElementById('invEditUnit').value.trim();
  const stock = parseFloat(document.getElementById('invEditStock').value);
  const reorder_threshold = parseFloat(document.getElementById('invEditMinAlert').value) || 100;
  const role = (localStorage.getItem('benzin_user_role') || 'owner').toLowerCase();

  if (!ingredientId || !name || isNaN(stock)) {
    alert('Please fill in a valid inventory item name and stock quantity');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/inventory/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ingredientId, name, brand, category, unit, stock, reorder_threshold, role })
    });

    const data = await res.json();
    if (data.success) {
      if (state.inventory) {
        if (state.inventory[ingredientId]) {
          state.inventory[ingredientId].brand = brand;
          state.inventory[ingredientId].name = name;
          state.inventory[ingredientId].category = category;
          state.inventory[ingredientId].category_id = category;
          state.inventory[ingredientId].unit = unit;
          state.inventory[ingredientId].stock = stock;
          state.inventory[ingredientId].reorder_threshold = reorder_threshold;
        } else {
          const matched = Object.values(state.inventory).find(i => (i.id || i._id) === ingredientId);
          if (matched) {
            matched.brand = brand;
            matched.name = name;
            matched.category = category;
            matched.category_id = category;
            matched.unit = unit;
            matched.stock = stock;
            matched.reorder_threshold = reorder_threshold;
          }
        }
      }
      closeEditInventoryModal();
      renderInventoryPage();
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not update inventory item: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error updating inventory item: ' + err.message);
  }
}

/**
 * Delete inventory item permanently.
 */
export async function deleteInventoryItem(ingredientId) {
  if (!confirm('Are you sure you want to delete this inventory item permanently?')) return;

  try {
    const headers = getAuthHeaders();
    const role = (localStorage.getItem('benzin_user_role') || 'owner').toLowerCase();
    const res = await fetch(`${API_URL}/api/orders/inventory/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ingredientId, role })
    });

    const data = await res.json();
    if (data.success) {
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not delete inventory item: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error deleting inventory item: ' + err.message);
  }
}

/**
 * Create a new inventory stock item.
 */
export async function saveNewInventoryItem() {
  const name = document.getElementById('invNewName').value.trim();
  const brand = document.getElementById('invNewBrand').value.trim();
  const category = document.getElementById('invNewCategory').value;
  const unit = document.getElementById('invNewUnit').value;
  const stock = parseFloat(document.getElementById('invNewStock').value);
  const reorder_threshold = parseFloat(document.getElementById('invNewMinAlert').value) || 100;
  const role = (localStorage.getItem('benzin_user_role') || 'owner').toLowerCase();

  if (!name || isNaN(stock)) {
    alert('Please fill in a valid inventory item name and stock quantity');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/inventory/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, brand, category, unit, stock, reorder_threshold, role })
    });

    const data = await res.json();
    if (data.success) {
      closeAddInventoryModal();
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Could not create inventory item: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error creating inventory item: ' + err.message);
  }
}

/**
 * Fetch tenant inventory categories from backend.
 */
export async function fetchInventoryCategories() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/inventory/categories`, { headers });
    const data = await res.json();
    if (data.success && Array.isArray(data.categories)) {
      state.inventoryCategories = data.categories.filter(c => c.active !== false);
      localStorage.setItem('benzin_cached_inv_cats', JSON.stringify(state.inventoryCategories));
    }
  } catch (err) {
    console.error('Error fetching inventory categories:', err);
  }
  renderInventoryCategoryTabs();
  renderExistingInvCategoriesList();
  populateInventoryCategoryDropdowns();
}

/**
 * Render category tabs above the inventory cards grid.
 */
export function renderInventoryCategoryTabs() {
  const container = document.getElementById('inventoryCategoryTabs');
  if (!container) return;

  const catMap = new Map();
  (state.inventoryCategories || []).forEach(cat => {
    const id = cat._id || cat.id;
    if (id && cat.active !== false) {
      catMap.set(id, { id, title: cat.title || 'Category', icon: cat.icon || '📦' });
    }
  });

  const keys = Array.from(catMap.keys());
  if (keys.length > 0) {
    if (!state.activeInventorySubTab || state.activeInventorySubTab === 'all' || !catMap.has(state.activeInventorySubTab)) {
      const hookahCat = keys.find(k => {
        const c = catMap.get(k);
        const t = (c?.title || '').toLowerCase();
        return k.toLowerCase().includes('hookah') || t.includes('hookah') || t.includes('shisha');
      });
      state.activeInventorySubTab = hookahCat || keys[0];
    }
  }

  let html = '';
  catMap.forEach((catObj, key) => {
    const isActive = state.activeInventorySubTab === key || state.activeInventorySubTab === catObj.id;
    const activeBg = 'linear-gradient(135deg, #E5B13A 0%, #c4952b 100%)';

    html += `
      <button class="sub-tab ${isActive ? 'active' : ''}" onclick="switchInventorySubTab('${catObj.id}')" style="margin-right: 8px; padding: 8px 16px; border-radius: 14px; font-weight: 800; border: 1.5px solid ${isActive ? 'transparent' : 'var(--line)'}; ${isActive ? `background: ${activeBg}; color: #000; box-shadow: 0 4px 16px rgba(229,177,58,0.35);` : 'background: var(--card); color: var(--cream);'} transition: all 0.2s ease;">
        ${catObj.icon} ${catObj.title}
      </button>
    `;
  });

  container.innerHTML = html;
}

/**
 * Get unified list of inventory categories with icons.
 */
export function getAllInventoryCategoriesList() {
  const list = [];
  const seen = new Set();

  (state.inventoryCategories || []).forEach(c => {
    const id = c._id || c.id;
    const key = (id || c.title || '').toLowerCase();
    if (id && c.active !== false && !seen.has(key)) {
      seen.add(key);
      list.push({ id, _id: id, title: c.title || 'Category', icon: c.icon || '📦', isDb: true, raw: c });
    }
  });

  return list;
}

/**
 * Render list of existing inventory categories inside category modal.
 */
export function renderExistingInvCategoriesList() {
  const listEl = document.getElementById('existingInvCatList');
  if (!listEl) return;

  const allCats = getAllInventoryCategoriesList();
  const stockItems = Object.values(state.inventory || {});

  if (allCats.length === 0) {
    listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 13px;">No inventory categories found for this venue. Click "+ Add Category" to create one.</div>';
    return;
  }

  listEl.innerHTML = allCats.map(cat => {
    const id = cat.id || cat._id;
    const title = cat.title || 'Category';
    const icon = cat.icon || '📦';
    const catKey = (id || title).toLowerCase();

    const count = stockItems.filter(item => {
      const c = (item.category || '').toLowerCase();
      return c === catKey || c === title.toLowerCase() || (item.category_id || '').toLowerCase() === id.toLowerCase();
    }).length;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 8px 12px;">
        <div>
          <span style="font-size: 13px; font-weight: 700; color: var(--cream);">${icon} ${title}</span>
          <span style="font-size: 11px; font-weight: 700; color: ${count > 0 ? 'var(--gold)' : 'var(--muted)'}; margin-left: 8px;">(${count} stock item${count === 1 ? '' : 's'})</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button onclick="openEditInvCategoryModal('${id}')" class="btn" style="padding: 4px 10px; font-size: 11px; font-weight: 700;">✏️ Edit</button>
          <button onclick="deleteInvCategory('${id}')" class="btn btn-danger" style="padding: 4px 10px; font-size: 11px; font-weight: 700; ${count > 0 ? 'opacity: 0.5;' : ''}" title="${count > 0 ? 'Cannot delete category with items' : 'Delete category'}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Populate category dropdowns in add/edit stock modals.
 */
export function populateInventoryCategoryDropdowns(selectedVal = '') {
  const newSel = document.getElementById('invNewCategory');
  const editSel = document.getElementById('invEditCategory');

  const allCats = getAllInventoryCategoriesList();
  let optionsHtml = '';
  const sLower = (selectedVal || '').toLowerCase();

  allCats.forEach(cat => {
    const val = cat.id || cat._id;
    const vLower = (val || '').toLowerCase();
    const tLower = (cat.title || '').toLowerCase();

    const isExact = sLower && (sLower === vLower || sLower === tLower);
    const isHkMatch = (sLower.includes('hookah') || sLower.includes('shisha')) && (vLower.includes('hookah') || vLower.includes('shisha') || tLower.includes('hookah') || tLower.includes('shisha'));
    const isFoodMatch = (sLower.includes('food') || sLower.includes('raw')) && (vLower.includes('food') || vLower.includes('raw') || tLower.includes('food') || tLower.includes('raw'));
    const isDrinkMatch = (sLower.includes('drink') || sLower.includes('beverage')) && (vLower.includes('drink') || vLower.includes('beverage') || tLower.includes('drink') || tLower.includes('beverage'));

    const isSel = (isExact || isHkMatch || isFoodMatch || isDrinkMatch) ? 'selected' : '';
    optionsHtml += `<option value="${val}" ${isSel}>${cat.icon || '📦'} ${cat.title}</option>`;
  });

  if (newSel) newSel.innerHTML = optionsHtml;
  if (editSel) editSel.innerHTML = optionsHtml;
}

/**
 * Open category management modal for inventory.
 */
export function openAddInvCategoryModal() {
  document.getElementById('invCatEditId').value = '';
  document.getElementById('invCatModalTitle').innerText = 'Manage Inventory Categories';
  document.getElementById('invCatTitle').value = '';
  document.getElementById('invCatIcon').value = '📦';
  renderExistingInvCategoriesList();
  document.getElementById('invCatModal').style.display = 'flex';
}

/**
 * Open edit inventory category modal.
 */
export function openEditInvCategoryModal(catId) {
  const allCats = getAllInventoryCategoriesList();
  const cat = allCats.find(c => (c._id || c.id) === catId || (c.title || '').toLowerCase() === catId.toLowerCase());
  if (!cat) return;
  document.getElementById('invCatEditId').value = cat.id || cat._id || catId;
  document.getElementById('invCatModalTitle').innerText = `Edit ${cat.title} Category`;
  document.getElementById('invCatTitle').value = cat.title || '';
  document.getElementById('invCatIcon').value = cat.icon || '📦';
  renderExistingInvCategoriesList();
  document.getElementById('invCatModal').style.display = 'flex';
}

/**
 * Close inventory category modal.
 */
export function closeInvCategoryModal() {
  document.getElementById('invCatModal').style.display = 'none';
}

/**
 * Save new or modified inventory category.
 */
export async function saveInvCategory() {
  const id = document.getElementById('invCatEditId').value;
  const title = document.getElementById('invCatTitle').value.trim();
  const icon = document.getElementById('invCatIcon').value.trim() || '📦';

  if (!title) {
    alert('Please enter an Inventory Category Name');
    return;
  }

  try {
    const headers = getAuthHeaders();
    let res;
    if (id) {
      res = await fetch(`${API_URL}/api/orders/inventory/categories/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, title, icon })
      });
    } else {
      res = await fetch(`${API_URL}/api/orders/inventory/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, icon })
      });
    }
    const data = await res.json();
    if (data.success) {
      document.getElementById('invCatEditId').value = '';
      document.getElementById('invCatTitle').value = '';
      await fetchInventoryCategories();
      renderInventoryPage();
    } else {
      alert('Could not save inventory category: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error saving inventory category: ' + err.message);
  }
}

/**
 * Delete inventory category after ensuring no stock items belong to it.
 */
export async function deleteInvCategory(catId) {
  const cat = (state.inventoryCategories || []).find(c => (c._id || c.id) === catId || (c.title || '').toLowerCase() === catId.toLowerCase());
  const catTitle = (cat?.title || '').toLowerCase();
  const targetId = cat?._id || cat?.id || catId;

  // Safety check: verify if any inventory stock items exist in this category
  const stockItems = Object.values(state.inventory || {});
  const matchingStock = stockItems.filter(item => {
    const c = (item.category || '').toLowerCase();
    return c === targetId.toLowerCase() || (catTitle && c === catTitle) || (item.category_id || '').toLowerCase() === targetId.toLowerCase();
  });

  if (matchingStock.length > 0) {
    alert(`⚠️ Cannot Delete Inventory Category:\n\nThe category "${cat?.title || catId}" contains ${matchingStock.length} active stock item(s).\n\nPlease delete or move those stock items before deleting this category.`);
    return;
  }

  if (!confirm(`Are you sure you want to delete inventory category "${cat?.title || catId}"?`)) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/inventory/categories/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: targetId })
    });
    const data = await res.json();
    if (data.success) {
      state.inventoryCategories = (state.inventoryCategories || []).filter(c => (c._id || c.id) !== targetId && (c._id || c.id) !== catId);
      await fetchInventoryCategories();
      renderInventoryPage();
    } else {
      alert('Could not delete inventory category: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error deleting inventory category: ' + err.message);
  }
}
