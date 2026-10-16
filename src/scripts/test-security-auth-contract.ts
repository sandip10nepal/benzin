/**
 * test-security-auth-contract.ts
 *
 * Isolated Security Regression Test Suite for Benzin Hospitality OS.
 *
 * CRITICAL SAFETY ENFORCEMENT:
 * 1. Strictly isolated: Runs exclusively in DATABASE_MODE=local with in-memory / temporary test fixtures.
 * 2. Fail-closed: MONGODB_URI is deleted from the environment; connection to Atlas is strictly prohibited.
 * 3. Byte-for-byte state preservation: multi_tenant_db.json is snapshotted before execution and restored in finally.
 * 4. Zero mutations to production data, credentials, or Cloud Run infrastructure.
 *
 * COVERAGE:
 * - Role-header spoofing (x-user-role bypass on orders, void, refund, inventory)
 * - Anonymous / unauthenticated table operations (tables.ts permissive fallback)
 * - Tenant isolation and default fallback leak behavior
 * - Staff PIN initial login vs terminal quick-switch contract gap
 * - Legitimate cryptographically verified JWT access
 */

// ── 1. FAIL-CLOSED ISOLATION PRE-FLIGHT ──────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DATABASE_MODE = 'local';
delete process.env.MONGODB_URI;

if (process.env.DATABASE_MODE === 'mongodb' || process.env.MONGODB_URI) {
  console.error('❌ FATAL: Test attempted to execute in MongoDB mode! Aborting immediately.');
  process.exit(1);
}

import fs from 'fs';
import path from 'path';
import http from 'http';
import express, { Express } from 'express';
import { MultiTenantDbService } from '../services/multi-tenant-db.service';
import { AuthService } from '../services/auth.service';
import ordersRouter from '../routes/orders';
import tablesRouter from '../routes/tables';
import employeesRouter from '../routes/employees';
import authRouter from '../routes/auth';

const DB_FILE = path.join(__dirname, '../../multi_tenant_db.json');

interface TestResult {
  suite: string;
  name: string;
  currentResult: 'VULNERABILITY_CONFIRMED' | 'GAP_CONFIRMED' | 'PASS' | 'FAIL';
  statusCode: number;
  expectedSecureStatus: number;
  description: string;
}

const results: TestResult[] = [];

