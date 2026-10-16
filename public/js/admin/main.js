/**
 * Benzin Hospitality OS — Admin Panel Module Entry Point
 * Native ES Module: main.js
 */

import { API_URL, ROLE_BADGES, state, clearInMemoryState } from './state.js';
import { escapeHtml, escapeJs, formatCurrency, formatTime, formatDate, playOrderChime, refreshIcons } from './utils.js';
import { getAuthHeaders, initTenantFromUrl, verifyRestaurantVenue } from './api.js';
import {
  isManagerOrOwnerUser,
  checkLoginStatus,
  loadStaffDropdown,
  switchLoginMode,
  handleStaffPinLogin,
  handleManagerEmailLogin,
  handleManagerCodeLogin,
  benzinLogout,
  openStaffSwitchModal,
  closeStaffSwitchModal,
  submitStaffSwitchPin,
  toggleShiftClock,
  updateClockWidgetState,
  syncActiveShiftTimer,
  handleHeaderProfileClick
} from './auth.js';
import {
  toggleTheme,
  updateNavTabLockBadges,
  toggleMobileAdminMenu,
  switchTab,
  switchInventorySubTab as navSwitchInventorySubTab,
  switchMenuCatalogSubTab as navSwitchMenuCatalogSubTab
} from './navigation.js';
import {
  consolidateItems,
  openCollectCashModal,
  closeCollectCashModal,
  calculateCashChange,
  submitCashPayment,
  renderTicketCard,
  renderOrders,
  fulfillOrder,
  updateOrderStatus,
  printTicket,
  clearArchive
} from './kds.js';
import {
  renderTablesPage,
  updateTablesStatsAndFilters,
  setTablesFilter,
  renderTablesGrid,
  assignTableOrder,
  unassignTableOrder,
  quickResetTable,
  quickUpdateTableStatus,
  quickFulfillTableOrder,
  openReassignModal,
  closeReassignModal,
  submitReassignModal,
  openAddTableModal,
  closeAddTableModal,
  submitAddTable,
  openEditTableModal,
  closeEditTableModal,
  submitEditTable,
  submitDeleteTableFromModal
} from './tables.js';
import {
  loadServiceRequests,
  updateServiceRequestStatus,
  renderHookahRequests
} from './service-requests.js';
import {
  renderInventoryPage,
  switchInventorySubTab,
  adjustInventory,
  openAddInventoryModal,
  closeAddInventoryModal,
  openEditInventoryModalFromObj,
  closeEditInventoryModal,
  saveEditInventoryItem,
  deleteInventoryItem,
  saveNewInventoryItem,
  fetchInventoryCategories,
  renderInventoryCategoryTabs,
  getAllInventoryCategoriesList,
  renderExistingInvCategoriesList,
  populateInventoryCategoryDropdowns,
  openAddInvCategoryModal,
  openEditInvCategoryModal,
  closeInvCategoryModal,
  saveInvCategory,
  deleteInvCategory
} from './inventory.js';
import {
  loadMenuItems,
  filterMenuCategory,
  onRecipeIngredientSelected,
  addRecipeIngredientRow,
  updateRecipeRowPreview,
  getRecipeFromModal,
  searchRecipeInventoryItems,
  renderRecipeSearchResults,
  selectRecipeSearchItem,
  addModifierGroupBlock,
  addModifierOptionRow,
  getModifiersFromModal,
  switchMenuCatalogSubTab,
  renderMenuPage,
  renderMenuCatalog,
  openAddMenuItemModal,
  openEditMenuItemModalById,
  closeMenuItemModal,
  toggleMenuItemStatus,
  saveMenuItem,
  deleteMenuItem,
  fetchMenuCategories,
  selectSuperCategoryFilter,
  selectSubCategoryFilter,
  scrollSuperCategories,
  getAllMenuCategoriesList,
  getSuperCategoriesList,
  renderMenuCategoryFilterBar,
  switchCategoryModalMode,
  populateSuperCategoriesDropdown,
  populateMenuCategorySelector,
  toggleMenuItemCategory,
  getSelectedMenuItemCategories,
  populateMenuCategoryDropdown,
  openAddSuperCategoryModal,
  renderExistingSuperCategoriesList,
  renderExistingMenuCategoriesList,
  openEditSuperCategoryModal,
  deleteSuperCategory,
  openAddMenuCategoryModal,
  openEditMenuCategoryModal,
  closeMenuCategoryModal,
  saveMenuCategory,
  deleteMenuCategory
} from './menu.js';
import {
  switchHookahTab,
  openHookahConfigModal,
  updateFlavorWeightPreview,
  closeHookahConfigModal,
  renderHookahConfigTabs,
  toggleHookahBaseAvail,
  toggleHookahFlavorAvail,
  toggleHookahAddonAvail,
  addHookahBaseRow,
  deleteHookahBase,
  addHookahFlavorRow,
  deleteHookahFlavor,
  addHookahAddonRow,
  deleteHookahAddon,
  saveHookahConfig
} from './hookah.js';
import {
  openSpecialsModal,
  closeSpecialsModal,
  renderSpecialsList,
  toggleSpecialActive,
  moveSpecial,
  removeSpecial,
  addSelectedMenuToSpecials,
  saveSpecials
} from './specials.js';
import { renderSalesPage } from './sales.js';
import {
  renderStaffPage,
  fulfillWeeklyPayroll,
  openStaffProfileModal,
  closeStaffProfileModal,
  fulfillSingleWeeklyPayroll,
  handleEmpRoleChange,
  openAddEmployeeModal,
  openEditEmpModal,
  closeEmpModal,
  submitEmployee,
  deleteEmployee
} from './staff.js';
import {
  ensureMenuItemsLoaded,
  renderVibeQuestPage,
  buildCategorizedMenuItemsOptions,
  buildDestinationOptionsHtml,
  renderQuestionCards,
  addFeaturedItemToQuestion,
  removeFeaturedItemFromQuestion,
  updateQuestionTrigger,
  toggleQuestionActive,
  updateQuestionText,
  updateQuestionSubtitle,
  addOptionToQuestion,
  deleteOptionFromQuestion,
  moveOptionInQuestion,
  updateOptionLabel,
  updateOptionHostReply,
  updateOptionDestination,
  addNewQuestionCard,
  deleteQuestionCard,
  moveQuestionCard,
  saveAllConfiguredQuestions
} from './vibe-quest.js';
import {
  fetchOrders,
  loadData,
  connectSSE
} from './sse.js';

