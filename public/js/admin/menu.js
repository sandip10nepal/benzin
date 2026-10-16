/**
 * Benzin Hospitality OS — Menu Catalog & Category Management
 * Native ES Module: menu.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml, escapeJs, refreshIcons } from './utils.js';
import { getAllInventoryCategoriesList } from './inventory.js';

let selectedMenuItemCategoriesSet = new Set();

/**
 * Load all restaurant menu items from backend API.
 */
export async function loadMenuItems() {
  try {
    const headers = getAuthHeaders();
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    const res = await fetch(`${API_URL}/api/menu?_t=${Date.now()}`, { headers, cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      state.menuItems = data.menuItems || data.items || [];
      localStorage.setItem('benzin_cached_menu_items', JSON.stringify(state.menuItems));
      renderMenuPage();
    }
  } catch (err) {
    console.error('Error fetching menu items:', err);
  }
}

/**
 * Filter menu category.
 */
export function filterMenuCategory(cat) {
  state.activeMenuCat = cat;
  document.querySelectorAll('#menuPageLayout .sub-tab').forEach(el => el.classList.remove('active'));
  const activeBtn = document.getElementById(`menuCat-${cat}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderMenuPage();
}

/**
 * Handle ingredient selection in recipe row.
 */
export function onRecipeIngredientSelected(selectEl) {
  if (!selectEl) return;
  const row = selectEl.closest('.recipe-row');
  if (!row) return;

  const opt = selectEl.options[selectEl.selectedIndex];
  const unit = opt?.dataset?.unit || 'g';
  const modeSelect = row.querySelector('.recipe-ing-mode');
  const valInput = row.querySelector('.recipe-ing-val');

  if (modeSelect) {
    if (unit === 'g') {
      modeSelect.innerHTML = `
        <option value="g" selected>Grams (g)</option>
        <option value="pct">Ratio (%)</option>
      `;
    } else {
      modeSelect.innerHTML = `
        <option value="${unit}" selected>${unit.toUpperCase()}</option>
      `;
    }
  }

  if (valInput) {
    const curVal = parseFloat(valInput.value || '0');
    if (isNaN(curVal) || curVal <= 0) {
      valInput.value = unit === 'g' ? 10 : 1;
    }
    valInput.placeholder = unit === 'g' ? '10g' : `1 ${unit}`;
  }

  updateRecipeRowPreview(valInput);
}

/**
 * Add a recipe ingredient row to link inventory deductions to menu item ordering.
 */
export function addRecipeIngredientRow(ingredientId = '', amount = '', unit = '', percentage = '') {
  const container = document.getElementById('recipeRowsContainer');
  if (!container) return;

  const rowDiv = document.createElement('div');
  rowDiv.className = 'recipe-row';
  rowDiv.style.cssText = 'display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.03); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; margin-bottom: 8px;';

  const dbItems = Object.values(state.inventory || {});
  const matchedItem = dbItems.find(i => (i.id || i._id) === ingredientId || (i.name && i.name.toLowerCase() === String(ingredientId).toLowerCase()));
  const isMissingOrInactive = ingredientId && (!matchedItem || matchedItem.active === false);

  const resolvedUnit = matchedItem?.unit || unit || 'g';

  const allCats = getAllInventoryCategoriesList();
  const catMap = new Map();
  allCats.forEach(c => {
    catMap.set(String(c.id || c._id).toLowerCase(), { cat: c, options: [] });
  });

  const unassignedOptions = [];

  dbItems.forEach(item => {
    const itemKey = item.id || item._id || item.name;
    const isSel = (itemKey === ingredientId || (matchedItem && (item.id || item._id) === (matchedItem.id || matchedItem._id))) ? 'selected' : '';
    const stockStr = `${item.stock !== undefined ? item.stock : 0}${item.unit || 'g'}`;
    const brandPrefix = item.brand ? `[${escapeHtml(item.brand)}] ` : '';
    
    const itemCatKey = String(item.category_id || item.category || '').toLowerCase();
    let targetGroup = catMap.get(itemCatKey);
    if (!targetGroup) {
      for (const [k, v] of catMap.entries()) {
        if (itemCatKey.includes(k) || (v.cat.title && itemCatKey.includes(v.cat.title.toLowerCase()))) {
          targetGroup = v;
          break;
        }
      }
    }

    const icon = targetGroup ? (targetGroup.cat.icon || '📦') : (item.unit === 'g' ? '💨' : '📦');
    const optHtml = `<option value="${itemKey}" data-unit="${item.unit || 'g'}" data-stock="${item.stock || 0}" ${isSel}>${icon} ${brandPrefix}${escapeHtml(item.name)} (${stockStr} in stock)</option>`;

    if (targetGroup) {
      targetGroup.options.push(optHtml);
    } else {
      unassignedOptions.push(optHtml);
    }
  });

  let categoryOptgroupsHtml = '';
  allCats.forEach(c => {
    const group = catMap.get(String(c.id || c._id).toLowerCase());
    if (group && group.options.length > 0) {
      categoryOptgroupsHtml += `<optgroup label="${group.cat.icon || '📦'} ${escapeHtml(group.cat.title)}">${group.options.join('')}</optgroup>`;
    }
  });
  if (unassignedOptions.length > 0) {
    categoryOptgroupsHtml += `<optgroup label="📦 General Supplies">${unassignedOptions.join('')}</optgroup>`;
  }

  let missingOpt = '';
  if (isMissingOrInactive) {
    missingOpt = `<option value="${ingredientId}" selected>⚠️ [Unavailable/Inactive] ${escapeHtml(matchedItem ? matchedItem.name : ingredientId)}</option>`;
  }

  const initialMode = (percentage !== '' && percentage !== undefined && Number(percentage) > 0) ? 'pct' : (resolvedUnit || 'g');
  const initialVal = initialMode === 'pct' ? percentage : (amount !== '' && amount !== undefined ? amount : (ingredientId ? (resolvedUnit === 'g' ? 10 : 1) : ''));

  let modeOptionsHtml = '';
  if (resolvedUnit === 'g') {
    modeOptionsHtml = `
      <option value="g" ${initialMode === 'g' ? 'selected' : ''}>Grams (g)</option>
      <option value="pct" ${initialMode === 'pct' ? 'selected' : ''}>Ratio (%)</option>
    `;
  } else {
    modeOptionsHtml = `<option value="${resolvedUnit}" selected>${resolvedUnit.toUpperCase()}</option>`;
  }

  rowDiv.innerHTML = `
    <div style="display: flex; gap: 8px; align-items: center;">
      <select class="recipe-ing-select" style="flex: 2; min-width: 160px; padding: 8px; background: var(--card2); border: 1px solid ${isMissingOrInactive ? 'var(--danger)' : 'var(--line)'}; border-radius: 6px; color: var(--cream); font-size: 12px;" onchange="onRecipeIngredientSelected(this)">
        <option value="">-- Select Raw Stock / Inventory Item --</option>
        ${missingOpt}
        ${categoryOptgroupsHtml}
      </select>
      <select class="recipe-ing-mode" style="width: 85px; padding: 8px; background: var(--card2); border: 1px solid var(--line); border-radius: 6px; color: var(--gold); font-size: 12px; font-weight: 800;" onchange="updateRecipeRowPreview(this)">
        ${modeOptionsHtml}
      </select>
      <input type="number" step="0.5" min="0" class="recipe-ing-val" placeholder="${resolvedUnit === 'g' ? (initialMode === 'pct' ? '50%' : '10g') : `1 ${resolvedUnit}`}" value="${initialVal}" style="width: 90px; padding: 8px; background: var(--card2); border: 1px solid var(--line); border-radius: 6px; color: var(--cream); font-size: 12px; font-weight: 700;" oninput="updateRecipeRowPreview(this)">
      <button type="button" class="btn btn-danger" style="padding: 6px 10px; font-size: 12px;" onclick="this.closest('.recipe-row').remove()">✕</button>
    </div>
    <div class="recipe-row-feedback" style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 2px;">
      <span class="calc-preview" style="color: var(--gold);"></span>
      ${isMissingOrInactive ? `<span style="color: #f87171; font-weight: 700;">⚠️ Referenced inventory item is missing or inactive in stock</span>` : ''}
    </div>
  `;

  container.appendChild(rowDiv);
  updateRecipeRowPreview(rowDiv.querySelector('.recipe-ing-val'));
}

/**
 * Preview weight or percentage calculation in recipe row.
 */
export function updateRecipeRowPreview(el) {
  if (!el) return;
  const row = el.closest('.recipe-row');
  if (!row) return;
  const mode = row.querySelector('.recipe-ing-mode')?.value || 'g';
  const val = parseFloat(row.querySelector('.recipe-ing-val')?.value || '0') || 0;
  const previewEl = row.querySelector('.calc-preview');
  const totalWeight = state.currentHookahConfig?.total_flavor_weight ? Number(state.currentHookahConfig.total_flavor_weight) : 20;

  if (!previewEl) return;
  if (val <= 0) {
    previewEl.innerText = '';
    return;
  }

  if (mode === 'pct') {
    const grams = ((val / 100) * totalWeight).toFixed(1).replace(/\.0$/, '');
    previewEl.innerHTML = `Calculated: <b>${grams}g</b> (${val}% of ${totalWeight}g bowl)`;
  } else if (mode === 'g') {
    const pct = ((val / totalWeight) * 100).toFixed(0);
    previewEl.innerHTML = `Calculated: <b>${pct}%</b> of ${totalWeight}g bowl (${val}g)`;
  } else {
    previewEl.innerHTML = `Deduction: <b>${val} ${mode}</b> per menu item ordered`;
  }
}

/**
 * Extract recipe deductions configuration from modal inputs.
 */
export function getRecipeFromModal() {
  const rows = document.querySelectorAll('#recipeRowsContainer .recipe-row');
  const recipe = [];
  const totalWeight = state.currentHookahConfig?.total_flavor_weight ? Number(state.currentHookahConfig.total_flavor_weight) : 20;
  const dbItems = Object.values(state.inventory || {});

  rows.forEach(row => {
    const selectEl = row.querySelector('.recipe-ing-select');
    const ingId = selectEl?.value;
    if (!ingId) return;

    const mode = row.querySelector('.recipe-ing-mode')?.value || 'g';
    const valInput = row.querySelector('.recipe-ing-val');
    let rawVal = parseFloat(valInput?.value || '0');

    const invMatch = dbItems.find(i => (i.id || i._id) === ingId || (i.name && i.name.toLowerCase() === ingId.toLowerCase()));
    const itemName = invMatch ? invMatch.name : (selectEl.options[selectEl.selectedIndex]?.text || ingId);
    const itemUnit = invMatch?.unit || selectEl.options[selectEl.selectedIndex]?.dataset?.unit || 'g';

    if (isNaN(rawVal) || rawVal <= 0) {
      rawVal = itemUnit === 'g' ? 10 : 1;
      if (valInput) valInput.value = rawVal;
    }

    let quantity = 0;
    let percentage = undefined;

    if (mode === 'pct') {
      percentage = rawVal;
      quantity = parseFloat(((rawVal / 100) * totalWeight).toFixed(2));
    } else {
      quantity = rawVal;
      if (itemUnit === 'g') {
        percentage = parseFloat(((rawVal / totalWeight) * 100).toFixed(1));
      }
    }

    recipe.push({
      ingredient_id: ingId,
      ingredientId: ingId,
      quantity,
      amount: quantity,
      percentage,
      unit: mode === 'pct' ? 'g' : (mode || itemUnit || 'g'),
      name: itemName
    });
  });
  return recipe;
}

/**
 * Search recipe inventory items.
 */
export function searchRecipeInventoryItems(query) {
  const resultsEl = document.getElementById('recipeInventorySearchResults');
  if (!resultsEl) return;
  const q = (query || '').toLowerCase().trim();
  const dbItems = Object.values(state.inventory || {}).filter(item => item.active !== false);

  if (!q) {
    const initialItems = dbItems.slice(0, 15);
    renderRecipeSearchResults(initialItems, resultsEl);
    return;
  }

  const matches = dbItems.filter(item => {
    const name = (item.name || '').toLowerCase();
    const brand = (item.brand || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    return name.includes(q) || brand.includes(q) || cat.includes(q);
  });

  renderRecipeSearchResults(matches, resultsEl);
}

/**
 * Render recipe search results list.
 */
export function renderRecipeSearchResults(items, resultsEl) {
  if (items.length === 0) {
    resultsEl.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--muted); font-size: 12px;">No matching inventory stock items found</div>`;
    resultsEl.style.display = 'block';
    return;
  }

  resultsEl.innerHTML = items.map(item => {
    const itemKey = item.id || item._id || item.name;
    const allCats = getAllInventoryCategoriesList();
    const matchedCat = allCats.find(c => (c.id || c._id) === item.category_id || (c.id || c._id) === item.category);
    const catTitle = matchedCat ? matchedCat.title : (item.category || 'Stock');
    const catIcon = matchedCat ? (matchedCat.icon || '📦') : (item.unit === 'g' ? '💨' : '📦');
    const stockStr = `${item.stock !== undefined ? item.stock : 0}${item.unit || 'g'}`;
    const brandBadge = item.brand ? `<span style="background: rgba(139,92,246,0.22); color: #C4B5FD; border: 1px solid #8B5CF6; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">${escapeHtml(item.brand)}</span>` : '';
    const itemEscaped = encodeURIComponent(itemKey);

    return `
      <div class="recipe-search-item" onclick="selectRecipeSearchItem('${itemEscaped}')" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.05);" onmouseover="this.style.background='var(--card2)'" onmouseout="this.style.background='transparent'">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${catIcon}</span>
          <div>
            <div style="font-size: 13px; font-weight: 800; color: var(--cream);">${escapeHtml(item.name)}</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
              ${brandBadge}
              <span style="font-size: 11px; color: var(--muted);">${catIcon} ${escapeHtml(catTitle)}</span>
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 12px; font-weight: 800; color: ${(item.stock || 0) <= (item.reorder_threshold || 100) ? 'var(--danger)' : 'var(--success)'};">${stockStr} in stock</span>
          <div style="font-size: 10px; color: var(--gold); font-weight: 700;">+ Click to add</div>
        </div>
      </div>
    `;
  }).join('');
  resultsEl.style.display = 'block';
}

/**
 * Handle selection of an inventory search item into recipe deductions.
 */
export function selectRecipeSearchItem(escapedItemKey) {
  const itemKey = decodeURIComponent(escapedItemKey);
  const dbItems = Object.values(state.inventory || {});
  const invMatch = dbItems.find(i => (i.id || i._id) === itemKey || (i.name && i.name.toLowerCase() === itemKey.toLowerCase()));
  const defaultUnit = invMatch?.unit || 'g';
  const defaultQty = defaultUnit === 'g' ? 10 : 1;

  addRecipeIngredientRow(itemKey, defaultQty, defaultUnit, '');
  const searchInput = document.getElementById('recipeInventorySearchInput');
  const resultsEl = document.getElementById('recipeInventorySearchResults');
  if (searchInput) searchInput.value = '';
  if (resultsEl) resultsEl.style.display = 'none';

  const rows = document.querySelectorAll('#recipeRowsContainer .recipe-row');
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const valInput = lastRow.querySelector('.recipe-ing-val');
    if (valInput) {
      valInput.focus();
      valInput.select();
    }
  }
}

