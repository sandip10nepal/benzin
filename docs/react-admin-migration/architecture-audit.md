# Benzin Hospitality OS — Architecture Audit
**Module**: Admin Panel & Multi-Tenant SaaS Platform  
**Target Migration**: Vanilla HTML/ES Modules → React + TypeScript + Vite  
**Audit Date**: October 2026  
**Target Baseline**: `refactor/react-admin-migration` (derived from commit `6afd088`)

---

## 1. Executive Summary & Purpose

Benzin is an enterprise multi-tenant restaurant SaaS platform currently deployed in production and actively powering **Cavalli Lounge** (Restaurant Code: `4821`, Slug: `cavali`). The operational core spans table QR ordering, digital menu discovery, kitchen and hookah display systems (KDS), inventory recipe deduction, staff timecards, table assignments, and guest service requests.

The existing administrative interface (`public/admin.html`) was recently decomposed from a single 4,500-line monolithic file into 17 native ES modules (`public/js/admin/*.js`). While this modularization significantly improved maintainability and resolved cross-instance synchronization issues, the user interface remains tethered to vanilla DOM manipulation, string template concatenation, manual state synchronization, and global `window` object event delegation.

This document presents a comprehensive, evidence-based architectural audit of the entire frontend and backend surface in preparation for migrating the admin dashboard to **React + TypeScript + Vite**, while ensuring **absolute zero disruption** to active restaurant operations.

---

## 2. Existing Frontend Surface Audit

### 2.1 Workspace Structure & Sibling Projects
The scratch workspace consists of three related codebases:
1. **`hookah-lounge-backend`** (Current Repository): Express 5 + Node.js 20 + TypeScript service. Hosts both the REST/SSE APIs and serves the administrative web portal from `public/`.
2. **`hookah-lounge-app`** (Sibling Repository): A Vite 5 + React 18 application providing marketing landing pages, an onboarding wizard, and a partial management portal (`RestaurantPortalView.jsx`). A production build of this app is static-mounted under `public/admin_dist/`.
3. **`hookah-lounge-app-native`** (Sibling Repository): Mobile client built with React Native and Expo for point-of-sale handhelds and server terminals.

### 2.2 Current Admin Dashboard (`public/admin.html` & `public/js/admin/`)
The authoritative, live Cavalli admin panel is delivered via `public/admin.html` (2,022 lines) and dynamically imports `/js/admin/main.js` as an ES module:

```html
<!-- Native ES Module Script Tag in public/admin.html -->
<script type="module" src="/js/admin/main.js?v=1792191500"></script>
```

#### Module Breakdown (17 Native ES Modules):
| Module | File | Size | Core Responsibilities |
|---|---|---|---|
| **State** | `state.js` | 2.3 KB | In-memory reactive state singleton, role badge definitions, reset handlers |
| **Utilities** | `utils.js` | 2.0 KB | XSS escaping (`escapeHtml`, `escapeJs`), date/time/currency formatters, audio chimes |
| **API Client** | `api.js` | 4.8 KB | Auth header injection, tenant resolution from URL/localStorage, venue verification |
| **Auth & Shifts** | `auth.js` | 16.3 KB | Staff PIN login, Manager email login, staff quick-switch, active shift timer tick |
| **Navigation** | `navigation.js` | 7.7 KB | Tab switching, dark/light theme toggle, role-based nav badge locking, mobile drawer |
| **KDS** | `kds.js` | 34.9 KB | Kitchen/Hookah order card rendering, status transitions, cash drawer modal, print ticket |
| **Floor Tables** | `tables.js` | 27.5 KB | Floor table grid, server assignment modal, table addition/editing, quick table reset |
| **Menu Catalog** | `menu.js` | 80.2 KB | Category tree, dish cards, recipe ingredient mappings, dish creation/edit modals |
| **Hookah Mix Lab**| `hookah.js` | 15.3 KB | Configurable bases, flavors, addons, packages (Daku refill rules), inventory links |
| **Inventory** | `inventory.js` | 29.4 KB | Category tabs, stock counters, +/- quick adjust, stock threshold pills, unit parsing |
| **Staff & Payroll**| `staff.js` | 17.7 KB | Roster rendering, shift clock indicators, wage masking, weekly payroll calculation |
| **Sales Analytics**| `sales.js` | 3.9 KB | Gross revenue calculation, payment method breakdown, sales hourly trends |
| **Service Requests**| `service-requests.js`| 5.4 KB | Guest table coal/water refill requests, status acknowledge/fulfill transitions |
| **Specials** | `specials.js` | 6.0 KB | Toggle catalog items onto featured specials board, priority management |
| **Vibe Quest** | `vibe-quest.js` | 41.4 KB | 5-stage question builder, answer-to-tag mappings, live simulation preview |
| **SSE Streaming** | `sse.js` | 8.3 KB | `EventSource` connection to `/api/orders/live`, auto-reconnect, 3s backup polling |
| **Main Bootstrap** | `main.js` | 17.2 KB | Window object method exports, `DOMContentLoaded` initialization, audio unlocking |

