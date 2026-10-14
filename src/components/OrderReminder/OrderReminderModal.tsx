import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { X, ArrowRight, Plus, Check } from 'lucide-react-native';
import { MenuItem, SelectedModifier } from '../../types';
import { getItemImageSource } from '../../data/menu_images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderReminderModalProps {
  visible: boolean;
  type: 'dessert' | 'drinks';
  title?: string;
  helperText?: string;
  browseBtnText?: string;
  skipBtnText?: string;
  theme: any;
  isMobile: boolean;
  quickAddItems?: MenuItem[];
  onBrowse: () => void;
  onSkip: () => void;
  onClose: () => void;
  onQuickAdd?: (item: MenuItem) => void;
}

export const OrderReminderModal: React.FC<OrderReminderModalProps> = ({
  visible,
  type,
  title,
  helperText,
  browseBtnText,
  skipBtnText,
  theme,
  isMobile,
  quickAddItems = [],
  onBrowse,
  onSkip,
  onClose,
  onQuickAdd,
}) => {
  if (!visible) return null;

  const isDessert = type === 'dessert';
  const badgeColor = isDessert ? '#EC4899' : '#10B981';
  const badgeLabel = isDessert ? 'SWEET FINALE 🍰' : 'REFRESHING SIP 🥤';

  const displayTitle = title || (isDessert
    ? 'Should we save room for something sweet? 🍰'
    : 'Would you like something to drink? 🥤');

  const displayHelper = typeof helperText === 'string'
    ? helperText
    : (isDessert
        ? 'Complete your session with warm Kunafa, Biscoff cake, or traditional sweets.'
        : 'Pair your dishes with crisp mojitos, fresh juices, Karak chai, or ice-cold sodas.');

  const finalBrowseBtnText = browseBtnText || (isDessert ? 'Browse Desserts 🍰' : 'Browse Drinks 🥤');
  const finalSkipBtnText = skipBtnText || (isDessert ? 'Skip Dessert & Continue →' : 'Skip Drinks & Review Order →');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: theme.cardColor,
              borderColor: badgeColor,
            },
            isMobile && { width: '92%', padding: 20 },
          ]}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.badgePill, { backgroundColor: `${badgeColor}22`, borderColor: `${badgeColor}55` }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
            >
              <X size={18} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* Prompt Title & Description */}
          <Text style={[styles.titleText, { color: theme.textColor }]}>
            {displayTitle}
          </Text>
          {!!displayHelper.trim() && (
            <Text style={[styles.helperText, { color: theme.mutedTextColor }]}>
              {displayHelper}
            </Text>
          )}

          {/* Quick Add Curated Items (if available) */}
          {quickAddItems && quickAddItems.length > 0 && onQuickAdd && (
            <View style={styles.quickAddSection}>
              <Text style={[styles.quickAddHeader, { color: theme.mutedTextColor }]}>
                POPULAR TABLE PAIRINGS:
              </Text>
              <ScrollView
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={quickAddItems.length > 2}
                nestedScrollEnabled={true}
              >
                <View style={styles.quickAddRow}>
                  {quickAddItems.map((item, idx) => {
                    const img = getItemImageSource(item);
                    return (
                      <View
                        key={item.id || `quick_${idx}`}
                        style={[
                          styles.quickItemCard,
                          {
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderColor: theme.borderColor,
                          },
                        ]}
                      >
                        <View style={styles.quickItemThumb}>
                          {img ? (
                            <Image source={img} style={styles.thumbImage} resizeMode="cover" />
                          ) : (
                            <Text style={{ fontSize: 20 }}>{isDessert ? '🍰' : '🍹'}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text
                            style={[styles.quickItemName, { color: theme.textColor }]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={[styles.quickItemPrice, { color: theme.secondaryColor }]}>
                            ${item.price.toFixed(2)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => onQuickAdd(item)}
                          activeOpacity={0.8}
                          style={[styles.quickAddBtn, { backgroundColor: badgeColor }]}
                        >
                          <Plus size={14} color="#FFFFFF" />
                          <Text style={styles.quickAddBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={onBrowse}
              activeOpacity={0.88}
              style={[styles.browseBtn, { backgroundColor: badgeColor }]}
            >
              <Text style={styles.browseBtnText}>{finalBrowseBtnText}</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSkip}
              activeOpacity={0.8}
              style={[styles.skipBtn, { borderColor: theme.borderColor }]}
            >
              <Text style={[styles.skipBtnText, { color: theme.mutedTextColor }]}>
                {finalSkipBtnText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogCard: {
    width: 480,
    maxWidth: '92%',
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  quickAddSection: {
    marginBottom: 18,
  },
  quickAddHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickAddRow: {
    gap: 8,
  },
  quickItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickItemThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  quickItemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionsContainer: {
    gap: 10,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
