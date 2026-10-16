/**
 * Benzin Hospitality OS — Navigation & View Routing Module
 * Native ES Module: navigation.js
 */

import { state } from './state.js';
import { refreshIcons } from './utils.js';
import { openStaffSwitchModal } from './auth.js';

/**
 * Toggle Light vs Dark Theme and persist to localStorage.
 */
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('benzin_theme', newTheme);
  
  const label = document.getElementById('themeLabel');
  const icon = document.getElementById('themeIcon');
  const drawerLabel = document.getElementById('drawerThemeLabel');
  const drawerIcon = document.getElementById('drawerThemeIcon');

  const text = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
  const emoji = newTheme === 'light' ? '🌙' : '☀️';

  if (label) label.innerText = text;
  if (icon) icon.innerText = emoji;
  if (drawerLabel) drawerLabel.innerText = text;
  if (drawerIcon) drawerIcon.innerText = emoji;
}

/**
 * Update navigation lock badges and hide manager-only tabs from server staff.
 */
export function updateNavTabLockBadges() {
  const role = (localStorage.getItem('benzin_user_role') || 'server').toLowerCase();
  const isManager = ['owner', 'manager', 'platform_admin', 'admin'].includes(role);

  ['inventory', 'menu', 'sales', 'staff'].forEach(t => {
    const btn = document.getElementById(`navTab-${t}`);
    if (btn) {
      btn.style.display = isManager ? 'flex' : 'none';
    }
  });

  const switchIcon = document.getElementById('headerSwitchIcon');
  if (switchIcon) {
    switchIcon.style.display = isManager ? 'inline' : 'none';
  }

  const userBox = document.getElementById('loggedInUserBox');
  if (userBox) {
    userBox.title = "Tap to view your staff profile & work hours";
  }
}

/**
 * Toggle Mobile Navigation Drawer overlay.
 */
export function toggleMobileAdminMenu(forceState) {
  const overlay = document.getElementById('mobileNavDrawerOverlay');
  const btn = document.getElementById('adminMobileMenuBtn');
  if (!overlay) return;
  
  const isVisible = overlay.style.display === 'flex';
  const shouldShow = typeof forceState === 'boolean' ? forceState : !isVisible;
  
  if (shouldShow) {
    const name = localStorage.getItem('benzin_user_name') || 'Manager';
    const role = localStorage.getItem('benzin_user_role') || 'OWNER';
    const nameEl = document.getElementById('mobileDrawerStaffName');
    if (nameEl) nameEl.innerText = name;
    const roleEl = document.getElementById('mobileDrawerStaffRole');
    if (roleEl) roleEl.innerText = role.toUpperCase();
    
    const timerText = document.getElementById('headerShiftTimerText');
    const drawerTimerText = document.getElementById('mobileDrawerShiftTimerText');
    if (timerText && drawerTimerText) drawerTimerText.innerText = timerText.innerText;

    const themeLabel = document.getElementById('themeLabel');
    const themeIcon = document.getElementById('themeIcon');
    const drawerLabel = document.getElementById('drawerThemeLabel');
    const drawerIcon = document.getElementById('drawerThemeIcon');
    if (themeLabel && drawerLabel) drawerLabel.innerText = themeLabel.innerText;
    if (themeIcon && drawerIcon) drawerIcon.innerText = themeIcon.innerText;

    overlay.style.display = 'flex';
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close navigation menu');
    }
  } else {
    overlay.style.display = 'none';
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open navigation menu');
    }
  }
}

/**
 * Switch primary navigation tab (KDS, Tables, Archive, Inventory, Menu, Sales, Staff).
 */
export function switchTab(tab) {
  if (tab === 'vibeQuest') {
    switchTab('menu');
    switchMenuCatalogSubTab('vibeQuest');
    return;
  }

  const role = (localStorage.getItem('benzin_user_role') || 'server').toLowerCase();
  const isManager = ['owner', 'manager', 'platform_admin', 'admin'].includes(role);

  if (!isManager && ['inventory', 'menu', 'sales', 'staff'].includes(tab)) {
    alert(`🔒 Manager Authorization Required\n\nThe "${tab.toUpperCase()}" tab is restricted to Managers and Owners. Please log in with a Manager PIN.`);
    openStaffSwitchModal();
    return;
  }

  state.activeTab = tab;
  const pages = ['kdsPageLayout', 'tablesPageLayout', 'archivePageLayout', 'inventoryPageLayout', 'menuPageLayout', 'salesPageLayout', 'staffPageLayout'];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  const activeBtn = document.getElementById(`navTab-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');
  const drawerBtn = document.getElementById(`drawerNavTab-${tab}`);
  if (drawerBtn) drawerBtn.classList.add('active');

  const activePage = document.getElementById(`${tab}PageLayout`);
  if (activePage) activePage.style.display = 'block';

  if (tab === 'kds' || tab === 'archive') {
    if (typeof window.renderOrders === 'function') window.renderOrders();
  } else if (tab === 'tables') {
    if (typeof window.renderTablesPage === 'function') window.renderTablesPage();
  } else if (tab === 'inventory') {
    if (typeof window.renderInventoryPage === 'function') window.renderInventoryPage();
  } else if (tab === 'menu') {
    if (typeof window.renderMenuPage === 'function') window.renderMenuPage();
  } else if (tab === 'sales') {
    if (typeof window.renderSalesPage === 'function') window.renderSalesPage();
  } else if (tab === 'staff') {
    if (typeof window.renderStaffPage === 'function') window.renderStaffPage();
  }

  const mobileSel = document.getElementById('mobileNavSelect');
  if (mobileSel) mobileSel.value = tab;

  toggleMobileAdminMenu(false);
  refreshIcons();
}

/**
 * Switch inventory category sub-tab (hookah, beverage, food, etc.).
 */
export function switchInventorySubTab(tab) {
  state.activeInventorySubTab = tab;
  const pills = document.querySelectorAll('#inventorySubTabsContainer .sub-tab');
  pills.forEach(p => p.classList.remove('active'));
  
  if (typeof window.renderInventoryPage === 'function') {
    window.renderInventoryPage();
  }
}

/**
 * Switch menu catalog subtab (items catalog vs vibe quest discovery).
 */
export function switchMenuCatalogSubTab(subTab) {
  const itemsBtn = document.getElementById('menuSubTab-items');
  const vqBtn = document.getElementById('menuSubTab-vibeQuest');
  const itemsView = document.getElementById('menuCatalogItemsView');
  const vqView = document.getElementById('menuCatalogVibeQuestView');

  if (subTab === 'vibeQuest') {
    if (itemsBtn) itemsBtn.classList.remove('active');
    if (vqBtn) vqBtn.classList.add('active');
    if (itemsView) itemsView.style.display = 'none';
    if (vqView) vqView.style.display = 'block';
    if (typeof window.renderVibeQuestPage === 'function') {
      window.renderVibeQuestPage();
    }
  } else {
    if (itemsBtn) itemsBtn.classList.add('active');
    if (vqBtn) vqBtn.classList.remove('active');
    if (itemsView) itemsView.style.display = 'block';
    if (vqView) vqView.style.display = 'none';
    if (typeof window.renderMenuCategoryFilterBar === 'function') {
      window.renderMenuCategoryFilterBar();
    }
    if (typeof window.renderMenuCatalog === 'function') {
      window.renderMenuCatalog();
    }
  }
  refreshIcons();
}
