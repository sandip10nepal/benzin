import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { MenuItem } from '../../types';
import { getItemImageSource } from '../../data/menu_images';

interface VibeQuestRecommendationsProps {
  recommendations: MenuItem[];
  theme: any;
  isMobile: boolean;
  onSelectProduct: (item: MenuItem) => void;
  onDismiss: () => void;
}

export const VibeQuestRecommendations: React.FC<VibeQuestRecommendationsProps> = ({
  recommendations,
  theme,
  isMobile,
  onSelectProduct,
  onDismiss,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        isMobile ? { marginHorizontal: 12, marginVertical: 12 } : { marginHorizontal: 24, marginVertical: 16 },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.sectionTitle}>YOUR TOP PICKS</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Show All Menu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        {recommendations.map((item) => {
          const imageSource = getItemImageSource(item);
          return (
            <TouchableOpacity
              key={item.id || (item as any)._id}
              activeOpacity={0.85}
              onPress={() => onSelectProduct(item)}
              style={[
                styles.productCard,
                { backgroundColor: '#27272A', borderColor: '#F59E0B' },
                isMobile ? { width: '100%', marginBottom: 10 } : { flex: 1, minWidth: 220 },
              ]}
            >
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderIconContainer}>
                  <Text style={{ fontSize: 32 }}>{(item as any).emoji || '🍽️'}</Text>
                </View>
              )}

            <View style={styles.cardContent}>
              <View style={styles.namePriceRow}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  ${Number(item.price).toFixed(2)}
                </Text>
              </View>

              {item.description ? (
                <Text style={styles.productDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={() => onSelectProduct(item)}
                style={styles.selectBtn}
              >
                <Text style={styles.selectBtnText}>Select & Customize →</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeBtnText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  placeholderIconContainer: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardContent: {
    padding: 12,
  },
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  productDesc: {
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  selectBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  selectBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
});
