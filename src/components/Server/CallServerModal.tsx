import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  ScrollView
} from 'react-native';
import { X, Bell, Flame, Droplets, Utensils, CreditCard, UserCheck, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { ServerRequestType, ServerRequestStatus } from '../../types';

interface CallServerModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestServer: (type: ServerRequestType, customNote?: string) => void;
  activeRequest: ServerRequestStatus | null;
  onCancelRequest: () => void;
}

export const CallServerModal: React.FC<CallServerModalProps> = ({
  visible,
  onClose,
  onRequestServer,
  activeRequest,
  onCancelRequest,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (activeRequest) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeRequest]);

  if (!visible) return null;

  const serverOptions: { type: ServerRequestType; title: string; subtitle: string; icon: any; color: string }[] = [
    {
      type: 'server',
      title: 'I Need a Server',
      subtitle: 'Staff assistance at your table',
      icon: UserCheck,
      color: '#E5B13A',
    },
    {
      type: 'coals',
      title: 'Hookah Coal Refill',
      subtitle: 'Heat up or replace hookah coals',
      icon: Flame,
      color: '#0099FF',
    },
    {
      type: 'utensils',
      title: 'Extra Plates & Utensils',
      subtitle: 'Napkins, silver, or extra plates',
      icon: Utensils,
      color: '#10B981',
    },
    {
      type: 'check',
      title: 'Bring the Check',
      subtitle: 'Ready to review and pay bill',
      icon: CreditCard,
      color: '#A855F7',
    },
  ];

  const handleSelectOption = (type: ServerRequestType) => {
    onRequestServer(type);
  };

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onRequestServer('custom', customText.trim());
      setShowCustomInput(false);
      setCustomText('');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, isMobile && { padding: 12 }]}>
        <View style={[
          styles.modalContainer, 
          { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
          isMobile && { padding: 14, maxHeight: '92%' }
        ]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.backNavBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.borderColor }]}
              >
                <ArrowLeft size={18} color={theme.textColor} />
                <Text style={[styles.backNavText, { color: theme.textColor }]}>BACK TO MENU</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
              accessibilityLabel="Close call server modal"
            >
              <X size={20} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* Subtitle Banner */}
          <View style={styles.titleBanner}>
            <Bell size={20} color={theme.accentColor} />
            <Text style={[styles.modalTitle, { color: theme.textColor, fontSize: isMobile ? 15 : 18 }]}>
              {activeRequest ? 'SERVER NOTIFIED' : 'CALL SERVER ASSISTANCE'}
            </Text>
          </View>

          {/* Body */}
          {activeRequest ? (
            <View style={styles.activeRequestContainer}>
              <View style={[styles.pulseCircle, { borderColor: theme.accentColor }]}>
                <CheckCircle2 size={isMobile ? 48 : 64} color={theme.accentColor} />
              </View>

              <Text style={[styles.activeTitle, { color: theme.textColor, fontSize: isMobile ? 18 : 22 }]}>
                {activeRequest.label}
              </Text>

              <Text style={[styles.activeDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 12 : 14 }]}>
                Your request has been broadcasted to the {theme.name || 'service'} team floor.
              </Text>

              <View style={[styles.timerPill, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: theme.borderColor }]}>
                <Text style={[styles.timerLabel, { color: theme.mutedTextColor }]}>ELAPSED TIME:</Text>
                <Text style={[styles.timerValue, { color: theme.secondaryColor }]}>
                  {elapsedSeconds}s
                </Text>
              </View>

              <TouchableOpacity
                onPress={onCancelRequest}
                activeOpacity={0.8}
                style={[styles.cancelBtn, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}
              >
                <Text style={styles.cancelBtnText}>CANCEL REQUEST</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {serverOptions.map((opt, idx) => {
                const Icon = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.type || `server_opt_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => handleSelectOption(opt.type)}
                    {...({ onClick: () => handleSelectOption(opt.type) } as any)}
                    style={[styles.optionCard, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.borderColor, cursor: 'pointer' as any }, isMobile && { paddingHorizontal: 12, paddingVertical: 10, gap: 12 }]}
                  >
                    <View style={[styles.optionIconBg, { backgroundColor: `${opt.color}15` }, isMobile && { width: 40, height: 40 }]}>
                      <Icon size={isMobile ? 20 : 24} color={opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: theme.textColor, fontSize: isMobile ? 14 : 16 }]}>{opt.title}</Text>
                      <Text style={[styles.optionSubtitle, { color: theme.mutedTextColor, fontSize: isMobile ? 10 : 12 }]}>{opt.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Custom Note Option */}
              {showCustomInput ? (
                <View style={styles.customInputBlock}>
                  <TextInput
                    style={[styles.customInput, { color: theme.textColor, borderColor: theme.accentColor, fontSize: 16 }]}
                    placeholder="Type what you need..."
                    placeholderTextColor={theme.mutedTextColor}
                    value={customText}
                    onChangeText={setCustomText}
                    autoFocus
                  />
                  <TouchableOpacity 
                    onPress={handleCustomSubmit}
                    style={[styles.sendCustomBtn, { backgroundColor: theme.accentColor }]}
                  >
                    <Text style={styles.sendCustomText}>SEND</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowCustomInput(true)}
                  style={[styles.optionCard, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: theme.borderColor }, isMobile && { paddingHorizontal: 12, paddingVertical: 10, gap: 12 }]}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: 'rgba(255,255,255,0.05)' }, isMobile && { width: 40, height: 40 }]}>
                    <Text style={{ fontSize: isMobile ? 16 : 20 }}>💬</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: theme.textColor, fontSize: isMobile ? 14 : 16 }]}>Something Else</Text>
                    <Text style={[styles.optionSubtitle, { color: theme.mutedTextColor, fontSize: isMobile ? 10 : 12 }]}>Send custom note to staff</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  backNavText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    marginTop: 18,
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 16,
  },
  optionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  optionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  customInputBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  customInput: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    // @ts-ignore
    outlineStyle: 'none' as any,
  },
  sendCustomBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },
  sendCustomText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeRequestContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,184,166,0.1)',
    marginBottom: 20,
  },
  activeTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  activeDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 400,
    marginBottom: 20,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  cancelBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
