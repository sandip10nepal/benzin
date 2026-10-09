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
  ActivityIndicator,
} from 'react-native';
import { Search, Clock, X, AlertCircle } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { TenantApiService } from '../../services/api';

interface TrackOrderLookupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (session: {
    orderId: string;
    trackingToken: string;
    trackingExpiresAt: string;
    customerNickname: string;
    order: any;
  }) => void;
  defaultTable?: string;
}

export const TrackOrderLookupModal: React.FC<TrackOrderLookupModalProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultTable = '',
}) => {
  const { theme } = useRestaurantTheme();
  const { isMobilePhone } = useResponsiveLayout();

  const [nickname, setNickname] = useState('');
  const [orderId, setOrderId] = useState('');
  const [table, setTable] = useState(defaultTable);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLookup = async () => {
    if (!nickname.trim()) {
      setErrorMsg('Please enter your order nickname');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await TenantApiService.lookupTracking({
        nickname: nickname.trim(),
        orderId: orderId.trim() || undefined,
        table: table.trim() || undefined,
      });

      if (res.success && res.orderId && res.trackingToken) {
        onSuccess({
          orderId: res.orderId,
          trackingToken: res.trackingToken,
          trackingExpiresAt: res.trackingExpiresAt || new Date(Date.now() + 7200000).toISOString(),
          customerNickname: res.order?.customerNickname || nickname.trim(),
          order: res.order,
        });
        onClose();
      } else {
        setErrorMsg(res.error || 'Order lookup failed. Please verify your details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to tracking service');
    } finally {
      setIsLoading(false);
    }
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
                    <Clock size={18} color={theme.secondaryColor} />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: theme.textColor }]}>
                      Track Your Order
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.mutedTextColor }]}>
                      Enter your order details to check live kitchen status
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={18} color={theme.mutedTextColor} />
                </TouchableOpacity>
              </View>

              {/* Form Body */}
              <View style={styles.body}>
                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={15} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorBannerText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Nickname Input */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.mutedTextColor }]}>
                    ORDER NICKNAME *
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                    <TextInput
                      style={[styles.input, { color: theme.textColor }]}
                      placeholder="e.g. Sandip or Alex"
                      placeholderTextColor={theme.mutedTextColor}
                      value={nickname}
                      onChangeText={(val) => {
                        setNickname(val);
                        if (errorMsg) setErrorMsg('');
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Order ID Input */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.mutedTextColor }]}>
                    ORDER ID OR RECEIPT CODE (OPTIONAL)
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                    <TextInput
                      style={[styles.input, { color: theme.textColor }]}
                      placeholder="e.g. cav-1727500000000 (optional)"
                      placeholderTextColor={theme.mutedTextColor}
                      value={orderId}
                      onChangeText={(val) => {
                        setOrderId(val);
                        if (errorMsg) setErrorMsg('');
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Optional Table Number */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.mutedTextColor }]}>
                    TABLE NUMBER (OPTIONAL)
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                    <TextInput
                      style={[styles.input, { color: theme.textColor }]}
                      placeholder="e.g. 4"
                      placeholderTextColor={theme.mutedTextColor}
                      value={table}
                      onChangeText={setTable}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <Text style={[styles.noteText, { color: theme.mutedTextColor }]}>
                  ℹ️ Order tracking access is active for 2 hours following order creation.
                </Text>
              </View>

              {/* Footer Actions */}
              <View style={[styles.footerRow, { borderTopColor: theme.borderColor }]}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={[styles.cancelBtn, { borderColor: theme.borderColor }]}
                  disabled={isLoading}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.mutedTextColor }]}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLookup}
                  activeOpacity={0.85}
                  style={[styles.lookupBtn, { backgroundColor: theme.primaryColor }]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Search size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.lookupBtnText}>LOOKUP ORDER</Text>
                    </>
                  )}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
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
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
