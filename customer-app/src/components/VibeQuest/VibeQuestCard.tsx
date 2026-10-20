import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { VibeQuestQuestion, VibeQuestAnswer } from '../../vibe-quest/vibe-quest.types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VibeQuestCardProps {
  question: VibeQuestQuestion;
  selectedAnswerIds?: string[];
  reactionMessage?: string | null;
  theme: any;
  isMobile: boolean;
  onSelectAnswer: (questionId: string, answerId: string) => void;
  onSkip: (questionId: string) => void;
  onDismiss: () => void;
}

export const VibeQuestCard: React.FC<VibeQuestCardProps> = ({
  question,
  selectedAnswerIds = [],
  reactionMessage,
  theme,
  isMobile,
  onSelectAnswer,
  onSkip,
  onDismiss,
}) => {
  // If an option is already selected, start minimized; otherwise expanded
  const [isMinimized, setIsMinimized] = useState<boolean>(() => selectedAnswerIds.length > 0);
  const animValue = useRef(new Animated.Value(selectedAnswerIds.length > 0 ? 1 : 0)).current;

  // Find all selected answer objects
  const selectedAnswers = useMemo<VibeQuestAnswer[]>(() => {
    return (question.answers || []).filter((ans) => selectedAnswerIds.includes(ans.id));
  }, [question.answers, selectedAnswerIds]);

  // Smooth toggle animation between minimized and maximized
  const toggleMinimized = useCallback((targetMinimized: boolean) => {
    try {
      LayoutAnimation.configureNext({
        duration: 280,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    } catch {
      // Ignore layout animation errors on web
    }

    setIsMinimized(targetMinimized);

    Animated.timing(animValue, {
      toValue: targetMinimized ? 1 : 0,
      duration: 260,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [animValue]);

  // Sync state if question changes
  useEffect(() => {
    const hasSelection = selectedAnswerIds.length > 0;
    setIsMinimized(hasSelection);
    animValue.setValue(hasSelection ? 1 : 0);
  }, [question.id]);

  // Handle selecting an option: register answer with tactile delay then smoothly minimize
  const handleAnswerPress = (ansId: string) => {
    onSelectAnswer(question.id, ansId);
    setTimeout(() => {
      toggleMinimized(true);
    }, 200);
  };

  const handleDismissPress = () => {
    toggleMinimized(true);
    onDismiss();
  };

  const handleSkipPress = () => {
    toggleMinimized(true);
    onSkip(question.id);
  };

  return (
    <>
      {/* 1. MINIMIZED STATE: Compact informative banner sitting directly above subcategory pills */}
      {isMinimized && (
        <View
          style={[
            styles.minimizedContainer,
            {
              backgroundColor: '#18181B',
              borderColor: '#F59E0B',
            },
            isMobile
              ? { marginHorizontal: 12, marginVertical: 6 }
              : { marginHorizontal: 24, marginVertical: 8, maxWidth: 1100, alignSelf: 'center', width: '100%' },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleMinimized(false)}
            style={styles.minimizedBar}
            accessibilityRole="button"
            accessibilityLabel={`Selected craving: ${selectedAnswers.map((a) => a.label).join(', ')}. Tap to change.`}
          >
            <View style={styles.minimizedLeft}>
              <View style={styles.minimizedHeaderLine}>
                <Text style={styles.stageTag}>{question.stage.toUpperCase()}</Text>
                <Text
                  style={[
                    styles.minimizedQuestionText,
                    { fontSize: isMobile ? 13 : 15 },
                  ]}
                  numberOfLines={1}
                >
                  {question.question_text}
                </Text>
              </View>

              {selectedAnswers.length > 0 && (
                <View style={styles.minimizedPillsRow}>
                  {selectedAnswers.map((ans) => (
                    <View key={ans.id} style={styles.selectedAnswerPill}>
                      {ans.emoji ? (
                        <Text style={styles.selectedPillEmoji}>{ans.emoji}</Text>
                      ) : null}
                      <Text style={styles.selectedPillLabel} numberOfLines={1}>
                        {ans.label}
                      </Text>
                      <View style={styles.selectedPillCheckmark}>
                        <Check size={11} color="#000000" strokeWidth={3} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.minimizedRight}>
              <View style={styles.changeActionPill}>
                <Text style={styles.changeActionText}>
                  {selectedAnswers.length > 0 ? 'Change' : 'Questions'}
                </Text>
                <ChevronDown size={14} color="#F59E0B" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. FLOATING HANGING MODAL OVERLAY: Floats over the menu with menu visible underneath */}
      <Modal
        visible={!isMinimized}
        transparent={true}
        animationType="fade"
        onRequestClose={() => toggleMinimized(true)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop layer: tapping outside dismisses modal */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => toggleMinimized(true)}
            accessibilityLabel="Close question overlay"
          />

          {/* Floating Card hanging suspended over the menu */}
          <View
            style={[
              styles.floatingCardContainer,
              {
                backgroundColor: '#18181B',
                borderColor: '#F59E0B',
              },
              isMobile ? styles.floatingCardMobile : styles.floatingCardDesktop,
            ]}
          >
            {/* Top Badge & Header Actions */}
            <View style={styles.headerRow}>
              <View style={styles.badgeRow}>
                <Text style={styles.stageTag}>{question.stage.toUpperCase()}</Text>
                {selectedAnswers.length > 0 && (
                  <View style={styles.currentlySelectedTag}>
                    <Text style={styles.currentlySelectedTagText}>
                      Active: {selectedAnswers[0].label}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.headerRightActions}>
                {selectedAnswers.length > 0 && (
                  <TouchableOpacity
                    onPress={() => toggleMinimized(true)}
                    style={styles.collapseHeaderBtn}
                    activeOpacity={0.75}
                    accessibilityLabel="Close question overlay"
                  >
                    <Text style={styles.collapseHeaderText}>Close</Text>
                    <ChevronUp size={13} color="#F59E0B" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleDismissPress}
                  style={styles.dismissBtn}
                  accessibilityLabel="Dismiss discovery"
                >
                  <Text style={styles.dismissText}>✕ Browse Menu</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable container for question and options */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 6 }}
            >
              {/* Question Text & Helper Subtext */}
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { fontSize: isMobile ? 18 : 22 }]}>
                  {question.question_text}
                </Text>
                {question.helper_text ? (
                  <Text style={styles.helperText}>{question.helper_text}</Text>
                ) : null}
              </View>

              {/* Reaction Prompt Banner if available */}
              {reactionMessage ? (
                <View style={styles.reactionBanner}>
                  <Text style={styles.reactionText}>{reactionMessage}</Text>
                </View>
              ) : null}

              {/* Answer Options Grid */}
              <View style={styles.answersGrid}>
                {question.answers.map((ans: VibeQuestAnswer) => {
                  const isSelected = selectedAnswerIds.includes(ans.id);
                  return (
                    <TouchableOpacity
                      key={ans.id}
                      activeOpacity={0.8}
                      onPress={() => handleAnswerPress(ans.id)}
                      style={[
                        styles.answerCard,
                        {
                          backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.18)' : '#27272A',
                          borderColor: isSelected ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)',
                          borderWidth: isSelected ? 2 : 1,
                        },
                        isMobile ? { width: '100%' } : { width: '48%' },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={ans.label}
                    >
                      <View style={styles.answerContentRow}>
                        {ans.emoji ? <Text style={styles.answerEmoji}>{ans.emoji}</Text> : null}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.answerLabel,
                              { color: isSelected ? '#F59E0B' : '#FFFFFF' },
                            ]}
                          >
                            {ans.label}
                          </Text>
                          {ans.description ? (
                            <Text style={styles.answerDesc} numberOfLines={2}>
                              {ans.description}
                            </Text>
                          ) : null}
                        </View>
                        {isSelected && (
                          <View style={styles.checkmarkBadge}>
                            <Check size={12} color="#000000" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Footer: Skip Actions */}
              {question.skippable && (
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    onPress={handleSkipPress}
                    style={styles.skipButton}
                    accessibilityLabel="Skip question"
                  >
                    <Text style={styles.skipText}>Skip for now →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  floatingCardContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  floatingCardDesktop: {
    width: '90%',
    maxWidth: 700,
    maxHeight: '86%',
    padding: 24,
  },
  floatingCardMobile: {
    width: '95%',
    maxWidth: 440,
    maxHeight: '88%',
    padding: 16,
  },
  minimizedContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardContainerMinimized: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  // Minimized Bar Layout
  minimizedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  minimizedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  minimizedHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimizedQuestionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  minimizedPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedAnswerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  selectedPillEmoji: {
    fontSize: 14,
  },
  selectedPillLabel: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  selectedPillCheckmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedRight: {
    marginLeft: 12,
  },
  changeActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeActionText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Expanded Header Layout
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageTag: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentlySelectedTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentlySelectedTagText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapseHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
  },
  collapseHeaderText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dismissText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  questionSection: {
    marginBottom: 14,
  },
  questionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  helperText: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 4,
  },
  reactionBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  reactionText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  answerCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  answerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  answerEmoji: {
    fontSize: 24,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  answerDesc: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  checkmarkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
  },
});
