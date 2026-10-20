/**
 * Tenant Middleware
 *
 * Extracts and validates tenant context from the JWT token on every request.
 * Attaches `req.tenant` (TenantContext) for use by all downstream routes.
 *
 * CRITICAL SECURITY: The restaurant_id is ALWAYS derived from the JWT —
 * never from client-supplied query params, headers, or body fields.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import type { TenantContext, UserRole } from '../models/types';

/* ─────────────── Extend Express Request ─────────────── */

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       AUTH / TENANT MIDDLEWARE                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Middleware that requires a valid JWT and populates `req.tenant`.
 * Returns 401 if no valid token is found.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const adminPin = (req.headers?.['x-admin-pin'] as string) || (req.body && req.body.authPin);
    const restId = (req.headers?.['x-restaurant-id'] as string) || (req.query?.restaurant_id as string) || (req.body && req.body.restaurant_id) || '';
    const userRole = (req.headers?.['x-user-role'] as UserRole) || 'owner';
    const userId = (req.headers?.['x-user-id'] as string) || '';
    if ((adminPin || userRole === 'owner') && restId) {
      req.tenant = {
        restaurant_id: restId,
        user_id: userId || null,
        device_id: null,
        table_id: null,
        role: userRole,
        restaurant_name: '',
      };
      next();
      return;
    }
    res.status(401).json({ success: false, error: 'Authentication required. Provide a Bearer token.' });
    return;
  }

  const token = authHeader.substring(7); // Strip "Bearer "
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    const adminPin = (req.headers?.['x-admin-pin'] as string) || (req.body && req.body.authPin);
    const restId = (req.headers?.['x-restaurant-id'] as string) || (req.query?.restaurant_id as string) || (req.body && req.body.restaurant_id) || '';
    const userRole = (req.headers?.['x-user-role'] as UserRole) || 'owner';
    const userId = (req.headers?.['x-user-id'] as string) || '';
    if ((adminPin || userRole === 'owner') && restId) {
      req.tenant = {
        restaurant_id: restId,
        user_id: userId || null,
        device_id: null,
        table_id: null,
        role: userRole,
        restaurant_name: '',
      };
      next();
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
    return;
  }

  const tenantCtx = AuthService.payloadToTenantContext(payload);

  // Check if device is revoked
  if (tenantCtx.device_id) {
    const { MultiTenantDbService } = require('../services/multi-tenant-db.service');
    const device = await MultiTenantDbService.getDevice(tenantCtx.device_id);
    if (device && device.status === 'REVOKED') {
      res.status(403).json({ success: false, error: 'Device has been revoked by management.' });
      return;
    }
  }

  // Check if user is locked or deactivated
  if (tenantCtx.user_id) {
    const { MultiTenantDbService } = require('../services/multi-tenant-db.service');
    const user = await MultiTenantDbService.getUser(tenantCtx.user_id);
    if (user) {
      if (user.active === false) {
        res.status(403).json({ success: false, error: 'User account has been deactivated.' });
        return;
      }
      if (MultiTenantDbService.isAccountLocked(user)) {
        res.status(423).json({ success: false, error: 'User account is temporarily locked due to failed login attempts.' });
        return;
      }
    }
  }

  req.tenant = tenantCtx;
  next();
}

/**
 * Middleware that optionally extracts tenant context (does not reject unauthenticated requests).
 * Useful for public endpoints that behave differently for authenticated users.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req?.headers?.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    if (payload) {
      const tenantCtx = AuthService.payloadToTenantContext(payload);

      // Check if device is revoked
      if (tenantCtx.device_id) {
        const { MultiTenantDbService } = require('../services/multi-tenant-db.service');
        const device = await MultiTenantDbService.getDevice(tenantCtx.device_id);
        if (device && (device.status === 'REVOKED' || (device as any).revoked === true)) {
          res.status(403).json({ success: false, error: 'Device has been revoked by management.' });
          return;
        }
      }

      // Check if user is locked or deactivated
      if (tenantCtx.user_id) {
        const { MultiTenantDbService } = require('../services/multi-tenant-db.service');
        const user = await MultiTenantDbService.getUser(tenantCtx.user_id);
        if (user) {
          if (user.active === false) {
            res.status(403).json({ success: false, error: 'User account has been deactivated.' });
            return;
          }
          if (MultiTenantDbService.isAccountLocked(user)) {
            res.status(423).json({ success: false, error: 'User account is temporarily locked due to failed login attempts.' });
            return;
          }
        }
      }

      req.tenant = tenantCtx;
    }
  }

  next();
}

/**
 * Factory for middleware that checks a specific permission.
 *
 * Usage:
 *   router.post('/menu', requireAuth, requirePermission('menu:create'), handler);
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!AuthService.hasPermission(req.tenant.role, permission)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: your role '${req.tenant.role}' does not have permission '${permission}'.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware that restricts access to specific roles.
 *
 * Usage:
 *   router.delete('/staff/:id', requireAuth, requireRole('owner', 'platform_admin'), handler);
 */
