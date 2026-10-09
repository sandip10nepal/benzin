import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { ArrowRight, Check, Plus, Minus, X } from 'lucide-react-native';
import {
  VibeQuestConfig,
  VibeQuestQuestion,
  VibeQuestAnswer,
  VibeQuestStage,
} from '../../vibe-quest/vibe-quest.types';
import { MenuItem, SelectedModifier, CartItem } from '../../types';
import { getItemImageSource } from '../../data/menu_images';
import { DakuUpgradeModal } from '../DakuUpgradeModal';
import { TenantApiService } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VibeQuestTransitionModalProps {
  visible: boolean;
  stage: VibeQuestStage;
  nextStageLabel: string;
  config: VibeQuestConfig | null;
  allMenuItems: MenuItem[];
  cartItems: CartItem[];
  theme: any;
  isMobile: boolean;
  restaurantId?: string;
  tableNumber?: string;
  onAddToCart: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  onUpdateQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  onProceed: () => void;
  onClose: () => void;
  onOpenMixLab?: () => void;
}

export const VibeQuestTransitionModal: React.FC<VibeQuestTransitionModalProps> = ({
  visible,
  stage,
  nextStageLabel,
  config,
  allMenuItems = [],
  cartItems = [],
  theme,
  isMobile,
  restaurantId = 'RES_EED4E9D266DF',
  tableNumber = '1',
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onProceed,
  onClose,
  onOpenMixLab,
}) => {
  // Active question ID within this modal session
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  // Answers recorded in this session: { [questionId]: [answerId] }
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, string[]>>({});
  // Accumulated preference signals
  const [sessionSignals, setSessionSignals] = useState<string[]>([]);
  // Whether we have transitioned to showing recommendations
  const [isShowingRecs, setIsShowingRecs] = useState<boolean>(false);
  // Track Daku upgrade modal target if user adds a hookah from recommendations
  const [pendingHookahForDaku, setPendingHookahForDaku] = useState<MenuItem | null>(null);

  // Active questions for this stage
  const stageQuestions = useMemo(() => {
    if (!config || !config.questions) return [];
    return config.questions
      .filter((q) => q.stage === stage && q.active !== false)
      .sort((a, b) => ((a as any).order ?? a.sort_order ?? 0) - ((b as any).order ?? b.sort_order ?? 0));
  }, [config, stage]);

  // Reset modal state when opened or stage changes
  useEffect(() => {
    if (visible) {
      setSessionAnswers({});
      setSessionSignals([]);
      setIsShowingRecs(false);
      setPendingHookahForDaku(null);
      if (stageQuestions.length > 0) {
        setCurrentQuestionId(stageQuestions[0].id);
      } else {
        setCurrentQuestionId(null);
        setIsShowingRecs(true);
      }
    }
  }, [visible, stage, stageQuestions]);

  // Current active question object
  const currentQuestion = useMemo<VibeQuestQuestion | null>(() => {
    if (!currentQuestionId) return null;
    return stageQuestions.find((q) => q.id === currentQuestionId) || null;
  }, [stageQuestions, currentQuestionId]);

  const currentQuestionIndex = useMemo(() => {
    if (!currentQuestionId) return 0;
    return stageQuestions.findIndex((q) => q.id === currentQuestionId);
  }, [stageQuestions, currentQuestionId]);

  // Analytics event tracker
  const trackEvent = useCallback(
    (eventType: string, extra: Record<string, any> = {}) => {
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
            stage,
            ...extra,
          }),
        }).catch(() => {});
      } catch (_) {}
    },
    [restaurantId, tableNumber, stage]
  );

  useEffect(() => {
    if (visible && currentQuestion) {
      trackEvent('question_shown', { question_id: currentQuestion.id });
    }
  }, [visible, currentQuestion, trackEvent]);

  // Handle selecting an answer
  const handleSelectAnswer = (qId: string, aId: string) => {
    if (!currentQuestion) return;
    const ans = (currentQuestion.answers || []).find((a) => a.id === aId);
    if (!ans) return;

    // Record answer
    setSessionAnswers((prev) => ({
      ...prev,
      [qId]: [aId],
    }));

    // Record preference signals
    const newSignals = ans.signals || (ans as any).preference_signals || [];
    if (newSignals.length > 0) {
      setSessionSignals((prev) => Array.from(new Set([...prev, ...newSignals])));
    }

    trackEvent('answer_selected', { question_id: qId, answer_id: aId });

    // 1. Check if destination is custom mix lab
    const dest = ans.destination as any;
    if (
      dest === 'custom_mix_lab' ||
      (typeof dest === 'object' && dest?.type === 'custom_mix_lab')
    ) {
      onClose();
      if (onOpenMixLab) onOpenMixLab();
      return;
    }

    // 2. Check if destination is dismiss or next_stage
    if (
      dest === 'dismiss' ||
      (typeof dest === 'object' && dest?.type === 'end_discovery')
    ) {
      onProceed();
      return;
    }

    // 3. Check if destination explicitly points to another question
    if (typeof dest === 'object' && dest?.type === 'question' && dest?.ref_id) {
      const targetQ = stageQuestions.find((q) => q.id === dest.ref_id);
      if (targetQ) {
        setCurrentQuestionId(targetQ.id);
        return;
      }
    }

    // 4. Check branching rules
    const branchRules = (ans as any).branching_rules;
    if (branchRules && branchRules.length > 0) {
      const nextId = branchRules[0]?.target_question_id;
      if (nextId) {
        const targetQ = stageQuestions.find((q) => q.id === nextId);
        if (targetQ) {
          setCurrentQuestionId(targetQ.id);
          return;
        }
      }
    }

    // 5. Advance to next question in this stage
    const currIdx = stageQuestions.findIndex((q) => q.id === qId);
    if (currIdx >= 0 && currIdx < stageQuestions.length - 1) {
      setCurrentQuestionId(stageQuestions[currIdx + 1].id);
    } else {
      // Completed all questions for this stage -> show recommendations view!
      setCurrentQuestionId(null);
      setIsShowingRecs(true);
      trackEvent('stage_questions_completed');
    }
  };

  // Handle skipping a question
  const handleSkipQuestion = (qId: string) => {
    trackEvent('question_skipped', { question_id: qId });
    const currIdx = stageQuestions.findIndex((q) => q.id === qId);
    if (currIdx >= 0 && currIdx < stageQuestions.length - 1) {
      setCurrentQuestionId(stageQuestions[currIdx + 1].id);
    } else {
      // Completed / skipped through all questions
      setCurrentQuestionId(null);
      setIsShowingRecs(true);
    }
  };

  // Calculate recommended items based on session answers & signals
  const recommendedItems = useMemo<MenuItem[]>(() => {
    if (!allMenuItems || allMenuItems.length === 0) return [];

    const curatedIds: string[] = [];

    // 1. Collect pinned / curated product IDs from selected answers
    Object.keys(sessionAnswers).forEach((qId) => {
      const aIds = sessionAnswers[qId] || [];
      const q = config?.questions?.find((x) => x.id === qId);
      if (q) {
        (q.answers || []).forEach((a) => {
          if (aIds.includes(a.id)) {
            const pinned = (a as any).pinned_product_ids || (a as any).curated_product_ids || [];
            pinned.forEach((pId: string) => {
              if (pId && !curatedIds.includes(pId)) curatedIds.push(pId);
            });
            if (typeof a.destination === 'object' && a.destination?.type === 'product' && (a.destination as any).ref_id) {
              if (!curatedIds.includes((a.destination as any).ref_id)) curatedIds.push((a.destination as any).ref_id);
            }
          }
        });
      }
    });

    const recs: MenuItem[] = [];

    // Match curated products by ID or _id
    curatedIds.forEach((pId) => {
      const match = allMenuItems.find((m) => (m.id || (m as any)._id) === pId);
      if (match && !recs.some((r) => (r.id || (r as any)._id) === (match.id || (match as any)._id))) {
        recs.push(match);
      }
    });

    // 2. If we need more items, match by preference signals
    if (recs.length < 3 && sessionSignals.length > 0) {
      const signalMatches = allMenuItems.filter((m) => {
        if (recs.some((r) => (r.id || (r as any)._id) === (m.id || (m as any)._id))) return false;
        // Match stage
        const itemCat = (m.category || (m as any).category_id || '').toLowerCase();
        const stageMatch = stage === 'hookah' ? itemCat.includes('hookah') : stage === 'drinks' ? (itemCat.includes('drink') || itemCat.includes('beverage')) : itemCat.includes('food');
        if (!stageMatch) return false;

        const nameLower = (m.name || '').toLowerCase();
        const descLower = (m.description || '').toLowerCase();
        return sessionSignals.some((sig) => nameLower.includes(sig.toLowerCase()) || descLower.includes(sig.toLowerCase()));
      });
      recs.push(...signalMatches);
    }

    // 3. Fallback: popular items in category
    if (recs.length < 3) {
      const categoryFallbacks = allMenuItems
        .filter((m) => {
          if (recs.some((r) => (r.id || (r as any)._id) === (m.id || (m as any)._id))) return false;
          const cat = (m.category || (m as any).category_id || '').toLowerCase();
          if (stage === 'hookah') return cat.includes('hookah');
          if (stage === 'drinks') return cat.includes('drink') || cat.includes('beverage');
          return cat.includes('food');
        })
        .slice(0, 3 - recs.length);
      recs.push(...categoryFallbacks);
    }

    return recs.slice(0, 3);
  }, [allMenuItems, sessionAnswers, sessionSignals, config, stage]);

  // Track item counts in cart
  const getItemCartCount = (itemId: string): number => {
    const found = cartItems.find((ci) => ci.item.id === itemId || (ci.item as any)._id === itemId);
    return found ? found.quantity : 0;
  };

  const isDakuInCart = useMemo(() => {
    return cartItems.some(
      (ci) =>
        ci.selectedModifiers?.some((m) => m.id === 'PKG_DAKU' || (m.name || '').includes('Daku')) ||
        (ci.item.name || '').toLowerCase().includes('daku')
    );
  }, [cartItems]);

  const handleAddRecommendedItem = (item: MenuItem) => {
    if (item.category === 'hookah' && !isDakuInCart) {
      setPendingHookahForDaku(item);
      return;
    }

    onAddToCart(item, 1, []);
    trackEvent('recommendation_added_to_cart', { product_id: item.id || (item as any)._id });
  };

  const handleAcceptDakuForRecommended = () => {
    if (!pendingHookahForDaku) return;
    const hookah = pendingHookahForDaku;
    setPendingHookahForDaku(null);

    const dakuPkgPrice = 65;
    const diff = Math.max(0, dakuPkgPrice - hookah.price);
    const selectedMods: SelectedModifier[] = [
      {
        id: 'PKG_DAKU',
        name: 'Make It Daku',
        optionName: 'Daku Package ($65) - Unlimited Head Refill',
        price: diff,
      },
      { id: 'OPT_ICE_BASE', name: 'Ice Base', optionName: 'Ice Base (Included)', price: 0 },
      { id: 'OPT_ICE_HOSE', name: 'Ice Hose', optionName: 'Ice Hose (Included)', price: 0 },
    ];
    onAddToCart(
      hookah,
      1,
      selectedMods,
      '🔥 DAKU PACKAGE: $65 Unlimited Head Refill · Ice Base · Ice Hose'
    );
    trackEvent('recommendation_added_to_cart_daku', { product_id: hookah.id });
  };

  const handleDeclineDakuForRecommended = () => {
    if (!pendingHookahForDaku) return;
    const hookah = pendingHookahForDaku;
    setPendingHookahForDaku(null);
    onAddToCart(hookah, 1, []);
    trackEvent('recommendation_added_to_cart', { product_id: hookah.id });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onProceed}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.cardModal,
            {
              backgroundColor: '#18181B',
              borderColor: '#E5B13A',
              maxWidth: isMobile ? '96%' : 600,
            },
          ]}
        >
          {/* Top Stage Header */}
          <View style={styles.topHeaderRow}>
            <View style={styles.headerBadgesRow}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(245, 158, 11, 0.18)', borderColor: '#F59E0B' }]}>
                <Text style={[styles.badgePillText, { color: '#F59E0B' }]}>CAVALLI VIBE QUEST</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: '#27272A', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.badgePillText, { color: '#94A3B8' }]}>
                  {stage.toUpperCase()} DISCOVERY
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!isShowingRecs && currentQuestion && (
                <TouchableOpacity
                  onPress={() => handleSkipQuestion(currentQuestion.id)}
                  style={styles.skipBtnHeader}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipBtnHeaderText}>Skip ⏩</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onProceed} style={styles.closeBtnHeader} activeOpacity={0.7}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* VIEW 1: QUESTIONS FLOW */}
          {!isShowingRecs && currentQuestion && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentArea}
            >
              {/* Question Count indicator */}
              <View style={styles.questionCounterRow}>
                <Text style={styles.counterText}>
                  QUESTION {currentQuestionIndex + 1} OF {stageQuestions.length}
                </Text>
              </View>

              {/* Question Prompt */}
              <Text style={styles.questionTitle}>
                {currentQuestion.question_text || currentQuestion.title}
              </Text>
              {currentQuestion.helper_text ? (
                <Text style={styles.helperText}>{currentQuestion.helper_text}</Text>
              ) : null}

              {/* Answers Stack */}
              <View style={styles.answersContainer}>
                {(currentQuestion.answers || []).map((ans: VibeQuestAnswer) => {
                  return (
                    <TouchableOpacity
                      key={ans.id}
                      onPress={() => handleSelectAnswer(currentQuestion.id, ans.id)}
                      activeOpacity={0.82}
                      style={[
                        styles.answerItemBtn,
                        {
                          backgroundColor: '#27272A',
                          borderColor: 'rgba(255, 255, 255, 0.12)',
                        },
                      ]}
                    >
                      {ans.emoji ? (
                        <Text style={styles.answerEmoji}>{ans.emoji}</Text>
                      ) : null}

                      <View style={{ flex: 1 }}>
                        <Text style={styles.answerLabel}>{ans.label}</Text>
                        {ans.description || (ans as any).subtext ? (
                          <Text style={styles.answerSubtext} numberOfLines={2}>
                            {ans.description || (ans as any).subtext}
                          </Text>
                        ) : null}
                      </View>

                      {ans.destination && typeof ans.destination === 'string' && (
                        <Text style={styles.destHint}>➡️ {ans.destination}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Instant Bypass Link */}
              <View style={styles.bypassRow}>
                <TouchableOpacity onPress={onProceed} activeOpacity={0.8} style={styles.bypassBtn}>
                  <Text style={styles.bypassBtnText}>
                    Skip Questions & Go Directly to {nextStageLabel} →
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* VIEW 2: RECOMMENDATIONS VIEW */}
          {isShowingRecs && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentArea}
            >
              <View style={styles.recsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 20 }}>🎯</Text>
                  <Text style={styles.recsTitle}>TOP CURATED PICKS</Text>
                </View>
                <Text style={styles.recsSubtitle}>
                  Tailored based on your taste for tonight at Cavalli
                </Text>
                {sessionSignals.length > 0 && (
                  <View style={styles.signalsRow}>
                    <Text style={styles.signalsLabel}>VIBE SIGNALS:</Text>
                    {sessionSignals.map((sig, idx) => (
                      <View key={`${sig}_${idx}`} style={styles.signalTag}>
                        <Text style={styles.signalTagText}>{sig.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Recommended Items Grid/List */}
              <View style={styles.recsListContainer}>
                {recommendedItems.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                      Ready to explore our full curated menu!
                    </Text>
                  </View>
                ) : (
                  recommendedItems.map((item) => {
                    const count = getItemCartCount(item.id || (item as any)._id);
                    const imageSource = getItemImageSource(item);

                    return (
                      <View
                        key={item.id || (item as any)._id}
                        style={[
                          styles.recProductCard,
                          {
                            backgroundColor: '#27272A',
                            borderColor: count > 0 ? '#10B981' : 'rgba(255, 255, 255, 0.12)',
                          },
                        ]}
                      >
                        <View style={styles.recProductImageWrap}>
                          {imageSource ? (
                            <Image
                              source={imageSource}
                              style={styles.recProductImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={{ fontSize: 28 }}>
                              {item.category === 'hookah' ? '💨' : item.category === 'drinks' ? '🍹' : '🍔'}
                            </Text>
                          )}
                        </View>

                        <View style={styles.recProductInfo}>
                          <View style={styles.recProductNamePriceRow}>
                            <Text style={styles.recProductName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.recProductPrice}>
                              ${Number(item.price).toFixed(2)}
                            </Text>
                          </View>

                          {item.description ? (
                            <Text style={styles.recProductDesc} numberOfLines={2}>
                              {item.description}
                            </Text>
                          ) : null}

                          <View style={{ marginTop: 8 }}>
                            {count === 0 ? (
                              <TouchableOpacity
                                onPress={() => handleAddRecommendedItem(item)}
                                activeOpacity={0.85}
                                style={[styles.recAddBtn, { backgroundColor: '#22C55E' }]}
                              >
                                <Plus size={14} color="#FFFFFF" />
                                <Text style={styles.recAddBtnText}>
                                  + ADD TO ORDER (${Number(item.price).toFixed(2)})
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.recAddedRow}>
                                <View style={styles.recAddedBadge}>
                                  <Check size={13} color="#10B981" />
                                  <Text style={styles.recAddedBadgeText}>{count} in order</Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleAddRecommendedItem(item)}
                                  activeOpacity={0.8}
                                  style={styles.recAddMoreBtn}
                                >
                                  <Plus size={12} color="#FFFFFF" />
                                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Add</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Continue / Next Section Action Button */}
              <View style={styles.recsFooterRow}>
                <TouchableOpacity
                  onPress={onProceed}
                  activeOpacity={0.88}
                  style={[styles.primaryProceedBtn, { backgroundColor: '#10B981' }]}
                >
                  <Text style={styles.primaryProceedBtnText}>
                    CONTINUE TO {nextStageLabel.toUpperCase()}
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onProceed}
                  activeOpacity={0.8}
                  style={styles.skipRecsBtn}
                >
                  <Text style={styles.skipRecsBtnText}>Skip and proceed →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Daku Upgrade Modal if a hookah is selected */}
      {pendingHookahForDaku && (
        <DakuUpgradeModal
          visible={!!pendingHookahForDaku}
          onAccept={handleAcceptDakuForRecommended}
          onDecline={handleDeclineDakuForRecommended}
          onClose={() => setPendingHookahForDaku(null)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  cardModal: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  skipBtnHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipBtnHeaderText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtnHeader: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollContentArea: {
    padding: 16,
    paddingBottom: 24,
  },
  questionCounterRow: {
    marginBottom: 6,
  },
  counterText: {
    color: '#E5B13A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  questionTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 25,
    marginBottom: 4,
  },
  helperText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  answersContainer: {
    gap: 10,
    marginBottom: 16,
  },
  answerItemBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  answerEmoji: {
    fontSize: 22,
  },
  answerLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  answerSubtext: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  destHint: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
  bypassRow: {
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 8,
  },
  bypassBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  bypassBtnText: {
    color: '#E5B13A',
    fontSize: 12,
    fontWeight: '700',
  },
  recsHeader: {
    marginBottom: 14,
  },
  recsTitle: {
    color: '#E5B13A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  recsSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  signalsLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signalTag: {
    backgroundColor: 'rgba(229, 177, 58, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  signalTagText: {
    color: '#E5B13A',
    fontSize: 10,
    fontWeight: '800',
  },
  recsListContainer: {
    gap: 10,
    marginBottom: 18,
  },
  recProductCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recProductImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recProductImg: {
    width: '100%',
    height: '100%',
  },
  recProductInfo: {
    flex: 1,
  },
  recProductNamePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recProductName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  recProductPrice: {
    color: '#E5B13A',
    fontSize: 13,
    fontWeight: '900',
  },
  recProductDesc: {
    color: '#94A3B8',
    fontSize: 11,
  },
  recAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  recAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  recAddedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recAddedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recAddedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  recAddMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  recsFooterRow: {
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryProceedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryProceedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  skipRecsBtn: {
    paddingVertical: 6,
  },
  skipRecsBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});