/**
 * Add modifier / choice group block (e.g. Wing Sauces, Soft Drinks).
 */
export function addModifierGroupBlock(groupData = null) {
  const container = document.getElementById('modifierGroupsContainer');
  if (!container) return;

  const groupUid = 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  const groupId = groupData?.id || groupUid;
  const groupName = groupData?.name || '';
  const isRequired = groupData ? Boolean(groupData.required) : true;
  const maxSelect = groupData?.max_selections || groupData?.maxSelect || 1;
  const isSingle = maxSelect === 1;

  const blockDiv = document.createElement('div');
  blockDiv.className = 'modifier-group-block';
  blockDiv.dataset.id = groupId;
  blockDiv.style.cssText = 'background: var(--card2); border: 1.5px solid rgba(16,185,129,0.35); border-radius: 12px; padding: 14px;';

  blockDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; flex-wrap: wrap;">
      <div style="flex: 2; min-width: 180px;">
        <label style="display: block; font-size: 10px; font-weight: 800; color: #10B981; text-transform: uppercase; margin-bottom: 3px;">Choice Group Name *</label>
        <input type="text" class="mod-group-name" value="${groupName.replace(/"/g, '&quot;')}" placeholder="e.g. Wing Sauce, Soft Drink Flavor, Dressing" style="width: 100%; box-sizing: border-box; padding: 7px 10px; background: var(--card); border: 1px solid var(--line); border-radius: 6px; color: var(--cream); font-size: 13px; font-weight: 700;">
      </div>

      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: var(--cream); cursor: pointer; user-select: none;">
          <input type="checkbox" class="mod-group-required" ${isRequired ? 'checked' : ''} style="accent-color: #10B981; cursor: pointer;">
          Required
        </label>

        <select class="mod-group-mode" onchange="this.closest('.modifier-group-block').querySelector('.mod-max-select-box').style.display = this.value === 'multiple' ? 'block' : 'none';" style="padding: 6px 8px; background: var(--card); border: 1px solid var(--line); border-radius: 6px; color: var(--cream); font-size: 11px; font-weight: 700;">
          <option value="single" ${isSingle ? 'selected' : ''}>Single Choice (1 only)</option>
          <option value="multiple" ${!isSingle ? 'selected' : ''}>Multi-Choice</option>
        </select>

        <div class="mod-max-select-box" style="display: ${isSingle ? 'none' : 'block'};">
          <input type="number" class="mod-group-max" min="1" max="50" value="${maxSelect > 1 ? maxSelect : 5}" placeholder="Max" title="Max selections allowed" style="width: 50px; padding: 6px 4px; text-align: center; background: var(--card); border: 1px solid var(--line); border-radius: 6px; color: var(--cream); font-size: 11px;">
        </div>

        <button type="button" class="btn btn-danger" style="padding: 5px 8px; font-size: 11px; font-weight: 800;" onclick="this.closest('.modifier-group-block').remove()" title="Delete this choice group">
          ✕ Remove
        </button>
      </div>
    </div>

    <div style="margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase;">Options &amp; Flavor Choices</span>
        <button type="button" class="btn" style="padding: 2px 8px; font-size: 10px; font-weight: 800; background: rgba(16,185,129,0.15); border: 1px solid #10B981; color: #10B981; border-radius: 4px;" onclick="addModifierOptionRow('${groupUid}')">
          + Add Option
        </button>
      </div>
      <div id="options_container_${groupUid}" class="mod-options-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
    </div>
  `;

  container.appendChild(blockDiv);

  if (groupData && Array.isArray(groupData.options) && groupData.options.length > 0) {
    groupData.options.forEach(opt => addModifierOptionRow(groupUid, opt));
  } else {
    addModifierOptionRow(groupUid);
    addModifierOptionRow(groupUid);
  }
}

/**
 * Add modifier option row inside modifier group block.
 */
export function addModifierOptionRow(groupUid, optData = null) {
  const optionsContainer = document.getElementById(`options_container_${groupUid}`);
  if (!optionsContainer) return;

  const optUid = 'opt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  const optId = optData?.id || optUid;
  const optName = optData?.name || '';
  const optPrice = Number(optData?.price_adjustment !== undefined ? optData.price_adjustment : (optData?.price !== undefined ? optData.price : 0));

  const rowDiv = document.createElement('div');
  rowDiv.className = 'modifier-option-row';
  rowDiv.dataset.id = optId;
  rowDiv.style.cssText = 'display: flex; gap: 8px; align-items: center;';

  rowDiv.innerHTML = `
    <input type="text" class="mod-opt-name" value="${optName.replace(/"/g, '&quot;')}" placeholder="Option name (e.g. Buffalo, BBQ, Garlic Parm)" style="flex: 2; padding: 6px 10px; background: var(--card); border: 1px solid var(--line); border-radius: 6px; color: var(--cream); font-size: 12px;">
    <div style="position: relative; flex: 1; max-width: 120px;">
      <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 11px;">+$</span>
      <input type="number" step="0.01" min="0" class="mod-opt-price" value="${optPrice > 0 ? optPrice.toFixed(2) : '0.00'}" placeholder="0.00" style="width: 100%; box-sizing: border-box; padding: 6px 6px 6px 24px; background: var(--card); border: 1px solid var(--line); border-radius: 6px; color: var(--cream); font-size: 12px;">
    </div>
    <button type="button" class="btn btn-danger" style="padding: 5px 8px; font-size: 11px;" onclick="this.parentElement.remove()" title="Remove option">✕</button>
  `;

  optionsContainer.appendChild(rowDiv);
}

/**
 * Extract modifier groups configuration from modal inputs.
 */
export function getModifiersFromModal() {
  const groupBlocks = document.querySelectorAll('#modifierGroupsContainer .modifier-group-block');
  const groups = [];

  groupBlocks.forEach((block, gIdx) => {
    const nameInput = block.querySelector('.mod-group-name');
    const groupName = nameInput ? nameInput.value.trim() : '';
    if (!groupName) return;

    const isRequired = Boolean(block.querySelector('.mod-group-required')?.checked);
    const mode = block.querySelector('.mod-group-mode')?.value;
    const maxInput = block.querySelector('.mod-group-max');
    const maxSelections = mode === 'multiple' ? (parseInt(maxInput?.value) || 5) : 1;
    const groupId = block.dataset.id || ('mod_' + gIdx + '_' + groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_'));

    const optionRows = block.querySelectorAll('.modifier-option-row');
    const options = [];

    optionRows.forEach((row, oIdx) => {
      const optName = row.querySelector('.mod-opt-name')?.value.trim();
      const optPrice = parseFloat(row.querySelector('.mod-opt-price')?.value) || 0;

      if (optName) {
        const optId = row.dataset.id || ('opt_' + oIdx + '_' + optName.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
        options.push({
          id: optId,
          name: optName,
          price_adjustment: optPrice,
          price: optPrice,
          available: true,
          sort_order: oIdx + 1
        });
      }
    });

    if (options.length > 0) {
      groups.push({
        id: groupId,
        name: groupName,
        required: isRequired,
        min_selections: isRequired ? 1 : 0,
        max_selections: maxSelections,
        maxSelect: maxSelections,
        sort_order: gIdx + 1,
        options
      });
    }
  });

  return groups;
}

/**
 * Switch sub-tab on the Menu Catalog layout ('items' | 'vibeQuest').
 */
export function switchMenuCatalogSubTab(subTab) {
  state.activeMenuSubTab = subTab;
  const itemsBtn = document.getElementById('menuSubTab-items');
  const vqBtn = document.getElementById('menuSubTab-vibeQuest');
  const itemsView = document.getElementById('menuCatalogItemsView');
  const vqView = document.getElementById('menuCatalogVibeQuestView');

  if (subTab === 'vibeQuest') {
    if (itemsBtn) itemsBtn.classList.remove('active');
    if (vqBtn) vqBtn.classList.add('active');
    if (itemsView) itemsView.style.display = 'none';
    if (vqView) vqView.style.display = 'block';
    if (typeof window.renderVibeQuestPage === 'function') window.renderVibeQuestPage();
  } else {
    if (itemsBtn) itemsBtn.classList.add('active');
    if (vqBtn) vqBtn.classList.remove('active');
    if (itemsView) itemsView.style.display = 'block';
    if (vqView) vqView.style.display = 'none';
    renderMenuCategoryFilterBar();
    renderMenuCatalog();
  }
  refreshIcons();
}

/**
 * Render root Menu page.
 */
export function renderMenuPage() {
  if (state.activeMenuSubTab === 'vibeQuest') {
    switchMenuCatalogSubTab('vibeQuest');
  } else {
    switchMenuCatalogSubTab('items');
  }
}

/**
 * Render menu catalog items grouped by sub-categories.
 */
export function renderMenuCatalog() {
  const container = document.getElementById('menuGridContainer');
  if (!container) return;

  if (!state.menuItems || state.menuItems.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; padding: 60px; text-align: center; color: var(--muted); font-size: 16px;">No menu items found in database. Tap "Add New Menu Item" to create one.</div>`;
    return;
  }

  const searchInput = document.getElementById('menuSearchInput');
  const searchQuery = (searchInput ? searchInput.value : '').trim().toLowerCase();

  let filtered = state.menuItems;
  const allCatsList = getAllMenuCategoriesList();

  if (state.activeSuperCategory !== 'all') {
    const validSubCatIds = allCatsList
      .filter(c => String(c.parent_id || '').toLowerCase() === String(state.activeSuperCategory).toLowerCase())
      .map(c => String(c.id || c._id).toLowerCase());

    const superList = getSuperCategoriesList();
    const activeSuperObj = superList.find(s => String(s.id).toLowerCase() === String(state.activeSuperCategory).toLowerCase());
    const superTitle = (activeSuperObj?.title || '').toLowerCase();

    filtered = filtered.filter(item => {
      const itemCatIds = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
        ? item.category_ids.map(c => String(c).toLowerCase())
        : [String(item.category_id || item.category || '').toLowerCase()];

      if (validSubCatIds.length > 0 && validSubCatIds.some(cid => itemCatIds.includes(cid))) {
        return true;
      }

      const itemLegacyCat = String(item.category || '').toLowerCase();
      if (superTitle.includes('food') && (itemLegacyCat === 'food' || itemCatIds.includes('food'))) return true;
      if ((superTitle.includes('drink') || superTitle.includes('beverage')) && (itemLegacyCat === 'drinks' || itemCatIds.includes('drinks'))) return true;
      if (superTitle.includes('hookah') && (itemLegacyCat === 'hookah' || itemCatIds.includes('hookah'))) return true;

      return validSubCatIds.some(cid => itemCatIds.includes(cid));
    });
  }

  if (state.activeSubCategory !== 'all') {
    filtered = filtered.filter(item => {
      const targetSub = String(state.activeSubCategory).toLowerCase();
      const itemCatIds = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
        ? item.category_ids.map(c => String(c).toLowerCase())
        : [String(item.category_id || item.category || '').toLowerCase()];
      return itemCatIds.includes(targetSub);
    });
  }

  if (searchQuery) {
    filtered = filtered.filter(item => {
      const nameMatch = (item.name || '').toLowerCase().includes(searchQuery);
      const catMatch = (item.category || '').toLowerCase().includes(searchQuery);
      const descMatch = (item.desc || '').toLowerCase().includes(searchQuery);
      let recipeMatch = false;
      if (Array.isArray(item.recipe)) {
        recipeMatch = item.recipe.some(r => (r.ingredientId || r.ingredient_id || '').toLowerCase().includes(searchQuery));
      } else if (item.ingredient_id) {
        recipeMatch = item.ingredient_id.toLowerCase().includes(searchQuery);
      }
      return nameMatch || catMatch || descMatch || recipeMatch;
    });
  }

  const subCategoryMap = {};
  const allMenuCats = getAllMenuCategoriesList();

  filtered.forEach(item => {
    const itemCatIds = (state.activeSubCategory !== 'all')
      ? [state.activeSubCategory]
      : ((Array.isArray(item.category_ids) && item.category_ids.length > 0)
          ? item.category_ids
          : [item.category_id || item.category || 'Menu Items']);

    itemCatIds.forEach(itemCatId => {
      const catKey = String(itemCatId).toLowerCase();
      const matchedDbCat = allMenuCats.find(c => String(c.id || c._id || '').toLowerCase() === catKey);

      const subTitle = matchedDbCat ? matchedDbCat.title : (item.category || itemCatId);
      const subIcon = matchedDbCat ? (matchedDbCat.icon || '📋') : '🍽️';

      if (!subCategoryMap[catKey]) {
        subCategoryMap[catKey] = {
          title: `${subIcon} ${subTitle.toUpperCase()}`,
          sort_order: matchedDbCat?.sort_order ?? 999,
          items: []
        };
      }

      if (!subCategoryMap[catKey].items.some(i => (i.id || i._id) === (item.id || item._id))) {
        subCategoryMap[catKey].items.push(item);
      }
    });
  });

  let html = '';
  const sortedSubKeys = Object.keys(subCategoryMap).sort((a, b) => {
    return (subCategoryMap[a].sort_order ?? 999) - (subCategoryMap[b].sort_order ?? 999);
  });
  sortedSubKeys.forEach(subKey => {
    const subGroup = subCategoryMap[subKey];
    if (subGroup.items.length > 0) {
      html += `
        <div style="grid-column: 1/-1; margin-top: 8px; margin-bottom: 4px;">
          <div style="color: var(--gold); font-size: 15px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; padding-bottom: 6px; border-bottom: 2px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
            <span>${subGroup.title}</span>
            <span style="font-size:12px; color:var(--muted); font-weight:700;">${subGroup.items.length} ITEMS</span>
          </div>
        </div>
      `;

      subGroup.items.forEach(item => {
        const isAvail = item.available !== false;
        const statusBadge = isAvail 
          ? `<span style="background:rgba(34,197,94,0.15); color:var(--success); border:1px solid var(--success); border-radius:20px; padding:2px 8px; font-size:10px; font-weight:800;">ACTIVE</span>`
          : `<span style="background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid var(--danger); border-radius:20px; padding:2px 8px; font-size:10px; font-weight:800;">DISABLED</span>`;

        let recipeBadge = '';
        let ingredientsList = [];
        const invArray = Array.isArray(state.inventory) ? state.inventory : Object.values(state.inventory || {});
        
        const recipeData = (Array.isArray(item.recipe) && item.recipe.length > 0) ? item.recipe : [];

        if (Array.isArray(recipeData) && recipeData.length > 0) {
          recipeData.forEach(r => {
            const ingId = r.ingredientId || r.ingredient_id;
            const amt = r.amount || r.ingredient_amount || r.quantity || 0;
            if (!ingId) return;
            const invItem = invArray.find(i => i.id === ingId || i._id === ingId || (i.name && i.name.toLowerCase() === String(ingId).toLowerCase()));
            const ingName = invItem ? invItem.name : (r.name || String(ingId).charAt(0).toUpperCase() + String(ingId).slice(1).replace(/_/g, ' '));
            const unit = r.unit || (invItem ? invItem.unit : 'g') || 'g';
            ingredientsList.push(`<span style="color:var(--cream); font-weight:700;">${ingName}</span>: <span style="color:var(--gold); font-weight:900;">${amt}${unit}</span>`);
          });
        } else if (item.ingredient_id) {
          const ingId = item.ingredient_id;
          const amt = item.ingredient_amount || 25;
          const invItem = invArray.find(i => i.id === ingId || i._id === ingId || (i.name && i.name.toLowerCase() === String(ingId).toLowerCase()));
          const ingName = invItem ? invItem.name : (String(ingId).charAt(0).toUpperCase() + String(ingId).slice(1).replace(/_/g, ' '));
          const unit = invItem ? (invItem.unit || 'g') : 'g';
          ingredientsList.push(`<span style="color:var(--cream); font-weight:700;">${ingName}</span>: <span style="color:var(--gold); font-weight:900;">${amt}${unit}</span>`);
        }

        if (ingredientsList.length > 0) {
          recipeBadge = `
            <div style="font-size: 11px; color: var(--gold); background: rgba(229,177,58,0.08); border: 1px dashed rgba(229,177,58,0.4); border-radius: 8px; padding: 6px 10px; margin-top: 8px; margin-bottom: 4px;">
              <div style="line-height: 1.4; font-size: 12px;">${ingredientsList.join(' • ')}</div>
            </div>
          `;
        } else {
          recipeBadge = '';
        }

        const itemMods = item.modifier_groups || item.modifierGroups || [];
        let modBadge = '';
        if (itemMods.length > 0) {
          const optCount = itemMods.reduce((acc, g) => acc + (g.options ? g.options.length : 0), 0);
          const groupNames = itemMods.map(g => g.name || 'Choice').join(', ');
          modBadge = `
            <div style="font-size: 11px; color: #10B981; background: rgba(16,185,129,0.08); border: 1px dashed rgba(16,185,129,0.4); border-radius: 8px; padding: 6px 10px; margin-top: 6px; margin-bottom: 4px;">
              <div style="font-weight: 800; font-size: 11px;">${itemMods.length} Choice Group${itemMods.length > 1 ? 's' : ''} (${optCount} options)</div>
              <div style="font-size: 10px; color: var(--muted); margin-top: 2px;">${groupNames}</div>
            </div>
          `;
        }

        const descTag = item.desc 
          ? `<p style="color: var(--muted); font-size: 12px; margin: 4px 0 8px 0; line-height: 1.4;">${item.desc}</p>`
          : '';

        const itemId = item.id || item._id;
        const dbImgUrl = item.image_url || item.imageUrl || item.image || item.img;
        const isHouseMix = item.category_id === 'CAT_HOOKAH_HOUSE_MIXES' || item.subcategory === 'House Mixes' || item.card_type === 'house_mix_compact';
        const isCustomMix = item.id === 'MI_custom_hookah_mix' || item.category_id === 'CAT_HOOKAH_CUSTOM' || item.is_custom_mix;

        let badgeHtml = '';
        if (item.badge) {
          badgeHtml = `<span style="background: rgba(229,177,58,0.2); color: var(--gold); border: 1px solid var(--gold); border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px;">${item.badge}</span>`;
        } else if (isHouseMix && (item.name.toLowerCase().includes('cavalli crush') || item.name.toLowerCase().includes('shah jahan'))) {
          badgeHtml = `<span style="background: rgba(34,197,94,0.2); color: var(--success); border: 1px solid var(--success); border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px;">NEW FLAVOR</span>`;
        }

        if (isHouseMix) {
          html += `
            <div class="menu-card" style="background: var(--card); border: 1.5px solid ${isAvail ? 'rgba(229,177,58,0.3)' : 'var(--danger)'}; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.25); opacity: ${isAvail ? '1' : '0.65'}; min-height: 120px;">
              <div>
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 900; color: var(--gold); font-size: 15px; line-height: 1.2;">💨 ${item.name}</div>
                  </div>
                  <div style="font-size: 16px; font-weight: 900; color: var(--gold); white-space: nowrap;">$${(Number(item.price) || 0).toFixed(2)}</div>
                </div>
                ${descTag}
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:4px; margin-bottom:4px;">
                  ${badgeHtml}
                  <span style="background: rgba(255,255,255,0.06); color: var(--muted); border: 1px solid var(--line); border-radius: 12px; padding: 2px 6px; font-size: 9px; font-weight: 700;">HOUSE BLEND</span>
                  ${statusBadge}
                </div>
                ${recipeBadge}
                ${modBadge}
              </div>

              <div style="display: flex; gap: 4px; margin-top: 10px;">
                <button class="btn" style="flex: 1; justify-content: center; padding: 4px 8px; font-size: 11px; font-weight: 800;" onclick="openEditMenuItemModalById('${itemId}', '${escapeJs(subKey)}')">
                  <i data-lucide="edit-2" style="width: 11px; height: 11px;"></i> Edit
                </button>
                <button class="btn" style="padding: 4px 8px; font-size: 11px; font-weight: 800; background: ${isAvail ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}; border-color: ${isAvail ? 'var(--danger)' : 'var(--success)'}; color: ${isAvail ? 'var(--danger)' : 'var(--success)'};" onclick="toggleMenuItemStatus('${itemId}', ${!isAvail})">
                  ${isAvail ? '🚫' : '🟢'}
                </button>
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="deleteMenuItem('${itemId}')">
                  <i data-lucide="trash-2" style="width: 11px; height: 11px;"></i>
                </button>
              </div>
            </div>
          `;
        } else if (isCustomMix) {
          // Custom Hookah Mix Lab card preserving Ice Base and Ice Hose
          html += `
            <div class="menu-card" style="background: linear-gradient(145deg, var(--card) 0%, rgba(229,177,58,0.08) 100%); border: 2px solid var(--gold); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 16px rgba(229,177,58,0.15); opacity: ${isAvail ? '1' : '0.65'};">
              <div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                  <span style="font-size: 36px; width: 52px; height: 52px; display:flex; align-items:center; justify-content:center; background: rgba(229,177,58,0.15); border-radius: 12px; border: 1.5px solid var(--gold); flex-shrink: 0;">🧪</span>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 900; color: var(--cream); font-size: 16px; line-height: 1.2;">${item.name}</div>
                    <div style="font-size: 11px; color: var(--gold); font-weight: 700; margin-top: 2px;">FLAVOR LABORATORY</div>
                  </div>
                  <div style="font-size: 18px; font-weight: 900; color: var(--gold); white-space: nowrap; align-self: flex-start;">$${(Number(item.price) || 25).toFixed(2)}</div>
                </div>
                ${descTag}
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
                  <span style="background: rgba(0,153,255,0.15); color: #0099FF; border: 1px solid #0099FF; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 800;">🧊 Ice Base (+$2)</span>
                  <span style="background: rgba(20,184,166,0.15); color: #14B8A6; border: 1px solid #14B8A6; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 800;">❄️ Ice Hose (+$6)</span>
                  ${statusBadge}
                </div>
                ${recipeBadge}
              </div>

              <div style="display: flex; gap: 6px; margin-top: 16px; flex-wrap: wrap;">
                <button class="btn" style="flex: 1; justify-content: center; padding: 6px 10px; font-size: 11px; font-weight: 800;" onclick="openEditMenuItemModalById('${itemId}', '${escapeJs(subKey)}')">
                  <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i> Edit
                </button>
                <button class="btn" style="padding: 6px 10px; font-size: 11px; font-weight: 800; background: ${isAvail ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}; border-color: ${isAvail ? 'var(--danger)' : 'var(--success)'}; color: ${isAvail ? 'var(--danger)' : 'var(--success)'};" onclick="toggleMenuItemStatus('${itemId}', ${!isAvail})">
                  ${isAvail ? '🚫 Disable' : '🟢 Enable'}
                </button>
                <button class="btn btn-danger" style="padding: 6px 10px; font-size: 11px;" onclick="deleteMenuItem('${itemId}')">
                  <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
              </div>
            </div>
          `;
        } else {
          const mediaDisplay = dbImgUrl ?
            `<img src="${dbImgUrl}" alt="${item.name}" loading="lazy" style="width: 52px; height: 52px; border-radius: 12px; object-fit: cover; border: 1.5px solid var(--gold); flex-shrink: 0;" onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-block';">
             <span style="font-size: 32px; width: 52px; text-align: center; flex-shrink: 0; display: none;">${item.emoji || '🍽️'}</span>` :
            `<span style="font-size: 32px; width: 52px; text-align: center; flex-shrink: 0;">${item.emoji || '🍽️'}</span>`;

          html += `
            <div class="menu-card" style="background: var(--card); border: 1.5px solid ${isAvail ? 'var(--line)' : 'var(--danger)'}; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 14px rgba(0,0,0,0.3); opacity: ${isAvail ? '1' : '0.65'};">
              <div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                  ${mediaDisplay}
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 900; color: var(--cream); font-size: 16px; line-height: 1.2; word-break: break-word;">${item.name}</div>
                  </div>
                  <div style="font-size: 18px; font-weight: 900; color: var(--gold); white-space: nowrap; align-self: flex-start;">$${(Number(item.price) || 0).toFixed(2)}</div>
                </div>
                ${descTag}
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
                  ${badgeHtml}
                  ${(() => {
                    const itemCatIds = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
                      ? item.category_ids
                      : [item.category_id || item.category].filter(Boolean);
                    return itemCatIds.map(cid => {
                      const matched = allMenuCats.find(c => String(c.id || c._id).toLowerCase() === String(cid).toLowerCase());
                      const label = matched ? matched.title : String(cid).replace(/^CAT_/i, '').replace(/_/g, ' ');
                      const icon = matched ? (matched.icon || '🏷️') : '🏷️';
                      return `<span style="background: rgba(229,177,58,0.12); color: var(--gold); border: 1px solid rgba(229,177,58,0.3); border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${icon} ${label}</span>`;
                    }).join(' ');
                  })()}
                  ${statusBadge}
                </div>
                ${recipeBadge}
                ${modBadge}
              </div>

              <div style="display: flex; gap: 6px; margin-top: 16px; flex-wrap: wrap;">
                <button class="btn" style="flex: 1; justify-content: center; padding: 6px 10px; font-size: 11px; font-weight: 800;" onclick="openEditMenuItemModalById('${itemId}', '${escapeJs(subKey)}')">
                  <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i> Edit
                </button>
                <button class="btn" style="padding: 6px 10px; font-size: 11px; font-weight: 800; background: ${isAvail ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}; border-color: ${isAvail ? 'var(--danger)' : 'var(--success)'}; color: ${isAvail ? 'var(--danger)' : 'var(--success)'};" onclick="toggleMenuItemStatus('${itemId}', ${!isAvail})" title="${isAvail ? 'Disable item' : 'Enable item'}">
                  ${isAvail ? '🚫 Disable' : '🟢 Enable'}
                </button>
                <button class="btn btn-danger" style="padding: 6px 10px; font-size: 11px;" onclick="deleteMenuItem('${itemId}')" title="Delete menu item">
                  <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
              </div>
            </div>
          `;
        }
      });
    }
  });

  container.innerHTML = html;
  refreshIcons();
}

/**
 * Open modal to add brand new menu item.
 */
export function openAddMenuItemModal() {
  const title = document.getElementById('menuModalTitle');
  if (title) title.innerText = 'Add New Menu Item';
  const editId = document.getElementById('menuEditId');
  if (editId) editId.value = '';
  const scopedInput = document.getElementById('menuEditScopedCategory');
  if (scopedInput) scopedInput.value = '';
  const noticeEl = document.getElementById('menuEditCategoryScopeNotice');
  if (noticeEl) noticeEl.style.display = 'none';

  const name = document.getElementById('menuItemName');
  if (name) name.value = '';
  const price = document.getElementById('menuItemPrice');
  if (price) price.value = '';
  const emoji = document.getElementById('menuItemEmoji');
  if (emoji) emoji.value = '👑';
  const initialCat = (state.activeSubCategory && state.activeSubCategory !== 'all') ? state.activeSubCategory : 'CAT_APPETIZERS';
  populateMenuCategorySelector([initialCat]);
  const desc = document.getElementById('menuItemDesc');
  if (desc) desc.value = '';
  const imgUrl = document.getElementById('menuItemImageUrl');
  if (imgUrl) imgUrl.value = '';

  const modContainer = document.getElementById('modifierGroupsContainer');
  if (modContainer) modContainer.innerHTML = '';

  const container = document.getElementById('recipeRowsContainer');
  if (container) container.innerHTML = '';
  addRecipeIngredientRow();

  const searchInput = document.getElementById('recipeInventorySearchInput');
  if (searchInput) searchInput.value = '';
  const searchRes = document.getElementById('recipeInventorySearchResults');
  if (searchRes) searchRes.style.display = 'none';

  const modal = document.getElementById('menuItemModal');
  if (modal) modal.style.display = 'flex';
}

/**
 * Open modal to edit existing menu item by ID.
 */
export function openEditMenuItemModalById(itemId, scopedCategory) {
  try {
    const item = (state.menuItems || []).find(i => String(i.id || i._id) === String(itemId));
    if (!item) return;

    const title = document.getElementById('menuModalTitle');
    if (title) title.innerText = 'Edit Menu Item';
    const editId = document.getElementById('menuEditId');
    if (editId) editId.value = item.id || item._id || '';

    const scopedInput = document.getElementById('menuEditScopedCategory');
    const noticeEl = document.getElementById('menuEditCategoryScopeNotice');
    const noticeNameEl = document.getElementById('menuEditScopedCategoryName');

    const isScoped = Boolean(scopedCategory && scopedCategory !== 'all');
    if (scopedInput) scopedInput.value = isScoped ? scopedCategory : '';
    if (noticeEl) {
      if (isScoped) {
        const allCats = getAllMenuCategoriesList();
        const matched = allCats.find(c => String(c.id || c._id).toLowerCase() === String(scopedCategory).toLowerCase());
        if (noticeNameEl) noticeNameEl.textContent = matched ? matched.title : String(scopedCategory).replace(/^CAT_/i, '').replace(/_/g, ' ');
        noticeEl.style.display = 'block';
      } else {
        noticeEl.style.display = 'none';
      }
    }

    const name = document.getElementById('menuItemName');
    if (name) name.value = item.name || '';

    const override = (isScoped && item.category_overrides && item.category_overrides[scopedCategory]) ? item.category_overrides[scopedCategory] : null;

    const price = document.getElementById('menuItemPrice');
    if (price) price.value = (override && override.price !== undefined) ? override.price : (item.price || '');
    const emoji = document.getElementById('menuItemEmoji');
    if (emoji) emoji.value = item.emoji || '🍽️';
    
    const initialCats = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
      ? item.category_ids
      : [item.category_id || item.category || 'CAT_APPETIZERS'];
    populateMenuCategorySelector(initialCats);

    const desc = document.getElementById('menuItemDesc');
    if (desc) desc.value = (override && override.desc !== undefined) ? override.desc : (item.desc || '');
    const imgUrl = document.getElementById('menuItemImageUrl');
    if (imgUrl) imgUrl.value = item.image_url || item.imageUrl || '';

    const modContainer = document.getElementById('modifierGroupsContainer');
    if (modContainer) modContainer.innerHTML = '';
    const mods = (override && override.modifier_groups) ? override.modifier_groups : (item.modifier_groups || item.modifierGroups || []);
    if (Array.isArray(mods) && mods.length > 0) {
      mods.forEach(g => addModifierGroupBlock(g));
    }

    const container = document.getElementById('recipeRowsContainer');
    if (container) container.innerHTML = '';

    if (Array.isArray(item.recipe) && item.recipe.length > 0) {
      item.recipe.forEach(r => {
        const rawAmount = r.amount !== undefined ? r.amount : (r.quantity !== undefined ? r.quantity : '');
        addRecipeIngredientRow(r.ingredientId || r.ingredient_id, rawAmount, r.unit || 'g', r.percentage);
      });
    } else if (item.ingredient_id) {
      addRecipeIngredientRow(item.ingredient_id, item.ingredient_amount, 'g');
    } else {
      addRecipeIngredientRow();
    }

    const searchInput = document.getElementById('recipeInventorySearchInput');
    if (searchInput) searchInput.value = '';
    const searchRes = document.getElementById('recipeInventorySearchResults');
    if (searchRes) searchRes.style.display = 'none';

    const modal = document.getElementById('menuItemModal');
    if (modal) modal.style.display = 'flex';
  } catch (err) {
    console.error('Error opening edit modal:', err);
  }
}

/**
 * Close menu item modal.
 */
export function closeMenuItemModal() {
  const searchInput = document.getElementById('recipeInventorySearchInput');
  if (searchInput) searchInput.value = '';
  const searchRes = document.getElementById('recipeInventorySearchResults');
  if (searchRes) searchRes.style.display = 'none';
  const modal = document.getElementById('menuItemModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Toggle menu item availability active status.
 */
export async function toggleMenuItemStatus(itemId, newAvailableState) {
  const itemIdx = (state.menuItems || []).findIndex(i => String(i.id || i._id).toLowerCase() === String(itemId).toLowerCase());
  const originalAvailable = itemIdx >= 0 ? state.menuItems[itemIdx].available : !newAvailableState;

  if (itemIdx >= 0) {
    state.menuItems[itemIdx].available = newAvailableState;
    state.menuItems[itemIdx].is_available = newAvailableState;
    renderMenuPage();
  }

  try {
    const headers = getAuthHeaders();
    const restId = localStorage.getItem('benzin_restaurant_id') || 'RES_EED4E9D266DF';
    const res = await fetch(`${API_URL}/api/menu/${encodeURIComponent(itemId)}?_t=${Date.now()}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ 
        available: newAvailableState,
        restaurant_id: restId 
      })
    });
    const data = await res.json();
    if (data.success) {
      await loadMenuItems();
    } else {
      if (itemIdx >= 0) {
        state.menuItems[itemIdx].available = originalAvailable;
        state.menuItems[itemIdx].is_available = originalAvailable;
        renderMenuPage();
      }
      alert('Could not update status: ' + (data.message || data.error || 'Error'));
    }
  } catch (err) {
    if (itemIdx >= 0) {
      state.menuItems[itemIdx].available = originalAvailable;
      state.menuItems[itemIdx].is_available = originalAvailable;
      renderMenuPage();
    }
    alert('Network error updating item status: ' + err.message);
  }
}