// ── BINDING FOR INLINE HTML COMPATIBILITY ──
// Inline DOM handlers (onclick, onchange, etc.) execute in window scope.
window.API_URL = API_URL;
window.state = state;
window.escapeHtml = escapeHtml;
window.escapeJs = escapeJs;
window.formatCurrency = formatCurrency;
window.formatTime = formatTime;
window.formatDate = formatDate;
window.playOrderChime = playOrderChime;
window.refreshIcons = refreshIcons;

window.getAuthHeaders = getAuthHeaders;
window.initTenantFromUrl = initTenantFromUrl;
window.verifyRestaurantVenue = verifyRestaurantVenue;

window.checkLoginStatus = checkLoginStatus;
window.loadStaffDropdown = loadStaffDropdown;
window.switchLoginMode = switchLoginMode;
window.handleStaffPinLogin = handleStaffPinLogin;
window.handleManagerEmailLogin = handleManagerEmailLogin;
window.handleManagerCodeLogin = handleManagerCodeLogin;
window.benzinLogout = benzinLogout;
window.openStaffSwitchModal = openStaffSwitchModal;
window.closeStaffSwitchModal = closeStaffSwitchModal;
window.submitStaffSwitchPin = submitStaffSwitchPin;
window.toggleShiftClock = toggleShiftClock;
window.updateClockWidgetState = updateClockWidgetState;
window.syncActiveShiftTimer = syncActiveShiftTimer;
window.handleHeaderProfileClick = handleHeaderProfileClick;

