# Benzin — Hospitality & Restaurant Operations Platform

Benzin is a modern multi-tenant hospitality management platform featuring customer self-ordering, an interactive hookah lab, kitchen display systems (KDS), table management, inventory ledgers, and staff timecard/clock-in management.

---

## 1. Directory Structure

```
benzin/
├── customer-app/                # Customer Ordering Frontend (Expo 54, React Native Web, React 19)
│   ├── app/                     # Dynamic routing (Menu browsing, cart, QR pairing, payments)
│   ├── src/                     # UI components, state management, API services
│   ├── assets/                  # High-resolution branding and illustrations
│   ├── package.json             # Independent customer app dependencies
│   ├── tsconfig.json
│   ├── Dockerfile               # Production container serving Expo web export via Nginx
│   └── nginx.conf
│
├── admin-app/                   # Restaurant Admin Command Suite (React 18, Vite 5, Tailwind)
│   ├── api/                     # Type-safe backend client
│   ├── components/              # Modals (menu, staff, tables, inventory), layout, branding
│   ├── views/                   # KDS, Tables, Menu, Inventory, Staff, Sales, Archive
│   ├── types/                   # Admin UI type contracts
│   ├── styles/                  # Responsive styling and design system tokens
│   ├── package.json             # Independent admin dashboard dependencies
│   ├── vite.config.ts           # Isolated Vite configuration (builds directly to backend/public/admin_react/)
│   └── tsconfig.json
│
├── backend/                     # Express API & Multi-Tenant Engine (Express 5, Node 20, TypeScript)
│   ├── src/
│   │   ├── config/              # Environment validation and GCS credentials
│   │   ├── routes/              # Orders, Menu v2, Auth, Tables, Media, Restaurants, Service Requests
│   │   ├── services/            # MultiTenantDbService, SquareService, MediaService, AuthService
│   │   ├── models/              # System schemas, data types, and enums
│   │   ├── database/            # MongoDB Atlas connection, indexes, collection definitions
│   │   ├── scripts/             # Production hardening test suite, seeders, sync scripts
│   │   └── server.ts            # Entrypoint & dual-mount static file serving
│   ├── public/                  # Statically hosted web assets (served in production Cloud Run)
│   │   ├── admin_react/         # Built React Admin Command Suite
│   │   ├── _expo/               # Built Customer Web App bundles
│   │   ├── images/              # Menu and venue image assets
│   │   └── uploads/             # Dynamic media upload cache
│   ├── multi_tenant_db.json     # Local development fallback database snapshot
│   ├── package.json             # Independent backend dependencies & scripts
│   ├── tsconfig.json
│   └── Dockerfile               # Production Cloud Run container specification
│
├── shared/                      # Shared Cross-Application Contracts
│   ├── types/                   # Branding presets, theme types, and shared data contracts
│   └── index.ts                 # Clean export barrel
│
├── docs/                        # Architecture, Deployment & Runbook Documentation
│   ├── architecture/            # Architectural decisions, data persistence reports
│   └── react-admin-migration/   # Migration safety guarantees, dual-mount routing specs
│
├── scripts/                     # Project Orchestration & CI Helpers
│   └── build-all.sh             # Compiles all three applications in order
│
├── .gitignore                   # Universal repository ignore rules
├── package.json                 # Root convenience scripts for multi-app development
└── README.md                    # Root orientation and runbook
```

---

## 2. Running Applications Locally

Each application has its own independent dependencies and can be run independently or concurrently:

### A. Root Convenience Scripts
From the root `benzin/` directory:

| Command | Action |
| :--- | :--- |
| `npm run dev:backend` | Starts Express backend API server on `http://localhost:3000` |
| `npm run dev:admin` | Starts Vite React Admin server on `http://localhost:3001` (with proxy to backend) |
| `npm run dev:customer` | Starts Expo Web development server for the customer app |
| `npm run build:all` | Compiles admin, backend, and customer web assets in sequence |
| `npm test` | Runs the 11-step backend multi-tenant production hardening test suite |

---

### B. Individual Application Commands

#### 1. Backend (`backend/`)
```bash
cd backend
npm install            # Install Node/Express dependencies
npm run dev            # Start development server with live reload on port 3000
npm run build          # Compile TypeScript to dist/
npm start              # Start compiled production server (node dist/server.js)
npm test               # Run production hardening & multi-tenant isolation tests
```
- Local API URL: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`
- Readiness Check: `http://localhost:3000/ready`
- Embedded Admin: `http://localhost:3000/admin`

#### 2. Restaurant Admin Dashboard (`admin-app/`)
```bash
cd admin-app
npm install            # Install React 18, Vite & Lucide dependencies
npm run dev            # Start Vite dev server on http://localhost:3001
npm run build          # Typecheck & build bundle directly into backend/public/admin_react/
```

#### 3. Customer Ordering App (`customer-app/`)
```bash
cd customer-app
npm run web            # Start Expo Router web server
npm run ios            # Launch on iOS Simulator (optional)
npm run android        # Launch on Android Emulator (optional)
npm run export:web     # Export production web bundle to dist/
```

---

## 3. Production Deployment & Cloud Run Invariants

- **Backend**: Deployed to Google Cloud Run using `backend/Dockerfile`. Statically serves `backend/public/` (including customer ordering SPA and the Admin suite at `/admin`).
- **Customer App**: Can be built via `npm run export:web` and deployed either through the backend's static file serving or as a standalone Nginx container via `customer-app/Dockerfile`.
- **Authoritative Database**: Managed MongoDB Atlas cluster (`benzin_saas_db`) via `DATABASE_MODE=mongodb`.
