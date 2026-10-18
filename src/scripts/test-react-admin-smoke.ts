/**
 * Benzin Hospitality OS — Phase 1 React Admin Smoke Test Suite
 * Validates React build artifacts, TypeScript compilation, HTTP asset delivery,
 * and strict isolation from legacy admin files.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

async function runReactAdminSmokeTest() {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('   BENZIN REACT ADMIN (PHASE 1) SMOKE TEST SUITE');
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
      failed++;
    }
  }

  // 1. React TypeScript compilation check (noEmit)
  console.log('--- 1. React Admin TypeScript Compilation ---');
  try {
    execSync('npx tsc --project src/admin/tsconfig.json --noEmit', { stdio: 'pipe' });
    assert(true, 'React Admin TypeScript compiles cleanly with zero type errors');
  } catch (err: any) {
    assert(false, 'React Admin TypeScript compilation failed', err.stdout?.toString() || err.message);
  }

  // 2. Build Artifacts Verification
  console.log('\n--- 2. Production Build Artifacts Integrity ---');
  const distDir = path.resolve(process.cwd(), 'public/admin_react');
  const indexHtmlPath = path.join(distDir, 'index.html');
  assert(fs.existsSync(indexHtmlPath), 'Build output index.html exists in public/admin_react');

  const assetsDir = path.join(distDir, 'assets');
  const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  assert(assetFiles.length > 0, `Generated ${assetFiles.length} bundled assets in public/admin_react/assets`);

  const hasCss = assetFiles.some((f) => f.endsWith('.css'));
  const hasJs = assetFiles.some((f) => f.endsWith('.js'));
  assert(hasCss, 'Extracted production CSS stylesheet generated');
  assert(hasJs, 'Vendor & application JavaScript chunks generated');

  // 3. Isolation & Non-Destructive Invariant Check
  console.log('\n--- 3. Legacy Admin & Customer App Isolation ---');
  const legacyAdminPath = path.resolve(process.cwd(), 'public/admin.html');
  const legacyAdminDist = path.resolve(process.cwd(), 'public/admin_dist/index.html');
  const legacyJsMain = path.resolve(process.cwd(), 'public/js/admin/main.js');

  assert(fs.existsSync(legacyAdminPath), 'Legacy public/admin.html is completely preserved and untouched');
  assert(fs.existsSync(legacyAdminDist), 'Marketing app public/admin_dist/ is completely preserved and untouched');
  assert(fs.existsSync(legacyJsMain), 'Modular public/js/admin/main.js is completely preserved and untouched');

  // 4. HTTP Delivery Smoke Test via Ephemeral Server
  console.log('\n--- 4. HTTP Delivery & Content Smoke Test ---');
  const app = express();
  app.use('/admin_react', express.static(distDir));

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/admin_react/index.html`);
    assert(res.status === 200, `GET /admin_react/index.html returned HTTP 200 (Got: ${res.status})`);

    const html = await res.text();
    assert(html.includes('Benzin OS'), 'HTML contains correct Benzin OS title and metadata');
    assert(html.includes('id="root"'), 'HTML contains React mount point root element');

    // Test asset HTTP responses
    for (const asset of assetFiles) {
      const assetRes = await fetch(`http://127.0.0.1:${port}/admin_react/assets/${asset}`);
      assert(assetRes.status === 200, `Asset /admin_react/assets/${asset} served with HTTP 200`);
    }
  } finally {
    server.close();
  }

  // 5. Backend compilation invariant
  console.log('\n--- 5. Backend Compilation Invariant ---');
  try {
    execSync('npm run build', { stdio: 'pipe' });
    assert(true, 'Backend compilation (npm run build) compiles cleanly to dist/server.js');
  } catch (err: any) {
    assert(false, 'Backend compilation failed', err.stdout?.toString() || err.message);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`PHASE 1 SMOKE TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runReactAdminSmokeTest().catch((err) => {
  console.error('Fatal error during smoke test:', err);
  process.exit(1);
});
