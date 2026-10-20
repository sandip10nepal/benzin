/**
 * Automated Verification Suite — Media Management, Sharp Optimization & Tenant Security
 *
 * Runs full security contract assertions against:
 * 1. Magic bytes image validation (rejects executables, scripts, SVGs).
 * 2. Sharp optimization & WebP conversion.
 * 3. SSRF external URL defense.
 * 4. Multi-tenant isolation and RBAC role boundaries.
 */
import sharp from 'sharp';
import { MediaService } from '../services/media.service';
import { AuthService } from '../services/auth.service';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('       BENZIN MEDIA MANAGEMENT & SECURITY CONTRACT SUITE          ');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  /* ───────────────────────────────────────────────────────────────────────── */
  /* 1. MAGIC BYTES & FILE VALIDATION                                          */
  /* ───────────────────────────────────────────────────────────────────────── */
  console.log('Test Group 1: Magic Bytes & Format Validation');

  // Valid 1x1 PNG
  const validPngBuffer = await sharp({
    create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } },
  }).png().toBuffer();

  const pngRes = MediaService.validateImageMagicBytes(validPngBuffer);
  assert(pngRes.valid === true && pngRes.detectedMime === 'image/png', 'Valid PNG buffer passes magic bytes check');

  // Valid JPEG
  const validJpegBuffer = await sharp({
    create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 255, b: 0 } },
  }).jpeg().toBuffer();

  const jpegRes = MediaService.validateImageMagicBytes(validJpegBuffer);
  assert(jpegRes.valid === true && jpegRes.detectedMime === 'image/jpeg', 'Valid JPEG buffer passes magic bytes check');

  // Valid WebP
  const validWebpBuffer = await sharp({
    create: { width: 10, height: 10, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
  }).webp().toBuffer();

  const webpRes = MediaService.validateImageMagicBytes(validWebpBuffer);
  assert(webpRes.valid === true && webpRes.detectedMime === 'image/webp', 'Valid WebP buffer passes magic bytes check');

  // Disguised executable / shell script
  const maliciousScript = Buffer.from('#!/bin/bash\nrm -rf /');
  const scriptRes = MediaService.validateImageMagicBytes(maliciousScript);
  assert(scriptRes.valid === false, 'Disguised shell script buffer is strictly rejected');

  // Disguised SVG (XSS vector)
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const svgRes = MediaService.validateImageMagicBytes(svgBuffer);
  assert(svgRes.valid === false, 'SVG vector is rejected to eliminate stored XSS risks');

  // Empty / truncated buffer
  const emptyRes = MediaService.validateImageMagicBytes(Buffer.alloc(4));
  assert(emptyRes.valid === false, 'Truncated 4-byte buffer is safely rejected');

  /* ───────────────────────────────────────────────────────────────────────── */
  /* 2. SHARP OPTIMIZATION & DIMENSION CONSTRAINTS                            */
  /* ───────────────────────────────────────────────────────────────────────── */
  console.log('\nTest Group 2: Sharp Image Optimization & Output Quality');

  // Oversized 3000x2000 image
  const oversizedRaw = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 120, g: 80, b: 40 } },
  }).png().toBuffer();

  const menuOptimized = await MediaService.optimizeImage(oversizedRaw, 'menu');
  assert(menuOptimized.format === 'image/webp', 'Menu optimization outputs WebP format');
  assert((menuOptimized.width ?? 0) <= 1200, 'Oversized menu image resized within 1200px width limit', `width: ${menuOptimized.width}`);
  assert((menuOptimized.height ?? 0) <= 1200, 'Oversized menu image resized within 1200px height limit', `height: ${menuOptimized.height}`);
  assert(menuOptimized.buffer.length < oversizedRaw.length, 'Optimized WebP file size is smaller than raw input');

  // Logo optimization (512x512 with transparency)
  const logoRaw = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 193, b: 7, alpha: 0.8 } },
  }).png().toBuffer();

  const logoOptimized = await MediaService.optimizeImage(logoRaw, 'logo');
  assert((logoOptimized.width ?? 0) <= 512, 'Logo resized within 512px limit', `width: ${logoOptimized.width}`);
  const logoMeta = await sharp(logoOptimized.buffer).metadata();
  assert(logoMeta.hasAlpha === true, 'Logo optimization preserves alpha transparency channel');

  /* ───────────────────────────────────────────────────────────────────────── */
  /* 3. SSRF EXTERNAL URL DEFENSE                                              */
  /* ───────────────────────────────────────────────────────────────────────── */
  console.log('\nTest Group 3: SSRF External Image URL Defense');

  // Legitimate HTTPS URL
  const validUrlRes = MediaService.validateExternalUrl('https://images.unsplash.com/photo-1555939594');
  assert(validUrlRes.valid === true, 'Legitimate external HTTPS image URL is accepted');

  // Insecure HTTP URL
  const httpUrlRes = MediaService.validateExternalUrl('http://insecure-cdn.com/dish.jpg');
  assert(httpUrlRes.valid === false, 'Insecure plain HTTP URL is strictly rejected');

  // Localhost / Loopback SSRF
  const localhostRes = MediaService.validateExternalUrl('https://localhost:8080/internal-leak.png');
  assert(localhostRes.valid === false, 'Localhost URL is blocked by SSRF defense');

  const ip127Res = MediaService.validateExternalUrl('https://127.0.0.1:3000/env');
  assert(ip127Res.valid === false, '127.0.0.1 loopback is blocked by SSRF defense');

  // Cloud metadata endpoint SSRF (169.254.169.254)
  const metaIpRes = MediaService.validateExternalUrl('https://169.254.169.254/computeMetadata/v1/');
  assert(metaIpRes.valid === false, 'Cloud metadata IP (169.254.169.254) is blocked by SSRF defense');

  // Private RFC 1918 subnets
  const rfc10Res = MediaService.validateExternalUrl('https://10.0.0.5/secret.png');
  assert(rfc10Res.valid === false, 'Private 10.0.0.0/8 subnet is blocked');

  const rfc192Res = MediaService.validateExternalUrl('https://192.168.1.1/secret.png');
  assert(rfc192Res.valid === false, 'Private 192.168.0.0/16 subnet is blocked');

  /* ───────────────────────────────────────────────────────────────────────── */
  /* 4. RBAC ROLE PERMISSIONS CONTRACT                                         */
  /* ───────────────────────────────────────────────────────────────────────── */
  console.log('\nTest Group 4: RBAC Role & Permission Matrix');

  assert(AuthService.hasPermission('owner', 'restaurant:update'), 'Owner has restaurant:update permission');
  assert(AuthService.hasPermission('manager', 'restaurant:update'), 'Manager has restaurant:update permission for branding');
  assert(!AuthService.hasPermission('server', 'restaurant:update'), 'Server role CANNOT update restaurant settings');
  assert(!AuthService.hasPermission('kitchen', 'restaurant:update'), 'Kitchen role CANNOT update restaurant settings');
  assert(!AuthService.hasPermission('host', 'restaurant:update'), 'Host role CANNOT update restaurant settings');

  assert(AuthService.hasPermission('manager', 'menu:create'), 'Manager can create menu items');
  assert(AuthService.hasPermission('manager', 'menu:update'), 'Manager can update menu items');
  assert(!AuthService.hasPermission('server', 'menu:update'), 'Server cannot modify menu items');

  /* ───────────────────────────────────────────────────────────────────────── */
  /* 5. CATEGORY GATING & IMMUTABLE VERSIONED KEYS                            */
  /* ───────────────────────────────────────────────────────────────────────── */
  console.log('\nTest Group 5: Category Gating & Immutable Versioned Keys');

  // Approved public categories succeed
  const menuKey = MediaService.generateObjectKey('RES_123', 'menu', 'med_001');
  assert(menuKey === 'restaurants/RES_123/menu/med_001.webp', 'Menu category produces expected canonical key', menuKey);

  const logoKey = MediaService.generateObjectKey('RES_123', 'logo', 'med_002');
  assert(logoKey === 'restaurants/RES_123/logo/med_002.webp', 'Logo category produces expected canonical key', logoKey);

  const brandingKey = MediaService.generateObjectKey('RES_123', 'branding', 'med_003');
  assert(brandingKey === 'restaurants/RES_123/branding/med_003.webp', 'Branding category produces expected canonical key', brandingKey);

  // Unapproved categories are strictly rejected
  let payrollRejected = false;
  try {
    MediaService.generateObjectKey('RES_123', 'payroll' as any, 'med_004');
  } catch (e: any) {
    payrollRejected = true;
  }
  assert(payrollRejected === true, 'Private payroll category is strictly rejected from public bucket');

  let sensitiveDocRejected = false;
  try {
    MediaService.generateObjectKey('RES_123', 'tax_records' as any, 'med_005');
  } catch (e: any) {
    sensitiveDocRejected = true;
  }
  assert(sensitiveDocRejected === true, 'Sensitive documents are strictly rejected from public bucket');

  let otherRejected = false;
  try {
    MediaService.generateObjectKey('RES_123', 'other' as any, 'med_006');
  } catch (e: any) {
    otherRejected = true;
  }
  assert(otherRejected === true, 'Arbitrary unclassified media category is rejected from public bucket');

  /* ───────────────────────────────────────────────────────────────────────── */
  /* SUMMARY                                                                   */
  /* ───────────────────────────────────────────────────────────────────────── */
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
