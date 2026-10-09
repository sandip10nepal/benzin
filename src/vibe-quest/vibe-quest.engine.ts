import {
  VibeQuestBranchRule,
  VibeQuestCondition,
  VibeQuestConfig,
  VibeQuestConfigSettings,
  VibeQuestDestination,
  VibeQuestQuestion,
  VibeQuestSessionState,
} from './vibe-quest.types';

export class VibeQuestEngine {
  /**
   * Evaluate a condition against session and cart.
   */
  static evaluateCondition(
    cond: VibeQuestCondition,
    session: VibeQuestSessionState,
    cart: Array<{ id?: string; _id?: string; category_id?: string; category_ids?: string[]; selectedModifiers?: any[] }>,
    catalogProducts?: Map<string, any>
  ): boolean {
    const field = cond.field || '';
    const value = cond.value;

    switch (cond.operator) {
      case 'answer_selected': {
        if (field) {
          const selected = session.answers[field] || [];
          return value ? selected.includes(String(value)) : selected.length > 0;
        }
        return Object.values(session.answers).some((ansList) =>
          ansList.includes(String(value))
        );
      }

      case 'answer_not_selected': {
        if (field) {
          const selected = session.answers[field] || [];
          return value ? !selected.includes(String(value)) : selected.length === 0;
        }
        return !Object.values(session.answers).some((ansList) =>
          ansList.includes(String(value))
        );
      }

      case 'signal_present': {
        const sig = field || String(value);
        return (session.signals[sig] || 0) > 0;
      }

      case 'question_answered': {
        const qid = field || String(value);
        return session.questions_answered.includes(qid);
      }

      case 'question_skipped': {
        const qid = field || String(value);
        return session.questions_skipped.includes(qid);
      }

      case 'question_not_seen': {
        const qid = field || String(value);
        return !session.questions_shown.includes(qid);
      }

      case 'stage_is': {
        const stage = field || String(value);
        return session.current_stage === stage;
      }

      case 'cart_has_category': {
        const catId = field || String(value);
        return cart.some((item) => {
          const cids = Array.isArray(item.category_ids) && item.category_ids.length > 0
            ? item.category_ids
            : [item.category_id || ''];
          return cids.includes(catId);
        });
      }

      case 'cart_not_has_category': {
        const catId = field || String(value);
        return !cart.some((item) => {
          const cids = Array.isArray(item.category_ids) && item.category_ids.length > 0
            ? item.category_ids
            : [item.category_id || ''];
          return cids.includes(catId);
        });
      }

      case 'cart_has_product': {
        const pid = field || String(value);
        return cart.some((item: any) => {
          if ((item.id || item._id) === pid) return true;
          if (Array.isArray(item.selectedModifiers)) {
            return item.selectedModifiers.some((m: any) => m.id === pid || m.optionId === pid);
          }
          return false;
        });
      }

      case 'cart_not_has_product': {
        const pid = field || String(value);
        return !cart.some((item: any) => {
          if ((item.id || item._id) === pid) return true;
          if (Array.isArray(item.selectedModifiers)) {
            return item.selectedModifiers.some((m: any) => m.id === pid || m.optionId === pid);
          }
          return false;
        });
      }

      case 'product_available': {
        const pid = field || String(value);
        const prod = catalogProducts?.get(pid);
        return prod ? prod.available !== false : false;
      }

      case 'recommendation_selected': {
        const pid = field || String(value);
        return session.recommendations_selected.includes(pid);
      }

      default:
        return true;
    }
  }