function recordResult(res: TestResult) {
  results.push(res);
  const icon = res.currentResult === 'VULNERABILITY_CONFIRMED' ? '🚨 [VULNERABILITY CONFIRMED]' :
               res.currentResult === 'GAP_CONFIRMED' ? '⚠️ [CONTRACT GAP CONFIRMED]' :
               res.currentResult === 'PASS' ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${icon} ${res.name} (HTTP ${res.statusCode}, Target: HTTP ${res.expectedSecureStatus})`);
  console.log(`     ↳ ${res.description}`);
}

async function runSecuritySuite() {
  console.log('================================================================');
  console.log('🛡️  STARTING ISOLATED BENZIN SECURITY REGRESSION TEST SUITE');
  console.log('    Mode: STRICT LOCAL / MOCK ISOLATION (Zero Atlas Connections)');
  console.log('================================================================\n');

  // Verify DB mode is local
  if (MultiTenantDbService.isMongoConnected()) {
    throw new Error('FATAL: Mongo connection detected during security test suite startup! Aborting.');
  }

  // Backup original local database file to restore byte-for-byte in finally
  let originalDbSnapshot: string | null = null;
  if (fs.existsSync(DB_FILE)) {
    originalDbSnapshot = fs.readFileSync(DB_FILE, 'utf-8');
  }

  let server: http.Server | null = null;
  let baseUrl = '';

  try {
    // Initialize Local Database with deterministic isolated fixtures
    await MultiTenantDbService.initialize();

    const cavalliId = 'RES_EED4E9D266DF';
    const otherTenantId = 'RES_OTHER_TENANT_99';

    // Seed test users
    const ownerPinHash = AuthService.hashPin('1234');
    const serverPinHash = AuthService.hashPin('5678');

    const testUsers = [
      {
        _id: 'usr_sec_owner',
        restaurant_id: cavalliId,
        name: 'Test Owner',
        email: 'owner@cavalli.test',
        role: 'owner',
        pin_hash: ownerPinHash,
        active: true
      },
      {
        _id: 'usr_sec_server',
        restaurant_id: cavalliId,
        name: 'Test Server',
        email: 'server@cavalli.test',
        role: 'server',
        pin_hash: serverPinHash,
        active: true
      }
    ];

    // Seed test restaurants
    const testRestaurants = [
      {
        _id: cavalliId,
        name: 'Cavalli Lounge (Test)',
        slug: 'cavali',
        restaurant_code: '4821',
        active: true
      },
      {
        _id: otherTenantId,
        name: 'Unrelated Tenant B (Test)',
        slug: 'tenant-b',
        restaurant_code: '9999',
        active: true
      }
    ];

    // Seed test orders for each isolated test case
    const testOrders = [
      {
        _id: 'ord_sec_cavalli_del',
        id: 'ord_sec_cavalli_del',
        restaurant_id: cavalliId,
        table: '1',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 45.00,
        subtotal: 40.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_void',
        id: 'ord_sec_cavalli_void',
        restaurant_id: cavalliId,
        table: '2',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 55.00,
        subtotal: 50.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_ref',
        id: 'ord_sec_cavalli_ref',
        restaurant_id: cavalliId,
        table: '3',
        status: 'completed',
        paymentStatus: 'paid',
        total: 65.00,
        subtotal: 60.00,
        totalPaid: 65.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_leak',
        id: 'ord_sec_cavalli_leak',
        restaurant_id: cavalliId,
        table: '4',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 35.00,
        subtotal: 30.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_cross',
        id: 'ord_sec_cavalli_cross',
        restaurant_id: cavalliId,
        table: '5',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 75.00,
        subtotal: 70.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_srv',
        id: 'ord_sec_cavalli_srv',
        restaurant_id: cavalliId,
        table: '6',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 40.00,
        subtotal: 35.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_tenantb_02',
        id: 'ord_sec_tenantb_02',
        restaurant_id: otherTenantId,
        table: '10',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 80.00,
        subtotal: 75.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_override_valid',
        id: 'ord_sec_cavalli_override_valid',
        restaurant_id: cavalliId,
        table: '7',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 50.00,
        subtotal: 45.00,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'ord_sec_cavalli_override_invalid',
        id: 'ord_sec_cavalli_override_invalid',
        restaurant_id: cavalliId,
        table: '8',
        status: 'pending',
        paymentStatus: 'unpaid',
        total: 50.00,
        subtotal: 45.00,
        createdAt: new Date().toISOString()
      }
    ];

    // Seed test tables
    const testTables = [
      {
        _id: 'tbl_sec_cavalli_01',
        restaurant_id: cavalliId,
        number: 1,
        label: 'Table 1',
        capacity: 4,
        active: true
      }
    ];

    // Seed test inventory
    const testInventory = [
      {
        _id: 'ing_sec_mint',
        restaurant_id: cavalliId,
        name: 'Al Fakher Mint',
        brand: 'Al Fakher',
        category: 'shisha',
        stock: 500,
        unit: 'g',
        reorder_threshold: 100,
        active: true
      }
    ];

    // Overwrite local memory collections for the test duration
    MultiTenantDbService.saveCollection('restaurants', testRestaurants as any);
    MultiTenantDbService.saveCollection('users', testUsers as any);
    MultiTenantDbService.saveCollection('orders', testOrders as any);
    MultiTenantDbService.saveCollection('tables', testTables as any);
    MultiTenantDbService.saveCollection('inventory_items', testInventory as any);

    // Build Express Test Application
    const app: Express = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mount routers identical to server.ts
    app.use('/api/orders', ordersRouter);
    app.use('/api/tables', tablesRouter);
    app.use('/api/employees', employeesRouter);
    app.use('/api/auth', authRouter);

    // Bind server to ephemeral random port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server!.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    console.log(`[Test Server] Bound to ephemeral port: ${baseUrl}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: ROLE-HEADER SPOOFING VULNERABILITY BASELINE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Suite 1: Role-Header Spoofing Vulnerabilities (Current Codebase Baseline) ---');

    // Test 1.1: DELETE /api/orders/:orderId with spoofed x-user-role: owner
    {
      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_del`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'owner',
          'x-restaurant-id': cavalliId
        }
      });
      recordResult({
        suite: 'Role Spoofing',
        name: 'DELETE /api/orders/:id with x-user-role: owner header',
        statusCode: res.status,
        expectedSecureStatus: 401,
        currentResult: res.status === 200 ? 'VULNERABILITY_CONFIRMED' : (res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL'),
        description: res.status === 200 
          ? 'Attacker without Bearer token deleted order ord_sec_cavalli_del by passing x-user-role: owner!'
          : 'Request properly rejected.'
      });
    }

    // Test 1.2: POST /api/orders/:orderId/void with spoofed x-user-role: manager
    {
      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_void/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'manager',
          'x-restaurant-id': cavalliId
        },
        body: JSON.stringify({ reason: 'Malicious void attack' })
      });
      recordResult({
        suite: 'Role Spoofing',
        name: 'POST /api/orders/:id/void with x-user-role: manager header',
        statusCode: res.status,
        expectedSecureStatus: 401,
        currentResult: res.status === 200 ? 'VULNERABILITY_CONFIRMED' : (res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL'),
        description: res.status === 200 
          ? 'Attacker without Bearer token voided order by passing x-user-role: manager!'
          : 'Request properly rejected.'
      });
    }

    // Test 1.3: POST /api/orders/:orderId/refund with spoofed x-user-role: owner
    {
      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_ref/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'owner',
          'x-restaurant-id': cavalliId
        },
        body: JSON.stringify({ isFullRefund: true, reason: 'Unauthorized refund' })
      });
      recordResult({
        suite: 'Role Spoofing',
        name: 'POST /api/orders/:id/refund with x-user-role: owner header',
        statusCode: res.status,
        expectedSecureStatus: 401,
        currentResult: res.status === 200 ? 'VULNERABILITY_CONFIRMED' : (res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL'),
        description: res.status === 200 
          ? 'Attacker without Bearer token issued full refund by passing x-user-role: owner!'
          : 'Request properly rejected.'
      });
    }

    // Test 1.4: POST /api/orders/inventory/adjust with spoofed x-user-role: owner
    {
      const res = await fetch(`${baseUrl}/api/orders/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'owner',
          'x-restaurant-id': cavalliId
        },
        body: JSON.stringify({
          ingredientId: 'ing_sec_mint',
          amount: 100,
          type: 'decrease',
          reason: 'Spoofed stock drain'
        })
      });
      recordResult({
        suite: 'Role Spoofing',
        name: 'POST /api/orders/inventory/adjust with x-user-role: owner header',
        statusCode: res.status,
        expectedSecureStatus: 401,
        currentResult: res.status === 200 ? 'VULNERABILITY_CONFIRMED' : (res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL'),
        description: res.status === 200 
          ? 'Attacker adjusted inventory without Bearer token by passing x-user-role: owner!'
          : 'Request properly rejected.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: UNAUTHENTICATED TABLE OPERATIONS (PERMISSIVE FALLBACK)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 2: Unauthenticated Table Operations (Permissive Fallback) ---');

    // Test 2.1: DELETE /api/tables/:id with ZERO authentication headers
    {
      const res = await fetch(`${baseUrl}/api/tables/tbl_sec_cavalli_01`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
          // Absolutely NO x-user-role, NO Authorization, NO pin!
        }
      });
      recordResult({
        suite: 'Table Auth',
        name: 'DELETE /api/tables/:id with completely empty headers',
        statusCode: res.status,
        expectedSecureStatus: 401,
        currentResult: res.status === 200 ? 'VULNERABILITY_CONFIRMED' : (res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL'),
        description: res.status === 200 
          ? 'Anonymous caller deleted table tbl_sec_cavalli_01 because isManagerOrAdmin() has if (!role) return true!'
          : 'Request properly rejected.'
      });
    }

    // Test 2.2: POST /api/tables with ZERO authentication headers
    {
      const res = await fetch(`${baseUrl}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: 99,
          label: 'Rogue Injected Table',
          capacity: 4
        })
      });
      recordResult({
        suite: 'Table Auth',
        name: 'POST /api/tables with completely empty headers',
        statusCode: res.status,
        expectedSecureStatus: 401,
        currentResult: (res.status === 200 || res.status === 201) ? 'VULNERABILITY_CONFIRMED' : (res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL'),
        description: (res.status === 200 || res.status === 201)
          ? 'Anonymous caller injected new table because isManagerOrAdmin() has if (!role) return true!'
          : 'Request properly rejected.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: TENANT ISOLATION & UN-SCOPED REQUEST LEAKAGE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 3: Tenant Isolation & Un-Scoped Default Fallback ---');

    // Test 3.1: GET /api/orders with ZERO tenant headers (demonstrating default Cavalli fallback)
    {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data: any = await res.json().catch(() => ({}));
      const returnedOrders = Array.isArray(data.orders) ? data.orders : [];
      const hasCavalliOrder = returnedOrders.some((o: any) => o._id === 'ord_sec_cavalli_leak' || o.id === 'ord_sec_cavalli_leak');

      recordResult({
        suite: 'Tenant Isolation',
        name: 'GET /api/orders without tenant headers returns Cavalli data by default',
        statusCode: res.status,
        expectedSecureStatus: 400,
        currentResult: (res.status === 200 && hasCavalliOrder) ? 'VULNERABILITY_CONFIRMED' : 'PASS',
        description: (res.status === 200 && hasCavalliOrder)
          ? 'Un-scoped request with no tenant ID leaked Cavalli live orders due to default fallback (4821)!'
          : 'Request properly rejected or isolated.'
      });
    }

    // Test 3.2: Tenant B authenticated request attempting to access Cavalli order
    {
      const tokenB = AuthService.generateToken({
        sub: 'usr_sec_tenantb',
        rid: otherTenantId,
        role: 'manager',
        rname: 'Tenant B'
      });

      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_cross`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenB}`
        }
      });
      const data: any = await res.json().catch(() => ({}));
      const leaked = data && (data._id === 'ord_sec_cavalli_cross' || (data.order && data.order._id === 'ord_sec_cavalli_cross'));

      recordResult({
        suite: 'Tenant Isolation',
        name: 'Cross-tenant order lookup (Tenant B user fetching Cavalli order)',
        statusCode: res.status,
        expectedSecureStatus: 404,
        currentResult: leaked ? 'VULNERABILITY_CONFIRMED' : 'PASS',
        description: leaked 
          ? 'CRITICAL LEAK: Tenant B user was able to read Cavalli order data!'
          : 'Tenant isolation enforced: Cavalli order was not returned to Tenant B.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 4: STAFF PIN INITIAL LOGIN VS TERMINAL QUICK-SWITCH CONTRACT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 4: Staff Authentication & Terminal Quick-Switch Contracts ---');

    // Test 4.1: POST /api/auth/staff-verify (Initial login with PIN)
    {
      const res = await fetch(`${baseUrl}/api/auth/staff-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_code: '4821',
          user_id: 'usr_sec_owner',
          pin: '1234',
          action: 'login'
        })
      });
      const data: any = await res.json().catch(() => ({}));
      const hasToken = data.success && typeof data.token === 'string';

      recordResult({
        suite: 'Staff Auth Contracts',
        name: 'POST /api/auth/staff-verify returns signed JWT on initial terminal login',
        statusCode: res.status,
        expectedSecureStatus: 200,
        currentResult: hasToken ? 'PASS' : 'FAIL',
        description: hasToken 
          ? 'Initial staff login correctly issues a signed JWT containing employee role and restaurant context.'
          : 'Initial staff login failed to issue a JWT token.'
      });
    }

    // Test 4.2: POST /api/employees/verify-pin (Fast terminal switch on floor)
    {
      const res = await fetch(`${baseUrl}/api/employees/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-restaurant-id': cavalliId
        },
        body: JSON.stringify({ pin: '1234' })
      });
      const data: any = await res.json().catch(() => ({}));
      const hasTokenInQuickSwitch = data.success && Boolean(data.token);

      recordResult({
        suite: 'Staff Auth Contracts',
        name: 'POST /api/employees/verify-pin (Quick-switch on terminal) response contract gap',
        statusCode: res.status,
        expectedSecureStatus: 200,
        currentResult: !hasTokenInQuickSwitch ? 'GAP_CONFIRMED' : 'PASS',
        description: !hasTokenInQuickSwitch 
          ? 'CONFIRMED CONTRACT GAP: Quick-switch returns { success: true, employee: {...} } WITHOUT issuing a new JWT! This explains why frontend relied on insecure x-user-role header.'
          : 'Quick-switch issued a JWT token.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 5: LEGITIMATE MANAGERIAL ACCESS WITH CRYPTOGRAPHIC JWT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 5: Legitimate Cryptographically Verified Manager Access ---');

    // Test 5.1: Owner with verified Bearer token accessing orders
    {
      const ownerToken = AuthService.generateToken({
        sub: 'usr_sec_owner',
        rid: cavalliId,
        role: 'owner',
        rname: 'Cavalli Lounge'
      });

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`
        }
      });
      recordResult({
        suite: 'Legitimate Access',
        name: 'Owner with verified Bearer JWT accessing GET /api/orders',
        statusCode: res.status,
        expectedSecureStatus: 200,
        currentResult: res.status === 200 ? 'PASS' : 'FAIL',
        description: res.status === 200 
          ? 'Legitimate owner with cryptographically signed token granted access.'
          : 'Legitimate owner request failed.'
      });
    }

    // Test 5.2: Server role with verified Bearer token attempting DELETE /api/orders/:id
    {
      const serverToken = AuthService.generateToken({
        sub: 'usr_sec_server',
        rid: cavalliId,
        role: 'server',
        rname: 'Cavalli Lounge'
      });

      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_srv`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serverToken}`,
          'x-restaurant-id': cavalliId // Test line 155 bypass attempt
        }
      });
      recordResult({
        suite: 'Legitimate Access',
        name: 'Server role with Bearer JWT attempting DELETE /api/orders/:id (Line 155 flaw)',
        statusCode: res.status,
        expectedSecureStatus: 403,
        currentResult: res.status === 200 ? 'VULNERABILITY_CONFIRMED' : (res.status === 403 ? 'PASS' : 'FAIL'),
        description: res.status === 200
          ? 'VULNERABILITY CONFIRMED: Server was able to delete order because isManagerOrOwner line 155 grants access if x-restaurant-id is present!'
          : 'Server role properly denied permission to delete order.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 6: LEGITIMATE STAFF, POS DEVICE, AND SUPERVISOR PIN WORKFLOWS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 6: Legitimate Staff, POS Device & Supervisor Workflows ---');

    // Test 6.1: Ordinary Server Order Creation
    {
      const serverToken = AuthService.generateToken({
        sub: 'usr_sec_server',
        rid: cavalliId,
        role: 'server',
        rname: 'Cavalli Lounge'
      });

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serverToken}`
        },
        body: JSON.stringify({
          restaurant_id: cavalliId,
          table: '1',
          items: [{ name: 'Mint Hookah', price: 35.00, quantity: 1, category: 'hookah' }],
          customer_name: 'VIP Guest'
        })
      });
      recordResult({
        suite: 'Operational Workflows',
        name: 'Server placing order via POST /api/orders',
        statusCode: res.status,
        expectedSecureStatus: 201,
        currentResult: res.status === 201 ? 'PASS' : 'FAIL',
        description: res.status === 201
          ? 'Legitimate server created order without disruption.'
          : 'Server order creation failed.'
      });
    }

    // Test 6.2: Ordinary Server Floor Table Listing
    {
      const serverToken = AuthService.generateToken({
        sub: 'usr_sec_server',
        rid: cavalliId,
        role: 'server',
        rname: 'Cavalli Lounge'
      });

      const res = await fetch(`${baseUrl}/api/tables?restaurant_id=${cavalliId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serverToken}`
        }
      });
      recordResult({
        suite: 'Operational Workflows',
        name: 'Server viewing floor tables via GET /api/tables',
        statusCode: res.status,
        expectedSecureStatus: 200,
        currentResult: res.status === 200 ? 'PASS' : 'FAIL',
        description: res.status === 200
          ? 'Server successfully retrieved floor table layout.'
          : 'Server floor table retrieval failed.'
      });
    }

    // Test 6.3: Paired POS Tablet Device Ordering
    {
      const deviceToken = AuthService.generateToken({
        sub: 'dev_sec_pos_01',
        did: 'dev_sec_pos_01',
        rid: cavalliId,
        role: 'device',
        rname: 'Cavalli Lounge'
      });

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deviceToken}`
        },
        body: JSON.stringify({
          restaurant_id: cavalliId,
          table: '2',
          items: [{ name: 'Double Apple Hookah', price: 40.00, quantity: 1, category: 'hookah' }],
          customer_name: 'Table Guest'
        })
      });
      recordResult({
        suite: 'Operational Workflows',
        name: 'Paired POS device submitting order via POST /api/orders',
        statusCode: res.status,
        expectedSecureStatus: 201,
        currentResult: res.status === 201 ? 'PASS' : 'FAIL',
        description: res.status === 201
          ? 'Paired POS device placed table order successfully.'
          : 'POS device order placement failed.'
      });
    }

    // Test 6.4: Paired POS Tablet Device Floor Table Listing
    {
      const deviceToken = AuthService.generateToken({
        sub: 'dev_sec_pos_01',
        did: 'dev_sec_pos_01',
        rid: cavalliId,
        role: 'device',
        rname: 'Cavalli Lounge'
      });

      const res = await fetch(`${baseUrl}/api/tables?restaurant_id=${cavalliId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deviceToken}`
        }
      });
      recordResult({
        suite: 'Operational Workflows',
        name: 'Paired POS device viewing floor tables via GET /api/tables',
        statusCode: res.status,
        expectedSecureStatus: 200,
        currentResult: res.status === 200 ? 'PASS' : 'FAIL',
        description: res.status === 200
          ? 'POS terminal loaded floor map successfully.'
          : 'POS terminal table retrieval failed.'
      });
    }

    // Test 6.5: Supervisor In-Person PIN Override with Valid Manager PIN
    {
      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_override_valid/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-restaurant-id': cavalliId
        },
        body: JSON.stringify({
          authPin: '1234',
          reason: 'Authorized supervisor void'
        })
      });
      recordResult({
        suite: 'Operational Workflows',
        name: 'Supervisor in-person PIN override on terminal with VALID PIN',
        statusCode: res.status,
        expectedSecureStatus: 200,
        currentResult: res.status === 200 ? 'PASS' : 'FAIL',
        description: res.status === 200
          ? 'Supervisor PIN override authorized void operation successfully.'
          : 'Supervisor valid PIN override failed.'
      });
    }

    // Test 6.6: Supervisor Override Rejection with INVALID PIN
    {
      const res = await fetch(`${baseUrl}/api/orders/ord_sec_cavalli_override_invalid/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-restaurant-id': cavalliId
        },
        body: JSON.stringify({
          authPin: '9999',
          reason: 'Unauthorized attempt with wrong PIN'
        })
      });
      recordResult({
        suite: 'Operational Workflows',
        name: 'Supervisor in-person PIN override rejection with WRONG PIN',
        statusCode: res.status,
        expectedSecureStatus: 403,
        currentResult: res.status === 403 ? 'PASS' : 'FAIL',
        description: res.status === 403
          ? 'Invalid PIN was rejected securely.'
          : 'Invalid PIN was improperly accepted.'
      });
    }

  } finally {
    // Teardown: Stop ephemeral test HTTP server
    if (server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
      console.log('\n[Test Server] Ephemeral HTTP listener closed.');
    }

    // Teardown: Restore original local database file byte-for-byte
    if (originalDbSnapshot !== null) {
      fs.writeFileSync(DB_FILE, originalDbSnapshot, 'utf-8');
      console.log('[Test Teardown] multi_tenant_db.json restored byte-for-byte to pre-test state.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('📊  SECURITY REGRESSION TEST SUITE RESULTS SUMMARY');
  console.log('================================================================');
  const vulns = results.filter(r => r.currentResult === 'VULNERABILITY_CONFIRMED').length;
  const gaps = results.filter(r => r.currentResult === 'GAP_CONFIRMED').length;
  const passes = results.filter(r => r.currentResult === 'PASS').length;
  const fails = results.filter(r => r.currentResult === 'FAIL').length;

  console.log(`Confirmed Vulnerabilities Demonstrated : ${vulns}`);
  console.log(`Confirmed Contract Gaps Identified     : ${gaps}`);
  console.log(`Legitimate / Isolated Passes           : ${passes}`);
  console.log(`Unexpected Failures                    : ${fails}`);
  console.log('================================================================\n');

  if (vulns > 0 || gaps > 0) {
    console.log('ℹ️  BASELINE RECORDED: The test suite successfully demonstrated existing backend vulnerabilities.');
    console.log('   These tests will serve as the exact regression gate for Step 2+ security fixes.\n');
  }
}

runSecuritySuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
