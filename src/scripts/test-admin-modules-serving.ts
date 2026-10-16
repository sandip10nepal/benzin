import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';

async function runAdminModulesServingTest() {
  const app = express();
  const publicPath = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicPath));
  app.get('/admin.html', (req, res) => res.sendFile('admin.html', { root: publicPath }));

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  console.log(`[Test Server] Ephemeral server running on port ${port}`);

  try {
    // 1. Verify /admin.html
    const adminRes = await fetch(`http://127.0.0.1:${port}/admin.html`);
    if (adminRes.status !== 200) throw new Error(`/admin.html returned status ${adminRes.status}`);
    const adminHtml = await adminRes.text();
    if (!adminHtml.includes('<script type="module" src="/js/admin/main.js"></script>')) {
      throw new Error('/admin.html does not contain the expected module script tag');
    }
    console.log('✅ [PASS] /admin.html served successfully with native ES module script tag');

    // 2. Verify all 17 ES modules
    const modulesDir = path.join(publicPath, 'js/admin');
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
    console.log(`Testing HTTP delivery of ${moduleFiles.length} ES modules...`);

    for (const mod of moduleFiles) {
      const res = await fetch(`http://127.0.0.1:${port}/js/admin/${mod}`);
      if (res.status !== 200) {
        throw new Error(`/js/admin/${mod} returned HTTP ${res.status}`);
      }
      const ctype = res.headers.get('content-type') || '';
      if (!ctype.includes('javascript')) {
        throw new Error(`/js/admin/${mod} content-type is not javascript (${ctype})`);
      }
      const text = await res.text();
      if (text.length === 0) {
        throw new Error(`/js/admin/${mod} returned empty body`);
      }
      console.log(`  ✅ [PASS] /js/admin/${mod} (HTTP 200, ${ctype}, ${text.length} bytes)`);
    }

    console.log('\n🎉 ALL ADMIN PANEL ES MODULE SERVING CHECKS PASSED 100%!');
  } finally {
    server.close();
  }
}

runAdminModulesServingTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
