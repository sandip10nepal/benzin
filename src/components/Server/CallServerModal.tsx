import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';
import { X, Bell, Flame, Droplets, Utensils, CreditCard, UserCheck, CheckCircle2 } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
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
      subtitle: 'Staff assistance at Table 12',
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
      type: 'water',
      title: 'Ice Water Pitcher',
      subtitle: 'Fresh cold water & glasses',
      icon: Droplets,
      color: '#3B82F6',
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
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(20,184,166,0.12)' }]}>
                <Bell size={24} color={theme.accentColor} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                  {activeRequest ? 'SERVER NOTIFIED' : 'HOW CAN WE HELP?'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.mutedTextColor }]}>
                  TABLE {theme.tableNumber} • {theme.name || 'LOUNGE'} ASSISTANCE
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
            >
              <X size={20} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {activeRequest ? (
            <View style={styles.activeRequestContainer}>
              <View style={[styles.pulseCircle, { borderColor: theme.accentColor }]}>
                <CheckCircle2 size={64} color={theme.accentColor} />
              </View>

              <Text style={[styles.activeTitle, { color: theme.textColor }]}>
                {activeRequest.label}
              </Text>

              <Text style={[styles.activeDesc, { color: theme.mutedTextColor }]}>
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
            <View style={styles.optionsContainer}>
              {serverOptions.map((opt, idx) => {
                const Icon = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.type || `server_opt_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => handleSelectOption(opt.type)}
                    style={[styles.optionCard, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.borderColor }]}
                  >
                    <View style={[styles.optionIconBg, { backgroundColor: `${opt.color}15` }]}>
                      <Icon size={24} color={opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: theme.textColor }]}>{opt.title}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Custom Note Option */}
              {showCustomInput ? (
                <View style={styles.customInputBlock}>
                  <TextInput
                    style={[styles.customInput, { color: theme.textColor, borderColor: theme.accentColor }]}
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
                  style={[styles.optionCard, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: theme.borderColor }]}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={{ fontSize: 20 }}>�</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: theme.textColor }]}>Something Else</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
    width: 600,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
