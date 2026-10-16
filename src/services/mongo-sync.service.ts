/**
 * MongoDB Atlas Real-Time Change Stream Synchronization Service
 *
 * Bridges the gap between distributed multi-instance environments (e.g. Render production)
 * and local development instances. Automatically captures all orders, service requests,
 * and table changes committed to MongoDB Atlas from any instance and broadcasts them
 * across local SSE clients in sub-second real time.
 */

import { ChangeStream, Db } from 'mongodb';
import { env } from '../config/env';
import { MultiTenantDbService } from './multi-tenant-db.service';
import { sseService } from './sse.service';
import { mapOrderForClient } from '../routes/orders';

export class MongoSyncService {
  private static isRunning = false;
  private static ordersStream: ChangeStream | null = null;
  private static serviceRequestsStream: ChangeStream | null = null;
  private static tablesStream: ChangeStream | null = null;
  private static reconnectTimeouts: NodeJS.Timeout[] = [];

  /**
   * Start listening to MongoDB Atlas Change Streams
   */
  static async start(): Promise<void> {
    if (this.isRunning) return;
    if (!env.isMongoMode) {
      console.log('ℹ️ [MongoSync] Skipped (not in MongoDB mode)');
      return;
    }

    try {
      const db = await MultiTenantDbService.getDb();
      if (!db) {
        console.warn('⚠️ [MongoSync] Cannot start change streams: Database is not ready');
        return;
      }

      this.isRunning = true;
      console.log('⚡ [MongoSync] Initializing MongoDB Atlas real-time change streams...');

      this.watchOrders(db);
      this.watchServiceRequests(db);
      this.watchTables(db);

      console.log('✅ [MongoSync] MongoDB Atlas cross-instance real-time synchronization active');
    } catch (err: any) {
      console.warn('⚠️ [MongoSync] Error starting change streams:', err.message || err);
    }
  }

  /**
   * Watch Orders Collection
   */
  private static watchOrders(db: Db): void {
    try {
      if (this.ordersStream) {
        try { this.ordersStream.close(); } catch (_) {}
      }

      this.ordersStream = db.collection('orders').watch([], { fullDocument: 'updateLookup' });

      this.ordersStream.on('change', (change: any) => {
        try {
          const opType = change.operationType;

          if (opType === 'insert') {
            const doc = change.fullDocument;
            if (!doc) return;
            const mapped = mapOrderForClient(doc);
            const restId = doc.restaurant_id || doc.restaurantId || 'RES_EED4E9D266DF';

            console.log(`📡 [MongoSync] 🔔 New Order from Atlas: ${mapped.id} (Table: ${mapped.table}, Customer: ${mapped.customerName || 'Guest'})`);

            sseService.broadcast({
              type: 'order_created',
              id: mapped.id,
              orderId: mapped.id,
              restaurant_id: restId,
              order: mapped,
              ...mapped,
            }, restId);

          } else if (opType === 'update' || opType === 'replace') {
            const doc = change.fullDocument;
            if (!doc) return;
            const mapped = mapOrderForClient(doc);
            const restId = doc.restaurant_id || doc.restaurantId || 'RES_EED4E9D266DF';

            console.log(`📡 [MongoSync] 🔄 Order Updated in Atlas: ${mapped.id} (Status: ${mapped.status})`);

            sseService.broadcast({
              type: 'order_updated',
              id: mapped.id,
              orderId: mapped.id,
              restaurant_id: restId,
              order: mapped,
              ...mapped,
            }, restId);

            if (mapped.status === 'fulfilled' || mapped.status === 'completed' || mapped.closedSession) {
              sseService.broadcast({
                type: 'order_fulfilled',
                id: mapped.id,
                orderId: mapped.id,
                restaurant_id: restId,
                order: mapped,
              }, restId);
            }

          } else if (opType === 'delete') {
            const deletedId = change.documentKey?._id;
            console.log(`📡 [MongoSync] 🗑️ Order Deleted in Atlas: ${deletedId}`);
            sseService.broadcast({
              type: 'order_deleted',
              orderId: deletedId,
            });
          }
        } catch (eventErr: any) {
          console.warn('[MongoSync] Error handling order change event:', eventErr.message);
        }
      });

      this.ordersStream.on('error', (err: any) => {
        console.warn('⚠️ [MongoSync] Orders change stream error, reconnecting in 5s:', err.message);
        this.scheduleReconnect(() => this.watchOrders(db));
      });

      this.ordersStream.on('close', () => {
        if (this.isRunning) {
          console.warn('⚠️ [MongoSync] Orders change stream closed, reconnecting in 5s');
          this.scheduleReconnect(() => this.watchOrders(db));
        }
      });

    } catch (err: any) {
      console.warn('⚠️ [MongoSync] Failed to initialize orders watch stream:', err.message);
      this.scheduleReconnect(() => this.watchOrders(db));
    }
  }

