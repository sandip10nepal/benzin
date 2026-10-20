import fs from 'fs';
import path from 'path';
import type { Db } from 'mongodb';
import { env } from '../../config/env';
import { MultiTenantDbService } from '../../services/multi-tenant-db.service';
import { sseService } from '../../services/sse.service';
import { VibeQuestEngine } from './vibe-quest.engine';
import {
  VibeQuestConfig,
  VibeQuestRestaurantSettings,
  VibeQuestValidationResult,
  VibeQuestQuestion,
  VibeQuestConfigSettings,
} from './vibe-quest.types';

export class VibeQuestService {
  private static async getDb(): Promise<Db | null> {
    if (env.isMongoMode) {
      try {
        return await MultiTenantDbService.ensureReady();
      } catch (err) {
        console.warn('[VibeQuestService] MongoDB not ready:', err);
        return null;
      }
    }
    return MultiTenantDbService.getDb();
  }

  /**
   * Resolve canonical restaurant _id.
   */
  static async resolveRestaurantId(restaurantId: string): Promise<string> {
    if (!restaurantId) return '';
    try {
      const rest = await MultiTenantDbService.getRestaurant(restaurantId);
      return rest?._id || restaurantId;
    } catch {
      return restaurantId;
    }
  }

  /**
   * Retrieve the full Vibe Quest settings for admin (including draft & published).
   */
  static async getSettings(restaurantId: string): Promise<VibeQuestRestaurantSettings | null> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const rest = await MultiTenantDbService.getRestaurant(canonicalId);
    return ((rest?.settings as any)?.vibe_quest as VibeQuestRestaurantSettings) || null;
  }

  /**
   * Retrieve only the published configuration for the public customer client.
   */
  static async getPublishedConfig(restaurantId: string): Promise<VibeQuestConfig | null> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const rest = await MultiTenantDbService.getRestaurant(canonicalId);
    const vq = (rest?.settings as any)?.vibe_quest as VibeQuestRestaurantSettings | undefined;
    if (!vq || vq.enabled === false) {
      return null;
    }
    return vq.published || vq.draft || null;
  }

  /**
   * Save or update configuration (atomically updates draft and published to keep them synchronized).
   */
  static async updateDraft(restaurantId: string, draft: VibeQuestConfig): Promise<boolean> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const now = new Date().toISOString();
    draft.updated_at = now;

    const existingSettings = await this.getSettings(canonicalId);
    const nextVersion = (existingSettings?.published_version || existingSettings?.draft?.version || 1) + 1;
    draft.version = nextVersion;

    const publishedConfig: VibeQuestConfig = {
      ...draft,
      version: nextVersion,
      enabled: true,
      published_at: now,
    };

    const rest = await MultiTenantDbService.getRestaurant(canonicalId);
    const currentSettings = (rest?.settings as any) || {};
    const updatedVibeQuest = {
      ...currentSettings.vibe_quest,
      enabled: true,
      published_version: nextVersion,
      draft,
      published: publishedConfig,
      updated_at: now,
      published_at: now,
    };

    await MultiTenantDbService.updateRestaurant(canonicalId, {
      settings: {
        ...currentSettings,
        vibe_quest: updatedVibeQuest,
      } as any,
    });

    // Broadcast SSE update
    try {
      sseService.broadcast(
        {
          type: 'vibe_quest_updated',
          version: nextVersion,
          restaurant_id: canonicalId,
        },
        canonicalId
      );
    } catch (_) {}

    return true;
  }

  /**
   * Dedicated method to save questions directly and immediately publish for a restaurant.
   */
  static async saveQuestions(
    restaurantId: string,
    questions: VibeQuestQuestion[],
    customSettings?: Partial<VibeQuestConfigSettings>
  ): Promise<{ success: boolean; version: number; config: VibeQuestConfig }> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const existingSettings = await this.getSettings(canonicalId);
    const currentVersion = existingSettings?.published_version || existingSettings?.draft?.version || 1;
    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    const sanitizedQuestions: VibeQuestQuestion[] = (questions || []).map((q, idx) => {
      let stage = q.stage;
      let repeatPolicy = q.repeat_policy || 'show_once';
      if (q.navigation_trigger === 'start_order') {
        stage = 'hookah';
      } else if (q.navigation_trigger === 'next_food') {
        stage = 'food';
      } else if (q.navigation_trigger === 'next_drinks') {
        stage = 'drinks';
      } else if (q.navigation_trigger === 'cart_dessert' || q.id === 'q_dessert_reminder') {
        stage = 'dessert';
        repeatPolicy = 'cart_conditional';
      } else if (q.navigation_trigger === 'cart_drinks') {
        stage = 'drinks';
        repeatPolicy = 'cart_conditional';
      }

      return {
        id: q.id || `q_${q.navigation_trigger || stage || idx}`,
        stage: stage || 'hookah',
        navigation_trigger: q.navigation_trigger,
        title: q.title || q.question_text || 'Question',
        question_text: q.question_text || q.title || '',
        subtitle: (q.subtitle || q.helper_text || q.description || '').trim(),
        helper_text: (q.helper_text || q.subtitle || q.description || '').trim(),
        description: (q.description || q.subtitle || q.helper_text || '').trim(),
        active: q.active !== false,
        sort_order: typeof q.sort_order === 'number' ? q.sort_order : idx,
        type: q.type || 'single_select',
        required: q.required ?? false,
        skippable: q.skippable ?? true,
        repeat_policy: repeatPolicy,
        curated_product_ids: Array.isArray(q.curated_product_ids) ? q.curated_product_ids : (q.pinned_product_ids || []),
        pinned_product_ids: Array.isArray(q.pinned_product_ids) ? q.pinned_product_ids : (q.curated_product_ids || []),
        answers: (q.answers || []).map((ans, aIdx) => ({
          id: ans.id || `ans_${idx}_${aIdx}`,
          label: ans.label || '',
          emoji: ans.emoji || (ans as any).icon || '',
          host_reply: (ans.host_reply || ans.reaction_message || '').trim(),
          reaction_message: (ans.reaction_message || ans.host_reply || '').trim(),
          destination: ans.destination || '',
          active: ans.active !== false,
          sort_order: typeof ans.sort_order === 'number' ? ans.sort_order : aIdx,
          curated_product_ids: Array.isArray(ans.curated_product_ids) ? ans.curated_product_ids : (q.curated_product_ids || []),
          pinned_product_ids: Array.isArray(ans.pinned_product_ids) ? ans.pinned_product_ids : (q.pinned_product_ids || []),
        })),
      };
    });

    const isHookahActive = sanitizedQuestions.some(
      (q) => (q.navigation_trigger === 'start_order' || q.stage === 'hookah') && q.active !== false
    );

    const dessertQ = sanitizedQuestions.find(
      (q) => q.navigation_trigger === 'cart_dessert' || q.id === 'q_dessert_reminder' || q.stage === 'dessert'
    );
    const dessertBrowseAns = dessertQ?.answers?.find((a) => a.destination && a.destination !== 'skip');
    const dessertDest = (dessertBrowseAns?.destination || customSettings?.dessert_destination_category || 'CAT_DESSERTS').replace(/^category:/, '');

    const drinkCartQ = sanitizedQuestions.find(
      (q) => q.navigation_trigger === 'cart_drinks' || (q.repeat_policy === 'cart_conditional' && q.stage === 'drinks') || q.id === 'q_drink_cart_reminder'
    );
    const drinkBrowseAns = drinkCartQ?.answers?.find((a) => a.destination && a.destination !== 'skip');
    const drinkDest = (drinkBrowseAns?.destination || customSettings?.drink_destination_category || 'cat_super_drinks').replace(/^category:/, '');

    const mergedSettings: VibeQuestConfigSettings = {
      ...(existingSettings?.draft?.settings || {}),
      ...(existingSettings?.published?.settings || {}),
      ...(customSettings || {}),
      hookah_selection_screen_enabled: isHookahActive,
      dessert_category_ids: ['CAT_DESSERTS'],
      dessert_reminder_enabled: dessertQ ? dessertQ.active !== false : (customSettings?.dessert_reminder_enabled ?? true),
      dessert_reminder_text: dessertQ?.question_text || customSettings?.dessert_reminder_text || 'Should we save room for something sweet? 🍰',
      dessert_reminder_subtitle: dessertQ?.subtitle || customSettings?.dessert_reminder_subtitle || '',
      dessert_destination_category: dessertDest,
      dessert_featured_product_ids: dessertQ?.curated_product_ids || customSettings?.dessert_featured_product_ids || [],
      drink_reminder_enabled: drinkCartQ ? drinkCartQ.active !== false : (customSettings?.drink_reminder_enabled ?? true),
      drink_reminder_text: drinkCartQ?.question_text || customSettings?.drink_reminder_text || 'Would you like something to drink? 🥤',
      drink_reminder_subtitle: drinkCartQ?.subtitle || customSettings?.drink_reminder_subtitle || '',
      drink_destination_category: drinkDest,
      drink_featured_product_ids: drinkCartQ?.curated_product_ids || customSettings?.drink_featured_product_ids || [],
    };

    const newConfig: VibeQuestConfig = {
      version: nextVersion,
      enabled: true,
      questions: sanitizedQuestions,
      settings: mergedSettings,
      updated_at: now,
      published_at: now,
    };

    const rest = await MultiTenantDbService.getRestaurant(canonicalId);
    const currentSettings = (rest?.settings as any) || {};
    await MultiTenantDbService.updateRestaurant(canonicalId, {
      settings: {
        ...currentSettings,
        vibe_quest: {
          ...currentSettings.vibe_quest,
          enabled: true,
          published_version: nextVersion,
          published: newConfig,
          draft: newConfig,
          published_at: now,
          updated_at: now,
        },
      } as any,
    });

    try {
      sseService.broadcast(
        {
          type: 'vibe_quest_updated',
          version: nextVersion,
          restaurant_id: canonicalId,
        },
        canonicalId
      );
    } catch (_) {}

    try {
      const localPath = path.join(__dirname, '../../../multi_tenant_db.json');
      if (fs.existsSync(localPath)) {
        const fileContent = JSON.parse(fs.readFileSync(localPath, 'utf8'));
        if (fileContent.restaurants) {
          const rKey = Object.keys(fileContent.restaurants).find((k) => {
            const r = fileContent.restaurants[k];
            return r._id === canonicalId || r.id === canonicalId;
          });
          if (rKey) {
            if (!fileContent.restaurants[rKey].settings) {
              fileContent.restaurants[rKey].settings = {};
            }
            fileContent.restaurants[rKey].settings.vibe_quest = {
              enabled: true,
              published_version: nextVersion,
              draft: newConfig,
              published: newConfig,
              updated_at: now,
              published_at: now,
            };
            fs.writeFileSync(localPath, JSON.stringify(fileContent, null, 2), 'utf8');
          }
        }
      }
    } catch (_) {}

    return {
      success: true,
      version: nextVersion,
      config: newConfig,
    };
  }

  /**
   * Validate draft against live catalog.
   */
  static async validateDraft(restaurantId: string): Promise<VibeQuestValidationResult> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const settings = await this.getSettings(canonicalId);
    if (!settings?.draft) {
      return {
        valid: false,
        errors: [{ message: 'No draft configuration found to validate', severity: 'error' }],
      };
    }

    const categories = await MultiTenantDbService.listCategories(canonicalId);
    const products = await MultiTenantDbService.listMenuItems(canonicalId);

    return VibeQuestEngine.validateConfig(settings.draft, categories as any, products as any);
  }

  /**
   * Publish draft if valid.
   */
  static async publishConfig(restaurantId: string): Promise<{
    success: boolean;
    version: number;
    validation: VibeQuestValidationResult;
  }> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const settings = await this.getSettings(canonicalId);
    if (!settings?.draft) {
      return {
        success: false,
        version: 0,
        validation: {
          valid: false,
          errors: [{ message: 'No draft configuration found to publish', severity: 'error' }],
        },
      };
    }

    const validation = await this.validateDraft(canonicalId);
    if (!validation.valid) {
      return {
        success: false,
        version: settings.published_version || 0,
        validation,
      };
    }

    const now = new Date().toISOString();
    const nextVersion = (settings.published_version || 0) + 1;
    const publishedConfig: VibeQuestConfig = {
      ...settings.draft,
      version: nextVersion,
      enabled: true,
      published_at: now,
    };

    const rest = await MultiTenantDbService.getRestaurant(canonicalId);
    const currentSettings = (rest?.settings as any) || {};
    await MultiTenantDbService.updateRestaurant(canonicalId, {
      settings: {
        ...currentSettings,
        vibe_quest: {
          ...currentSettings.vibe_quest,
          enabled: true,
          published_version: nextVersion,
          published: publishedConfig,
          published_at: now,
          updated_at: now,
        },
      } as any,
    });

    // Broadcast SSE update
    sseService.broadcast(
      {
        type: 'vibe_quest_updated',
        version: nextVersion,
        restaurant_id: canonicalId,
      },
      canonicalId
    );

    return {
      success: true,
      version: nextVersion,
      validation,
    };
  }

  /**
   * Toggle Vibe Quest enabled state.
   */
  static async setEnabled(restaurantId: string, enabled: boolean): Promise<boolean> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const now = new Date().toISOString();
    const rest = await MultiTenantDbService.getRestaurant(canonicalId);
    const currentSettings = (rest?.settings as any) || {};
    await MultiTenantDbService.updateRestaurant(canonicalId, {
      settings: {
        ...currentSettings,
        vibe_quest: {
          ...currentSettings.vibe_quest,
          enabled,
          updated_at: now,
        },
      } as any,
    });

    sseService.broadcast(
      {
        type: 'vibe_quest_updated',
        enabled,
        restaurant_id: canonicalId,
      },
      canonicalId
    );

    return true;
  }

  /**
   * Record lightweight, fire-and-forget discovery event.
   */
  static async recordEvent(
    restaurantId: string,
    event: {
      event_type: string;
      question_id?: string;
      answer_id?: string;
      product_id?: string;
      session_id?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      const canonicalId = await this.resolveRestaurantId(restaurantId);
      const db = await this.getDb();
      if (db) {
        await db.collection<any>('vibe_quest_events').insertOne({
          restaurant_id: canonicalId,
          event_type: event.event_type,
          question_id: event.question_id,
          answer_id: event.answer_id,
          product_id: event.product_id,
          session_id: event.session_id,
          metadata: event.metadata,
          created_at: new Date(),
        });
      }
    } catch (err: any) {
      console.warn('[VibeQuest] Failed to record event:', err.message);
    }
  }

  /**
   * Get aggregate metrics for admin panel.
   */
  static async getAnalyticsSummary(restaurantId: string): Promise<any> {
    const canonicalId = await this.resolveRestaurantId(restaurantId);
    const db = await this.getDb();
    if (!db) {
      return {
        total_events: 0,
        event_counts: {},
        top_answers: [],
        top_products_selected: [],
      };
    }
    const collection = db.collection<any>('vibe_quest_events');

    const totalEvents = await collection.countDocuments({ restaurant_id: canonicalId });

    const eventCounts = await collection
      .aggregate([
        { $match: { restaurant_id: canonicalId } },
        { $group: { _id: '$event_type', count: { $sum: 1 } } },
      ])
      .toArray();

    const topAnswers = await collection
      .aggregate([
        { $match: { restaurant_id: canonicalId, event_type: 'answer_selected' } },
        { $group: { _id: { question_id: '$question_id', answer_id: '$answer_id' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const topProductsSelected = await collection
      .aggregate([
        { $match: { restaurant_id: canonicalId, event_type: 'recommendation_selected' } },
        { $group: { _id: '$product_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    return {
      total_events: totalEvents,
      event_counts: Object.fromEntries(eventCounts.map((x: any) => [x._id, x.count])),
      top_answers: topAnswers.map((x: any) => ({
        question_id: x._id.question_id,
        answer_id: x._id.answer_id,
        count: x.count,
      })),
      top_products_selected: topProductsSelected.map((x: any) => ({
        product_id: x._id,
        count: x.count,
      })),
    };
  }
}
