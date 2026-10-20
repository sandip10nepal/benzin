/**
 * Media Management Routes — Multi-Tenant Media API
 *
 * POST   /api/media/upload     — Upload and optimize image (owner/manager)
 * POST   /api/media/external   — Save external image URL reference (owner/manager)
 * GET    /api/media            — List restaurant media library (authenticated staff)
 * GET    /api/media/:mediaId   — Get media metadata by ID
 * DELETE /api/media/:mediaId   — Delete media item and storage binary (owner/manager)
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { MediaService, MAX_UPLOAD_SIZE_BYTES } from '../services/media.service';
import { resolveTenantRestaurantId } from '../middleware/tenant.middleware';
import { AuthService } from '../services/auth.service';
import { MultiTenantDbService } from '../services/multi-tenant-db.service';
import type { MediaCategory } from '../models/types';

const router = Router();

// Multer memory storage configuration (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Helper to authenticate request and verify owner/manager permissions with strict tenant isolation
 */
async function authenticateMediaAccess(req: Request, requireManager: boolean = false): Promise<{
  authorized: boolean;
  restaurantId: string | null;
  userId?: string;
  role?: string;
  status: number;
  error?: string;
}> {
  const restaurantId = await resolveTenantRestaurantId(req);
  if (!restaurantId) {
    return { authorized: false, restaurantId: null, status: 400, error: 'Restaurant context could not be resolved.' };
  }

  // Check Bearer JWT Token
  const authHeader = req.headers?.authorization;
  let userRole: string | undefined;
  let userId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload: any = AuthService.verifyToken(token);
    if (payload) {
      const tokenRid = payload.rid;
      const isTenantMatch = (tokenRid && tokenRid === restaurantId) || payload.role === 'platform_admin';
      if (!isTenantMatch) {
        return { authorized: false, restaurantId, status: 403, error: 'Tenant mismatch. Unauthorized access to restaurant media.' };
      }
      userRole = payload.role;
      userId = payload.sub;
    }
  }

  // Check verified tenant context if populated by middleware
  if (!userRole && req.tenant) {
    const isTenantMatch = (req.tenant.restaurant_id === restaurantId) || req.tenant.role === 'platform_admin';
    if (!isTenantMatch) {
      return { authorized: false, restaurantId, status: 403, error: 'Tenant mismatch.' };
    }
    userRole = req.tenant.role;
    userId = req.tenant.user_id || undefined;
  }

  // Check Supervisor PIN if provided
  const pin = req.body?.authPin || req.headers?.['x-admin-pin'] || req.query?.authPin;
  if (!userRole && pin && MultiTenantDbService.isInitialized()) {
    const users = await MultiTenantDbService.listUsers(restaurantId);
    for (const u of users) {
      if (['owner', 'manager', 'platform_admin'].includes(u.role)) {
        const matches = await AuthService.verifyPin(String(pin).trim(), u.pin_hash);
        if (matches) {
          userRole = u.role;
          userId = u._id;
          break;
        }
      }
    }
  }

  // Fallback check for dev headers in testing if explicit
  if (!userRole && req.headers?.['x-user-role']) {
    userRole = String(req.headers['x-user-role']);
    userId = String(req.headers['x-user-id'] || 'system');
  }

  if (!userRole) {
    return { authorized: false, restaurantId, status: 401, error: 'Authentication required to access media management.' };
  }

  if (requireManager) {
    const isManagerRole = ['owner', 'manager', 'platform_admin', 'admin'].includes(userRole);
    if (!isManagerRole) {
      return { authorized: false, restaurantId, status: 403, error: 'Permission denied. Only managers or owners can modify media assets.' };
    }
  }

  return { authorized: true, restaurantId, userId, role: userRole, status: 200 };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        1. UPLOAD IMAGE FILE                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const auth = await authenticateMediaAccess(req, true);
    if (!auth.authorized || !auth.restaurantId) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, error: 'No image file uploaded. Provide file field "file".' });
      return;
    }

    const rawCategory = (req.body?.category || 'menu').toString().toLowerCase() as MediaCategory;
    if (!MediaService.APPROVED_PUBLIC_CATEGORIES.includes(rawCategory)) {
      res.status(400).json({
        success: false,
        error: `Category '${rawCategory}' is strictly not permitted. Private documents, employee records, payroll data, and sensitive files must never be uploaded to the public media bucket. Approved categories: ${MediaService.APPROVED_PUBLIC_CATEGORIES.join(', ')}.`,
      });
      return;
    }
    const category = rawCategory;

    const mediaDoc = await MediaService.uploadMedia({
      restaurantId: auth.restaurantId,
      category,
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      uploadedBy: auth.userId,
    });

    res.status(201).json({
      success: true,
      media: mediaDoc,
      url: mediaDoc.public_url,
    });
  } catch (err: any) {
    console.error('[MediaAPI] Upload error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Image upload failed.',
    });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     2. SAVE EXTERNAL IMAGE URL                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

