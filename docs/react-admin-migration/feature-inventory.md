# Benzin Hospitality OS — Feature & UI Inventory
**Module**: Admin Dashboard & Command Center  
**Source Files**: `public/admin.html`, `public/js/admin/*.js`  
**Target Migration**: React + TypeScript Component Tree

---

## 1. Overview of Admin Panels & Views

The admin dashboard contains 11 primary operational panels and 16 modal dialogs. Each view is mapped below with its underlying data models, user roles, and action triggers.

---

## 2. Exhaustive Panel & Feature Breakdown

### Panel 1: Kitchen & Hookah Display System (KDS)
- **Container ID**: `#tab-kds`
- **Module**: `public/js/admin/kds.js`
- **Allowed Roles**: All staff roles (Owner, Manager, Cashier, Server, Chef, Hookah Maker).
- **Features & Controls**:
  - **Live Order Feed**: Real-time rendering of active customer and server tickets via SSE stream.
  - **Ticket Headers**: Displays Table Number / Patio code, customer nickname, time elapsed with color-coded urgency indicators (green < 10m, yellow 10-20m, red > 20m).
  - **Item Grouping**: Aggregates identical dishes/flavors (`consolidateItems`) with modifier pills (e.g., Ice Base, Ice Hose, Wing Sauces, Spice Level, Steaks temps).
  - **Department Separation**: Distinguishes kitchen food items vs hookah preparation vs bar beverages.
  - **Workflow Actions**:
    - `Prep`: Transitions item/order status from `pending` to `preparing`.
    - `Ready`: Transitions order status to `ready` for runner pickup.
    - `Serve`: Completes ticket delivery to guest table.
    - `Pay Cash`: Launches `#collectCashModal` for cash drawer settlement.
    - `Print`: Prints physical receipt slip via thermal printer format (`printTicket`).

### Panel 2: Floor Tables & Seating Management
- **Container ID**: `#tab-tables`
- **Module**: `public/js/admin/tables.js`
- **Allowed Roles**: Host, Server, Cashier, Manager, Owner.
- **Features & Controls**:
  - **Stats & Metrics Header**: Total floor table count, occupied count, available count, and pending orders badge.
  - **Filter Bar**: Quick filter by `All`, `Available`, `Occupied`, `Needs Service`.
  - **Search Input**: Instant client-side search by table number or label (e.g. `1`, `P1`, `VIP`).
  - **Interactive Table Cards**:
    - Status pill (`Available`, `Occupied`, `Bill Printed`).
    - Capacity indicator (`Seats: 4`).
    - Assigned server badge (`Server: Suwasna`).
    - Active order subtotal and duration timer.
    - Card Actions: `Manage Table`, `Assign Staff`, `Quick Reset Table`, `Quick Fulfill`.
  - **CRUD Operations**: Add Table button (opens `#addTableModal`), Edit Table (opens `#editTableModal`).

### Panel 3: Menu Catalog & Categories
- **Container ID**: `#tab-menu`
- **Module**: `public/js/admin/menu.js`
- **Allowed Roles**: Manager, Owner (Server/Cashier have read-only view with lock badges).
- **Features & Controls**:
  - **Supercategory Navigation**: Tabbed browsing across `FOOD & DINING`, `BEVERAGES`, and `HOOKAH & SHISHA`.
  - **Subcategory Filter Pills**: Dynamic category buttons loaded from MongoDB (`/api/v2/menu/categories`).
  - **Catalog Item Cards**:
    - Item image thumbnail (with graceful emoji fallback).
    - Item name, category badge, and formatted price (`$XX.XX`).
    - Description text and dietary/allergen icons.
    - Quick availability toggle switch (`Active / Inactive`).
    - Edit button (opens `#addItemModal` in edit mode).
    - Delete button with confirmation prompt.
  - **Category Actions**: `Add Category` button (opens `#addCategoryModal`).
  - **Ordering Questions Configuration**: Accordion editor for configuring stage questions and item-level options.

