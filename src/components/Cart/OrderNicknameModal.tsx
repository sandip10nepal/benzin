import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { User, Sparkles, X } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

interface OrderNicknameModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (nickname: string) => void;
  initialNickname?: string;
  tableNumber?: string;
}

export const OrderNicknameModal: React.FC<OrderNicknameModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialNickname = '',
  tableNumber = '1',
}) => {
  const { theme } = useRestaurantTheme();
  const { isMobilePhone } = useResponsiveLayout();
  const [nickname, setNickname] = useState<string>(initialNickname || '');
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('Please enter a nickname or name for this order');
      return;
    }
    setError('');
    onSubmit(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.cardColor,
                  borderColor: theme.borderColor,
                  maxWidth: isMobilePhone ? '92%' : 460,
                },
              ]}
            >
              {/* Header */}
              <View style={[styles.headerRow, { borderBottomColor: theme.borderColor }]}>
                <View style={styles.headerTitleGroup}>
                  <View style={[styles.iconBg, { backgroundColor: 'rgba(229, 177, 58, 0.12)' }]}>
                    <User size={18} color={theme.secondaryColor} />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: theme.textColor }]}>
                      Who is this order for?
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.mutedTextColor }]}>
                      Table {tableNumber} • Used to identify your order
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={18} color={theme.mutedTextColor} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.body}>
                <Text style={[styles.inputLabel, { color: theme.mutedTextColor }]}>
                  ENTER NICKNAME OR NAME
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.backgroundColor,
                      borderColor: error ? '#EF4444' : theme.borderColor,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.textColor }]}
                    placeholder="e.g. Sandip, Alex, Table Guest"
                    placeholderTextColor={theme.mutedTextColor}
                    value={nickname}
                    onChangeText={(val) => {
                      setNickname(val);
                      if (error) setError('');
                    }}
                    autoFocus
                    maxLength={30}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                  />
                  {nickname.trim().length > 0 && (
                    <TouchableOpacity onPress={() => setNickname('')} style={{ padding: 4 }}>
                      <X size={14} color={theme.mutedTextColor} />
                    </TouchableOpacity>
                  )}
                </View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
              </View>

              {/* Footer Actions */}
              <View style={[styles.footerRow, { borderTopColor: theme.borderColor }]}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={[styles.cancelBtn, { borderColor: theme.borderColor }]}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.mutedTextColor }]}>
                    BACK
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                  style={[styles.submitBtn, { backgroundColor: '#10B981' }]}
                >
                  <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>CONFIRM & SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
