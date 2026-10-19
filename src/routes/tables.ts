import { Router, Request, Response } from 'express';
import { MultiTenantDbService } from '../services/multi-tenant-db.service';
import { OrderRepository } from '../modules/orders/order.repository';
import { sseService } from '../services/sse.service';
import { AuthService } from '../services/auth.service';
import { resolveTenantRestaurantId } from '../middleware/tenant.middleware';

const router = Router();

// Helper to check manager role permissions via verified JWT or supervisor PIN
async function isManagerOrAdmin(req: Request): Promise<boolean> {
  const restaurantId = await resolveTenantRestaurantId(req);

  // 1. Verify Cryptographic Bearer JWT Token
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload: any = AuthService.verifyToken(token);
    if (payload) {
      const tokenRid = payload.rid;
      const isTenantMatch = (tokenRid && restaurantId && tokenRid === restaurantId) || payload.role === 'platform_admin';
      if (isTenantMatch && ['owner', 'manager', 'platform_admin', 'admin'].includes(payload.role)) {
        if (payload.sub && MultiTenantDbService.isInitialized()) {
          const user: any = await MultiTenantDbService.getUser(String(payload.sub));
          if (user && (user.active === false || MultiTenantDbService.isAccountLocked(user))) {
            return false;
          }
        }
        return true;
      }
    }
  }

  // 2. Check verified tenant context
  if (req.tenant) {
    const tRole = req.tenant.role;
    const tRid = req.tenant.restaurant_id;
    const isTenantMatch = (tRid && restaurantId && tRid === restaurantId) || tRole === 'platform_admin';
    if (isTenantMatch && ['owner', 'manager', 'platform_admin', 'admin'].includes(tRole)) {
      return true;
    }
  }

  // 3. Manager/Owner PIN Verification (supervisor override on POS terminals)
  const pin = req.body?.authPin || req.body?.pin || req.headers?.['x-admin-pin'] || req.query?.authPin;
  if (pin && restaurantId && MultiTenantDbService.isInitialized()) {
    const pinStr = String(pin).trim();
    if (pinStr.length > 0) {
      const users = await MultiTenantDbService.listUsers(restaurantId);
      for (const u of users) {
        if (u.active !== false && !MultiTenantDbService.isAccountLocked(u)) {
          if (['owner', 'manager', 'platform_admin', 'admin'].includes(u.role) && AuthService.verifyPin(pinStr, u.pin_hash)) {
            return true;
          }
        }
      }
    }
  }

  // Strictly reject unauthenticated calls (NO permissive fallback if role is missing)
  return false;
}

// Natural sort helper for tables
export function sortTablesNaturally(a: any, b: any): number {
  const getSortKey = (item: any) => {
    const raw = String(item.label || item.table_label || item.table_number || item.number || '').trim();
    const clean = raw.replace(/^table[\s-_]*/i, '').replace(/^tbl[\s-_]*/i, '').trim();
    
    // 1. Pure numeric tables: 1, 2, 3 ... 21
    const numMatch = clean.match(/^(\d+)$/);
    if (numMatch) {
      return { type: 1, section: '', num: parseInt(numMatch[1], 10), raw: clean };
    }
    
    // 2. Alphanumeric section tables like P1, P2, VIP1
    const alphaNumMatch = clean.match(/^([a-zA-Z\s_-]+?)(\d+)$/);
    if (alphaNumMatch) {
      const section = alphaNumMatch[1].replace(/[\s-_]+$/, '').toUpperCase();
      return { type: 2, section, num: parseInt(alphaNumMatch[2], 10), raw: clean };
    }
    
    // 3. Other named tables
    return { type: 3, section: clean.toUpperCase(), num: 0, raw: clean };
  };

  const keyA = getSortKey(a);
  const keyB = getSortKey(b);

  if (keyA.type !== keyB.type) {
    return keyA.type - keyB.type;
  }

  if (keyA.type === 1) {
    return keyA.num - keyB.num;
  }

  if (keyA.type === 2) {
    if (keyA.section !== keyB.section) {
      return keyA.section.localeCompare(keyB.section);
    }
    return keyA.num - keyB.num;
  }

  return keyA.raw.localeCompare(keyB.raw, undefined, { numeric: true, sensitivity: 'base' });
}

