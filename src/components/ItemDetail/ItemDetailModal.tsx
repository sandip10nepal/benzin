import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput 
} from 'react-native';
import { X, Check, Sparkles, Plus } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { MenuItem, SelectedModifier, ModifierOption } from '../../types';
import { QuantitySelector } from '../ui/QuantitySelector';
import { MENU_IMAGES, getItemImageSource } from '../../data/menu_images';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem, 
    quantity: number, 
    modifiers: SelectedModifier[], 
    specialInstructions: string
  ) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const { theme } = useRestaurantTheme();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSpecialInstructions('');
      setValidationError(null);
      setSelectedModifiers([]);
    }
  }, [item]);

  if (!item) return null;

  const imageSource = getItemImageSource(item);

  const handleToggleModifier = (groupId: string, groupName: string, option: ModifierOption, isSingleChoice: boolean) => {
    setValidationError(null);
    const optId = option.id || option._id || option.name;
    const optPrice = Number(option.price !== undefined ? option.price : (option as any).price_adjustment !== undefined ? (option as any).price_adjustment : 0);
    setSelectedModifiers((prev) => {
      const isAlreadySelected = prev.some((m) => (m.groupId === groupId || m.groupName === groupName) && (m.optionId === optId || m.optionName === option.name));
      if (isSingleChoice) {
        const filtered = prev.filter((m) => m.groupId !== groupId && m.groupName !== groupName);
        if (isAlreadySelected) {
          // Allow unselecting
          return filtered;
        }
        return [
          ...filtered,
          {
            groupId,
            groupName,
            optionId: optId,
            optionName: option.name,
            price: optPrice,
          },
        ];
      } else {
        if (isAlreadySelected) {
          return prev.filter((m) => !((m.groupId === groupId || m.groupName === groupName) && (m.optionId === optId || m.optionName === option.name)));
        } else {
          return [
            ...prev,
            {
              groupId,
              groupName,
              optionId: optId,
              optionName: option.name,
              price: optPrice,
            },
          ];
        }
      }
    });
  };

  const isSoftDrink = (item.name || '').toLowerCase().includes('soft drink') || (item.name || '').toLowerCase().includes('soda');
  const modifierTotal = selectedModifiers.reduce((acc, m) => acc + (Number(m.price) || 0), 0);
  const drinkMultiplier = (isSoftDrink && selectedModifiers.length > 1) ? selectedModifiers.length : 1;
  const baseUnit = (Number(item.price) || 0) * drinkMultiplier + modifierTotal;
  const calculatedPrice = (Number(baseUnit) || 0) * (Number(quantity) || 1);

  const handleAdd = () => {
    // Check if any required modifier group is missing a selection
    const missingGroup = (item.modifierGroups || []).find((group) => {
      if (!group.required) return false;
      const grpId = group.id || group._id || group.name;
      return !selectedModifiers.some(
        (m) => (m.groupId === grpId || m.groupName === group.name) && Boolean(m.optionName || m.optionId)
      );
    });

    if (missingGroup) {
      setValidationError(`Please select a choice for "${missingGroup.name}"`);
      return;
    }

    if (isSoftDrink) {
      const activeMods = selectedModifiers.length > 0 
        ? selectedModifiers 
        : (item.modifierGroups?.[0]?.options?.[0] ? [{
            groupId: item.modifierGroups[0].id,
            groupName: item.modifierGroups[0].name,
            optionId: item.modifierGroups[0].options[0].id,
            optionName: item.modifierGroups[0].options[0].name,
            price: Number(item.modifierGroups[0].options[0].price || (item.modifierGroups[0].options[0] as any).price_adjustment || 0),
          }] : []);

      if (activeMods.length > 1) {
        // Add each chosen soft drink as an individual item so customer sees exact drink names and staff receives exact items
        activeMods.forEach((mod) => {
          const singleDrinkItem: MenuItem = {
            ...item,
            id: `${item.id}_${mod.optionId}`,
            name: mod.optionName,
            description: `Chilled ${mod.optionName} served with ice.`,
          };
          onAddToCart(singleDrinkItem, quantity, [mod], specialInstructions);
        });
      } else if (activeMods.length === 1) {
        // Single soft drink chosen - display the specific drink name!
        const singleDrinkItem: MenuItem = {
          ...item,
          id: `${item.id}_${activeMods[0].optionId}`,
          name: activeMods[0].optionName,
          description: `Chilled ${activeMods[0].optionName} served with ice.`,
        };
        onAddToCart(singleDrinkItem, quantity, activeMods, specialInstructions);
      } else {
        onAddToCart(item, quantity, [], specialInstructions);
      }
    } else {
      onAddToCart(item, quantity, selectedModifiers, specialInstructions);
    }
    onClose();
  };

  return (
    <Modal visible={!!item} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardColor, borderColor: '#E5B13A', borderWidth: 2 }]}>
          {/* Header Image or Banner */}
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image source={imageSource} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.placeholderBanner, { backgroundColor: 'rgba(255,90,31,0.1)' }]}>
                <Text style={{ fontSize: 54 }}>�</Text>
              </View>
            )}
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {item.badge && (
              <View style={[styles.badgePill, { backgroundColor: theme.primaryColor }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>

          {/* Main Body */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <View style={styles.titleSection}>
              <Text style={[styles.itemName, { color: theme.textColor }]}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: theme.secondaryColor }]}>
                ${item.price.toFixed(2)}
              </Text>
            </View>

            <Text style={[styles.description, { color: theme.mutedTextColor }]}>
              {item.description}
            </Text>

            {/* Modifier Groups */}
            {item.modifierGroups && item.modifierGroups.length > 0 && (
              <View style={styles.modifiersSection}>
                {item.modifierGroups.map((group, gIdx) => {
                  const isSingleChoice = !isSoftDrink && (
                    Boolean(group.required) || 
                    group.maxSelect === 1 || 
                    (group as any).max_selections === 1 || 
                    (group as any).max_selection === 1
                  );

                  return (
                    <View key={group.id || `group_${gIdx}`} style={styles.groupBlock}>
                      <View style={styles.groupHeader}>
                        <Text style={[styles.groupTitle, { color: theme.textColor }]}>
                          {group.name}
                        </Text>
                        {group.required && (
                          <Text style={[styles.requiredTag, { color: theme.primaryColor }]}>
                            REQUIRED
                          </Text>
                        )}
                      </View>

                      <View style={styles.optionsGrid}>
                        {group.options.map((opt, oIdx) => {
                          const grpId = group.id || group._id || group.name || `group_${gIdx}`;
                          const optId = opt.id || opt._id || opt.name || `opt_${oIdx}`;
                          const isSelected = selectedModifiers.some(
                            (m) => (m.groupId === grpId || m.groupName === group.name) && (m.optionId === optId || m.optionName === opt.name)
                          );

                          return (
                            <TouchableOpacity
                              key={optId}
                              activeOpacity={0.7}
                              onPress={() => handleToggleModifier(grpId, group.name, { ...opt, id: optId }, isSingleChoice)}
                              style={[
                                styles.optionCard,
                                { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: theme.borderColor },
                                isSelected && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2 },
                              ]}
                            >
                              <View style={styles.optionInfo}>
                                <View style={[
                                  styles.checkboxCircle,
                                  { borderColor: isSelected ? '#10B981' : theme.mutedTextColor },
                                  isSelected && { backgroundColor: '#10B981' },
                                ]}>
                                  {isSelected && <Check size={12} color="#FFFFFF" />}
                                </View>
                                <Text style={[styles.optionName, { color: theme.textColor }]}>
                                  {opt.name}
                                </Text>
                              </View>

                              {opt.price > 0 && (
                                <Text style={[styles.optionPrice, { color: theme.secondaryColor }]}>
                                  +${opt.price.toFixed(2)}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Special Instructions */}
            <View style={styles.instructionSection}>
              <Text style={[styles.instructionLabel, { color: theme.textColor }]}>
                SPECIAL INSTRUCTIONS
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: 'rgba(255,255,255,0.03)' },
                ]}
                placeholder="e.g. Extra mint, sauce on side, light ice..."
                placeholderTextColor={theme.mutedTextColor}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
              />
            </View>
          </ScrollView>

          {/* Validation Error Banner */}
          {validationError && (
            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 20, marginBottom: 8, borderRadius: 10 }}>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>
                ⚠️ {validationError}
              </Text>
            </View>
          )}

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.borderColor }]}>
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => q + 1)}
              onDecrease={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
              size="large"
            />

            <TouchableOpacity
              onPress={item.available !== false ? handleAdd : undefined}
              activeOpacity={item.available !== false ? 0.85 : 1}
              style={[
                styles.addBtn, 
                item.available !== false 
                  ? { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5 }
                  : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.borderColor, borderWidth: 1, opacity: 0.6 }
              ]}
            >
              <Sparkles size={20} color={item.available !== false ? "#22C55E" : theme.mutedTextColor} />
              <Text style={[styles.addBtnText, { color: item.available !== false ? '#22C55E' : theme.mutedTextColor }]}>
                {item.available !== false ? `ADD TO ORDER — $${calculatedPrice.toFixed(2)}` : 'CURRENTLY UNAVAILABLE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBanner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '900',
    flex: 1,
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  modifiersSection: {
    gap: 20,
    marginBottom: 20,
  },
  groupBlock: {},
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  optionsGrid: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  instructionSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    height: 70,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    gap: 16,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