window.toggleTheme = toggleTheme;
window.updateNavTabLockBadges = updateNavTabLockBadges;
window.toggleMobileAdminMenu = toggleMobileAdminMenu;
window.switchTab = switchTab;

window.consolidateItems = consolidateItems;
window.openCollectCashModal = openCollectCashModal;
window.closeCollectCashModal = closeCollectCashModal;
window.calculateCashChange = calculateCashChange;
window.submitCashPayment = submitCashPayment;
window.renderTicketCard = renderTicketCard;
window.renderOrders = renderOrders;
window.fulfillOrder = fulfillOrder;
window.updateOrderStatus = updateOrderStatus;
window.printTicket = printTicket;
window.clearArchive = clearArchive;

window.renderTablesPage = renderTablesPage;
window.updateTablesStatsAndFilters = updateTablesStatsAndFilters;
window.setTablesFilter = setTablesFilter;
window.renderTablesGrid = renderTablesGrid;
window.assignTableOrder = assignTableOrder;
window.unassignTableOrder = unassignTableOrder;
window.quickResetTable = quickResetTable;
window.quickUpdateTableStatus = quickUpdateTableStatus;
window.quickFulfillTableOrder = quickFulfillTableOrder;
window.openReassignModal = openReassignModal;
window.closeReassignModal = closeReassignModal;
window.submitReassignModal = submitReassignModal;
window.openAddTableModal = openAddTableModal;
window.closeAddTableModal = closeAddTableModal;
window.submitAddTable = submitAddTable;
window.openEditTableModal = openEditTableModal;
window.closeEditTableModal = closeEditTableModal;
window.submitEditTable = submitEditTable;
window.submitDeleteTableFromModal = submitDeleteTableFromModal;

window.loadServiceRequests = loadServiceRequests;
window.updateServiceRequestStatus = updateServiceRequestStatus;
window.renderHookahRequests = renderHookahRequests;

window.renderInventoryPage = renderInventoryPage;
window.switchInventorySubTab = switchInventorySubTab;
window.adjustInventory = adjustInventory;
window.openAddInventoryModal = openAddInventoryModal;
window.closeAddInventoryModal = closeAddInventoryModal;
window.openEditInventoryModalFromObj = openEditInventoryModalFromObj;
window.closeEditInventoryModal = closeEditInventoryModal;
window.saveEditInventoryItem = saveEditInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.saveNewInventoryItem = saveNewInventoryItem;
window.fetchInventoryCategories = fetchInventoryCategories;
window.renderInventoryCategoryTabs = renderInventoryCategoryTabs;
window.getAllInventoryCategoriesList = getAllInventoryCategoriesList;
window.renderExistingInvCategoriesList = renderExistingInvCategoriesList;
window.populateInventoryCategoryDropdowns = populateInventoryCategoryDropdowns;
window.openAddInvCategoryModal = openAddInvCategoryModal;
window.openEditInvCategoryModal = openEditInvCategoryModal;
window.closeInvCategoryModal = closeInvCategoryModal;
window.saveInvCategory = saveInvCategory;
window.deleteInvCategory = deleteInvCategory;