  /**
   * Determine whether a question should be shown in the current context.
   */
  static isQuestionEligible(
    question: VibeQuestQuestion,
    session: VibeQuestSessionState,
    cart: any[],
    settings?: VibeQuestConfigSettings
  ): boolean {
    if (!question.active) return false;

    // Global and question dismissal checks
    if (session.questions_dismissed.includes(question.id) || session.questions_dismissed.includes('*')) {
      return false;
    }

    if (question.repeat_policy === 'show_once') {
      if (session.questions_shown.includes(question.id) || session.questions_skipped.includes(question.id)) return false;
    }

    if (question.repeat_policy === 'suppress_if_skipped') {
      if (session.questions_skipped.includes(question.id)) {
        return false;
      }
    }

    if (question.stage === 'dessert' || question.repeat_policy === 'cart_conditional') {
      if (session.questions_dismissed.includes(question.id)) return false;

      const dessertCatIds = settings?.dessert_category_ids || ['CAT_DESSERTS'];
      const hasDessertInCart = cart.some((item) => {
        const cids = Array.isArray(item.category_ids) && item.category_ids.length > 0
          ? item.category_ids
          : [item.category_id || ''];
        return dessertCatIds.some((dcid) => cids.includes(dcid));
      });

      if (hasDessertInCart) return false;
    }

    if (question.display_conditions && question.display_conditions.length > 0) {
      for (const cond of question.display_conditions) {
        if (!this.evaluateCondition(cond, session, cart)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Resolve next destination.
   */
  static resolveNextDestination(
    question: VibeQuestQuestion,
    selectedAnswerIds: string[],
    session: VibeQuestSessionState,
    cart: any[]
  ): VibeQuestDestination {
    if (question.branches && question.branches.length > 0) {
      for (const branch of question.branches) {
        const allMatch = branch.conditions.every((c) => this.evaluateCondition(c, session, cart));
        if (allMatch) {
          return branch.destination;
        }
      }
    }

    if (selectedAnswerIds.length > 0) {
      for (const ansId of selectedAnswerIds) {
        const ans = question.answers.find((a) => a.id === ansId);
        if (ans && ans.destination) {
          return ans.destination;
        }
      }
    }

    return question.default_destination || { type: 'next_stage' };
  }

  /**
   * Rank recommendations for selected answers and session state.
   */
  static rankRecommendations(options: {
    question?: VibeQuestQuestion;
    selectedAnswerIds?: string[];
    config: VibeQuestConfig;
    catalogProducts: any[];
    cart: any[];
    session: VibeQuestSessionState;
  }): any[] {
    const { question, selectedAnswerIds = [], config, catalogProducts, session } = options;

    const recConfig = question?.recommendation_config || {};
    const resultCount = recConfig.result_count || 3;
    const diversityLimit = recConfig.diversity_limit_per_category || 2;

    const answers = (question?.answers || []).filter((a) => selectedAnswerIds.includes(a.id));

    const pinnedSet = new Set<string>();
    const eligibleCategories = new Set<string>(recConfig.eligible_category_ids || []);
    const excludedProducts = new Set<string>(recConfig.excluded_product_ids || []);

    // Exclude known test items
    excludedProducts.add('ITM_6D32A3982F2D');
    excludedProducts.add('ITM_09618EBFB068');
    excludedProducts.add('sazdxfcgvhb');

    answers.forEach((ans) => {
      (ans.pinned_product_ids || []).forEach((pid) => pinnedSet.add(pid));
      (ans.eligible_category_ids || []).forEach((cid) => eligibleCategories.add(cid));
      (ans.excluded_product_ids || []).forEach((pid) => excludedProducts.add(pid));
    });

    const eligibleProducts = catalogProducts.filter((p) => {
      const pid = p._id || p.id;
      if (p.available === false) return false;
      if (excludedProducts.has(pid)) return false;

      if (eligibleCategories.size > 0) {
        const cids = Array.isArray(p.category_ids) && p.category_ids.length > 0
          ? p.category_ids
          : [p.category_id || ''];
        const matchesCategory = cids.some((c: string) => eligibleCategories.has(c));
        if (!matchesCategory) return false;
      }
      return true;
    });

    const scored = eligibleProducts.map((p) => {
      const pid = p._id || p.id;
      let score = 0;

      if (pinnedSet.has(pid)) {
        score += 100;
      }

      const prodTags = (config.product_tags && config.product_tags[pid]) || [];
      for (const tag of prodTags) {
        const sigScore = session.signals[tag] || 0;
        if (sigScore > 0) {
          score += sigScore * 10;
        }
      }

      return { product: p, score };
    });

    const seenNames = new Set<string>();
    const deduped: typeof scored = [];

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.product.sort_order || 99) - (b.product.sort_order || 99);
    });

    for (const item of scored) {
      const normName = (item.product.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        deduped.push(item);
      }
    }

    const categoryCounts: Record<string, number> = {};
    const diverseResults: any[] = [];

    for (const item of deduped) {
      const catId = item.product.category_id || (item.product.category_ids && item.product.category_ids[0]) || 'misc';
      const curCount = categoryCounts[catId] || 0;

      if (curCount < diversityLimit || diverseResults.length < resultCount) {
        categoryCounts[catId] = curCount + 1;
        diverseResults.push(item.product);
      }

      if (diverseResults.length >= resultCount) break;
    }

    if (diverseResults.length === 0 && recConfig.fallback_category_id) {
      const fallbackItems = catalogProducts
        .filter((p) => {
          const cids = p.category_ids?.length ? p.category_ids : [p.category_id];
          return cids.includes(recConfig.fallback_category_id) && p.available !== false && !excludedProducts.has(p._id || p.id);
        })
        .slice(0, resultCount);
      return fallbackItems;
    }

    return diverseResults;
  }
}