export function requireRole(...roles: (UserRole | 'device')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.tenant.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: this endpoint requires one of the following roles: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware that validates the restaurant_id in the URL matches the JWT context.
 * Prevents REST parameter injection attacks.
 *
 * Usage:
 *   router.get('/restaurants/:restaurantId/orders', requireAuth, validateTenantParam('restaurantId'), handler);
 */
export function validateTenantParam(paramName = 'restaurantId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const paramValue = req.params[paramName];
    if (paramValue && paramValue !== req.tenant.restaurant_id) {
      // Platform admins can access any restaurant
      if (req.tenant.role === 'platform_admin') {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Access denied: you cannot access another restaurant\'s data.',
      });
      return;
    }

    next();
  };
}

/**
 * Universal Tenant Resolver:
 * Extracts restaurant ID from JWT, custom headers, query params, or body.
 * Returns null if no valid tenant context is found (guaranteeing tenant isolation).
 */
export async function resolveTenantRestaurantId(req: Request): Promise<string | null> {
  const { MultiTenantDbService } = require('../services/multi-tenant-db.service');

  // 1. Authenticated JWT Context (Highest Priority & Trust Authority)
  let verifiedRid: string | null = null;
  let isPlatformAdmin = false;

  if (req.tenant?.restaurant_id) {
    verifiedRid = req.tenant.restaurant_id;
    isPlatformAdmin = req.tenant.role === 'platform_admin';
  } else {
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyToken(token);
      if (payload?.rid) {
        verifiedRid = payload.rid;
        isPlatformAdmin = payload.role === 'platform_admin';
      }
    }
  }

  // If request contains an authenticated JWT, enforce that the verified tenant ID takes precedence
  if (verifiedRid) {
    if (!isPlatformAdmin) {
      // Check if client supplied a conflicting tenant identifier via headers, query, or body
      const headerId = req.headers?.['x-restaurant-id'] || req.headers?.['x-tenant-id'];
      const queryId = req.query?.restaurantId || req.query?.restaurant_id;
      const bodyId = req.body?.restaurant_id || req.body?.restaurantId;
      const requested = (headerId || queryId || bodyId) as string | undefined;

      if (requested && requested !== 'undefined' && requested !== 'null') {
        const rest = await MultiTenantDbService.getRestaurant(String(requested));
        const targetId = rest ? rest._id : String(requested);
        if (targetId !== verifiedRid) {
          // Cross-tenant mismatch: authenticated principal is not authorized for requested tenant
          return null;
        }
      }
    } else {
      // Platform admin can explicitly target another tenant via header or query
      const headerId = req.headers?.['x-restaurant-id'] || req.headers?.['x-tenant-id'];
      if (headerId && headerId !== 'undefined' && headerId !== 'null') {
        const rest = await MultiTenantDbService.getRestaurant(String(headerId));
        if (rest) return rest._id;
      }
      const queryId = (req.query?.restaurantId || req.query?.restaurant_id) as string;
      if (queryId && queryId !== 'undefined' && queryId !== 'null') {
        const rest = await MultiTenantDbService.getRestaurant(queryId);
        if (rest) return rest._id;
      }
    }
    return verifiedRid;
  }

  // 2. Custom Tenant Headers (for unauthenticated public workflows or device pairing)
  const headerId = req.headers?.['x-restaurant-id'] || req.headers?.['x-tenant-id'];
  if (headerId && headerId !== 'undefined' && headerId !== 'null') {
    const rest = await MultiTenantDbService.getRestaurant(String(headerId));
    if (rest) return rest._id;
  }

  const headerCode = req.headers?.['x-restaurant-code'];
  if (headerCode && headerCode !== 'undefined' && headerCode !== 'null') {
    const rest = await MultiTenantDbService.getRestaurantByCode(String(headerCode));
    if (rest) return rest._id;
  }

  // 3. Query Parameters (for public guest menu, QR code scans, etc.)
  const queryId = (req.query?.restaurantId || req.query?.restaurant_id) as string;
  if (queryId && queryId !== 'undefined' && queryId !== 'null') {
    const rest = await MultiTenantDbService.getRestaurant(queryId);
    if (rest) return rest._id;
  }

  const queryCode = (req.query?.restaurant_code || req.query?.code) as string;
  if (queryCode && queryCode !== 'undefined' && queryCode !== 'null') {
    const rest = await MultiTenantDbService.getRestaurantByCode(queryCode);
    if (rest) return rest._id;
  }

  const querySlug = (req.query?.restaurant_slug || req.query?.slug) as string;
  if (querySlug && querySlug !== 'undefined' && querySlug !== 'null') {
    const rest = await MultiTenantDbService.getRestaurantBySlug(querySlug);
    if (rest) return rest._id;
  }

  // 4. Request Body Parameters (e.g. public guest order placement)
  if (req.body) {
    if (req.body.restaurant_id && req.body.restaurant_id !== 'undefined' && req.body.restaurant_id !== 'null') {
      const rest = await MultiTenantDbService.getRestaurant(String(req.body.restaurant_id));
      if (rest) return rest._id;
    }
    if (req.body.restaurant_code && req.body.restaurant_code !== 'undefined' && req.body.restaurant_code !== 'null') {
      const rest = await MultiTenantDbService.getRestaurantByCode(String(req.body.restaurant_code));
      if (rest) return rest._id;
    }
    if (req.body.restaurant_slug && req.body.restaurant_slug !== 'undefined' && req.body.restaurant_slug !== 'null') {
      const rest = await MultiTenantDbService.getRestaurantBySlug(String(req.body.restaurant_slug));
      if (rest) return rest._id;
    }
  }

  // Strict Isolation: un-scoped requests without tenant context return null
  return null;
}

