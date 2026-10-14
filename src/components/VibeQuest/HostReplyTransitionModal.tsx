import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Sparkles, ArrowRight, Bot, Check } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HostTransitionPayload {
  questionTitle?: string;
  selectedOptionLabel: string;
  selectedOptionEmoji?: string;
  replyMessage: string;
  targetDestinationLabel?: string;
  onComplete: () => void;
}

interface HostReplyTransitionModalProps {
  visible: boolean;
  transition: HostTransitionPayload | null;
  theme?: any;
  isMobile?: boolean;
  onDismiss?: () => void;
}

export const HostReplyTransitionModal: React.FC<HostReplyTransitionModalProps> = ({
  visible,
  transition,
  theme,
  isMobile = false,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  const handleProceed = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (transition?.onComplete) {
      transition.onComplete();
    }
    if (onDismiss) {
      onDismiss();
    }
  }, [transition, onDismiss]);

  useEffect(() => {
    if (!visible || !transition) {
      completedRef.current = false;
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      progressAnim.setValue(0);
      return;
    }

    completedRef.current = false;
    scaleAnim.setValue(0.92);
    opacityAnim.setValue(0);
    progressAnim.setValue(0);

    // Card entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Progress bar fills over 1600ms
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: false,
    }).start();

    // Auto-advance after 1650ms
    const timer = setTimeout(() => {
      handleProceed();
    }, 1650);

    return () => {
      clearTimeout(timer);
    };
  }, [visible, transition, scaleAnim, opacityAnim, progressAnim, handleProceed]);

  if (!visible || !transition) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleProceed}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              maxWidth: isMobile ? SCREEN_WIDTH - 32 : 460,
            },
          ]}
        >
          {/* Top Host Identity Badge */}
          <View style={styles.hostHeaderRow}>
            <View style={styles.hostAvatarRing}>
              <Bot size={20} color="#E5B13A" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.hostName}>Cavalli Host</Text>
                <View style={styles.onlinePill}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>CONCIERGE</Text>
                </View>
              </View>
              {transition.questionTitle ? (
                <Text style={styles.questionHint} numberOfLines={1}>
                  {transition.questionTitle}
                </Text>
              ) : null}
            </View>
            <Sparkles size={18} color="#E5B13A" />
          </View>

          {/* User Selection Pill */}
          <View style={styles.selectionPill}>
            <Text style={styles.selectionPrefix}>You selected:</Text>
            <View style={styles.selectionBadge}>
              {transition.selectedOptionEmoji ? (
                <Text style={{ fontSize: 13 }}>{transition.selectedOptionEmoji}</Text>
              ) : null}
              <Text style={styles.selectionLabel} numberOfLines={1}>
                {transition.selectedOptionLabel}
              </Text>
              <Check size={13} color="#E5B13A" />
            </View>
          </View>

          {/* Host Reply Speech Bubble */}
          <View style={styles.speechCard}>
            <Text style={styles.quoteMarkLeft}>“</Text>
            <Text style={styles.replyMessage}>
              {transition.replyMessage}
            </Text>
            <Text style={styles.quoteMarkRight}>”</Text>
          </View>

          {/* Destination Target Banner */}
          {transition.targetDestinationLabel ? (
            <View style={styles.destinationBanner}>
              <View style={styles.pulseIndicator} />
              <Text style={styles.destinationText}>
                Taking you to <Text style={styles.destinationHighlight}>{transition.targetDestinationLabel}</Text>...
              </Text>
            </View>
          ) : null}

          {/* Smooth Transition Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          {/* Fast Proceed Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleProceed}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue Now</Text>
            <ArrowRight size={16} color="#000000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 5, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#16121E',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 177, 58, 0.45)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  hostHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  hostAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 177, 58, 0.12)',
    borderWidth: 1.5,
    borderColor: '#E5B13A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  questionHint: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  selectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  selectionPrefix: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectionLabel: {
    color: '#E5B13A',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 220,
  },
  speechCard: {
    backgroundColor: 'rgba(229, 177, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 177, 58, 0.28)',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 18,
    position: 'relative',
  },
  quoteMarkLeft: {
    color: 'rgba(229, 177, 58, 0.4)',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: -6,
  },
  quoteMarkRight: {
    color: 'rgba(229, 177, 58, 0.4)',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: -6,
  },
  replyMessage: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 4,
    letterSpacing: 0.3,
  },
  destinationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  pulseIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E5B13A',
  },
  destinationText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  destinationHighlight: {
    color: '#E5B13A',
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E5B13A',
    borderRadius: 2,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E5B13A',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
