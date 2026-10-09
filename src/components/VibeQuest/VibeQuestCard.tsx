import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { VibeQuestQuestion, VibeQuestAnswer } from '../../vibe-quest/vibe-quest.types';

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
  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: '#18181B',
          borderColor: '#F59E0B',
        },
        isMobile ? { marginHorizontal: 12, marginVertical: 10 } : { marginHorizontal: 24, marginVertical: 16 },
      ]}
    >
      {/* Top Badge & Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Text style={styles.stageTag}>{question.stage.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissBtn}
          accessibilityLabel="Dismiss discovery"
        >
          <Text style={styles.dismissText}>✕ Browse Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Question Text */}
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
              onPress={() => onSelectAnswer(question.id, ans.id)}
              style={[
                styles.answerCard,
                {
                  backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : '#27272A',
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
                    <Text style={styles.checkmarkText}>✓</Text>
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
            onPress={() => onSkip(question.id)}
            style={styles.skipButton}
            accessibilityLabel="Skip question"
          >
            <Text style={styles.skipText}>Skip for now →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  questBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  checkmarkText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
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