### Panel 4: Hookah Mix Lab
- **Container ID**: `#tab-hookah`
- **Module**: `public/js/admin/hookah.js`
- **Allowed Roles**: Manager, Owner, Hookah Maker.
- **Features & Controls**:
  - **Hookah Sub-Tabs**:
    - `Bases`: Water, Rooh Afza, Watermelon Syrup, Milk/Cream. Shows price modifier and active toggle.
    - `Addons`: Ice Base ($2), Ice Hose ($6). Shows toggle and inventory link.
    - `Flavors`: House blends, Single flavors, Mix Lab brand items.
    - `Packages`: Daku ($65 with unlimited head refill), Standard bowls.
  - **Config Preservation**: Enforces that House Mixes do not auto-force Ice Base or Ice Hose unless selected.
  - **Quick Add & Edit**: Modals for adding custom hookah bases and flavor options with dynamic weight calculations.

### Panel 5: Inventory & Stock Tracking
- **Container ID**: `#tab-inventory`
- **Module**: `public/js/admin/inventory.js`
- **Allowed Roles**: Manager, Owner (Staff can view stock levels).
- **Features & Controls**:
  - **Dynamic Category Tabs**: `Hookah Shisha`, `Food Ingredients`, `Beverages`, `Essentials`, `All`.
  - **Inventory Item Cards / Table**:
    - Item name, category, and current stock level.
    - Unit display (`g`, `kg`, `bottles`, `packs`, `units`).
    - Low-stock warning pill (`Alert when < 20`).
    - Quick increment buttons: `+10`, `+50`, `-10`.
    - Edit stock modal button (opens `#editInvModal`).
    - Delete stock item button.
  - **Category Management**: `Add Category` button and `Manage Categories` modal.

### Panel 6: Staff Management & Weekly Payroll
- **Container ID**: `#tab-staff`
- **Module**: `public/js/admin/staff.js`
- **Allowed Roles**: Manager, Owner (Server receives masked wages and is forbidden from payroll).
- **Features & Controls**:
  - **Staff Roster Table**:
    - Employee Name, Role Badge (Owner, Manager, Host, Server, Bartender, Chef, Hookah Maker).
    - Email address (required for managers, displayed for owners).
    - Clock-in status pill (`🟢 ON SHIFT` vs `⚪ OFF SHIFT`).
    - Shift timecard duration tracker.
    - Masked Hourly Wage: Displays `$XX.XX/hr` for managers; `Protected` for non-managers.
    - Action buttons: `Edit Profile`, `Clock In/Out Override`, `Deactivate`.
  - **Weekly Payroll Summary**:
    - Calculated total active staff hours.
    - Aggregated gross payroll estimate.
    - Breakdown by department.
  - **Modal Triggers**: `Add Employee` (opens `#addEmployeeModal`).

### Panel 7: Financial Sales & Analytics
- **Container ID**: `#tab-sales`
- **Module**: `public/js/admin/sales.js`
- **Allowed Roles**: Manager, Owner only (Server blocked with 403).
- **Features & Controls**:
  - **KPI Cards**:
    - Gross Sales ($)
    - Total Orders Fulfilled
    - Gratuity / Tips Collected ($)
    - Sales Tax Aggregated ($)
  - **Payment Method Split**: Breakdown of Cash drawer transactions vs Square/Stripe digital card transactions.
  - **Date Range Selector**: `Today`, `Yesterday`, `This Week`, `Custom Range`.

### Panel 8: Live Guest Service Requests
- **Container ID**: `#tab-service-requests`
- **Module**: `public/js/admin/service-requests.js`
- **Allowed Roles**: All floor staff.
- **Features & Controls**:
  - **Request Cards**: Table number, Request Type (`Coal Refill`, `Water Carafe`, `Server Assistance`, `Bill Request`), timestamp elapsed.
  - **Action Buttons**: `Acknowledge Request`, `Mark Resolved`.
  - **Visual Ping**: Flashing gold indicator for unacknowledged requests.

### Panel 9: Featured Specials
- **Container ID**: `#tab-specials`
- **Module**: `public/js/admin/specials.js`
- **Allowed Roles**: Manager, Owner.
- **Features & Controls**:
  - Direct curation of featured menu items for guest table QR landing pages.
  - Toggle existing catalog dishes into Specials without creating duplicate database records.
  - Reordering priority controls.

