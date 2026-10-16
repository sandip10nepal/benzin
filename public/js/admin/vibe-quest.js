/**
 * Benzin Hospitality OS — Cavalli Vibe Quest Discovery Admin Engine
 * Native ES Module: vibe-quest.js
 */

import { API_URL, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { escapeHtml, refreshIcons } from './utils.js';
import { fetchMenuCategories, getAllMenuCategoriesList } from './menu.js';

/**
 * Preload menu items and categories required for question pairings.
 */
export async function ensureMenuItemsLoaded() {
  try {
    const restId = localStorage.getItem('benzin_restaurant_id') || 'RES_EED4E9D266DF';
    const promises = [];
    if (!state.menuItems || state.menuItems.length === 0) {
      promises.push(
        fetch(`${API_URL}/api/menu?restaurantId=${restId}`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data.items)) state.menuItems = data.items;
            else if (Array.isArray(data.menu_items)) state.menuItems = data.menu_items;
          })
          .catch(e => console.warn('Menu load error:', e))
      );
    }
    if (!state.menuCategories || state.menuCategories.length === 0) {
      promises.push(fetchMenuCategories().catch(e => console.warn('Cat load error:', e)));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  } catch (err) {
    console.warn('Could not preload menu items/categories for Vibe Quest:', err);
  }
  return state.menuItems || [];
}

/**
 * Render the main Vibe Quest questions configuration page.
 */