window.loadMenuItems = loadMenuItems;
window.filterMenuCategory = filterMenuCategory;
window.onRecipeIngredientSelected = onRecipeIngredientSelected;
window.addRecipeIngredientRow = addRecipeIngredientRow;
window.updateRecipeRowPreview = updateRecipeRowPreview;
window.getRecipeFromModal = getRecipeFromModal;
window.searchRecipeInventoryItems = searchRecipeInventoryItems;
window.renderRecipeSearchResults = renderRecipeSearchResults;
window.selectRecipeSearchItem = selectRecipeSearchItem;
window.addModifierGroupBlock = addModifierGroupBlock;
window.addModifierOptionRow = addModifierOptionRow;
window.getModifiersFromModal = getModifiersFromModal;
window.switchMenuCatalogSubTab = switchMenuCatalogSubTab;
window.renderMenuPage = renderMenuPage;
window.renderMenuCatalog = renderMenuCatalog;
window.openAddMenuItemModal = openAddMenuItemModal;
window.openEditMenuItemModalById = openEditMenuItemModalById;
window.closeMenuItemModal = closeMenuItemModal;
window.toggleMenuItemStatus = toggleMenuItemStatus;
window.saveMenuItem = saveMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.fetchMenuCategories = fetchMenuCategories;
window.selectSuperCategoryFilter = selectSuperCategoryFilter;
window.selectSubCategoryFilter = selectSubCategoryFilter;
window.scrollSuperCategories = scrollSuperCategories;
window.getAllMenuCategoriesList = getAllMenuCategoriesList;
window.getSuperCategoriesList = getSuperCategoriesList;
window.renderMenuCategoryFilterBar = renderMenuCategoryFilterBar;
window.switchCategoryModalMode = switchCategoryModalMode;
window.populateSuperCategoriesDropdown = populateSuperCategoriesDropdown;
window.populateMenuCategorySelector = populateMenuCategorySelector;
window.toggleMenuItemCategory = toggleMenuItemCategory;
window.getSelectedMenuItemCategories = getSelectedMenuItemCategories;
window.populateMenuCategoryDropdown = populateMenuCategoryDropdown;
window.openAddSuperCategoryModal = openAddSuperCategoryModal;
window.renderExistingSuperCategoriesList = renderExistingSuperCategoriesList;
window.renderExistingMenuCategoriesList = renderExistingMenuCategoriesList;
window.openEditSuperCategoryModal = openEditSuperCategoryModal;
window.deleteSuperCategory = deleteSuperCategory;
window.openAddMenuCategoryModal = openAddMenuCategoryModal;
window.openEditMenuCategoryModal = openEditMenuCategoryModal;
window.closeMenuCategoryModal = closeMenuCategoryModal;
window.saveMenuCategory = saveMenuCategory;
window.deleteMenuCategory = deleteMenuCategory;

window.switchHookahTab = switchHookahTab;
window.openHookahConfigModal = openHookahConfigModal;
window.updateFlavorWeightPreview = updateFlavorWeightPreview;
window.closeHookahConfigModal = closeHookahConfigModal;
window.renderHookahConfigTabs = renderHookahConfigTabs;
window.toggleHookahBaseAvail = toggleHookahBaseAvail;
window.toggleHookahFlavorAvail = toggleHookahFlavorAvail;
window.toggleHookahAddonAvail = toggleHookahAddonAvail;
window.addHookahBaseRow = addHookahBaseRow;
window.deleteHookahBase = deleteHookahBase;
window.addHookahFlavorRow = addHookahFlavorRow;
window.deleteHookahFlavor = deleteHookahFlavor;
window.addHookahAddonRow = addHookahAddonRow;
window.deleteHookahAddon = deleteHookahAddon;
window.saveHookahConfig = saveHookahConfig;

window.openSpecialsModal = openSpecialsModal;
window.closeSpecialsModal = closeSpecialsModal;
window.renderSpecialsList = renderSpecialsList;
window.toggleSpecialActive = toggleSpecialActive;
window.moveSpecial = moveSpecial;
window.removeSpecial = removeSpecial;
window.addSelectedMenuToSpecials = addSelectedMenuToSpecials;
window.saveSpecials = saveSpecials;