### Panel 10: Vibe Quest Discovery Engine
- **Container ID**: `#tab-vibe-quest`
- **Module**: `public/js/admin/vibe-quest.js`
- **Allowed Roles**: Manager, Owner.
- **Features & Controls**:
  - **Questionnaire Builder**: 5-stage interactive flow editor (Hookah, Food, Drinks, Music/Vibe, Ambience).
  - **Option Matrix**: Add/delete/reorder options within each question with dynamic branch routing.
  - **Signal & Destination Mapping**: Map options to recommendation tags (e.g. `sweet`, `fruity`, `minty`, `spicy`).
  - **Interactive Simulation**: Live preview simulating a guest answering questions and generating matched items.

### Panel 11: Order Archive & History
- **Container ID**: `#tab-archive`
- **Module**: `public/js/admin/kds.js`
- **Allowed Roles**: Manager, Owner (viewable by staff).
- **Features & Controls**:
  - Tabular list of completed and cancelled orders with timestamp, table, items, and total paid.
  - `Clear Archive` button: Requires Supervisor PIN prompt to protect audit history.

---

## 3. Comprehensive Modals Inventory (16 Modals)

| Modal ID | Trigger | Description | Core Form Fields |
|---|---|---|---|
| `#benzinLoginOverlay` | Page Load (unauthenticated) | Two-mode login portal | Venue PIN (4821) + Staff Dropdown + PIN Pad OR Manager Email/Password |
| `#staffSwitchModal` | Header Staff Pill Click | Fast in-person PIN pad | 4-digit PIN pad with numeric keypad |
| `#collectCashModal` | KDS "Pay Cash" Button | Cash drawer calculator | Subtotal, Tax, Gratuity, Total Due, Cash Tendered, Change Due display |
| `#reassignModal` | Table Card "Assign" | Table server reassignment | Server dropdown list |
| `#addTableModal` | "Add Table" Button | Floor plan table creation | Table Label (e.g. `P1`), Table Number, Capacity |
| `#editTableModal` | Table Card "Edit" | Modify or delete table | Table Label, Number, Capacity, Delete Table button |
| `#addItemModal` | "Add Item" / Dish Edit | Dish catalog editor | Name, Category, Price, Supercategory, Image URL, Description, Allergens, Recipe Multi-Item Ingredients |
| `#addCategoryModal` | "Add Category" Button | Menu category creation | Category Name, Supercategory dropdown, Icon/Emoji |
| `#addInvModal` | "Add Stock Item" Button | Inventory stock creation | Name, Category, Initial Quantity, Unit, Low Stock Threshold |
| `#editInvModal` | Inventory Item "Edit" | Modify inventory stock | Name, Category, Quantity (+10/+50 quick buttons), Unit, Threshold |
| `#addInvCategoryModal` | "Add Category" Button | Inventory category creation| Category Name |
| `#manageInvCategoriesModal`| "Manage Categories" | Category list manager | List with delete confirmation |
| `#addEmployeeModal` | "Add Staff" Button | New employee creation | Name, Role (dropdown), PIN (4-digits), Hourly Rate, Email |
| `#editEmployeeModal` | Staff Card "Edit" | Update employee details | Name, Role, New PIN, Hourly Rate, Email, Active Status |
| `#editSupervisorPinModal`| Header Profile Menu | Manager PIN change | Current PIN, New 4-digit Supervisor PIN, Confirm PIN |
| `#staffProfileModal` | Header Profile Click | Logged-in staff modal | Staff Name, Role, Venue Name, Active Shift duration, Clock In/Out button |

---

## 4. Global UI Components & Shared Shell

- **Collapsible Sidebar**:
  - Logo branding: `BENZIN Hospitality OS` (Venue: Cavalli).
  - Navigation links with Lucide icons for all 11 tabs.
  - Dynamic lock badges on protected tabs (`Staff & Payroll`, `Sales`, `Menu Edit`) when logged in as Server.
- **Top Header Bar**:
  - Venue indicator (`Cavalli Lounge`).
  - Active staff badge (`Suwasna Gorkhali - SERVER`).
  - Shift Clock Widget (`⏱️ 01:24:12` with green/gold status).
  - Dark/Light mode toggle button.
  - Staff quick-switch icon button.
  - Logout button.
- **Notification & Chime System**:
  - Audio element `#orderChime` played on incoming orders via SSE.
  - Sound policy unlock on first user interaction anywhere on screen.