export async function renderVibeQuestPage() {
  const container = document.getElementById('questionConfigCardsContainer');
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);"><i data-lucide="loader" class="spin"></i> Loading question configuration...</div>';
  refreshIcons();

  await ensureMenuItemsLoaded();

  try {
    const headers = getAuthHeaders();
    let res = await fetch(`${API_URL}/api/vibe-quest/admin/settings`, { headers });
    if (!res.ok) {
      res = await fetch(`${API_URL}/api/vibe-quest/admin/draft`, { headers });
    }
    if (!res.ok) {
      throw new Error(`Failed to load configuration (${res.status})`);
    }
    const data = await res.json();
    const rawQuestions = data.draft?.questions || data.questions || data.published?.questions || [];

    if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
      state.configuredQuestions = rawQuestions.map((q, idx) => {
        let trigger = q.navigation_trigger;
        if (!trigger) {
          if (q.stage === 'hookah' || q.id === 'q_hookah_experience' || q.id === 'q_hookah_path') {
            trigger = 'start_order';
          } else if (q.stage === 'food' || q.id === 'q_food_craving') {
            trigger = 'next_food';
          } else if (q.stage === 'dessert' || q.id === 'q_dessert_reminder' || (q.repeat_policy === 'cart_conditional' && q.stage === 'dessert')) {
            trigger = 'cart_dessert';
          } else if (q.stage === 'drinks' && (q.repeat_policy === 'cart_conditional' || q.id === 'q_drink_cart_reminder')) {
            trigger = 'cart_drinks';
          } else if (q.stage === 'drinks' || q.id === 'q_drink_reminder') {
            trigger = 'next_drinks';
          } else {
            trigger = 'start_order';
          }
        } else if (q.id === 'q_drink_cart_reminder' || (q.repeat_policy === 'cart_conditional' && q.stage === 'drinks')) {
          trigger = 'cart_drinks';
        } else if (q.id === 'q_dessert_reminder' || (q.repeat_policy === 'cart_conditional' && q.stage === 'dessert')) {
          trigger = 'cart_dessert';
        }

        let curated = Array.isArray(q.curated_product_ids) ? [...q.curated_product_ids] : (Array.isArray(q.pinned_product_ids) ? [...q.pinned_product_ids] : []);
        if (curated.length === 0) {
          if (trigger === 'cart_dessert') {
            const sCurated = data.draft?.settings?.dessert_featured_product_ids || data.published?.settings?.dessert_featured_product_ids || data.settings?.dessert_featured_product_ids;
            if (Array.isArray(sCurated)) curated = [...sCurated];
          } else if (trigger === 'cart_drinks') {
            const sCurated = data.draft?.settings?.drink_featured_product_ids || data.published?.settings?.drink_featured_product_ids || data.settings?.drink_featured_product_ids;
            if (Array.isArray(sCurated)) curated = [...sCurated];
          }
        }

        return {
          id: q.id || `q_${trigger}_${idx + 1}`,
          navigation_trigger: trigger,
          question_text: q.question_text || q.title || '',
          subtitle: q.subtitle || q.helper_text || q.description || '',
          active: q.active !== false,
          curated_product_ids: curated,
          answers: Array.isArray(q.answers) ? q.answers.map((a, aIdx) => ({
            id: a.id || `ans_${idx + 1}_${aIdx + 1}`,
            label: a.label || '',
            host_reply: a.host_reply || a.reaction_message || '',
            destination: a.destination || 'skip',
            curated_product_ids: Array.isArray(a.curated_product_ids) ? [...a.curated_product_ids] : []
          })) : []
        };
      });

      // Ensure cart_dessert question is present in configuredQuestions
      if (!state.configuredQuestions.some(q => q.navigation_trigger === 'cart_dessert')) {
        const dessertText = data.draft?.settings?.dessert_reminder_text || data.published?.settings?.dessert_reminder_text || data.settings?.dessert_reminder_text || 'Should we save room for something sweet? 🍰';
        const dessertSub = data.draft?.settings?.dessert_reminder_subtitle || data.published?.settings?.dessert_reminder_subtitle || data.settings?.dessert_reminder_subtitle || 'Complete your session with warm Kunafa, Biscoff cake, or traditional sweets.';
        const dessertActive = (data.draft?.settings?.dessert_reminder_enabled ?? data.published?.settings?.dessert_reminder_enabled ?? data.settings?.dessert_reminder_enabled) !== false;
        const rawDessertDest = data.draft?.settings?.dessert_destination_category || data.published?.settings?.dessert_destination_category || data.settings?.dessert_destination_category || 'CAT_DESSERTS';
        const dessertDest = String(rawDessertDest).replace(/^category:/, '');
        const dessertCurated = Array.isArray(data.draft?.settings?.dessert_featured_product_ids) ? data.draft.settings.dessert_featured_product_ids : (Array.isArray(data.settings?.dessert_featured_product_ids) ? data.settings.dessert_featured_product_ids : []);
        state.configuredQuestions.push({
          id: 'q_dessert_reminder',
          navigation_trigger: 'cart_dessert',
          question_text: dessertText,
          subtitle: dessertSub,
          active: dessertActive,
          curated_product_ids: [...dessertCurated],
          answers: [
            { id: 'ans_d_browse', label: 'Browse Desserts 🍰', host_reply: 'Sweet ending coming right up! 🍰', destination: `category:${dessertDest}` },
            { id: 'ans_d_skip', label: 'Skip Dessert & Continue →', host_reply: '', destination: 'skip' }
          ]
        });
      }

      // Ensure cart_drinks question is present in configuredQuestions
      if (!state.configuredQuestions.some(q => q.navigation_trigger === 'cart_drinks')) {
        const drinkText = data.draft?.settings?.drink_reminder_text || data.published?.settings?.drink_reminder_text || data.settings?.drink_reminder_text || 'Would you like something to drink? 🥤';
        const drinkSub = data.draft?.settings?.drink_reminder_subtitle || data.published?.settings?.drink_reminder_subtitle || data.settings?.drink_reminder_subtitle || 'Pair your dishes with crisp mojitos, fresh juices, Karak chai, or ice-cold sodas.';
        const drinkActive = (data.draft?.settings?.drink_reminder_enabled ?? data.published?.settings?.drink_reminder_enabled ?? data.settings?.drink_reminder_enabled) !== false;
        const rawDrinkDest = data.draft?.settings?.drink_destination_category || data.published?.settings?.drink_destination_category || data.settings?.drink_destination_category || 'cat_super_drinks';
        const drinkDest = String(rawDrinkDest).replace(/^category:/, '');
        const drinkCurated = Array.isArray(data.draft?.settings?.drink_featured_product_ids) ? data.draft.settings.drink_featured_product_ids : (Array.isArray(data.settings?.drink_featured_product_ids) ? data.settings.drink_featured_product_ids : []);
        state.configuredQuestions.push({
          id: 'q_drink_cart_reminder',
          navigation_trigger: 'cart_drinks',
          question_text: drinkText,
          subtitle: drinkSub,
          active: drinkActive,
          curated_product_ids: [...drinkCurated],
          answers: [
            { id: 'ans_dr_browse', label: 'Browse Drinks 🥤', host_reply: 'Refreshing drinks on the way! 🥤', destination: `category:${drinkDest}` },
            { id: 'ans_dr_skip', label: 'Skip Drinks & Review Order →', host_reply: '', destination: 'stage:checkout' }
          ]
        });
      }
    } else {
      state.configuredQuestions = [
        {
          id: 'q_start_order',
          navigation_trigger: 'start_order',
          question_text: 'What kind of hookah experience would you like?',
          subtitle: 'Select signature mixes or build your custom blend.',
          active: true,
          curated_product_ids: [],
          answers: [
            { id: 'ans_1', label: 'House Mix Hookahs', host_reply: 'Awesome, exploring house mixes! 💨', destination: 'menu:hookah' },
            { id: 'ans_2', label: 'Create Your Own Hookah', host_reply: 'Opening custom mix lab for you! 🧪', destination: 'flow:mix_lab' }
          ]
        },
        {
          id: 'q_next_food',
          navigation_trigger: 'next_food',
          question_text: 'What are we craving?',
          subtitle: 'From authentic mains to quick bites.',
          active: true,
          curated_product_ids: [],
          answers: [
            { id: 'ans_1', label: 'Browse Food Menu', host_reply: 'Delicious food menu coming up! 🥘', destination: 'menu:food' },
            { id: 'ans_2', label: 'Skip', host_reply: '', destination: 'skip' }
          ]
        },
        {
          id: 'q_next_drinks',
          navigation_trigger: 'next_drinks',
          question_text: 'Would you like something to drink?',
          subtitle: 'Pair your dishes with refreshers, tea, or sodas.',
          active: true,
          curated_product_ids: [],
          answers: [
            { id: 'ans_1', label: 'Browse Drinks Menu', host_reply: 'Cold and hot drinks coming right up! 🍹', destination: 'menu:drinks' },
            { id: 'ans_2', label: 'Skip', host_reply: '', destination: 'skip' }
          ]
        },
        {
          id: 'q_dessert_reminder',
          navigation_trigger: 'cart_dessert',
          question_text: 'Should we save room for something sweet? 🍰',
          subtitle: 'Complete your session with warm Kunafa, Biscoff cake, or traditional sweets.',
          active: true,
          curated_product_ids: [],
          answers: [
            { id: 'ans_1', label: 'Browse Desserts 🍰', host_reply: 'Sweet ending coming right up! 🍰', destination: 'category:CAT_DESSERTS' },
            { id: 'ans_2', label: 'Skip Dessert & Continue →', host_reply: '', destination: 'skip' }
          ]
        },
        {
          id: 'q_drink_cart_reminder',
          navigation_trigger: 'cart_drinks',
          question_text: 'Would you like something to drink? 🥤',
          subtitle: 'Pair your dishes with crisp mojitos, fresh juices, Karak chai, or ice-cold sodas.',
          active: true,
          curated_product_ids: [],
          answers: [
            { id: 'ans_1', label: 'Browse Drinks 🥤', host_reply: 'Refreshing drinks on the way! 🥤', destination: 'menu:drinks' },
            { id: 'ans_2', label: 'Skip Drinks & Review Order →', host_reply: '', destination: 'stage:checkout' }
          ]
        }
      ];
    }

    renderQuestionCards();
  } catch (err) {
    console.error('Error rendering ordering questions:', err);
    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1.5px solid var(--danger); border-radius: 12px; padding: 24px; text-align: center;">
        <div style="font-size: 16px; font-weight: 800; color: var(--danger); margin-bottom: 8px;">Failed to load question configuration</div>
        <div style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">${escapeHtml(err.message)}</div>
        <button class="btn btn-primary" onclick="renderVibeQuestPage()" style="padding: 8px 16px; font-weight: 800;">Retry</button>
      </div>
    `;
  }
}

/**
 * Build dropdown options grouped by category for featured table pairings.
 */
export function buildCategorizedMenuItemsOptions(selectedIds = []) {
  const selectedSet = new Set((selectedIds || []).map(id => String(id)));
  const items = Array.isArray(state.menuItems) ? state.menuItems : [];
  const cats = getAllMenuCategoriesList();
  const catMap = {};
  cats.forEach(c => {
    catMap[c.id || c._id] = c.title || c.id || c._id;
  });

  const grouped = {};
  items.forEach(item => {
    const iId = String(item.id || item._id);
    if (selectedSet.has(iId)) return;
    const cId = item.category || (Array.isArray(item.category_ids) ? item.category_ids[0] : 'other');
    const cName = catMap[cId] || cId || 'Other Menu Items';
    if (!grouped[cName]) grouped[cName] = [];
    grouped[cName].push(item);
  });

  let html = '<option value="">-- Select a Menu Item to Add --</option>';
  const groupNames = Object.keys(grouped).sort();
  if (groupNames.length === 0) {
    html = '<option value="">-- All Available Items Already Added --</option>';
    return html;
  }
  groupNames.forEach(gName => {
    html += `<optgroup label="${escapeHtml(gName)}">`;
    grouped[gName].forEach(it => {
      const id = it.id || it._id;
      const price = it.price ? ` ($${Number(it.price).toFixed(2)})` : '';
      html += `<option value="${escapeHtml(id)}">${escapeHtml(it.name)}${price}</option>`;
    });
    html += `</optgroup>`;
  });

  return html;
}

/**
 * Build destination navigation options for answer choices.
 */
export function buildDestinationOptionsHtml(selectedVal) {
  const current = selectedVal || 'skip';
  const staticOptions = [
    { value: 'menu:hookah', label: 'House Mix Hookahs Menu (menu:hookah)' },
    { value: 'flow:mix_lab', label: 'Custom Hookah Mix Lab (flow:mix_lab)' },
    { value: 'menu:food', label: 'All Food Menu (menu:food)' },
    { value: 'menu:drinks', label: 'All Drinks Menu (menu:drinks)' },
    { value: 'stage:checkout', label: 'Review Order (stage:checkout)' },
    { value: 'skip', label: 'Skip Question (skip)' }
  ];

  let optionsHtml = '';
  let foundSelected = false;

  staticOptions.forEach(opt => {
    const isSel = opt.value === current;
    if (isSel) foundSelected = true;
    optionsHtml += `<option value="${opt.value}" ${isSel ? 'selected' : ''}>${opt.label}</option>`;
  });

  const allCats = getAllMenuCategoriesList();

  if (allCats && allCats.length > 0) {
    optionsHtml += `<optgroup label="Menu Categories">`;
    allCats.forEach(cat => {
      const cid = cat.id || cat._id;
      if (cid) {
        const val = `category:${cid}`;
        const isSel = val === current || cid === current;
        if (isSel) foundSelected = true;
        optionsHtml += `<option value="${val}" ${isSel ? 'selected' : ''}>Category: ${escapeHtml(cat.title || cid)} (${cid})</option>`;
      }
    });
    optionsHtml += `</optgroup>`;
  }

  if (!foundSelected && current) {
    optionsHtml = `<option value="${escapeHtml(current)}" selected>Current: ${escapeHtml(current)}</option>` + optionsHtml;
  }

  return optionsHtml;
}

/**
 * Render all configured question cards in the editor.
 */
export function renderQuestionCards() {
  const container = document.getElementById('questionConfigCardsContainer');
  if (!container) return;

  if (!state.configuredQuestions || state.configuredQuestions.length === 0) {
    container.innerHTML = `
      <div style="background: var(--card); border: 1.5px dashed var(--line); border-radius: 14px; padding: 40px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 12px;">📝</div>
        <div style="font-size: 16px; font-weight: 800; color: var(--cream); margin-bottom: 6px;">No Questions Configured</div>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 20px;">Add a question to display when customers navigate between order steps.</p>
        <button class="btn btn-primary" onclick="addNewQuestionCard()" style="background: var(--gold); color: #000; font-weight: 800; padding: 10px 20px; border-radius: 10px;">
          + Add First Question
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  state.configuredQuestions.forEach((q, qIdx) => {
    const answers = Array.isArray(q.answers) ? q.answers : [];
    const curatedIds = Array.isArray(q.curated_product_ids) ? q.curated_product_ids : [];

    html += `
      <div style="background: var(--card); border: 1.5px solid var(--line); border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 18px rgba(0,0,0,0.3); transition: border-color 0.2s;">
        <!-- Question Header Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--line); padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="background: var(--card2); border: 1px solid var(--line); font-size: 12px; font-weight: 900; color: var(--gold); padding: 4px 10px; border-radius: 8px;">
              Question #${qIdx + 1}
            </span>

            <!-- Navigation Trigger Dropdown -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase;">Navigation Trigger:</label>
              <select onchange="updateQuestionTrigger(${qIdx}, this.value)" style="padding: 6px 12px; font-size: 12px; font-weight: 800; border-radius: 8px; background: var(--card2); border: 1.5px solid var(--gold); color: var(--gold); cursor: pointer;">
                <option value="start_order" ${q.navigation_trigger === 'start_order' ? 'selected' : ''}>Start Order (Hookah)</option>
                <option value="next_food" ${q.navigation_trigger === 'next_food' ? 'selected' : ''}>Next: Food</option>
                <option value="next_drinks" ${q.navigation_trigger === 'next_drinks' ? 'selected' : ''}>Next: Drinks</option>
                <option value="cart_dessert" ${q.navigation_trigger === 'cart_dessert' ? 'selected' : ''}>Cart Reminder: Dessert (Prompt if no dessert in cart)</option>
                <option value="cart_drinks" ${q.navigation_trigger === 'cart_drinks' ? 'selected' : ''}>Cart Reminder: Drinks (Prompt if no drink in cart)</option>
              </select>
            </div>

            <!-- Enabled Checkbox -->
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: ${q.active !== false ? 'var(--success)' : 'var(--muted)'}; cursor: pointer; margin-left: 8px;">
              <input type="checkbox" ${q.active !== false ? 'checked' : ''} onchange="toggleQuestionActive(${qIdx}, this.checked)" style="width: 16px; height: 16px; cursor: pointer;">
              ${q.active !== false ? 'Active' : 'Disabled'}
            </label>
          </div>

          <!-- Question Controls: Reorder & Delete -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="btn" onclick="moveQuestionCard(${qIdx}, -1)" ${qIdx === 0 ? 'disabled' : ''} title="Move Up" style="padding: 6px 10px; font-size: 12px; background: var(--card2); border: 1px solid var(--line); opacity: ${qIdx === 0 ? '0.4' : '1'};">
              ⬆️
            </button>
            <button class="btn" onclick="moveQuestionCard(${qIdx}, 1)" ${qIdx === state.configuredQuestions.length - 1 ? 'disabled' : ''} title="Move Down" style="padding: 6px 10px; font-size: 12px; background: var(--card2); border: 1px solid var(--line); opacity: ${qIdx === state.configuredQuestions.length - 1 ? '0.4' : '1'};">
              ⬇️
            </button>
            <button class="btn" onclick="deleteQuestionCard(${qIdx})" title="Delete Question" style="padding: 6px 12px; font-size: 12px; font-weight: 800; background: rgba(239,68,68,0.12); color: var(--danger); border: 1px solid var(--danger); border-radius: 8px;">
              🗑️ Delete
            </button>
          </div>
        </div>

        <!-- Question Text Field -->
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 11px; font-weight: 800; color: var(--cream); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.4px;">
            Question Text <span style="color: var(--gold);">(Customer Prompt)</span>
          </label>
          <input type="text" value="${escapeHtml(q.question_text)}" onchange="updateQuestionText(${qIdx}, this.value)" oninput="updateQuestionText(${qIdx}, this.value)" placeholder="e.g. What kind of hookah experience would you like?" style="width: 100%; padding: 12px 14px; font-size: 15px; font-weight: 700; border-radius: 10px; background: var(--card2); border: 1.5px solid var(--line); color: var(--cream); box-sizing: border-box;">
        </div>

        <!-- Question Subheading / Description Field -->
        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 11px; font-weight: 800; color: var(--cream); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.4px;">
            Subheading / Description <span style="color: var(--gold); font-size: 10px; font-weight: 600;">(Optional helper text displayed under question title)</span>
          </label>
          <input type="text" value="${escapeHtml(q.subtitle || '')}" onchange="updateQuestionSubtitle(${qIdx}, this.value)" oninput="updateQuestionSubtitle(${qIdx}, this.value)" placeholder="e.g. Complete your session with warm Kunafa, Biscoff cake, or traditional sweets." style="width: 100%; padding: 10px 14px; font-size: 13px; font-weight: 600; border-radius: 10px; background: var(--card2); border: 1.5px solid var(--line); color: var(--cream); box-sizing: border-box;">
        </div>

        <!-- Featured Menu Items / Table Pairings (Optional) -->
        <div style="background: rgba(0,0,0,0.22); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 800; color: var(--gold); text-transform: uppercase; letter-spacing: 0.4px;">
                ⭐ Featured Menu Items (Popular Table Pairings)
              </span>
              <span style="font-size: 11px; font-weight: 700; color: var(--muted);">
                (${curatedIds.length} added)
              </span>
            </div>
            <div style="font-size: 11px; color: var(--muted);">
              Quick-add cards shown in customer popup. If none added, table pairings won't be displayed.
            </div>
          </div>

          <!-- Selected Items Badges -->
          <div id="curatedList_${qIdx}" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: ${curatedIds.length > 0 ? '12px' : '8px'};">
            ${curatedIds.length === 0 ? `
              <div style="font-size: 12px; color: var(--muted); font-style: italic; padding: 4px 0;">
                No menu items added. Customers will only see the prompt without table pairings.
              </div>
            ` : curatedIds.map(itemId => {
              const mItem = (state.menuItems || []).find(m => String(m.id || m._id) === String(itemId));
              const itemName = mItem ? mItem.name : itemId;
              const itemPrice = mItem && mItem.price ? `$${Number(mItem.price).toFixed(2)}` : '';
              const itemImg = mItem && mItem.image_url ? `<img src="${escapeHtml(mItem.image_url)}" style="width: 22px; height: 22px; border-radius: 4px; object-fit: cover;" />` : '';
              return `
                <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--card2); border: 1.5px solid var(--gold); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 700; color: var(--cream);">
                  ${itemImg}
                  <span>${escapeHtml(itemName)}</span>
                  ${itemPrice ? `<span style="color: var(--gold); font-size: 11px;">${itemPrice}</span>` : ''}
                  <button type="button" onclick="removeFeaturedItemFromQuestion(${qIdx}, '${escapeHtml(itemId)}')" title="Remove" style="background: none; border: none; color: var(--danger); font-size: 15px; font-weight: 900; cursor: pointer; padding: 0 0 0 4px; line-height: 1;">✕</button>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Add Item Selector Dropdown & Button -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <select id="curatedSelect_${qIdx}" style="padding: 7px 12px; font-size: 12px; font-weight: 700; border-radius: 8px; background: var(--card2); border: 1px solid var(--line); color: var(--cream); cursor: pointer; max-width: 340px; flex: 1; min-width: 220px;">
              ${buildCategorizedMenuItemsOptions(curatedIds)}
            </select>
            <button type="button" class="btn" onclick="addFeaturedItemToQuestion(${qIdx})" style="padding: 7px 14px; font-size: 12px; font-weight: 800; background: var(--gold); color: #000; border-radius: 8px; white-space: nowrap;">
              + Add Item
            </button>
          </div>
        </div>

        <!-- Answer Options List -->
        <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--line); border-radius: 12px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--gold); text-transform: uppercase; letter-spacing: 0.4px;">
              Answer Options (${answers.length})
            </span>
            <button class="btn" onclick="addOptionToQuestion(${qIdx})" style="padding: 6px 14px; font-size: 12px; font-weight: 800; background: var(--card2); border: 1px solid var(--gold); color: var(--gold); border-radius: 8px;">
              + Add Option
            </button>
          </div>

          ${answers.length === 0 ? `
            <div style="text-align: center; padding: 20px; color: var(--muted); font-size: 13px;">
              No options added yet. Click "+ Add Option" to add selection choices for this question.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${answers.map((ans, aIdx) => `
                <div style="display: flex; align-items: flex-start; gap: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; flex-wrap: wrap;">
                  <span style="font-size: 11px; font-weight: 800; color: var(--muted); min-width: 24px; margin-top: 24px;">#${aIdx + 1}</span>

                  <!-- Option Label Input -->
                  <div style="flex: 2; min-width: 180px;">
                    <label style="display: block; font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 4px;">Choice Label</label>
                    <input type="text" value="${escapeHtml(ans.label)}" onchange="updateOptionLabel(${qIdx}, ${aIdx}, this.value)" oninput="updateOptionLabel(${qIdx}, ${aIdx}, this.value)" placeholder="Option Label (e.g. House Mix Hookahs)" style="width: 100%; padding: 8px 12px; font-size: 13px; font-weight: 700; border-radius: 8px; background: var(--card2); border: 1px solid var(--line); color: var(--cream); box-sizing: border-box;">
                  </div>

                  <!-- Host Reply Input -->
                  <div style="flex: 2.2; min-width: 220px;">
                    <label style="display: block; font-size: 10px; font-weight: 800; color: var(--gold); text-transform: uppercase; margin-bottom: 4px;">💬 Host Reply (Animated Transition)</label>
                    <input type="text" value="${escapeHtml(ans.host_reply || '')}" onchange="updateOptionHostReply(${qIdx}, ${aIdx}, this.value)" oninput="updateOptionHostReply(${qIdx}, ${aIdx}, this.value)" placeholder="e.g. Don't worry, I will get your stomach full!" title="AI Host response shown with a beautiful transition before opening category" style="width: 100%; padding: 8px 12px; font-size: 12px; font-weight: 600; border-radius: 8px; background: rgba(212,175,55,0.06); border: 1px dashed var(--gold); color: var(--cream); box-sizing: border-box;">
                  </div>

                  <!-- Destination Selector Dropdown -->
                  <div style="flex: 2.5; min-width: 220px;">
                    <label style="display: block; font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 4px;">Destination Navigation</label>
                    <select onchange="updateOptionDestination(${qIdx}, ${aIdx}, this.value)" style="width: 100%; padding: 8px 12px; font-size: 12px; font-weight: 700; border-radius: 8px; background: var(--card2); border: 1px solid var(--line); color: var(--cream); cursor: pointer; box-sizing: border-box;">
                      ${buildDestinationOptionsHtml(ans.destination)}
                    </select>
                  </div>

                  <!-- Move & Delete Option Buttons -->
                  <div style="display: flex; align-items: center; gap: 4px; margin-top: 20px;">
                    <button class="btn" onclick="moveOptionInQuestion(${qIdx}, ${aIdx}, -1)" ${aIdx === 0 ? 'disabled' : ''} title="Move Up" style="padding: 6px 8px; font-size: 11px; background: var(--card2); border: 1px solid var(--line); opacity: ${aIdx === 0 ? '0.3' : '1'};">
                      ⬆️
                    </button>
                    <button class="btn" onclick="moveOptionInQuestion(${qIdx}, ${aIdx}, 1)" ${aIdx === answers.length - 1 ? 'disabled' : ''} title="Move Down" style="padding: 6px 8px; font-size: 11px; background: var(--card2); border: 1px solid var(--line); opacity: ${aIdx === answers.length - 1 ? '0.3' : '1'};">
                      ⬇️
                    </button>
                    <button class="btn" onclick="deleteOptionFromQuestion(${qIdx}, ${aIdx})" title="Remove Option" style="padding: 6px 8px; font-size: 11px; color: var(--danger); background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px;">
                      ✕
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  refreshIcons();
}