/**
 * Save new or modified menu item.
 */
export async function saveMenuItem() {
  const id = document.getElementById('menuEditId').value;
  const name = document.getElementById('menuItemName').value.trim();
  const price = parseFloat(document.getElementById('menuItemPrice').value);
  const emoji = document.getElementById('menuItemEmoji').value.trim() || '🍽️';
  const category_ids = getSelectedMenuItemCategories();
  const primaryCategory = category_ids[0] || document.getElementById('menuItemCategory').value || 'cat_mains';
  const desc = document.getElementById('menuItemDesc').value.trim();
  const image_url = document.getElementById('menuItemImageUrl').value.trim();
  const recipe = getRecipeFromModal();
  const modifier_groups = getModifiersFromModal();

  if (!name || isNaN(price)) {
    alert('Please fill in valid item name and price');
    return;
  }
  if (category_ids.length === 0 && !primaryCategory) {
    alert('Please select at least one category for this menu item');
    return;
  }

  const scoped_category_id = document.getElementById('menuEditScopedCategory')?.value || undefined;

  try {
    const headers = getAuthHeaders();
    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_URL}/api/menu/${id}` : `${API_URL}/api/menu`;

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify({
        name,
        price,
        emoji,
        category: primaryCategory,
        category_ids: category_ids.length > 0 ? category_ids : [primaryCategory],
        scoped_category_id,
        desc,
        image_url,
        recipe,
        modifier_groups,
        ingredient_id: recipe.length > 0 ? recipe[0].ingredientId : '',
        ingredient_amount: recipe.length > 0 ? recipe[0].amount : 0
      })
    });
    const data = await res.json();
    if (data.success) {
      if (id && state.menuItems) {
        const idx = state.menuItems.findIndex(i => String(i.id || i._id) === String(id));
        if (idx !== -1) {
          state.menuItems[idx] = {
            ...state.menuItems[idx],
            name,
            price,
            emoji,
            category: primaryCategory,
            category_ids: category_ids.length > 0 ? category_ids : [primaryCategory],
            desc,
            image_url,
            recipe,
            modifier_groups
          };
        }
      }
      closeMenuItemModal();
      renderMenuPage();
      await loadMenuItems();
    } else {
      alert('Could not save menu item: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error saving menu item: ' + err.message);
  }
}

/**
 * Remove menu item from catalog.
 */
export async function deleteMenuItem(itemId) {
  if (!confirm('Are you sure you want to remove this menu item from the catalog?')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/menu/${itemId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (data.success) {
      await loadMenuItems();
    } else {
      alert('Could not delete menu item: ' + (data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error deleting item: ' + err.message);
  }
}

/**
 * Fetch all menu categories from API.
 */
export async function fetchMenuCategories() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v2/menu/categories`, { headers });
    const data = await res.json();
    if (data.success && Array.isArray(data.categories)) {
      state.menuCategories = data.categories;
      localStorage.setItem('benzin_cached_menu_cats', JSON.stringify(state.menuCategories));
    }
  } catch (err) {
    console.error('Error fetching menu categories:', err);
  }
  renderMenuCategoryFilterBar();
}