window.renderSalesPage = renderSalesPage;
window.renderStaffPage = renderStaffPage;
window.fulfillWeeklyPayroll = fulfillWeeklyPayroll;
window.openStaffProfileModal = openStaffProfileModal;
window.closeStaffProfileModal = closeStaffProfileModal;
window.fulfillSingleWeeklyPayroll = fulfillSingleWeeklyPayroll;
window.handleEmpRoleChange = handleEmpRoleChange;
window.openAddEmployeeModal = openAddEmployeeModal;
window.openEditEmpModal = openEditEmpModal;
window.closeEmpModal = closeEmpModal;
window.submitEmployee = submitEmployee;
window.deleteEmployee = deleteEmployee;

window.ensureMenuItemsLoaded = ensureMenuItemsLoaded;
window.renderVibeQuestPage = renderVibeQuestPage;
window.buildCategorizedMenuItemsOptions = buildCategorizedMenuItemsOptions;
window.buildDestinationOptionsHtml = buildDestinationOptionsHtml;
window.renderQuestionCards = renderQuestionCards;
window.addFeaturedItemToQuestion = addFeaturedItemToQuestion;
window.removeFeaturedItemFromQuestion = removeFeaturedItemFromQuestion;
window.updateQuestionTrigger = updateQuestionTrigger;
window.toggleQuestionActive = toggleQuestionActive;
window.updateQuestionText = updateQuestionText;
window.updateQuestionSubtitle = updateQuestionSubtitle;
window.addOptionToQuestion = addOptionToQuestion;
window.deleteOptionFromQuestion = deleteOptionFromQuestion;
window.moveOptionInQuestion = moveOptionInQuestion;
window.updateOptionLabel = updateOptionLabel;
window.updateOptionHostReply = updateOptionHostReply;
window.updateOptionDestination = updateOptionDestination;
window.addNewQuestionCard = addNewQuestionCard;
window.deleteQuestionCard = deleteQuestionCard;
window.moveQuestionCard = moveQuestionCard;
window.saveAllConfiguredQuestions = saveAllConfiguredQuestions;

window.fetchOrders = fetchOrders;
window.loadData = loadData;
window.connectSSE = connectSSE;

// ── INITIALIZATION BOOTSTRAP ON DOMCONTENTLOADED ──
document.addEventListener('DOMContentLoaded', async () => {
  initTenantFromUrl();
  const savedCode = localStorage.getItem('benzin_restaurant_code') || '4821';
  const codeInput = document.getElementById('loginVenueCode');
  if (codeInput && savedCode) codeInput.value = savedCode;

  await verifyRestaurantVenue();

  const savedTheme = localStorage.getItem('benzin_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const label = document.getElementById('themeLabel');
  const icon = document.getElementById('themeIcon');
  if (savedTheme === 'light') {
    if (label) label.innerText = 'Dark Mode';
    if (icon) icon.innerText = '🌙';
  }

  refreshIcons();

  checkLoginStatus();
  await loadData();
  await loadMenuItems();
  connectSSE();

  // Automated background order synchronization loop (every 3 seconds)
  setInterval(() => {
    fetchOrders(true);
  }, 3000);

  // Instant refresh when user returns to tab / unlocks screen
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      fetchOrders(true);
      if (!state.sseEventSource || state.sseEventSource.readyState === EventSource.CLOSED) {
        connectSSE();
      }
    }
  });

  // Unlock browser audio policy on first user interaction anywhere on page
  const unlockAudio = () => {
    const chime = document.getElementById('orderChime');
    if (chime) {
      chime.play().then(() => {
        chime.pause();
        chime.currentTime = 0;
      }).catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  // Shift timer tick interval
  setInterval(() => {
    if (state.isUserClockedIn) {
      state.shiftTimerSeconds++;
      const hrs = String(Math.floor(state.shiftTimerSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((state.shiftTimerSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(state.shiftTimerSeconds % 60).padStart(2, '0');
      const el = document.getElementById('headerShiftTimerText');
      if (el) el.innerText = `${hrs}:${mins}:${secs}`;
    }
  }, 1000);
});