export function addFeaturedItemToQuestion(qIdx) {
  if (!state.configuredQuestions[qIdx]) return;
  const select = document.getElementById(`curatedSelect_${qIdx}`);
  if (!select || !select.value) {
    alert('Please select a menu item from the dropdown.');
    return;
  }
  if (!Array.isArray(state.configuredQuestions[qIdx].curated_product_ids)) {
    state.configuredQuestions[qIdx].curated_product_ids = [];
  }
  if (!state.configuredQuestions[qIdx].curated_product_ids.includes(select.value)) {
    state.configuredQuestions[qIdx].curated_product_ids.push(select.value);
  }
  renderQuestionCards();
}

export function removeFeaturedItemFromQuestion(qIdx, itemId) {
  if (!state.configuredQuestions[qIdx] || !Array.isArray(state.configuredQuestions[qIdx].curated_product_ids)) return;
  state.configuredQuestions[qIdx].curated_product_ids = state.configuredQuestions[qIdx].curated_product_ids.filter(id => String(id) !== String(itemId));
  renderQuestionCards();
}

export function updateQuestionTrigger(qIdx, trigger) {
  if (!state.configuredQuestions[qIdx]) return;
  state.configuredQuestions[qIdx].navigation_trigger = trigger;
}

export function toggleQuestionActive(qIdx, active) {
  if (!state.configuredQuestions[qIdx]) return;
  state.configuredQuestions[qIdx].active = active;
  renderQuestionCards();
}

