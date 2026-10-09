import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VibeQuestConfig,
  VibeQuestQuestion,
  VibeQuestSessionState,
  VibeQuestStage,
} from './vibe-quest.types';
import { VibeQuestEngine } from './vibe-quest.engine';
import { MenuItem, CartItem } from '../types';
import { TenantApiService } from '../services/api';

import { DEFAULT_VIBE_QUEST_CONFIG } from './vibe-quest.default';

interface UseVibeQuestProps {
  restaurantId?: string;
  tableNumber?: string;
  currentStage: VibeQuestStage;
  cart: CartItem[];
  allMenuItems: MenuItem[];
  allCategories: any[];
  onOpenMixLab?: () => void;
  onSelectItem?: (item: MenuItem) => void;
  onNavigateStage?: (stage: VibeQuestStage) => void;
}

export function useVibeQuest({
  restaurantId,
  tableNumber,
  currentStage,
  cart,
  allMenuItems,
  allCategories,
  onOpenMixLab,
  onSelectItem,
  onNavigateStage,
}: UseVibeQuestProps) {
  const [config, setConfig] = useState<VibeQuestConfig | null>(DEFAULT_VIBE_QUEST_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [reactionMessage, setReactionMessage] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const [showRecsInline, setShowRecsInline] = useState<boolean>(true);

  const [sessionState, setSessionState] = useState<VibeQuestSessionState>({
    answers: {},
    signals: {},
    questions_shown: [],
    questions_answered: [],
    questions_skipped: [],
    questions_dismissed: [],
    recommendations_shown: [],
    recommendations_selected: [],
    cart_items_added: [],
    current_stage: currentStage,
  });

  const storageKey = useMemo(() => {
    return `@benzin_vibe_quest_${restaurantId || 'default'}_${tableNumber || 'default'}`;
  }, [restaurantId, tableNumber]);

  // Fire-and-forget analytics
  const trackEvent = useCallback(
    (eventType: string, extra: Record<string, any> = {}) => {
      if (!restaurantId) return;
      try {
        TenantApiService.resilientFetchPublic('/api/vibe-quest/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Restaurant-ID': restaurantId,
          },
          body: JSON.stringify({
            event_type: eventType,
            session_id: `${restaurantId}_${tableNumber}`,
            ...extra,
          }),
        }).catch(() => {});
      } catch (_) {}
    },
    [restaurantId, tableNumber]
  );

  // Load config & saved session state
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!restaurantId) {
        setIsLoading(false);
        return;
      }

      try {
        // Load published config via resilient fetch
        const res = await TenantApiService.resilientFetchPublic(
          `/api/vibe-quest?restaurantId=${encodeURIComponent(restaurantId)}`,
          {
            headers: { 'X-Restaurant-ID': restaurantId },
          }
        );
        const data = await res.json();

        if (isMounted && data.success && data.config && data.config.enabled) {
          setConfig(data.config);

          // Restore session from AsyncStorage
          const savedSessionJson = await AsyncStorage.getItem(storageKey);
          if (savedSessionJson) {
            try {
              const parsed = JSON.parse(savedSessionJson);
              if (parsed && typeof parsed === 'object') {
                // If config version matches, preserve progress
                if (!parsed.config_version || parsed.config_version === data.config.version) {
                  setSessionState((prev) => ({
                    ...prev,
                    ...parsed,
                    questions_dismissed: [], // Clear stale dismissals across reloads
                    current_stage: currentStage,
                  }));
                }
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('[VibeQuest] Could not load config:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [restaurantId, storageKey]);

  // Persist session state changes
  useEffect(() => {
    if (config) {
      AsyncStorage.setItem(
        storageKey,
        JSON.stringify({ ...sessionState, config_version: config.version })
      ).catch(() => {});
    }
  }, [sessionState, config, storageKey]);

  // Sync current stage
  useEffect(() => {
    setSessionState((prev) => {
      if (prev.current_stage !== currentStage) {
        return { ...prev, current_stage: currentStage };
      }
      return prev;
    });
    // Reset active question and inline recs on stage change
    setActiveQuestionId(null);
    setShowRecsInline(false);
    setRecommendations([]);
    setReactionMessage(null);
  }, [currentStage]);

  // Compute current eligible question for the active stage
  const currentQuestion = useMemo<VibeQuestQuestion | null>(() => {
    if (!config || !config.enabled || isDismissed) return null;

    const stageQuestions = (config.questions || [])
      .filter((q) => q.stage === currentStage)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (stageQuestions.length === 0) return null;

    // If activeQuestionId is set, verify it's still eligible
    if (activeQuestionId) {
      const explicitQ = stageQuestions.find((q) => q.id === activeQuestionId);
      if (explicitQ && VibeQuestEngine.isQuestionEligible(explicitQ, sessionState, cart, config.settings)) {
        return explicitQ;
      }
    }

    // Find the first eligible question for this stage
    for (const q of stageQuestions) {
      if (VibeQuestEngine.isQuestionEligible(q, sessionState, cart, config.settings)) {
        return q;
      }
    }

    // Fallback: return the first question of this stage so the user is always asked
    return stageQuestions[0] || null;
  }, [config, isDismissed, currentStage, activeQuestionId, sessionState, cart]);

  // Track when question is shown
  const lastShownQuestionRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentQuestion && lastShownQuestionRef.current !== currentQuestion.id) {
      lastShownQuestionRef.current = currentQuestion.id;
      setSessionState((prev) => {
        if (prev.questions_shown.includes(currentQuestion.id)) return prev;
        return {
          ...prev,
          questions_shown: [...prev.questions_shown, currentQuestion.id],
        };
      });
      trackEvent('question_shown', { question_id: currentQuestion.id });
    }
  }, [currentQuestion, trackEvent]);

  // Ensure recommendations are always populated for the active question and stage
  useEffect(() => {
    if (!config || !allMenuItems || allMenuItems.length === 0) return;
    const activeQ = currentQuestion || (config.questions || []).find((q) => q.stage === currentStage && q.active !== false);
    if (!activeQ) return;

    const selectedAnswers = sessionState.answers[activeQ.id] || [];
    const answerIds = selectedAnswers.length > 0
      ? selectedAnswers
      : (activeQ.answers?.[0] ? [activeQ.answers[0].id] : []);

    const recs = VibeQuestEngine.rankRecommendations({
      question: activeQ,
      selectedAnswerIds: answerIds,
      config,
      catalogProducts: allMenuItems,
      cart,
      session: sessionState,
    });
    if (recs && recs.length > 0) {
      setRecommendations(recs);
      setShowRecsInline(true);
    }
  }, [config, currentQuestion, currentStage, sessionState.answers, allMenuItems, cart]);

  // Handle selecting an answer
  const handleSelectAnswer = useCallback(
    (questionId: string, answerId: string) => {
      if (!config) return;
      const question = config.questions.find((q) => q.id === questionId);
      if (!question) return;

      const answer = question.answers.find((a) => a.id === answerId);
      if (!answer) return;

      // Update session state
      setSessionState((prev) => {
        const prevAnswers = prev.answers[questionId] || [];
        const isMulti = question.type === 'multi_select';
        const newAnswers = isMulti
          ? prevAnswers.includes(answerId)
            ? prevAnswers.filter((id) => id !== answerId)
            : [...prevAnswers, answerId]
          : [answerId];

        const updatedSignals = { ...prev.signals };
        (answer.signals || []).forEach((sig) => {
          const w = (answer.weights && answer.weights[sig]) || 1;
          updatedSignals[sig] = (updatedSignals[sig] || 0) + w;
        });

        return {
          ...prev,
          answers: { ...prev.answers, [questionId]: newAnswers },
          signals: updatedSignals,
          questions_answered: prev.questions_answered.includes(questionId)
            ? prev.questions_answered
            : [...prev.questions_answered, questionId],
        };
      });

      trackEvent('answer_selected', { question_id: questionId, answer_id: answerId });

      // Reaction text
      if (config.settings?.reactions) {
        for (const sig of answer.signals || []) {
          if (config.settings.reactions[sig]) {
            setReactionMessage(config.settings.reactions[sig]);
            break;
          }
        }
      }

      // Always update recommendations immediately for the selected answer
      const recs = VibeQuestEngine.rankRecommendations({
        question,
        selectedAnswerIds: [answerId],
        config,
        catalogProducts: allMenuItems,
        cart,
        session: {
          ...sessionState,
          answers: { ...sessionState.answers, [questionId]: [answerId] },
        },
      });
      if (recs && recs.length > 0) {
        setRecommendations(recs);
        setShowRecsInline(true);
        recs.forEach((r) => {
          trackEvent('recommendation_shown', { product_id: r._id || r.id });
        });
      }

      // Resolve destination
      const nextDest = VibeQuestEngine.resolveNextDestination(
        question,
        [answerId],
        sessionState,
        cart
      );

      switch (nextDest.type) {
        case 'question':
          if (nextDest.ref_id) {
            setActiveQuestionId(nextDest.ref_id);
          }
          break;

        case 'recommendations':
          // Recommendations already rendered above
          break;

        case 'custom_mix_lab':
          if (onOpenMixLab) onOpenMixLab();
          break;

        case 'product':
        case 'product_customization':
          if (nextDest.ref_id && onSelectItem) {
            const prod = allMenuItems.find((p) => (p._id || p.id) === nextDest.ref_id);
            if (prod) onSelectItem(prod);
          }
          break;

        case 'next_stage':
          if (nextDest.ref_id && onNavigateStage) {
            onNavigateStage(nextDest.ref_id as VibeQuestStage);
          }
          break;

        case 'end_discovery':
          setIsDismissed(true);
          break;
      }
    },
    [config, sessionState, cart, allMenuItems, onOpenMixLab, onSelectItem, onNavigateStage, trackEvent]
  );

  // Handle skipping a question
  const handleSkipQuestion = useCallback(
    (questionId: string) => {
      setSessionState((prev) => ({
        ...prev,
        questions_skipped: prev.questions_skipped.includes(questionId)
          ? prev.questions_skipped
          : [...prev.questions_skipped, questionId],
      }));
      trackEvent('question_skipped', { question_id: questionId });
      setActiveQuestionId(null);
      setShowRecsInline(false);
    },
    [trackEvent]
  );

  // Handle dismissing discovery
  const handleDismissDiscovery = useCallback(() => {
    setIsDismissed(true);
    setSessionState((prev) => {
      const stageQIds = (config?.questions || [])
        .filter((q) => q.stage === currentStage)
        .map((q) => q.id);
      return {
        ...prev,
        questions_dismissed: Array.from(new Set([...prev.questions_dismissed, ...stageQIds])),
      };
    });
    trackEvent('discovery_dismissed', { stage: currentStage });
  }, [config, currentStage, trackEvent]);

  // Handle recommendation tap
  const handleSelectRecommendation = useCallback(
    (item: MenuItem) => {
      setSessionState((prev) => ({
        ...prev,
        recommendations_selected: [...prev.recommendations_selected, item.id || (item as any)._id],
      }));
      trackEvent('recommendation_selected', { product_id: item.id || (item as any)._id });
      if (onSelectItem) {
        onSelectItem(item);
      }
    },
    [onSelectItem, trackEvent]
  );

  return {
    isEnabled: !!config?.enabled && !isDismissed,
    isDismissed,
    reopenDiscovery: () => {
      setIsDismissed(false);
      setSessionState((prev) => ({ ...prev, questions_dismissed: [] }));
    },
    isLoading,
    config,
    currentQuestion,
    recommendations,
    showRecsInline,
    reactionMessage,
    sessionState,
    handleSelectAnswer,
    handleSkipQuestion,
    handleDismissDiscovery,
    handleSelectRecommendation,
  };
}
