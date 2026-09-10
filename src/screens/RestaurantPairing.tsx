import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Hash, ArrowRight, User, ShieldCheck, Lock } from 'lucide-react-native';
import { BenzinLogo } from '../components/ui/BenzinLogo';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { TenantApiService, STORAGE_KEYS } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RestaurantPairingProps {
  onPairSuccess: () => void;
  onRefreshMenu?: () => Promise<void>;
}

export const RestaurantPairing: React.FC<RestaurantPairingProps> = ({ onPairSuccess, onRefreshMenu }) => {
  const { updateTheme } = useRestaurantTheme();

  const [step, setStep] = useState<'auth' | 'table'>('auth');
  const [floorCode, setFloorCode] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pairedRestaurantName, setPairedRestaurantName] = useState<string>('Cavalli');

  useEffect(() => {
    // Check if restaurant is already paired
    AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME).then(name => {
      if (name) {
        setPairedRestaurantName(name);
        setStep('table');
      }
    });
  }, []);

  const handleVerifyFloorCode = async () => {
    const trimmedInput = floorCode.trim();
    if (!trimmedInput || trimmedInput.length < 3) {
      setErrorMsg('Please enter a valid venue code or venue name.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const isNumeric = /^[0-9]+$/.test(trimmedInput);

    try {
      const payload: any = {
        table_number: tableNumber.trim() || '1',
        device_name: `iPad Table Device`,
      };

      if (isNumeric) {
        payload.pin = trimmedInput.length === 8 ? `${trimmedInput.slice(0, 4)}-${trimmedInput.slice(4)}` : trimmedInput;
      } else {
        payload.restaurant_name = trimmedInput;
        payload.pin = '1234';
      }

      const res = await TenantApiService.configureTableDevice(payload);

      if (res.success && res.restaurant) {
        setPairedRestaurantName(res.restaurant.name);
        
        const branding = res.restaurant.branding || {};
        updateTheme({
          name: res.restaurant.name.toUpperCase(),
          tableNumber: tableNumber.trim() || '1',
          primaryColor: branding.primary_color || '#0099FF',
          secondaryColor: branding.secondary_color || '#E5B13A',
          accentColor: branding.accent_color || '#14B8A6',
          backgroundColor: branding.background_color || '#0C0806',
          cardColor: branding.card_color || '#19120E',
          textColor: branding.text_color || '#F8F1EA',
          mutedTextColor: branding.muted_color || '#9C8C7E',
        });

        if (onRefreshMenu) {
          onRefreshMenu().catch(() => {});
        }

        setStep('table');
      } else {
        setErrorMsg(res.error || 'Invalid venue code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDining = async () => {
    const cleanTable = tableNumber.trim() || '1';
    const guestName = customerName.trim() || `Guest (Table ${cleanTable})`;

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER, cleanTable);
      await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME, pairedRestaurantName);
      await AsyncStorage.setItem('@saas_customer_name', guestName);
    } catch (err) {
      console.warn('Storage save note:', err);
    }

    updateTheme({
      name: pairedRestaurantName.toUpperCase(),
      tableNumber: cleanTable,
    });

    if (onRefreshMenu) {
      onRefreshMenu().catch(() => {});
    }

    onPairSuccess();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header & Logo */}
          <View style={styles.cardHeader}>
            <BenzinLogo size="medium" showSubtitle={true} />
          </View>

          {step === 'auth' ? (
            <>
              <View style={styles.badgeRow}>
                <View style={styles.authBadge}>
                  <Lock size={14} color="#E5B13A" />
                  <Text style={styles.badgeText}>VENUE DEVICE AUTHENTICATION</Text>
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Code Input */}
              <View style={styles.sectionBlock}>
                <TextInput
                  style={[styles.textInput, styles.codeInput]}
                  placeholder="Enter Venue Code"
                  placeholderTextColor="#6B5A4E"
                  value={floorCode}
                  onChangeText={setFloorCode}
                  keyboardType="default"
                  autoCapitalize="none"
                  maxLength={20}
                  autoFocus={true}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyFloorCode}
                />
              </View>

              {/* Action Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleVerifyFloorCode}
                disabled={loading}
                style={[styles.startBtn, loading && { opacity: 0.6 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#20140C" size="small" />
                ) : (
                  <View style={styles.startBtnContent}>
                    <Text style={styles.startBtnText}>
                      VERIFY VENUE & LOAD MENU
                    </Text>
                    <ArrowRight size={22} color="#20140C" />
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.badgeRow}>
                <View style={styles.cavaliBadge}>
                  <ShieldCheck size={14} color="#14B8A6" />
                  <Text style={styles.cavaliBadgeText}>{pairedRestaurantName}</Text>
                </View>
              </View>

              {/* Table Number Input */}
              <View style={styles.sectionBlock}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>TABLE NUMBER</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.tableInput]}
                  placeholder="Table Number"
                  placeholderTextColor="#6B5A4E"
                  value={tableNumber}
                  onChangeText={setTableNumber}
                  keyboardType="number-pad"
                  autoFocus={true}
                  returnKeyType="next"
                />
              </View>

              {/* Guest Name Input */}
              <View style={styles.sectionBlock}>
                <View style={styles.inputLabelRow}>
                  <User size={16} color="#E5B13A" />
                  <Text style={styles.inputLabel}>GUEST NAME (OPTIONAL)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Guest Name"
                  placeholderTextColor="#6B5A4E"
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleStartDining}
                />
              </View>

              {/* Re-authenticate Option */}
              <TouchableOpacity
                onPress={() => setStep('auth')}
                style={styles.changeVenueBtn}
              >
                <Text style={styles.changeVenueText}>⚙️ Re-authenticate Venue Code</Text>
              </TouchableOpacity>

              {/* Start Ordering Action Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleStartDining}
                style={styles.startBtn}
              >
                <View style={styles.startBtnContent}>
                  <Text style={styles.startBtnText}>
                    START DINING & ORDERING
                  </Text>
                  <ArrowRight size={22} color="#20140C" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0806',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#19120E',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(229, 177, 58, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 177, 58, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 177, 58, 0.3)',
  },
  badgeText: {
    color: '#E5B13A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cavaliBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  cavaliBadgeText: {
    color: '#14B8A6',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8F1EA',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5B13A',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#0F0A07',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 177, 58, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8F1EA',
    fontWeight: '600',
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#E5B13A',
  },
  tableInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#0099FF',
  },
  changeVenueBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  changeVenueText: {
    color: '#9C8C7E',
    fontSize: 12,
    fontWeight: '600',
  },
  startBtn: {
    backgroundColor: '#E5B13A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#20140C',
    letterSpacing: 0.5,
  },
});