  /**
   * Watch Service Requests Collection (Coal refills, Waiter calls)
   */
  private static watchServiceRequests(db: Db): void {
    try {
      if (this.serviceRequestsStream) {
        try { this.serviceRequestsStream.close(); } catch (_) {}
      }

      this.serviceRequestsStream = db.collection('service_requests').watch([], { fullDocument: 'updateLookup' });

      this.serviceRequestsStream.on('change', (change: any) => {
        try {
          const opType = change.operationType;
          const doc = change.fullDocument;
          if (!doc) return;

          const restId = doc.restaurant_id || doc.restaurantId || 'RES_EED4E9D266DF';
          const isCoal = doc.type === 'COAL_REFILL' || doc.request_type === 'COAL_REFILL';

          if (opType === 'insert') {
            console.log(`📡 [MongoSync] 🔔 Service Request from Atlas: ${doc._id} (Type: ${doc.type || doc.request_type})`);
            if (isCoal) {
              sseService.broadcast({
                type: 'coal_refill_request',
                station: 'hookah_maker',
                request: doc,
              }, restId);
              sseService.broadcast({
                type: 'server_call',
                station: 'hookah_maker',
                request: doc,
              }, restId);
            } else {
              sseService.broadcast({
                type: 'server_request',
                id: doc._id,
                request: doc,
                ...doc,
              }, restId);
            }
          } else if (opType === 'update' || opType === 'replace') {
            console.log(`📡 [MongoSync] 🔄 Service Request Updated in Atlas: ${doc._id} (Status: ${doc.status})`);
            if (isCoal) {
              sseService.broadcast({
                type: 'coal_refill_updated',
                station: 'hookah_maker',
                requestId: doc._id,
                status: doc.status,
              }, restId);
            } else {
              sseService.broadcast({
                type: 'server_call_updated',
                requestId: doc._id,
                status: doc.status,
              }, restId);
            }
          }
        } catch (err: any) {
          console.warn('[MongoSync] Error handling service_request change event:', err.message);
        }
      });

      this.serviceRequestsStream.on('error', (err: any) => {
        console.warn('⚠️ [MongoSync] Service requests stream error, reconnecting in 5s:', err.message);
        this.scheduleReconnect(() => this.watchServiceRequests(db));
      });

    } catch (err: any) {
      console.warn('⚠️ [MongoSync] Failed to initialize service requests watch stream:', err.message);
      this.scheduleReconnect(() => this.watchServiceRequests(db));
    }
  }

  /**
   * Watch Tables Collection
   */
  private static watchTables(db: Db): void {
    try {
      if (this.tablesStream) {
        try { this.tablesStream.close(); } catch (_) {}
      }

      this.tablesStream = db.collection('tables').watch([], { fullDocument: 'updateLookup' });

      this.tablesStream.on('change', (change: any) => {
        try {
          const doc = change.fullDocument;
          if (!doc) return;
          const restId = doc.restaurant_id || doc.restaurantId || 'RES_EED4E9D266DF';
          sseService.broadcast({
            type: 'table_updated',
            table: doc,
          }, restId);
        } catch (err: any) {
          console.warn('[MongoSync] Error handling table change event:', err.message);
        }
      });

      this.tablesStream.on('error', (err: any) => {
        console.warn('⚠️ [MongoSync] Tables stream error, reconnecting in 5s:', err.message);
        this.scheduleReconnect(() => this.watchTables(db));
      });

    } catch (err: any) {
      console.warn('⚠️ [MongoSync] Failed to initialize tables watch stream:', err.message);
      this.scheduleReconnect(() => this.watchTables(db));
    }
  }

  private static scheduleReconnect(fn: () => void): void {
    if (!this.isRunning) return;
    const t = setTimeout(() => {
      if (this.isRunning) fn();
    }, 5000);
    this.reconnectTimeouts.push(t);
  }

  /**
   * Cleanly stop all change streams
   */
  static stop(): void {
    this.isRunning = false;
    this.reconnectTimeouts.forEach(clearTimeout);
    this.reconnectTimeouts = [];
    try { if (this.ordersStream) this.ordersStream.close(); } catch (_) {}
    try { if (this.serviceRequestsStream) this.serviceRequestsStream.close(); } catch (_) {}
    try { if (this.tablesStream) this.tablesStream.close(); } catch (_) {}
    this.ordersStream = null;
    this.serviceRequestsStream = null;
    this.tablesStream = null;
    console.log('🛑 [MongoSync] MongoDB change streams stopped');
  }
}