### 2.3 Identified Frontend Architectural Deficiencies
1. **Window Scope Pollution**: Due to inline HTML handlers (`onclick="openAddTableModal()"`) across `admin.html`, `main.js` must explicitly attach over 85 functions to the global `window` object.
2. **String-Concatenated DOM Rendering**: All complex cards (KDS tickets, menu cards, floor tables, inventory items) are constructed via template literals (`listBody.innerHTML = ...`), creating maintenance hazards and vulnerability to edge-case escaping bugs.
3. **Dual Synchronization (SSE + Polling)**: The frontend connects to an SSE stream via `sse.js`, but also runs a 3,000ms polling loop (`setInterval(() => fetchOrders(true), 3000)`) in `main.js`, creating redundant server load.
4. **Lack of Type Contracts**: Frontend objects (`Order`, `MenuItem`, `Employee`, `Table`) are un-typed JavaScript objects, while the backend has rich TypeScript types in `src/models/types.ts`.
5. **Direct Mutation of State Singleton**: `state.js` exports a mutable object mutated directly by modules, leading to subtle race conditions during rapid state transitions.

---

## 3. Existing Backend & API Contract Audit

### 3.1 Technology Stack & Lifecycle
- **Engine**: Node.js v20 LTS, Express 5.2.1, TypeScript 5.4.5, MongoDB Native Driver 7.5.0.
- **Port**: Default 3000 (configurable via `PORT` in `.env`).
- **Database Engine**: Authoritative MongoDB Atlas cluster (`benzin_saas_db`) with change streams for real-time synchronization.

### 3.2 Key Admin API Endpoints
All existing REST APIs must be preserved without breaking modifications:

```mermaid
graph TD
    Client[React Admin Panel] -->|Bearer JWT + Tenant Headers| AuthMW[Tenant & Auth Middleware]
    AuthMW --> AuthRoutes[/api/auth/*]
    AuthMW --> OrderRoutes[/api/orders/*]
    AuthMW --> TableRoutes[/api/tables/*]
    AuthMW --> MenuRoutes[/api/menu/* & /api/v2/menu/*]
    AuthMW --> EmployeeRoutes[/api/employees/*]
    AuthMW --> InventoryRoutes[/api/menu/inventory/*]
    AuthMW --> SSERoute[/api/orders/live SSE]
    AuthMW --> VibeRoute[/api/vibe-quest/*]
```

#### Detailed Endpoint Inventory:
1. **Authentication (`/api/auth`)**:
   - `POST /api/auth/staff-roster`: Returns active staff for venue PIN (with `include_managers` toggle).
   - `POST /api/auth/staff-verify`: 3-way verification (Rest Code + User ID + PIN) issuing 30-day scoped JWT.
   - `POST /api/auth/manager-login`: Strict email + password authentication for managers/owners.
   - `POST /api/auth/manager-code-login`: Direct supervisor PIN login.
2. **Orders & KDS (`/api/orders`)**:
   - `GET /api/orders`: Query orders by restaurant ID and date range.
   - `GET /api/orders/live`: Server-Sent Events (SSE) stream for real-time order creation and updates.
   - `PUT /api/orders/:id/status`: Transition status (`pending`, `preparing`, `ready`, `served`, `cancelled`).
   - `PUT /api/orders/:id/fulfill`: Fulfill individual departments (`kitchen`, `hookah`, `bar`).
   - `POST /api/orders/:id/cash`: Record cash drawer payment with calculated change.
   - `POST /api/orders/:id/assign`: Assign waiter/server to order ticket.
   - `GET /api/orders/sales/summary`: Manager-only aggregated revenue, tips, tax, and settlement summary.
   - `POST /api/orders/archive/clear`: Manager-only archive truncation requiring supervisor PIN.
