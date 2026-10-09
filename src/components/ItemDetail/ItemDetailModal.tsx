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
import { X, Check, Plus } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { MenuItem, SelectedModifier, ModifierOption, ModifierGroup } from '../../types';
import { QuantitySelector } from '../ui/QuantitySelector';
import { MENU_IMAGES, getItemImageSource } from '../../data/menu_images';
import { getMissingRequiredModifierGroup } from '../../utils/modifierUtils';
import { DakuUpgradeModal } from '../DakuUpgradeModal';

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
  const [showDakuModal, setShowDakuModal] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSpecialInstructions('');
      setValidationError(null);
      setSelectedModifiers([]);
      setShowDakuModal(false);
    }
  }, [item]);

  if (!item) return null;

  const effectiveModifierGroups = React.useMemo<ModifierGroup[]>(() => {
    if (!item) return [];
    let groups: ModifierGroup[] = item.modifierGroups || (item as any).modifier_groups || [];

    const isHouseMix = item.category_id === 'CAT_HOOKAH_HOUSE_MIXES' || 
      (Array.isArray(item.category_ids) && item.category_ids.includes('CAT_HOOKAH_HOUSE_MIXES')) ||
      (item.category || '').toLowerCase().includes('house_mix');

    if (isHouseMix && groups.length > 0) {
      groups = groups.filter(g => {
        const gn = (g.name || g.id || '').toLowerCase();
        return !gn.includes('enhancement') && !gn.includes('ice') && !gn.includes('base');
      });
    }

    if (groups.length > 0) return groups;

    const isWings = item.category_id === 'CAT_WINGS' || 
      (Array.isArray(item.category_ids) && item.category_ids.includes('CAT_WINGS')) ||
      (item.name || '').toLowerCase().includes('wing');

    if (isWings) {
      return [
        {
          id: 'grp_wing_sauces',
          name: 'Sauce Choices (Pick 1 to 3)',
          required: true,
          minSelect: 1,
          maxSelect: 3,
          options: [
            { id: 'opt_buffalo', name: 'Buffalo', price: 0 },
            { id: 'opt_bbq', name: 'BBQ', price: 0 },
            { id: 'opt_garlic_parm', name: 'Garlic Parmesan', price: 0 },
            { id: 'opt_lemon_pepper', name: 'Lemon Pepper', price: 0 },
            { id: 'opt_honey_bbq', name: 'Honey BBQ', price: 0 },
            { id: 'opt_mango_habanero', name: 'Mango Habanero', price: 0 },
          ],
        },
      ];
    }

    const isSpicyDish = /chow mein|fried rice|chili chicken/i.test(item.name || '');
    if (isSpicyDish) {
      return [
        {
          id: 'grp_spice_level',
          name: 'Spice Level',
          required: false,
          minSelect: 0,
          maxSelect: 1,
          options: [
            { id: 'opt_mild', name: 'Mild', price: 0 },
            { id: 'opt_medium', name: 'Medium', price: 0 },
            { id: 'opt_hot', name: 'Hot', price: 0 },
          ],
        },
      ];
    }

    const isColdCoffee = /cold coffee|iced coffee/i.test(item.name || '');
    if (isColdCoffee) {
      return [
        {
          id: 'grp_coffee_flavors',
          name: 'Cold Coffee Flavor',
          required: false,
          minSelect: 0,
          maxSelect: 1,
          options: [
            { id: 'opt_classic', name: 'Classic / Original', price: 0 },
            { id: 'opt_vanilla', name: 'Vanilla (+0.75)', price: 0.75 },
            { id: 'opt_caramel', name: 'Caramel (+0.75)', price: 0.75 },
            { id: 'opt_hazelnut', name: 'Hazelnut (+0.75)', price: 0.75 },
          ],
        },
      ];
    }

    const isBurgerOrEntree = /burger|sandwich|platter|patty/i.test(item.name || '');
    if (isBurgerOrEntree) {
      return [
        {
          id: 'grp_extra_protein',
          name: 'Extra Protein / Filling',
          required: false,
          minSelect: 0,
          maxSelect: 2,
          options: [
            { id: 'opt_extra_patty', name: 'Extra Patty (+$4.50)', price: 4.50 },
            { id: 'opt_extra_chicken', name: 'Extra Chicken (+$4.00)', price: 4.00 },
            { id: 'opt_extra_cheese', name: 'Extra Cheese (+$1.50)', price: 1.50 },
          ],
        },
        {
          id: 'grp_side_options',
          name: 'Side Options (Replace or Add Extra)',
          required: false,
          minSelect: 0,
          maxSelect: 2,
          options: [
            { id: 'opt_no_side', name: 'No Side (-$2.00)', price: -2.00 },
            { id: 'opt_fries', name: 'French Fries', price: 0 },
            { id: 'opt_sub_onion_rings', name: 'Sub Onion Rings (+$1.50)', price: 1.50 },
            { id: 'opt_extra_fries', name: 'Add Extra Fries (+$3.50)', price: 3.50 },
            { id: 'opt_extra_onion_rings', name: 'Add Extra Onion Rings (+$4.50)', price: 4.50 },
          ],
        },
      ];
    }

    return [];
  }, [item]);

  const imageSource = getItemImageSource(item);

  const handleToggleModifier = (groupId: string, groupName: string, option: ModifierOption, isSingleChoice: boolean) => {
    setValidationError(null);
    const optId = option.id || (option as any)._id || option.name;
    const optPrice = Number(option.price !== undefined ? option.price : (option as any).price_adjustment !== undefined ? (option as any).price_adjustment : 0);

    const targetGroup = effectiveModifierGroups.find(g => g.id === groupId || g.name === groupName);
    const maxSelect = targetGroup?.maxSelect || (isSingleChoice ? 1 : 99);

    setSelectedModifiers((prev) => {
      const isAlreadySelected = prev.some((m) => (m.groupId === groupId || m.groupName === groupName) && (m.optionId === optId || m.optionName === option.name));
      if (isSingleChoice || maxSelect === 1) {
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
          const currentGroupSelections = prev.filter(m => m.groupId === groupId || m.groupName === groupName);
          if (currentGroupSelections.length >= maxSelect) {
            setValidationError(`You can select up to ${maxSelect} option${maxSelect > 1 ? 's' : ''} for ${groupName}.`);
            return prev;
          }
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
    // Check if any required modifier group (such as sauce choice) is missing a selection
    const missingGroup = getMissingRequiredModifierGroup(
      { ...item, modifierGroups: effectiveModifierGroups },
      selectedModifiers
    );

    if (missingGroup) {
      const isSauce = (missingGroup.name || '').toLowerCase().includes('sauce') || (item.name || '').toLowerCase().includes('wing');
      setValidationError(
        isSauce 
          ? `⚠️ Please choose a sauce for your ${item.name} to continue!` 
          : `⚠️ Please select a choice for "${missingGroup.name}" to continue!`
      );
      return;
    }

    if (isSoftDrink) {
      const activeMods = selectedModifiers.length > 0 
        ? selectedModifiers 
        : (effectiveModifierGroups[0]?.options?.[0] ? [{
            groupId: effectiveModifierGroups[0].id,
            groupName: effectiveModifierGroups[0].name,
            optionId: effectiveModifierGroups[0].options[0].id,
            optionName: effectiveModifierGroups[0].options[0].name,
            price: Number(effectiveModifierGroups[0].options[0].price || (effectiveModifierGroups[0].options[0] as any).price_adjustment || 0),
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
      onAddToCart(item, quantity, [], specialInstructions);
    }
  } else {
    if ((item.category === 'hookah' || (item.name || '').toLowerCase().includes('hookah')) && !(item as any).isDaku) {
      setShowDakuModal(true);
      return;
    }
    onAddToCart(item, quantity, selectedModifiers, specialInstructions);
  }
  onClose();
};

const processDakuAddToCart = (isDaku: boolean) => {
  setShowDakuModal(false);
  if (isDaku) {
    const dakuPkg = { id: 'PKG_DAKU', name: 'Daku', price: 65, description: 'Unlimited head refill' };
    
    // Convert existing selections to Daku pricing (bases/ice become $0)
    const modifiedModifiers = selectedModifiers.map(mod => {
      if (mod.optionName.toLowerCase().includes('base') || mod.optionName.toLowerCase().includes('hose')) {
        return { ...mod, price: 0, optionName: `${mod.optionName} (Included)` };
      }
      return mod;
    });

    const dakuModifier: SelectedModifier = {
      id: 'PKG_DAKU',
      optionId: 'PKG_DAKU',
      name: 'Daku',
      optionName: `Daku Upgrade ($${dakuPkg.price}) - ${dakuPkg.description}`,
      // For a regular menu item, the base price of the item itself is paid, so we adjust Daku price
      // Wait, if Daku makes the TOTAL $65, and the item base is $25, Daku modifier should be $40.
      price: Math.max(0, dakuPkg.price - (Number(item?.price) || 25)),
    };
    
    // Add Daku modifier and remove any existing Daku modifier to avoid dupes
    const finalMods = [...modifiedModifiers.filter(m => m.id !== 'PKG_DAKU'), dakuModifier];
    
    const dakuItem = { ...item, isDaku: true } as MenuItem;
    onAddToCart(dakuItem, quantity, finalMods, specialInstructions);
  } else {
    onAddToCart(item!, quantity, selectedModifiers, specialInstructions);
  }
  onClose();
};

  return (
    <>
      <DakuUpgradeModal
        visible={showDakuModal}
        onClose={() => setShowDakuModal(false)}
        onAccept={() => processDakuAddToCart(true)}
        onDecline={() => processDakuAddToCart(false)}
      />
      <Modal visible={!!item && !showDakuModal} animationType="fade" transparent>
        <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardColor, borderColor: '#E5B13A', borderWidth: 2 }]}>
          {/* Header Image or Banner */}
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image source={imageSource} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.placeholderBanner, { backgroundColor: 'rgba(255,90,31,0.1)' }]}>
                <Text style={{ fontSize: 54 }}>🍽️</Text>
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
            {effectiveModifierGroups && effectiveModifierGroups.length > 0 && (
              <View style={styles.modifiersSection}>
                {effectiveModifierGroups.map((group, gIdx) => {
                  const grpId = group.id || (group as any)._id || group.name || `group_${gIdx}`;
                  const isSingleChoice = !isSoftDrink && (
                    Boolean(group.required) || 
                    group.maxSelect === 1 || 
                    (group as any).max_selections === 1 || 
                    (group as any).max_selection === 1
                  );

                  const isSauceOrFlavor = (group.name || '').toLowerCase().includes('sauce') || (group.name || '').toLowerCase().includes('flavor');
                  const isWings = (item.name || '').toLowerCase().includes('wing');
                  const isRequired = Boolean(group.required) || isSauceOrFlavor || isWings;

                  const hasSelection = selectedModifiers.some(
                    (m) => (m.groupId === grpId || m.groupName === group.name) && Boolean(m.optionName || m.optionId)
                  );
                  const isMissingThisGroup = Boolean(validationError) && isRequired && !hasSelection;

                  return (
                    <View 
                      key={grpId} 
                      style={[
                        styles.groupBlock,
                        isMissingThisGroup && {
                          borderColor: '#EF4444',
                          borderWidth: 2,
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          borderRadius: 14,
                          padding: 12,
                        }
                      ]}
                    >
                      <View style={styles.groupHeader}>
                        <Text style={[styles.groupTitle, { color: theme.textColor }]}>
                          {group.name}
                        </Text>
                        {isRequired && (
                          <Text style={[
                            styles.requiredTag, 
                            { 
                              color: hasSelection ? '#10B981' : '#EF4444',
                              fontWeight: '900'
                            }
                          ]}>
                            {hasSelection ? '✓ SAUCE SELECTED' : 'REQUIRED (SELECT 1)'}
                          </Text>
                        )}
                      </View>

                      {isMissingThisGroup && (
                        <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 10 }}>
                          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800' }}>
                            👉 Please select a sauce below to proceed with your order
                          </Text>
                        </View>
                      )}

                      <View style={styles.optionsGrid}>
                        {group.options.map((opt, oIdx) => {
                          const optId = opt.id || (opt as any)._id || opt.name || `opt_${oIdx}`;
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
              <Plus size={20} color={item.available !== false ? "#22C55E" : theme.mutedTextColor} />
              <Text style={[styles.addBtnText, { color: item.available !== false ? '#22C55E' : theme.mutedTextColor }]}>
                {item.available !== false ? `ADD TO ORDER — $${calculatedPrice.toFixed(2)}` : 'CURRENTLY UNAVAILABLE'}
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </Modal>
    </>
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
    fontSize: 16,
    height: 70,
    textAlignVertical: 'top',
    // @ts-ignore
    outlineStyle: 'none' as any,
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