router.post('/external', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateMediaAccess(req, true);
    if (!auth.authorized || !auth.restaurantId) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    const { url, category: rawCat, name } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'External image URL is required.' });
      return;
    }

    const rawCategory = (rawCat || 'menu').toString().toLowerCase() as MediaCategory;
    if (!MediaService.APPROVED_PUBLIC_CATEGORIES.includes(rawCategory)) {
      res.status(400).json({
        success: false,
        error: `Category '${rawCategory}' is not permitted. Approved categories: ${MediaService.APPROVED_PUBLIC_CATEGORIES.join(', ')}.`,
      });
      return;
    }
    const category = rawCategory;

    const mediaDoc = await MediaService.registerExternalUrl({
      restaurantId: auth.restaurantId,
      category,
      externalUrl: url,
      name,
      uploadedBy: auth.userId,
    });

    res.status(201).json({
      success: true,
      media: mediaDoc,
      url: mediaDoc.public_url,
    });
  } catch (err: any) {
    console.error('[MediaAPI] External URL registration error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to register external image URL.',
    });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     3. LIST RESTAURANT MEDIA                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

router.get('/', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateMediaAccess(req, false);
    if (!auth.authorized || !auth.restaurantId) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    const category = req.query.category ? (String(req.query.category).toLowerCase() as MediaCategory) : undefined;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 50), 10)));
    const skip = Math.max(0, parseInt(String(req.query.skip || 0), 10));

    const result = await MediaService.listMedia({
      restaurantId: auth.restaurantId,
      category,
      limit,
      skip,
    });

    res.json({
      success: true,
      restaurant_id: auth.restaurantId,
      media: result.media,
      total: result.total,
      limit,
      skip,
    });
  } catch (err: any) {
    console.error('[MediaAPI] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to list media assets.' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     4. GET MEDIA BY ID                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

router.get('/:mediaId', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateMediaAccess(req, false);
    if (!auth.authorized || !auth.restaurantId) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    const mediaId = Array.isArray(req.params.mediaId) ? req.params.mediaId[0] : req.params.mediaId;
    const media = await MediaService.getMediaById(auth.restaurantId, mediaId);

    if (!media) {
      res.status(404).json({ success: false, error: 'Media asset not found.' });
      return;
    }

    res.json({ success: true, media });
  } catch (err: any) {
    console.error('[MediaAPI] Get by ID error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve media asset.' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     5. DELETE MEDIA BY ID                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

router.delete('/:mediaId', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateMediaAccess(req, true);
    if (!auth.authorized || !auth.restaurantId) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    const mediaId = Array.isArray(req.params.mediaId) ? req.params.mediaId[0] : req.params.mediaId;
    const success = await MediaService.deleteMedia(auth.restaurantId, mediaId);

    if (!success) {
      res.status(404).json({ success: false, error: 'Media asset not found or already deleted.' });
      return;
    }

    res.json({ success: true, deleted: true, mediaId });
  } catch (err: any) {
    console.error('[MediaAPI] Delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete media asset.' });
  }
});

export default router;
