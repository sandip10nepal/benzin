# Benzin Admin Panel Architecture & Module Mapping

## 1. Overview & Objectives

The Benzin Hospitality OS admin dashboard (`public/admin.html`) is an 8,193-line single-page application that powers front-of-house, kitchen display, table management, hookah inventory, menu configuration, and staff operations at Cavalli Lounge and multi-tenant venues.

This document describes the architectural refactoring of the monolithic `<script>` block in `public/admin.html` into a structured, maintainable set of native browser **ECMAScript (ES) modules** located under:

```
public/js/admin/
```

### Core Architecture Rules
1. **Zero Build Step & Zero Frameworks**: Utilizes native browser ES modules (`<script type="module" src="/js/admin/main.js"></script>`). No Vite, React, Webpack, or npm bundler runtime.
2. **Deterministic Dependency Direction**: Shared state and API utilities are independent. Feature modules import shared utilities, and `main.js` coordinates lifecycle initialization and window compatibility bindings.
3. **Preservation of Existing Contracts**: All existing HTML element IDs, CSS styling, backend API route contracts, and inline HTML handler compatibility bindings are preserved.
4. **Security Invariant**: Browser-side refactoring does not weaken or bypass authoritative server-side cryptographic JWT verification, tenant isolation, or role-based access control.

---

## 2. Target Module Decomposition

```
public/js/admin/
├── state.js            # Shared application state, constants, and reactive caches
├── utils.js            # Formatting, escaping, audio chime, and UI helpers
├── api.js              # Tenant resolution, getAuthHeaders, and unified fetch client
├── auth.js             # Manager login, staff PIN quick-switch, and shift timeclock
├── navigation.js       # View switching, theme toggle, and RBAC tab lock badges
├── kds.js              # Kitchen Display System, ticket lifecycle, voids, and refunds
├── sse.js              # Real-time Server-Sent Events stream and background order sync
├── tables.js           # Floor layout, server table assignments, and table CRUD
├── service-requests.js # Hookah station coal refill queue management
├── inventory.js        # Stock levels, category filters, adjustments, and inventory CRUD
├── menu.js             # Menu catalog, categories, modifier groups, and availability
├── hookah.js           # Hookah configuration, Ice Base/Ice Hose options, and flavor mixes
├── specials.js         # Daily/weekly restaurant specials and promotions
├── sales.js            # Sales summary, revenue analytics, payment ledger, and archive clear
├── staff.js            # Employee roster, weekly payroll summaries, and wage masking
├── vibe-quest.js       # Vibe Quest discovery engine, simulator, and questions editor
└── main.js             # Module entry point, DOMContentLoaded coordinator, and window exports
```

---

## 3. Function & Dependency Mapping