/**
 * Select active super category filter tab.
 */
export function selectSuperCategoryFilter(superId) {
  state.activeSuperCategory = superId;
  state.activeSubCategory = 'all';
  renderMenuCategoryFilterBar();
  renderMenuPage();
}

/**
 * Select active sub-category filter pill.
 */
export function selectSubCategoryFilter(subId) {
  state.activeSubCategory = subId;
  renderMenuCategoryFilterBar();
  renderMenuPage();
}

/**
 * Scroll super categories navigation container.
 */
export function scrollSuperCategories(direction) {
  const container = document.getElementById('superCategoryHeaderNav');
  if (container) {
    container.scrollBy({ left: direction * 140, behavior: 'smooth' });
  }
}

/**
 * Get sorted list of all active child/sub-categories.
 */
export function getAllMenuCategoriesList() {
  const list = [];
  (state.menuCategories || []).forEach(c => {
    const id = c._id || c.id;
    if (id && c.active !== false && c.parent_id !== null) {
      list.push({
        id,
        _id: id,
        parent_id: c.parent_id,
        title: c.name || c.title || 'Sub Category',
        icon: c.icon || '📋',
        subtitle: c.description || c.subtitle || '',
        sort_order: c.sort_order ?? 0,
        active: c.active !== false,
        raw: c
      });
    }
  });
  return list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/**
 * Get sorted list of root super categories (e.g. Hookah, Food, Drinks).
 */
export function getSuperCategoriesList() {
  const list = [];
  (state.menuCategories || []).forEach(cat => {
    const id = cat._id || cat.id;
    if (id && cat.active !== false && cat.parent_id === null) {
      list.push({
        id,
        _id: id,
        parent_id: null,
        title: cat.name || cat.title || 'Super Category',
        icon: cat.icon || '👑',
        sort_order: cat.sort_order ?? 0,
        active: cat.active !== false,
        raw: cat
      });
    }
  });
  return list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/**
 * Render super category tabs and child sub-category pills.
 */
export function renderMenuCategoryFilterBar() {
  const superContainer = document.getElementById('superCategoryHeaderNav');
  const subContainer = document.getElementById('subCategoryHeaderNav');

  const superList = getSuperCategoriesList();
  const allCatsList = getAllMenuCategoriesList();

  if (superList.length > 0 && (!state.activeSuperCategory || !superList.some(s => String(s.id).toLowerCase() === String(state.activeSuperCategory).toLowerCase()))) {
    state.activeSuperCategory = superList[0].id;
  }

  // 1. Render Super Category Tabs Bar
  if (superContainer) {
    let superHtml = '';
    superList.forEach(superObj => {
      const isActive = String(state.activeSuperCategory).toLowerCase() === String(superObj.id).toLowerCase();
      const activeBg = 'linear-gradient(135deg, #0066FF 0%, #0044CC 100%)';
      superHtml += `
        <button class="super-cat-tab ${isActive ? 'active' : ''}" onclick="selectSuperCategoryFilter('${superObj.id}')" style="padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 14px; border: 1.5px solid ${isActive ? '#0066FF' : 'var(--line)'}; ${isActive ? `background: ${activeBg}; color: #FFFFFF; box-shadow: 0 4px 14px rgba(0,102,255,0.3);` : 'background: var(--card); color: var(--muted);'} transition: all 0.2s ease; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 8px;">
          <span>${superObj.icon || '📁'}</span>
          <span>${(superObj.title || '').toUpperCase()}</span>
        </button>
      `;
    });
    superContainer.innerHTML = superHtml;
  }

  // 2. Render Sub-Category Pills for the active Super Category only
  if (subContainer) {
    const childCats = allCatsList.filter(c => String(c.parent_id || '').toLowerCase() === String(state.activeSuperCategory).toLowerCase());

    let subHtml = `
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-top: 4px; padding-bottom: 4px;">
        <button class="sub-tab ${state.activeSubCategory === 'all' ? 'active' : ''}" onclick="selectSubCategoryFilter('all')" style="padding: 6px 14px; border-radius: 10px; font-weight: 800; font-size: 12px; border: 1px solid ${state.activeSubCategory === 'all' ? 'transparent' : 'var(--line)'}; ${state.activeSubCategory === 'all' ? 'background: linear-gradient(135deg, #E5B13A 0%, #c4952b 100%); color: #000; box-shadow: 0 2px 10px rgba(229,177,58,0.25);' : 'background: var(--card2); color: var(--muted);'} transition: all 0.2s ease; cursor: pointer; white-space: nowrap;">
          📋 All ${childCats.length > 0 ? '' : 'Items'}
        </button>
    `;

    childCats.forEach(subObj => {
      const isActive = String(state.activeSubCategory || '').toLowerCase() === String(subObj.id).toLowerCase();
      const activeBg = 'linear-gradient(135deg, #E5B13A 0%, #c4952b 100%)';
      subHtml += `
        <button class="sub-tab ${isActive ? 'active' : ''}" onclick="selectSubCategoryFilter('${subObj.id}')" style="padding: 6px 14px; border-radius: 10px; font-weight: 800; font-size: 12px; border: 1px solid ${isActive ? 'transparent' : 'var(--line)'}; ${isActive ? `background: ${activeBg}; color: #000; box-shadow: 0 2px 10px rgba(229,177,58,0.25);` : 'background: var(--card2); color: var(--muted);'} transition: all 0.2s ease; cursor: pointer; white-space: nowrap;">
          ${subObj.icon || '📋'} ${subObj.title}
        </button>
      `;
    });
    subHtml += `</div>`;
    subContainer.innerHTML = subHtml;
  }
}

/**
 * Switch modal display between super category and sub-category modes.
 */
export function switchCategoryModalMode(mode) {
  const isSuper = mode === 'super';
  document.getElementById('menuCatIsSuper').value = isSuper ? 'true' : 'false';
  document.getElementById('tabSubCatBtn').style.background = isSuper ? 'transparent' : 'var(--gold)';
  document.getElementById('tabSubCatBtn').style.color = isSuper ? 'var(--cream)' : '#000';
  document.getElementById('tabSuperCatBtn').style.background = isSuper ? 'var(--gold)' : 'transparent';
  document.getElementById('tabSuperCatBtn').style.color = isSuper ? '#000' : 'var(--cream)';

  document.getElementById('catFormHeaderTitle').innerText = isSuper ? 'Create or Edit Super Category (Menu Section)' : 'Create or Edit Sub-Category';
  document.getElementById('catTitleLabel').innerText = isSuper ? 'Super Category Title *' : 'Sub-Category Title *';
  document.getElementById('menuCatTitle').placeholder = isSuper ? 'e.g. Desserts & Sweets or VIP Lounge' : 'e.g. Appetizers & Starters';
  document.getElementById('catSubtitleRow').style.display = isSuper ? 'none' : 'block';
  document.getElementById('catSuperDropdownRow').style.display = isSuper ? 'none' : 'block';
  document.getElementById('rosterTitleText').innerText = isSuper ? 'Existing Super Categories' : 'Existing Sub-Categories';

  if (isSuper) {
    renderExistingSuperCategoriesList();
  } else {
    renderExistingMenuCategoriesList();
  }
}

/**
 * Populate super categories dropdown inside sub-category creation form.
 */
export function populateSuperCategoriesDropdown(selectedVal = 'hookah') {
  const select = document.getElementById('menuCatType');
  if (!select) return;

  const supers = getSuperCategoriesList();
  let html = '';
  supers.forEach(s => {
    const val = s.id.toLowerCase();
    const isSel = (selectedVal.toLowerCase() === val) ? 'selected' : '';
    html += `<option value="${val}" ${isSel}>${s.icon || '👑'} ${s.title}</option>`;
  });
  select.innerHTML = html;
}

/**
 * Populate multi-select category pills inside item creation form.
 */
export function populateMenuCategorySelector(selectedVals = []) {
  const grid = document.getElementById('menuItemCategoriesGrid');
  const countEl = document.getElementById('selectedCategoriesCount');
  const hiddenCat = document.getElementById('menuItemCategory');
  if (!grid) return;

  selectedMenuItemCategoriesSet.clear();
  const initialArr = Array.isArray(selectedVals) ? selectedVals : (selectedVals ? [selectedVals] : []);
  
  const allCats = getAllMenuCategoriesList();
  const supers = getSuperCategoriesList();

  initialArr.forEach(rawVal => {
    if (!rawVal) return;
    const lower = String(rawVal).toLowerCase();
    const matched = allCats.find(c => 
      String(c.id || c._id).toLowerCase() === lower || 
      (c.title || '').toLowerCase() === lower ||
      String(c.id || c._id).toLowerCase().replace(/^cat_/, '') === lower.replace(/^cat_/, '')
    );
    if (matched) {
      selectedMenuItemCategoriesSet.add(matched.id || matched._id);
    } else {
      selectedMenuItemCategoriesSet.add(rawVal);
    }
  });

  function updateCategorySelectorUI() {
    const count = selectedMenuItemCategoriesSet.size;
    if (countEl) {
      countEl.innerText = `${count} Selected`;
      countEl.style.color = count > 0 ? '#10B981' : 'var(--danger)';
    }
    if (hiddenCat) {
      hiddenCat.value = Array.from(selectedMenuItemCategoriesSet)[0] || '';
    }

    const pills = grid.querySelectorAll('.cat-select-pill');
    pills.forEach(pill => {
      const catId = pill.dataset.catId;
      const isSelected = selectedMenuItemCategoriesSet.has(catId);
      if (isSelected) {
        pill.style.background = 'rgba(16, 185, 129, 0.2)';
        pill.style.borderColor = '#10B981';
        pill.style.color = '#10B981';
        const check = pill.querySelector('.cat-check');
        if (check) {
          check.innerText = '✓';
          check.style.color = '#10B981';
        }
      } else {
        pill.style.background = 'var(--card)';
        pill.style.borderColor = 'var(--line)';
        pill.style.color = 'var(--cream)';
        const check = pill.querySelector('.cat-check');
        if (check) {
          check.innerText = '+';
          check.style.color = 'var(--muted)';
        }
      }
    });
  }

  let html = '';
  allCats.forEach(cat => {
    const id = cat.id || cat._id;
    const title = cat.title || 'Category';
    const icon = cat.icon || '📋';
    const parentSuper = supers.find(s => s.id === cat.parent_id);
    const parentLabel = parentSuper ? parentSuper.title : '';

    html += `
      <button type="button" class="cat-select-pill" data-cat-id="${id}" onclick="toggleMenuItemCategory('${id}')" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; border: 1px solid var(--line); background: var(--card); color: var(--cream);">
        <span class="cat-check" style="font-size: 13px; font-weight: 900; color: var(--muted); width: 12px; text-align: center;">+</span>
        <span>${icon} ${title}</span>
        ${parentLabel ? `<span style="font-size: 9px; opacity: 0.6; text-transform: uppercase;">(${parentLabel})</span>` : ''}
      </button>
    `;
  });

  if (!html) {
    html = '<div style="color: var(--muted); font-size: 12px; padding: 8px;">No categories configured yet.</div>';
  }

  grid.innerHTML = html;
  updateCategorySelectorUI();
}

/**
 * Toggle category selection for menu item.
 */
export function toggleMenuItemCategory(catId) {
  if (selectedMenuItemCategoriesSet.has(catId)) {
    selectedMenuItemCategoriesSet.delete(catId);
  } else {
    selectedMenuItemCategoriesSet.add(catId);
  }
  const countEl = document.getElementById('selectedCategoriesCount');
  const hiddenCat = document.getElementById('menuItemCategory');
  const grid = document.getElementById('menuItemCategoriesGrid');
  if (countEl) {
    const count = selectedMenuItemCategoriesSet.size;
    countEl.innerText = `${count} Selected`;
    countEl.style.color = count > 0 ? '#10B981' : 'var(--danger)';
  }
  if (hiddenCat) {
    hiddenCat.value = Array.from(selectedMenuItemCategoriesSet)[0] || '';
  }
  if (grid) {
    const pills = grid.querySelectorAll('.cat-select-pill');
    pills.forEach(pill => {
      const pId = pill.dataset.catId;
      const isSelected = selectedMenuItemCategoriesSet.has(pId);
      if (isSelected) {
        pill.style.background = 'rgba(16, 185, 129, 0.2)';
        pill.style.borderColor = '#10B981';
        pill.style.color = '#10B981';
        const check = pill.querySelector('.cat-check');
        if (check) {
          check.innerText = '✓';
          check.style.color = '#10B981';
        }
      } else {
        pill.style.background = 'var(--card)';
        pill.style.borderColor = 'var(--line)';
        pill.style.color = 'var(--cream)';
        const check = pill.querySelector('.cat-check');
        if (check) {
          check.innerText = '+';
          check.style.color = 'var(--muted)';
        }
      }
    });
  }
}

/**
 * Return selected menu item category IDs as array.
 */
export function getSelectedMenuItemCategories() {
  return Array.from(selectedMenuItemCategoriesSet);
}

/**
 * Legacy compatibility wrapper for category dropdown.
 */
export function populateMenuCategoryDropdown(selectedVal = 'hookah') {
  populateMenuCategorySelector(selectedVal ? [selectedVal] : []);
}

/**
 * Open modal to create super category.
 */
export function openAddSuperCategoryModal() {
  document.getElementById('menuCatEditId').value = '';
  document.getElementById('menuCatModalTitle').innerText = 'Manage Super Categories';
  document.getElementById('menuCatTitle').value = '';
  document.getElementById('menuCatIcon').value = '👑';
  document.getElementById('menuCatColor').value = '#E5B13A';
  switchCategoryModalMode('super');
  document.getElementById('menuCatModal').style.display = 'flex';
}

/**
 * Render existing super categories list inside category modal.
 */
export function renderExistingSuperCategoriesList() {
  const listEl = document.getElementById('existingMenuCatList');
  if (!listEl) return;

  const supers = getSuperCategoriesList();
  listEl.innerHTML = supers.map(s => {
    const id = s.id;
    const title = s.title;
    const icon = s.icon || '👑';

    const subCount = getAllMenuCategoriesList().filter(c => c.parent_id === id).length;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; margin-bottom: 6px;">
        <div>
          <span style="font-size: 14px; font-weight: 800; color: var(--cream);">${icon} ${title}</span>
          <span style="font-size: 11px; font-weight: 700; color: var(--gold); margin-left: 8px;">(${subCount} sub-categories)</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button onclick="openEditSuperCategoryModal('${id}')" class="btn" style="padding: 4px 10px; font-size: 11px; font-weight: 700;">✏️ Edit</button>
          <button onclick="deleteSuperCategory('${id}')" class="btn btn-danger" style="padding: 4px 10px; font-size: 11px; font-weight: 700; ${subCount > 0 ? 'opacity: 0.5;' : ''}" title="${subCount > 0 ? 'Cannot delete super category with sub-categories' : 'Delete super category'}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render existing sub-categories list inside category modal.
 */
export function renderExistingMenuCategoriesList() {
  const listEl = document.getElementById('existingMenuCatList');
  if (!listEl) return;

  const allCats = getAllMenuCategoriesList();
  const items = Array.isArray(state.menuItems) ? state.menuItems : [];

  if (allCats.length === 0) {
    listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 13px;">No sub-categories found. Create one above!</div>';
    return;
  }

  listEl.innerHTML = allCats.map(cat => {
    const id = cat.id || cat._id;
    const title = cat.title || 'Category';
    const icon = cat.icon || '📋';

    const itemCount = items.filter(item => item.category_id === id || item.category === id).length;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; margin-bottom: 6px;">
        <div>
          <span style="font-size: 14px; font-weight: 800; color: var(--cream);">${icon} ${title}</span>
          <span style="font-size: 11px; font-weight: 700; color: ${itemCount > 0 ? 'var(--gold)' : 'var(--muted)'}; margin-left: 8px;">(${itemCount} item${itemCount === 1 ? '' : 's'})</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button onclick="openEditMenuCategoryModal('${id}')" class="btn" style="padding: 4px 10px; font-size: 11px; font-weight: 700;">✏️ Edit</button>
          <button onclick="deleteMenuCategory('${id}')" class="btn btn-danger" style="padding: 4px 10px; font-size: 11px; font-weight: 700; ${itemCount > 0 ? 'opacity: 0.5;' : ''}" title="${itemCount > 0 ? 'Cannot delete category with items' : 'Delete category'}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Open edit super category modal.
 */
export function openEditSuperCategoryModal(superId) {
  const supers = getSuperCategoriesList();
  const s = supers.find(x => x.id.toLowerCase() === superId.toLowerCase());
  if (!s) return;
  document.getElementById('menuCatEditId').value = s.id;
  document.getElementById('menuCatModalTitle').innerText = `Edit ${s.title} Super Category`;
  document.getElementById('menuCatTitle').value = s.title;
  document.getElementById('menuCatIcon').value = s.icon || '👑';
  switchCategoryModalMode('super');
  document.getElementById('menuCatModal').style.display = 'flex';
}

/**
 * Delete super category with cascade safety check.
 */
export async function deleteSuperCategory(superId) {
  const subCount = getAllMenuCategoriesList().filter(c => c.parent_id === superId).length;
  let confirmMsg = `Are you sure you want to delete Super Category "${superId.toUpperCase()}"?`;
  if (subCount > 0) {
    confirmMsg = `⚠️ Delete Super Category "${superId.toUpperCase()}":\n\nThis section contains ${subCount} sub-category(ies).\n\nDo you want to delete this super category?`;
  }

  if (!confirm(confirmMsg)) return;

  const supers = getSuperCategoriesList();
  const targetSuper = supers.find(x => x.id.toLowerCase() === superId.toLowerCase());
  const catId = targetSuper?.raw?._id || targetSuper?.raw?.id || superId;

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v2/menu/categories/${catId}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (data.success) {
      await fetchMenuCategories();
      renderMenuCategoryFilterBar();
      renderExistingSuperCategoriesList();
      renderMenuPage();
    } else {
      alert('Could not delete super category: ' + (data.error || data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error deleting super category: ' + err.message);
  }
}

/**
 * Open modal to add sub-category.
 */
export function openAddMenuCategoryModal() {
  const editId = document.getElementById('menuCatEditId');
  if (editId) editId.value = '';
  const titleEl = document.getElementById('menuCatModalTitle');
  if (titleEl) titleEl.innerText = 'Manage Menu Categories';
  const catTitle = document.getElementById('menuCatTitle');
  if (catTitle) catTitle.value = '';
  const catSub = document.getElementById('menuCatSubtitle');
  if (catSub) catSub.value = '';
  const catIcon = document.getElementById('menuCatIcon');
  if (catIcon) catIcon.value = '💨';
  const catColor = document.getElementById('menuCatColor');
  if (catColor) catColor.value = '#FF5A1F';
  populateSuperCategoriesDropdown('hookah');
  switchCategoryModalMode('sub');
  const modal = document.getElementById('menuCatModal');
  if (modal) modal.style.display = 'flex';
}

/**
 * Open modal to edit sub-category.
 */
export function openEditMenuCategoryModal(catId) {
  const allCats = getAllMenuCategoriesList();
  const cat = allCats.find(c => (c.id || c._id) === catId || (c.title || '').toLowerCase() === catId.toLowerCase());
  if (!cat) return;
  document.getElementById('menuCatEditId').value = cat.id || cat._id || catId;
  document.getElementById('menuCatModalTitle').innerText = `Edit ${cat.title} Category`;
  document.getElementById('menuCatTitle').value = cat.title || '';
  document.getElementById('menuCatSubtitle').value = cat.subtitle || '';
  document.getElementById('menuCatIcon').value = cat.icon || '💨';
  document.getElementById('menuCatType').value = cat.menu_type || 'hookah';
  document.getElementById('menuCatColor').value = cat.color || '#FF5A1F';
  switchCategoryModalMode('sub');
  renderExistingMenuCategoriesList();
  document.getElementById('menuCatModal').style.display = 'flex';
}

/**
 * Close category management modal.
 */
export function closeMenuCategoryModal() {
  document.getElementById('menuCatModal').style.display = 'none';
}

/**
 * Save new or edited category.
 */
export async function saveMenuCategory() {
  const id = document.getElementById('menuCatEditId').value;
  const isSuper = document.getElementById('menuCatIsSuper').value === 'true';
  const title = document.getElementById('menuCatTitle').value.trim();
  const subtitle = document.getElementById('menuCatSubtitle').value.trim();
  const icon = document.getElementById('menuCatIcon').value.trim() || (isSuper ? '👑' : '📋');
  const menu_type = isSuper ? (id || title.toLowerCase().replace(/[^a-z0-9]/g, '_')) : (document.getElementById('menuCatType').value || 'hookah');
  const color = document.getElementById('menuCatColor').value;

  if (!title) {
    alert('Please enter a Category Title');
    return;
  }

  try {
    const headers = getAuthHeaders();
    let res;
    const payload = { title, subtitle, icon, menu_type, color, is_super: isSuper };
    if (id) {
      res = await fetch(`${API_URL}/api/v2/menu/categories/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_URL}/api/v2/menu/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    }
    const data = await res.json();
    if (data.success) {
      document.getElementById('menuCatEditId').value = '';
      document.getElementById('menuCatTitle').value = '';
      document.getElementById('menuCatSubtitle').value = '';
      await fetchMenuCategories();
      if (isSuper) {
        renderExistingSuperCategoriesList();
      } else {
        renderExistingMenuCategoriesList();
      }
      renderMenuCategoryFilterBar();
      closeMenuCategoryModal();
      await loadMenuItems();
    } else {
      alert('Could not save menu category: ' + (data.error || data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error saving category: ' + err.message);
  }
}

/**
 * Delete category after safety check for existing items.
 */
export async function deleteMenuCategory(catId) {
  const cat = (state.menuCategories || []).find(c => (c.id || c._id) === catId);
  const catTitle = (cat?.title || '').toLowerCase();

  const matchingItems = (state.menuItems || []).filter(item => {
    const c = (item.category || item.category_id || '').toLowerCase();
    return c === catId.toLowerCase() || (catTitle && c === catTitle);
  });

  if (matchingItems.length > 0) {
    alert(`⚠️ Cannot Delete Category:\n\nThe category "${cat?.title || catId}" contains ${matchingItems.length} active menu item(s).\n\nPlease delete or move those menu items before deleting this category.`);
    return;
  }

  if (!confirm(`Are you sure you want to delete category "${cat?.title || catId}"?`)) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v2/menu/categories/${catId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (data.success) {
      await fetchMenuCategories();
      renderExistingMenuCategoriesList();
      await loadMenuItems();
    } else {
      alert('Could not delete category: ' + (data.error || data.message || 'Error'));
    }
  } catch (err) {
    alert('Network error deleting category: ' + err.message);
  }
}