export function updateQuestionText(qIdx, text) {
  if (!state.configuredQuestions[qIdx]) return;
  state.configuredQuestions[qIdx].question_text = text;
}

export function updateQuestionSubtitle(qIdx, text) {
  if (!state.configuredQuestions[qIdx]) return;
  state.configuredQuestions[qIdx].subtitle = text;
}

export function addOptionToQuestion(qIdx) {
  if (!state.configuredQuestions[qIdx]) return;
  if (!Array.isArray(state.configuredQuestions[qIdx].answers)) {
    state.configuredQuestions[qIdx].answers = [];
  }
  state.configuredQuestions[qIdx].answers.push({
    id: `ans_${qIdx + 1}_${Date.now()}`,
    label: '',
    host_reply: '',
    destination: 'skip'
  });
  renderQuestionCards();
}

export function deleteOptionFromQuestion(qIdx, aIdx) {
  if (!state.configuredQuestions[qIdx] || !state.configuredQuestions[qIdx].answers) return;
  state.configuredQuestions[qIdx].answers.splice(aIdx, 1);
  renderQuestionCards();
}

export function moveOptionInQuestion(qIdx, aIdx, dir) {
  if (!state.configuredQuestions[qIdx] || !state.configuredQuestions[qIdx].answers) return;
  const arr = state.configuredQuestions[qIdx].answers;
  const targetIdx = aIdx + dir;
  if (targetIdx < 0 || targetIdx >= arr.length) return;
  const temp = arr[aIdx];
  arr[aIdx] = arr[targetIdx];
  arr[targetIdx] = temp;
  renderQuestionCards();
}