| Function Name | Original Lines in `admin.html` | Target Module | Dependencies | Exported to Window |
| :--- | :--- | :--- | :--- | :--- |
| `getAuthHeaders()` | 2048–2065 | `api.js` | `localStorage` | Yes |
| `clearInMemoryState()` | 2067–2073 | `state.js` | State variables | Yes |
| `toggleTheme()` | 2076–2091 | `navigation.js` | DOM | Yes |
| `isManagerOrOwnerUser()` | 2093–2096 | `auth.js` | `localStorage` | Yes |
| `checkLoginStatus()` | 2099–2123 | `auth.js` | `state.js`, `api.js` | Yes |
| `verifyRestaurantVenue()` | 2125–2160 | `api.js` | `api.js` | Yes |
| `handleManagerLogin()` | 2266–2309 | `auth.js` | `api.js`, `state.js` | Yes |
| `handleManagerCodeLogin()` | 2311–2361 | `auth.js` | `api.js`, `state.js` | Yes |
| `syncActiveShiftTimer()` | 2364–2400 | `auth.js` | `api.js`, `state.js` | Yes |
| `handleClockInAction()` | 2402–2435 | `auth.js` | `api.js`, `state.js` | Yes |
| `handleClockOutAction()` | 2437–2468 | `auth.js` | `api.js`, `state.js` | Yes |
| `updateNavTabLockBadges()` | 2471–2491 | `navigation.js` | `localStorage` | Yes |
| `switchTab()` | 2546–2592 | `navigation.js` | `state.js` | Yes |
| `renderOrders()` | 2995–3087 | `kds.js` | `state.js`, `utils.js` | Yes |
| `handleFulfillTicket()` | 3040–3065 | `kds.js` | `api.js`, `state.js` | Yes |
| `openCashCollectModal()` | 2660–2690 | `kds.js` | `state.js`, `api.js` | Yes |
| `openVoidModal()` / `handleConfirmVoid()` | 2720–2760 | `kds.js` | `api.js`, `state.js` | Yes |
| `openRefundModal()` / `handleConfirmRefund()` | 2770–2820 | `kds.js` | `api.js`, `state.js` | Yes |
| `renderTablesPage()` | 3160–3240 | `tables.js` | `state.js`, `api.js` | Yes |
| `handleServerAssign()` | 3400–3430 | `tables.js` | `api.js`, `state.js` | Yes |
| `handleServerUnassign()` | 3432–3450 | `tables.js` | `api.js`, `state.js` | Yes |
| `renderInventoryPage()` | 3855–3950 | `inventory.js` | `state.js`, `utils.js` | Yes |
| `handleSaveStockAdjustment()` | 3965–4010 | `inventory.js` | `api.js`, `state.js` | Yes |
| `loadMenuItems()` / `renderMenuItems()` | 4155–4280 | `menu.js` | `api.js`, `state.js` | Yes |
| `handleSaveMenuItem()` | 4300–4390 | `menu.js` | `api.js`, `state.js` | Yes |
| `loadHookahConfig()` / `handleSaveHookahConfig()` | 5250–5390 | `hookah.js` | `api.js`, `state.js` | Yes |
| `loadSalesSummary()` / `renderSalesSummary()` | 5745–5800 | `sales.js` | `api.js`, `utils.js` | Yes |
| `loadStaffRoster()` / `renderStaffRoster()` | 5805–5920 | `staff.js` | `api.js`, `state.js` | Yes |
| `loadPayrollSummary()` / `fulfillWeeklyPayroll()` | 6000–6150 | `staff.js` | `api.js`, `utils.js` | Yes |
| `handleVerifyStaffPin()` | 6180–6216 | `auth.js` | `api.js`, `state.js` | Yes |
| `fetchOrders()` | 7083–7138 | `sse.js` | `api.js`, `state.js` | Yes |
| `connectSSE()` | 7187–7295 | `sse.js` | `api.js`, `state.js` | Yes |
| `saveAllConfiguredQuestions()` | 7500–7650 | `vibe-quest.js` | `api.js`, `state.js` | Yes |

---

## 4. Initialization & Bootstrap Lifecycle

1. **`DOMContentLoaded` Trigger**:
   - `initTenantFromUrl()` extracts restaurant identifiers from the browser query string.
   - `verifyRestaurantVenue()` authenticates venue status against `/api/auth/staff-roster`.
   - Theme (`benzin_theme`) is applied to `document.documentElement`.
   - Lucide icons initialized (`lucide.createIcons()`).
   - `checkLoginStatus()` evaluates active JWT and displays either floor dashboard or login overlay.
2. **Initial Data Ingestion**:
   - `loadData()` queries menus, categories, tables, and stock.
   - `connectSSE()` opens persistent EventSource connection to `/api/orders/live`.
3. **Background Synchronizers**:
   - 3-second background polling interval via `fetchOrders(true)` ensures ticket delivery even under flaky proxy connections.
   - Shift timeclock updates every 1 second when clocked in.
   - Audio unlock policy bound to first user touch/click/keypress.
