/**
 * Benzin Hospitality OS — Shared Admin Application State
 * Native ES Module: state.js
 */

export const API_URL = window.location.origin;

export const ROLE_BADGES = {
  owner: { label: 'Owner', color: 'var(--gold)' },
  manager: { label: 'Manager', color: 'var(--teal)' },
  host: { label: 'Host / Greeter', color: '#a855f7' },
  server: { label: 'Server', color: 'var(--success)' },
  bartender: { label: 'Bartender', color: '#3b82f6' },
  chef: { label: 'Chef', color: 'var(--ember)' },
  hookah_maker: { label: 'Hookah Maker', color: '#ff5a1f' },
  cashier: { label: 'Cashier / Server', color: 'var(--success)' },
  kitchen: { label: 'Kitchen Staff', color: 'var(--muted)' }
};

export const state = {
  orders: [],
  inventory: {},
  menuItems: [],
  employeesList: [],
  tablesList: [],
  menuCategories: [],
  inventoryCategories: [],
  serviceRequests: [],
  
  // Navigation & Filter State
  activeTab: 'kds',
  activeTableFilter: 'all',
  activeInventorySubTab: 'hookah',
  activeMenuCat: 'all',
  activeMenuSubTab: 'items',
  activeSuperCategory: '',
  activeSubCategory: 'all',
  activeHookahTab: 'bases',
  
  // Hookah & Specials State
  currentHookahConfig: {
    flavors: [],
    bases: [],
    addons: [],
    packages: []
  },
  currentSpecials: [],
  currentProfileUserId: null,

  // Shift & Clock-in State
  shiftTimerSeconds: 0,
  isUserClockedIn: false,
  activeShiftTimecardId: null,
  
  // SSE Streaming
  sseEventSource: null,
  isFetchingOrders: false,
  isFetchingTables: false,

  // Vibe Quest Discovery Engine State
  vibeQuestDraft: null,
  vibeQuestPublished: null,
  vibeQuestActiveStageFilter: 'all',
  configuredQuestions: [],
  simStage: 'hookah',
  simQuestionId: null,
  simAnswers: {},
  simSignals: [],
  simCart: []
};

/**
 * Reset in-memory cached state upon tenant switch or manager logout.
 */
export function clearInMemoryState() {
  state.orders = [];
  state.inventory = {};
  state.menuItems = [];
  state.menuCategories = [];
  state.inventoryCategories = [];
  state.employeesList = [];
  state.tablesList = [];
  state.serviceRequests = [];
  state.configuredQuestions = [];
  state.currentSpecials = [];
  state.currentHookahConfig = { flavors: [], bases: [], addons: [], packages: [] };
  state.vibeQuestDraft = null;
  state.vibeQuestPublished = null;
}