export function updateOptionLabel(qIdx, aIdx, label) {
  if (!state.configuredQuestions[qIdx] || !state.configuredQuestions[qIdx].answers?.[aIdx]) return;
  state.configuredQuestions[qIdx].answers[aIdx].label = label;
}

export function updateOptionHostReply(qIdx, aIdx, reply) {
  if (!state.configuredQuestions[qIdx] || !state.configuredQuestions[qIdx].answers?.[aIdx]) return;
  state.configuredQuestions[qIdx].answers[aIdx].host_reply = reply;
}

export function updateOptionDestination(qIdx, aIdx, destination) {
  if (!state.configuredQuestions[qIdx] || !state.configuredQuestions[qIdx].answers?.[aIdx]) return;
  state.configuredQuestions[qIdx].answers[aIdx].destination = destination;
}

export function addNewQuestionCard() {
  state.configuredQuestions.push({
    id: `q_custom_${Date.now()}`,
    navigation_trigger: 'start_order',
    question_text: '',
    subtitle: '',
    active: true,
    curated_product_ids: [],
    answers: [
      { id: `ans_1_${Date.now()}`, label: '', host_reply: '', destination: 'skip' }
    ]
  });
  renderQuestionCards();
}

export function deleteQuestionCard(qIdx) {
  if (!confirm('Are you sure you want to delete this question?')) return;
  state.configuredQuestions.splice(qIdx, 1);
  renderQuestionCards();
}