// GET /api/tables
// Returns all floor tables for the restaurant
router.get('/', async (req: Request, res: Response) => {
  try {
    const restaurantId = await resolveTenantRestaurantId(req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Tenant restaurant ID is required' });
    }
    const tables = await MultiTenantDbService.listTables(restaurantId);
    // Sort tables naturally: 1-21, then P1-P8, etc.
    tables.sort(sortTablesNaturally);
    return res.status(200).json({
      success: true,
      restaurant_id: restaurantId,
      tables
    });
  } catch (err: any) {
    console.error('Error listing tables:', err);
    return res.status(500).json({ success: false, message: 'Failed to list tables: ' + err.message });
  }
});

// POST /api/tables
// Adds a new floor table (supports numeric like "15" and alphanumeric like "P1", "P2", "VIP1")
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!(await isManagerOrAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Manager or owner role required to add tables' });
    }

    const restaurantId = await resolveTenantRestaurantId(req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Tenant restaurant ID is required' });
    }

    const existingTables = await MultiTenantDbService.listTables(restaurantId);

    const rawNumStr = String(req.body.number || '').trim();
    const rawLabelStr = String(req.body.label || '').trim();

    // Check if input represents a Patio table like "P1", "P2" or "Patio 1"
    const pMatch = rawNumStr.match(/^p(\d+)$/i) || 
                   rawLabelStr.match(/^p(\d+)$/i) || 
                   rawNumStr.match(/^patio[\s-_]*(\d+)$/i) || 
                   rawLabelStr.match(/^patio[\s-_]*(\d+)$/i);

    let number = 0;
    let label = '';

    if (pMatch) {
      const pIdx = parseInt(pMatch[1], 10);
      label = rawLabelStr && !/^p\d+$/i.test(rawLabelStr) ? rawLabelStr : `P${pIdx}`;
      number = 100 + pIdx;
    } else {
      const parsedNum = parseInt(rawNumStr, 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        number = parsedNum;
      } else {
        const maxNum = existingTables.reduce((max, t) => Math.max(max, t.number || 0), 0);
        number = maxNum + 1;
      }
      label = rawLabelStr || (rawNumStr && isNaN(parseInt(rawNumStr, 10)) ? rawNumStr : `Table ${number}`);
    }

    const capacity = parseInt(String(req.body.capacity), 10) || 4;

    // Check for duplicate number or label
    const duplicate = existingTables.find(t => 
      t.number === number || 
      (t.label && t.label.trim().toLowerCase() === label.trim().toLowerCase())
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `A table with number "${number}" or name "${label}" already exists.`
      });
    }

    const newTable = await MultiTenantDbService.createTable({
      restaurant_id: restaurantId,
      number,
      label,
      capacity,
      active: true,
    });

    sseService.broadcast({
      type: 'table_created',
      restaurant_id: restaurantId,
      table: newTable
    });

    return res.status(201).json({
      success: true,
      message: `${newTable.label} created successfully`,
      table: newTable
    });
  } catch (err: any) {
    console.error('Error creating table:', err);
    return res.status(500).json({ success: false, message: 'Failed to create table: ' + err.message });
  }
});