3. **Floor Tables (`/api/tables`)**:
   - `GET /api/tables`: List floor tables with active order summaries and occupied statuses.
   - `POST /api/tables`: Create table (supports alphanumeric tables like `P1`, `P2`).
   - `PUT /api/tables/:id`: Update table number, label, capacity, or active state.
   - `DELETE /api/tables/:id`: Remove table from floor plan.
   - `POST /api/tables/reset`: Quick reset table to available.
4. **Menu & Hookah Catalog (`/api/menu`, `/api/v2/menu`)**:
   - `GET /api/v2/menu/categories`: List menu categories (supercategories `FOOD & DINING`, `BEVERAGES`, `HOOKAH & SHISHA`).
   - `GET /api/v2/menu/items`: List all items with pricing, description, allergens, and recipe ingredients.
   - `POST /api/menu`: Create menu item (Manager only).
   - `PUT /api/menu/:id`: Update menu item with category independence (isolated ID preservation).
   - `DELETE /api/menu/:id`: Delete menu item.
   - `GET /api/menu/hookah-config` & `PUT /api/menu/hookah-config`: Manage hookah bases, addons, flavors, and packages.
   - `GET /api/menu/specials` & `PUT /api/menu/specials`: Configure restaurant-curated featured specials.
5. **Staff & Payroll (`/api/employees`)**:
   - `GET /api/employees`: List employees (automatically masks `hourly_rate` as `null` for non-managers).
   - `POST /api/employees`: Create new staff member with role and PIN.
   - `PUT /api/employees/:id`: Update employee details, permissions, or PIN.
   - `DELETE /api/employees/:id`: Deactivate employee.
   - `POST /api/employees/verify-pin`: Supervisor PIN verification and quick-switch authorization.
   - `GET /api/employees/payroll/summary`: Manager-only calculated weekly hours and gross wages.
6. **Guest Service Requests (`/api/service-requests`)**:
   - `GET /api/service-requests`: List pending guest service requests (coals, water, server call).
   - `PUT /api/service-requests/:id/status`: Acknowledge or complete request.
7. **Vibe Quest Discovery (`/api/vibe-quest`)**:
   - `GET /api/vibe-quest/config`: Fetch dynamic questionnaire configuration.
   - `PUT /api/vibe-quest/config`: Update questions, options, recommendations, and destination tags.

---

## 4. Current Serving & Routing Architecture

In `src/server.ts`, static routes and host-based rewriting determine how requests are handled:
```typescript
// Serve Admin Dashboard (Cavalli Admin & Staff Management Portal)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const isAdminHost = req.hostname && req.hostname.toLowerCase().startsWith('admin.');
  const isAdminPath = req.path === '/admin' || req.path.startsWith('/admin/') || req.path === '/staff' || req.path === '/admin.html';

  if (isAdminHost || isAdminPath) {
    return res.sendFile('admin.html', { root: publicPath });
  }
  next();
});
```

### Safety Implication for React Migration:
Because the backend serves `admin.html` whenever `/admin` or `/staff` is requested, we can develop the new React admin panel under an isolated build output (e.g., `public/admin_react/` or `/admin-v2`) without touching or replacing `public/admin.html` until full verification is achieved.

---

## 5. Security & RBAC Enforcement Summary

The backend enforces server-side Role-Based Access Control (RBAC) validated by 49 regression tests in [`test-security-auth-contract.ts`](file:///Users/sandipnepal/.gemini/antigravity-ide/scratch/hookah-lounge-backend/src/scripts/test-security-auth-contract.ts):
- **Server Role**: Forbidden from payroll summaries (`GET /api/employees/payroll/summary` → 403), sales revenue summaries (`GET /api/orders/sales/summary` → 403), menu updates (403), and archive truncation (403). Wages are masked (`hourly_rate: null`).
- **Manager/Owner Role**: Full access authorized via JWT or supervisor PIN override (`x-admin-pin` / `x-staff-pin`).
- **Device Role**: Paired POS devices authenticate via device JWTs and can place orders and view floor tables, but cannot access administrative endpoints.
- **Tenant Isolation**: All operations strictly check `rid` in the cryptographically signed JWT against the target restaurant document.