export function moveQuestionCard(qIdx, dir) {
  const targetIdx = qIdx + dir;
  if (targetIdx < 0 || targetIdx >= state.configuredQuestions.length) return;
  const temp = state.configuredQuestions[qIdx];
  state.configuredQuestions[qIdx] = state.configuredQuestions[targetIdx];
  state.configuredQuestions[targetIdx] = temp;
  renderQuestionCards();
}

/**
 * Persist and publish all configured Vibe Quest discovery questions to backend API.
 */
export async function saveAllConfiguredQuestions() {
  for (let i = 0; i < state.configuredQuestions.length; i++) {
    const q = state.configuredQuestions[i];
    if (!q.question_text || !q.question_text.trim()) {
      alert(`Question #${i + 1} has empty question text. Please provide question text.`);
      return;
    }
    if (!Array.isArray(q.answers) || q.answers.length === 0) {
      alert(`Question #${i + 1} has no answer options. Please add at least one answer option.`);
      return;
    }
    for (let j = 0; j < q.answers.length; j++) {
      if (!q.answers[j].label || !q.answers[j].label.trim()) {
        alert(`Question #${i + 1}, Option #${j + 1} has an empty label. Please provide an option label.`);
        return;
      }
    }
  }

  let dessertReminderText = 'Should we save room for something sweet? 🍰';
  let dessertReminderSubtitle = '';
  let dessertReminderEnabled = true;
  let dessertDestCat = 'CAT_DESSERTS';
  let dessertFeaturedProductIds = [];
  let drinkReminderText = 'Would you like something to drink? 🥤';
  let drinkReminderSubtitle = '';
  let drinkReminderEnabled = true;
  let drinkDestCat = 'cat_super_drinks';
  let drinkFeaturedProductIds = [];

  const formattedQuestions = state.configuredQuestions.map((q, idx) => {
    const trigger = q.navigation_trigger || 'start_order';
    let stage = 'hookah';
    let repeatPolicy = 'always';
    let qId = q.id || `q_${trigger}_${idx + 1}`;
    const curated = Array.isArray(q.curated_product_ids) ? [...q.curated_product_ids] : [];
    const subtitle = (q.subtitle || '').trim();

    if (trigger === 'start_order') {
      stage = 'hookah';
      qId = q.id && q.id.includes('hookah') ? q.id : 'q_hookah_experience';
    } else if (trigger === 'next_food') {
      stage = 'food';
      qId = q.id && q.id.includes('food') ? q.id : 'q_food_craving';
    } else if (trigger === 'next_drinks') {
      stage = 'drinks';
      qId = q.id && (q.id.includes('drink') || q.id.includes('bev')) ? q.id : 'q_drink_reminder';
    } else if (trigger === 'cart_dessert') {
      stage = 'dessert';
      repeatPolicy = 'cart_conditional';
      qId = 'q_dessert_reminder';
      dessertReminderText = q.question_text.trim();
      dessertReminderSubtitle = subtitle;
      dessertReminderEnabled = q.active !== false;
      dessertFeaturedProductIds = curated;
      const browseAns = (q.answers || []).find(a => a.destination && a.destination !== 'skip');
      if (browseAns && browseAns.destination) {
        dessertDestCat = browseAns.destination.replace(/^category:/, '');
      }
    } else if (trigger === 'cart_drinks') {
      stage = 'drinks';
      repeatPolicy = 'cart_conditional';
      qId = 'q_drink_cart_reminder';
      drinkReminderText = q.question_text.trim();
      drinkReminderSubtitle = subtitle;
      drinkReminderEnabled = q.active !== false;
      drinkFeaturedProductIds = curated;
      const browseAns = (q.answers || []).find(a => a.destination && a.destination !== 'skip');
      if (browseAns && browseAns.destination) {
        drinkDestCat = browseAns.destination.replace(/^category:/, '');
      }
    }

    return {
      id: qId,
      navigation_trigger: trigger,
      stage: stage,
      title: q.question_text.trim(),
      question_text: q.question_text.trim(),
      subtitle: subtitle,
      helper_text: subtitle,
      description: subtitle,
      order: idx + 1,
      sort_order: idx + 1,
      active: q.active !== false,
      skippable: true,
      repeat_policy: repeatPolicy,
      curated_product_ids: curated,
      pinned_product_ids: curated,
      answers: (q.answers || []).map((ans, aIdx) => ({
        id: ans.id || `ans_${idx + 1}_${aIdx + 1}`,
        label: ans.label.trim(),
        host_reply: (ans.host_reply || '').trim(),
        reaction_message: (ans.host_reply || '').trim(),
        destination: ans.destination || 'skip',
        preference_signals: [],
        curated_product_ids: curated,
        pinned_product_ids: curated
      }))
    };
  });

  const topSaveBtn = document.getElementById('saveQuestionsTopBtn');
  const origText = topSaveBtn ? topSaveBtn.innerText : '';
  if (topSaveBtn) {
    topSaveBtn.innerText = 'Saving...';
    topSaveBtn.disabled = true;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/vibe-quest/admin/save-questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        questions: formattedQuestions,
        settings: {
          dessert_reminder_enabled: dessertReminderEnabled,
          dessert_reminder_text: dessertReminderText,
          dessert_reminder_subtitle: dessertReminderSubtitle,
          dessert_destination_category: dessertDestCat,
          dessert_featured_product_ids: dessertFeaturedProductIds,
          drink_reminder_enabled: drinkReminderEnabled,
          drink_reminder_text: drinkReminderText,
          drink_reminder_subtitle: drinkReminderSubtitle,
          drink_destination_category: drinkDestCat,
          drink_featured_product_ids: drinkFeaturedProductIds
        }
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save questions');
    }

    alert('Questions successfully saved and published for customer ordering!');
    renderVibeQuestPage();
  } catch (err) {
    console.error('Error saving questions:', err);
    alert('Error saving questions: ' + err.message);
  } finally {
    if (topSaveBtn) {
      topSaveBtn.innerText = origText;
      topSaveBtn.disabled = false;
    }
  }
}