// PUT /api/tables/:id
// Updates an existing floor table's details (number, label, capacity, active)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!(await isManagerOrAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Manager or owner role required to edit tables' });
    }

    const restaurantId = await resolveTenantRestaurantId(req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Tenant restaurant ID is required' });
    }

    const tableId = String(req.params.id);

    const existing = await MultiTenantDbService.getTable(tableId, restaurantId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const updates: any = {};
    const rawNumStr = req.body.number !== undefined ? String(req.body.number).trim() : '';
    const rawLabelStr = req.body.label !== undefined ? String(req.body.label).trim() : '';

    if (rawNumStr || rawLabelStr) {
      const pMatch = rawNumStr.match(/^p(\d+)$/i) || 
                     rawLabelStr.match(/^p(\d+)$/i) || 
                     rawNumStr.match(/^patio[\s-_]*(\d+)$/i) || 
                     rawLabelStr.match(/^patio[\s-_]*(\d+)$/i);

      if (pMatch) {
        const pIdx = parseInt(pMatch[1], 10);
        updates.label = rawLabelStr && !/^p\d+$/i.test(rawLabelStr) ? rawLabelStr : `P${pIdx}`;
        updates.number = 100 + pIdx;
      } else {
        if (rawNumStr) {
          const num = parseInt(rawNumStr, 10);
          if (!isNaN(num) && num > 0) updates.number = num;
        }
        if (rawLabelStr) {
          updates.label = rawLabelStr;
        }
      }
    }

    if (req.body.capacity !== undefined) {
      const cap = parseInt(String(req.body.capacity), 10);
      if (!isNaN(cap) && cap > 0) updates.capacity = cap;
    }
    if (req.body.active !== undefined) {
      updates.active = Boolean(req.body.active);
    }

    // Check duplicate if number or label changed
    if (updates.number || updates.label) {
      const allTables = await MultiTenantDbService.listTables(restaurantId);
      const conflict = allTables.find(t => 
        t._id !== tableId && (
          (updates.number && t.number === updates.number) ||
          (updates.label && t.label && t.label.trim().toLowerCase() === updates.label.trim().toLowerCase())
        )
      );
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Another table already uses number ${updates.number || existing.number} or name "${updates.label || existing.label}".`
        });
      }
    }

    const updatedTable = await MultiTenantDbService.updateTable(tableId, restaurantId, updates);

    sseService.broadcast({
      type: 'table_updated',
      restaurant_id: restaurantId,
      table: updatedTable
    });

    return res.status(200).json({
      success: true,
      message: `${updatedTable?.label || 'Table'} updated successfully`,
      table: updatedTable
    });
  } catch (err: any) {
    console.error('Error updating table:', err);
    return res.status(500).json({ success: false, message: 'Failed to update table: ' + err.message });
  }
});

// DELETE /api/tables/:id
// Removes a floor table
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!(await isManagerOrAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Manager or owner role required to delete tables' });
    }

    const restaurantId = await resolveTenantRestaurantId(req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Tenant restaurant ID is required' });
    }

    const tableId = String(req.params.id);

    const table = await MultiTenantDbService.getTable(tableId, restaurantId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    // Safety check: Prevent deletion if this table currently has an active order
    const orders = await OrderRepository.listByRestaurant(restaurantId);
    const hasActiveOrder = orders.some((o: any) => {
      const isClosed = o.status === 'fulfilled' || o.status === 'completed' || o.closedSession;
      if (isClosed) return false;
      const orderTbl = String(o.table || o.table_id || '').toLowerCase();
      const matchId = o.table_id === table._id;
      const matchLabel = table.label && orderTbl === table.label.toLowerCase();
      const matchNum = orderTbl === String(table.number) || orderTbl === `table ${table.number}`;
      return matchId || matchLabel || matchNum;
    });

    if (hasActiveOrder) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove "${table.label}" because it currently has an active order. Please complete or reset the table order first.`
      });
    }

    const deleted = await MultiTenantDbService.deleteTable(tableId, restaurantId);
    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete table from database' });
    }

    sseService.broadcast({
      type: 'table_deleted',
      restaurant_id: restaurantId,
      table_id: tableId,
      label: table.label
    });

    return res.status(200).json({ success: true, message: `Table "${table.label}" deleted` });
  } catch (err: any) {
    console.error('Error deleting table:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete table: ' + err.message });
  }
});

// POST /api/tables/:id/reset
// Resets a floor table to Available state after guests get up / order is served
router.post('/:id/reset', async (req: Request, res: Response) => {
  try {
    const restaurantId = await resolveTenantRestaurantId(req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Tenant restaurant ID is required' });
    }

    const tableId = String(req.params.id);
    const table = await MultiTenantDbService.getTable(tableId, restaurantId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    // Find and close any active orders for this table
    const orders = await OrderRepository.listByRestaurant(restaurantId);
    let resetCount = 0;
    for (const o of orders) {
      const isClosed = o.status === 'fulfilled' || o.status === 'completed' || o.closedSession;
      const orderTbl = String(o.table || o.table_id || '').toLowerCase();
      const matchId = o.table_id === table._id;
      const matchLabel = table.label && orderTbl === table.label.toLowerCase();
      const matchNum = orderTbl === String(table.number) || orderTbl === `table ${table.number}`;

      if (!isClosed && (matchId || matchLabel || matchNum)) {
        await MultiTenantDbService.updateOrderStatus(o._id, restaurantId, 'completed', {
          closedSession: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
        resetCount++;

        sseService.broadcast({
          type: 'table_reset',
          orderId: o._id,
          table: o.table || table.label,
          table_id: table._id,
        }, restaurantId);
      }
    }

    // Broadcast table state change
    sseService.broadcast({
      type: 'table_reset',
      table_id: table._id,
      table: table.label,
      restaurant_id: restaurantId,
    }, restaurantId);

    return res.status(200).json({
      success: true,
      message: `Table "${table.label}" has been reset to Available.`,
      table_id: tableId,
      orders_closed: resetCount,
    });
  } catch (err: any) {
    console.error('Error resetting table:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset table: ' + err.message });
  }
});

export default router;
