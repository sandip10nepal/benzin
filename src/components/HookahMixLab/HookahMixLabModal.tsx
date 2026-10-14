import React, { useState, useMemo } from 'react';
import { DakuUpgradeModal } from '../DakuUpgradeModal';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRight,
  Dices
} from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  HookahFlavor, 
  FlavorInMix, 
  MenuItem, 
  SelectedModifier 
} from '../../types';
import { HOOKAH_FLAVORS_DATABASE, DEFAULT_HOOKAH_BASES, DAKU_PACKAGE } from '../../data/hookahMixData';

interface HookahMixLabModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMixToCart: (item: MenuItem, quantity: number, modifiers: SelectedModifier[], specialNotes?: string) => void;
  hookahConfig?: any;
  allMenuItems?: MenuItem[];
  isDakuInCart?: boolean;
}

export const HookahMixLabModal: React.FC<HookahMixLabModalProps> = ({
  visible,
  onClose,
  onAddMixToCart,
  hookahConfig,
  allMenuItems,
  isDakuInCart,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [iceBase, setIceBase] = useState<boolean>(false);
  const [iceHose, setIceHose] = useState<boolean>(false);

  // Active Mix Chamber State
  const [selectedFlavors, setSelectedFlavors] = useState<HookahFlavor[]>([]);
  const [customMixName, setCustomMixName] = useState<string>('ROYAL CUSTOM BOWL');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [flavorPercentages, setFlavorPercentages] = useState<Record<string, number>>({});
  const [selectedBaseId, setSelectedBaseId] = useState<string>('base_water');
  const [showDakuModal, setShowDakuModal] = useState<boolean>(false);

  const dakuPkg = useMemo(() => {
    if (hookahConfig?.packages && Array.isArray(hookahConfig.packages)) {
      return hookahConfig.packages.find((p: any) => p.id === 'daku' || (p.name && p.name.toLowerCase().includes('daku'))) || DAKU_PACKAGE;
    }
    return DAKU_PACKAGE;
  }, [hookahConfig]);

  const totalFlavorWeight = useMemo(() => {
    return Math.max(1, Number(hookahConfig?.total_flavor_weight || hookahConfig?.total_weight || 20));
  }, [hookahConfig]);

  const flavorsDatabase = useMemo<HookahFlavor[]>(() => {
    if (hookahConfig?.flavors && Array.isArray(hookahConfig.flavors) && hookahConfig.flavors.length > 0) {
      // Inactive flavors are hidden; active flavors (including out-of-stock) are shown
      const activeFlavors = hookahConfig.flavors.filter((f: any) => f.active !== false);
      if (activeFlavors.length > 0) {
        return activeFlavors.map((item: any) => {
          const stock = typeof item.stock === 'number' ? item.stock : 999;
          const isAvailable = Boolean(item.active !== false && item.available !== false && stock > 0);
          return {
            id: String(item.id || item._id || item.inventory_id),
            inventory_id: String(item.inventory_id || item.id || item._id),
            name: item.name,
            brand: item.brand || item.category || 'House',
            category: (item.brand || item.category || 'house').toLowerCase(),
            description: item.description || '',
            color: item.color || '#8B5CF6',
            emoji: item.emoji || '💨',
            tags: item.tags || [],
            stock: stock,
            unit: item.unit || 'g',
            available: isAvailable,
            active: item.active !== false
          } as HookahFlavor;
        });
      }
    }

    if (allMenuItems) {
      const dbFlavors = allMenuItems.filter(item => {
        const isHkFlavorCatId = item.category_id && String(item.category_id).includes('cat_hk_flavors');
        const isHkFlavorCatIds = Array.isArray(item.category_ids) && item.category_ids.some(c => 
          String(c).includes('cat_hk_flavors') || String(c).includes('Hookah Flavors')
        );
        return isHkFlavorCatId || isHkFlavorCatIds;
      });
      if (dbFlavors.length > 0) {
        return dbFlavors.map(item => ({
          id: item.id,
          inventory_id: item.id,
          name: item.name,
          brand: item.brand || 'House',
          category: (item.brand || 'house').toLowerCase(),
          description: item.description || '',
          color: item.color || item.imageUrl || '#8B5CF6',
          emoji: item.emoji || '💨',
          tags: item.tags || [],
          stock: 999,
          unit: 'g',
          available: item.active !== false,
          active: item.active !== false
        })) as HookahFlavor[];
      }
    }
    return HOOKAH_FLAVORS_DATABASE;
  }, [hookahConfig, allMenuItems]);

  const basesDatabase = useMemo(() => {
    if (hookahConfig?.bases && Array.isArray(hookahConfig.bases) && hookahConfig.bases.length > 0) {
      return hookahConfig.bases.filter((b: any) => b.active !== false);
    }
    return DEFAULT_HOOKAH_BASES;
  }, [hookahConfig]);

  const selectedBase = basesDatabase.find((b: any) => b.id === selectedBaseId) || basesDatabase[0];

  // Calculate percentages dynamically with user overrides
  const flavorsInMix: FlavorInMix[] = useMemo(() => {
    const total = selectedFlavors.length;
    if (total === 0) return [];

    const hasAll = selectedFlavors.every(f => typeof flavorPercentages[f.id] === 'number');
    if (hasAll) {
      return selectedFlavors.map(f => ({
        flavor: f,
        percentage: flavorPercentages[f.id] || 0,
      }));
    }

    const basePct = Math.floor(100 / total);
    const remainder = 100 - basePct * total;
    return selectedFlavors.map((flavor, idx) => ({
      flavor,
      percentage: idx === 0 ? basePct + remainder : basePct,
    }));
  }, [selectedFlavors, flavorPercentages]);

  const totalPercentage = useMemo(() => {
    return flavorsInMix.reduce((sum, f) => sum + (Number(f.percentage) || 0), 0);
  }, [flavorsInMix]);

  const handleAdjustPercentage = (flavorId: string, delta: number) => {
    const current = flavorsInMix.find(f => f.flavor.id === flavorId)?.percentage || 0;
    const nextVal = Math.max(5, Math.min(95, current + delta));
    if (nextVal === current) return;

    const newMap: Record<string, number> = {};
    flavorsInMix.forEach(f => {
      newMap[f.flavor.id] = f.percentage;
    });
    newMap[flavorId] = nextVal;
    setFlavorPercentages(newMap);
  };

  const handleAutoBalance = () => {
    const total = selectedFlavors.length;
    if (total === 0) return;
    const basePct = Math.floor(100 / total);
    const remainder = 100 - basePct * total;
    const newMap: Record<string, number> = {};
    selectedFlavors.forEach((f, idx) => {
      newMap[f.id] = idx === 0 ? basePct + remainder : basePct;
    });
    setFlavorPercentages(newMap);
  };

  // Auto Name Generator
  const generateMixName = (flavors: HookahFlavor[]) => {
    if (flavors.length === 0) return 'MY CUSTOM BOWL';
    const names = flavors.map(f => f.name.toLowerCase());
    if (names.some(n => n.includes('paan') || n.includes('pan')) && names.some(n => n.includes('mint'))) {
      return 'ROYAL PAAN MINT MASTER';
    }
    if (names.some(n => n.includes('peach')) || names.some(n => n.includes('mango'))) {
      return 'TROPICAL CAVALLI SUNSET';
    }
    if (names.some(n => n.includes('blue'))) {
      return 'BLUE FROSTBITE ROYALE';
    }
    if (names.some(n => n.includes('apple'))) {
      return 'IMPERIAL APPLE CRUSH';
    }
    return `${flavors[0].name.toUpperCase()} SPECIAL BLEND`;
  };

  // Add flavor to chamber
  const handleAddFlavor = (flavor: HookahFlavor) => {
    if (selectedFlavors.some(f => f.id === flavor.id)) return;
    if (flavor.available === false || (flavor.stock !== undefined && flavor.stock <= 0)) {
      alert(`${flavor.name} is currently out of stock.`);
      return;
    }
    if (selectedFlavors.length >= 5) {
      alert("Maximum 5 flavors allowed in a custom bowl.");
      return;
    }
    const newFlavors = [...selectedFlavors, flavor];
    setSelectedFlavors(newFlavors);

    // Auto-balance initial percentages
    const basePct = Math.floor(100 / newFlavors.length);
    const remainder = 100 - basePct * newFlavors.length;
    const newPercentages: Record<string, number> = {};
    newFlavors.forEach((f, idx) => {
      newPercentages[f.id] = idx === 0 ? basePct + remainder : basePct;
    });
    setFlavorPercentages(newPercentages);

    if (customMixName === 'MY CUSTOM BOWL' || customMixName === 'ROYAL CUSTOM BOWL') {
      setCustomMixName(generateMixName(newFlavors));
    }
  };

  // Remove flavor from custom bowl
  const handleRemoveFlavor = (flavorId: string) => {
    const newFlavors = selectedFlavors.filter(f => f.id !== flavorId);
    setSelectedFlavors(newFlavors);
    const newPercentages: Record<string, number> = {};
    if (newFlavors.length > 0) {
      const basePct = Math.floor(100 / newFlavors.length);
      const remainder = 100 - basePct * newFlavors.length;
      newFlavors.forEach((f, idx) => {
        newPercentages[f.id] = idx === 0 ? basePct + remainder : basePct;
      });
      setCustomMixName(generateMixName(newFlavors));
    } else {
      setCustomMixName('MY CUSTOM BOWL');
    }
    setFlavorPercentages(newPercentages);
  };

  // Surprise Me Randomizer
  const handleSurpriseMe = () => {
    const pool = flavorsDatabase.filter((f: HookahFlavor) => f.available !== false && (f.stock === undefined || f.stock > 0));
    if (pool.length === 0) {
      alert("No in-stock hookah flavors available.");
      return;
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const count = Math.min(pool.length, Math.floor(Math.random() * 2) + 2);
    const randomMix = shuffled.slice(0, count);
    setSelectedFlavors(randomMix);

    const basePct = Math.floor(100 / count);
    const remainder = 100 - basePct * count;
    const newPercentages: Record<string, number> = {};
    randomMix.forEach((f, idx) => {
      newPercentages[f.id] = idx === 0 ? basePct + remainder : basePct;
    });
    setFlavorPercentages(newPercentages);

    if (randomMix.length > 0) {
      setCustomMixName(`${randomMix[0].name.toUpperCase()} MASTERPIECE`);
    }
  };

  // Clear Entire Mix
  const handleClearMix = () => {
    setSelectedFlavors([]);
    setFlavorPercentages({});
    setCustomMixName('MY CUSTOM BOWL');
  };

  // Filtered Flavors by Search Query and Brand
  const filteredFlavors = useMemo<HookahFlavor[]>(() => {
    return flavorsDatabase.filter((f: HookahFlavor) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.tags && f.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery, flavorsDatabase]);

  const basePrice = 25.0;
  const totalPrice = basePrice + (selectedBase?.price || 0) + (iceBase ? 2 : 0) + (iceHose ? 6 : 0);

  // Submit Mix to Cart
  const handleAddInitiated = () => {
    if (selectedFlavors.length === 0) return;
    if (totalPercentage !== 100) {
      handleAutoBalance();
    }
    if (isDakuInCart) {
      processAddToCart(false);
    } else {
      setShowDakuModal(true);
    }
  };

  const processAddToCart = (isDaku: boolean) => {
    setShowDakuModal(false);
    const compositionDesc = flavorsInMix
      .map(f => `${f.flavor.brand ? f.flavor.brand + ' ' : ''}${f.flavor.name} (${f.percentage}% · ${((f.percentage / 100) * totalFlavorWeight).toFixed(1).replace(/\.0$/, '')}g)`)
      .join(' • ');

    const selectedOptions: SelectedModifier[] = [];
    if (isDaku) {
      selectedOptions.push({
        id: 'PKG_DAKU',
        optionId: 'PKG_DAKU',
        name: dakuPkg.name,
        optionName: `${dakuPkg.name} ($${dakuPkg.price}) - ${dakuPkg.description}`,
        price: Math.max(0, dakuPkg.price - 25),
      });
    }
    if (selectedBase && selectedBase.id !== 'base_water') {
      selectedOptions.push({
        id: `BASE_${selectedBase.id}`,
        optionId: `BASE_${selectedBase.id}`,
        name: `Base: ${selectedBase.name}`,
        optionName: `${selectedBase.name} Base${isDaku ? ' (Included)' : ''}`,
        price: isDaku ? 0 : (selectedBase.price || 0),
      });
    }
    if (iceBase) selectedOptions.push({ id: 'OPT_ICE_BASE', optionId: 'OPT_ICE_BASE', optionName: isDaku ? 'Ice Base (Included)' : 'Ice Base', name: 'Ice Base', price: isDaku ? 0 : 2 });
    if (iceHose) selectedOptions.push({ id: 'OPT_ICE_HOSE', optionId: 'OPT_ICE_HOSE', optionName: isDaku ? 'Ice Hose (Included)' : 'Ice Hose', name: 'Ice Hose', price: isDaku ? 0 : 6 });

    const recipe = flavorsInMix.map(f => {
      const grams = parseFloat(((f.percentage / 100) * totalFlavorWeight).toFixed(2));
      return {
        ingredient_id: f.flavor.inventory_id || f.flavor.id,
        ingredientId: f.flavor.inventory_id || f.flavor.id,
        quantity: grams,
        amount: grams,
        percentage: f.percentage,
        unit: 'g',
        name: f.flavor.name
      };
    });

    const notesParts: string[] = [`Composition: ${compositionDesc}`];
    if (isDaku) notesParts.push(`🔥 ${dakuPkg.name.toUpperCase()}: $${dakuPkg.price} ${dakuPkg.description}`);
    if (selectedBase && selectedBase.id !== 'base_water') {
      notesParts.push(`Base: ${selectedBase.name}${isDaku ? ' (Included)' : (selectedBase.price ? ` (+$${selectedBase.price})` : '')}`);
    }
    if (iceBase) notesParts.push(isDaku ? 'Ice Base (Included)' : 'Ice Base (+$2)');
    if (iceHose) notesParts.push(isDaku ? 'Ice Hose (Included)' : 'Ice Hose (+$6)');

    const customHookahItem: MenuItem = {
      id: `custom_mix_${Date.now()}`,
      name: customMixName || 'Custom Hookah Mix',
      price: basePrice,
      description: `Custom Laboratory Bowl: ${compositionDesc}${isDaku ? ` • ${dakuPkg.name} $${dakuPkg.price} ${dakuPkg.description}` : ''}${selectedBase && selectedBase.id !== 'base_water' ? ` • Base: ${selectedBase.name}` : ''}${iceBase ? ' • Ice Base' : ''}${iceHose ? ' • Ice Hose' : ''}`,
      category: 'hookah',
      subcategory: 'Mix Lab Creation',
      badge: `🧪 $${(isDaku ? dakuPkg.price : totalPrice).toFixed(2)} CUSTOM`,
      emoji: '🧪',
      isDaku: Boolean(isDaku),
      base: selectedBase.name,
      package: isDaku ? `${dakuPkg.name} ($${dakuPkg.price} ${dakuPkg.description})` : undefined,
      recipe: recipe,
    } as any;

    onAddMixToCart(customHookahItem, 1, selectedOptions, notesParts.join(' · '));
    onClose();
  };

  const handleAcceptDaku = () => processAddToCart(true);
  const handleDeclineDaku = () => processAddToCart(false);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <DakuUpgradeModal
        visible={showDakuModal}
        onAccept={handleAcceptDaku}
        onDecline={handleDeclineDaku}
        onClose={() => setShowDakuModal(false)}
      />
      <View style={[styles.overlay, isMobile && { padding: 4 }]}>
        <View style={[
          styles.modalContainer, 
          { backgroundColor: theme.backgroundColor, borderColor: '#E5B13A' },
          isMobile && { width: '100%', height: '100%', borderRadius: 16 }
        ]}>
          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.labIconBg, { backgroundColor: 'rgba(229,177,58,0.15)' }]}>
                <Text style={{ fontSize: isMobile ? 18 : 22 }}>🧪</Text>
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.textColor, fontSize: isMobile ? 15 : 18 }]} numberOfLines={1}>
                  CUSTOM HOOKAH FLAVOR LAB
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <X size={isMobile ? 18 : 22} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* MOBILE VIEW: VERTICAL STACK WITH FIXED BOTTOM CTA */}
          {isMobile ? (
            <View style={{ flex: 1 }}>
              {/* 1. VISUAL MIXING BOWL (STATIC) */}
              <View style={[styles.mobileChamberCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, margin: 12, marginBottom: 0 }]}>
                <View style={styles.chamberHeader}>
                  {isEditingName ? (
                    <TextInput
                      style={[styles.mixNameInput, { color: theme.textColor, borderColor: '#E5B13A', fontSize: 16 }]}
                      value={customMixName}
                      onChangeText={setCustomMixName}
                      onBlur={() => setIsEditingName(false)}
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.mixNameRow}>
                      <Text style={[styles.mixNameText, { color: theme.textColor, fontSize: 14 }]}>{customMixName}</Text>
                      <Text style={{ fontSize: 12 }}>✏️</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.visualBowlContainer, { borderColor: '#E5B13A', minHeight: 100, marginBottom: 8 }]}>
                  <View style={styles.bowlTopRim}>
                    <Text style={styles.rimText}>BOWL COMPOSITION ({selectedFlavors.length}/5) · {totalFlavorWeight}g TOTAL</Text>
                  </View>

                  {selectedFlavors.length === 0 ? (
                    <View style={styles.emptyChamber}>
                      <Text style={{ fontSize: 24 }}>🧪</Text>
                    </View>
                  ) : (
                    <View style={styles.bowlLiquidLayers}>
                      {flavorsInMix.map((item, idx) => (
                        <View 
                          key={item.flavor.id || `mix_m_${idx}`} 
                          style={[styles.flavorLayer, { backgroundColor: item.flavor.color, paddingVertical: 5, paddingHorizontal: 8 }]}
                        >
                          <View style={styles.layerInfoRow}>
                            <Text style={{ fontSize: 13 }}>{item.flavor.emoji}</Text>
                            <Text style={[styles.layerName, { fontSize: 11, flex: 1 }]} numberOfLines={1}>
                              {item.flavor.brand} {item.flavor.name}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginHorizontal: 4 }}>
                              <TouchableOpacity
                                onPress={() => handleAdjustPercentage(item.flavor.id, -5)}
                                style={{ paddingHorizontal: 5, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4 }}
                              >
                                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>-</Text>
                              </TouchableOpacity>
                              <Text style={[styles.layerPct, { fontSize: 10, minWidth: 48, textAlign: 'center' }]}>
                                {item.percentage}% ({((item.percentage / 100) * totalFlavorWeight).toFixed(1).replace(/\.0$/, '')}g)
                              </Text>
                              <TouchableOpacity
                                onPress={() => handleAdjustPercentage(item.flavor.id, 5)}
                                style={{ paddingHorizontal: 5, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4 }}
                              >
                                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleRemoveFlavor(item.flavor.id)}
                              style={[styles.removeLayerBtn, { paddingHorizontal: 6, paddingVertical: 2 }]}
                            >
                              <Trash2 size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {selectedFlavors.length > 0 && totalPercentage !== 100 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 6, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 8, marginTop: 4 }}>
                      <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '700' }}>
                        Total: {totalPercentage}% (Needs 100%)
                      </Text>
                      <TouchableOpacity onPress={handleAutoBalance} style={{ backgroundColor: '#E5B13A', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
                        <Text style={{ color: '#000000', fontSize: 9, fontWeight: '900' }}>AUTO-BALANCE</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.filterControlBlock, { paddingHorizontal: 12, marginTop: 12 }]}>
                <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, paddingVertical: 6 }]}>
                  <Search size={16} color={theme.mutedTextColor} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.textColor, fontSize: 16 }]}
                      placeholder="Search Flavors..."
                      placeholderTextColor={theme.mutedTextColor}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                </View>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
                {/* 4. FLAVOR LIST */}
                <View style={styles.flavorCardsGridMobile}>
                  {filteredFlavors.map((flavor, idx) => {
                    const isAdded = selectedFlavors.some(f => f.id === flavor.id);
                    const isOutOfStock = Boolean(flavor.available === false || (flavor.stock !== undefined && flavor.stock <= 0));
                    return (
                      <TouchableOpacity
                        key={flavor.id || `flv_m_${idx}`}
                        activeOpacity={0.88}
                        disabled={isOutOfStock && !isAdded}
                        onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                        style={[
                          styles.mobileFlavorRowCard,
                          { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                          isAdded && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2 },
                          isOutOfStock && !isAdded && { opacity: 0.55 }
                        ]}
                      >
                        <Text style={{ fontSize: 22 }}>{flavor.emoji}</Text>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.flavorName, { color: theme.textColor, fontSize: 13 }]}>{flavor.name}</Text>
                            {flavor.brand ? (
                              <View style={[styles.brandMiniBadge, { backgroundColor: flavor.color || '#E5B13A' }]}>
                                <Text style={styles.brandMiniBadgeText}>{flavor.brand}</Text>
                              </View>
                            ) : null}
                            {isOutOfStock ? (
                              <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                                <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '800' }}>OUT OF STOCK</Text>
                              </View>
                            ) : (
                              <Text style={{ fontSize: 9.5, color: '#10B981', fontWeight: '700' }}>
                                {flavor.stock !== undefined ? `${flavor.stock}g in stock` : 'In Stock'}
                              </Text>
                            )}
                          </View>
                          <Text style={[styles.flavorDesc, { color: theme.mutedTextColor, fontSize: 10 }]} numberOfLines={1}>
                            {flavor.description}
                          </Text>
                        </View>

                        <TouchableOpacity
                          disabled={isOutOfStock && !isAdded}
                          onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                          style={[
                            styles.mobileAddBtn,
                            { backgroundColor: isAdded ? '#EF4444' : (isOutOfStock ? '#475569' : '#22C55E') }
                          ]}
                        >
                          {isAdded ? (
                            <Trash2 size={14} color="#FFFFFF" />
                          ) : (
                            <Plus size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* FIXED MOBILE BOTTOM ACTION BAR */}
              <View style={[styles.mobileFixedFooter, { backgroundColor: theme.cardColor, borderTopColor: theme.borderColor }]}>
                {/* Surprise & Clear Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={handleSurpriseMe}
                    activeOpacity={0.8}
                    style={[styles.actionPill, { backgroundColor: '#E5B13A', flex: 1, paddingVertical: 8 }]}
                  >
                    <Dices size={15} color="#000000" />
                    <Text style={{ color: '#000000', fontWeight: '900', fontSize: 11 }}>🎲 SURPRISE ME</Text>
                  </TouchableOpacity>

                  {selectedFlavors.length > 0 && (
                    <TouchableOpacity
                      onPress={handleClearMix}
                      style={[styles.actionPill, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#EF4444', paddingHorizontal: 14 }]}
                    >
                      <Trash2 size={15} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 11 }}>CLEAR</Text>
                    </TouchableOpacity>
                  )}
                </View>



                {/* Base Selection */}
                <View style={{ marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' }}>
                      SELECT BASE
                    </Text>
                    {selectedBaseId !== 'base_water' && (
                      <TouchableOpacity onPress={() => setSelectedBaseId('base_water')}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9.5, fontWeight: '600' }}>
                          SKIP (Standard)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                    {basesDatabase.map((b: any) => {
                      const isSelected = selectedBaseId === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedBaseId(b.id)}
                          style={{
                            paddingVertical: 3,
                            paddingHorizontal: 7,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isSelected ? '#10B981' : 'rgba(255,255,255,0.15)',
                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <Text style={{ color: isSelected ? '#10B981' : '#E2E8F0', fontSize: 10, fontWeight: '800' }}>
                            {b.name} {b.price ? `(+$${b.price})` : '($0)'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Add-on options: Ice Base & Ice Hose */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => setIceBase(!iceBase)}
                    activeOpacity={0.8}
                    style={[
                      styles.actionPill,
                      { 
                        backgroundColor: iceBase ? 'rgba(0,153,255,0.25)' : 'rgba(255,255,255,0.06)', 
                        borderColor: iceBase ? '#0099FF' : 'rgba(255,255,255,0.2)', 
                        borderWidth: 1.5, 
                        flex: 1, 
                        paddingVertical: 8 
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 13 }}>🧊</Text>
                    <Text style={{ color: iceBase ? '#0099FF' : theme.textColor, fontWeight: '800', fontSize: 11 }}>
                      {iceBase ? '✓ ICE BASE (+$2)' : '+ ICE BASE (+$2)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIceHose(!iceHose)}
                    activeOpacity={0.8}
                    style={[
                      styles.actionPill,
                      { 
                        backgroundColor: iceHose ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.06)', 
                        borderColor: iceHose ? '#14B8A6' : 'rgba(255,255,255,0.2)', 
                        borderWidth: 1.5, 
                        flex: 1, 
                        paddingVertical: 8 
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 13 }}>❄️</Text>
                    <Text style={{ color: iceHose ? '#14B8A6' : theme.textColor, fontWeight: '800', fontSize: 11 }}>
                      {iceHose ? '✓ ICE HOSE (+$6)' : '+ ICE HOSE (+$6)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleAddInitiated}
                  disabled={selectedFlavors.length === 0}
                  activeOpacity={0.88}
                  style={[
                    styles.addMixToOrderBtn,
                    { backgroundColor: '#10B981', paddingVertical: 12 },
                    selectedFlavors.length === 0 && { opacity: 0.4 }
                  ]}
                >
                  <Text style={[styles.addMixText, { fontSize: 13 }]}>
                    ADD CUSTOM BOWL (${totalPrice.toFixed(2)})
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* DESKTOP / IPAD SPLIT VIEW */
            <View style={styles.labBody}>
              {/* LEFT SIDE: FLAVOR CATALOG */}
              <View style={styles.flavorExplorerSide}>
                {/* Search Box */}
                <View style={styles.filterControlBlock}>
                  <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                    <Search size={18} color={theme.mutedTextColor} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.textColor, fontSize: 16 }]}
                      placeholder="Search Flavors..."
                      placeholderTextColor={theme.mutedTextColor}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>

                {/* Flavors Grid */}
                <ScrollView contentContainerStyle={styles.flavorCardsGrid} showsVerticalScrollIndicator={false}>
                  {filteredFlavors.map((flavor, idx) => {
                    const isAdded = selectedFlavors.some(f => f.id === flavor.id);
                    const isOutOfStock = Boolean(flavor.available === false || (flavor.stock !== undefined && flavor.stock <= 0));
                    return (
                      <TouchableOpacity
                        key={flavor.id || `flavor_${idx}`}
                        activeOpacity={0.85}
                        disabled={isOutOfStock && !isAdded}
                        onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                        style={[
                          styles.flavorCard,
                          { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                          isAdded && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2 },
                          isOutOfStock && !isAdded && { opacity: 0.55 }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 26 }}>{flavor.emoji}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isOutOfStock ? (
                              <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '800' }}>OUT OF STOCK</Text>
                              </View>
                            ) : null}
                            {flavor.brand ? (
                              <View style={[styles.brandMiniBadge, { backgroundColor: flavor.color || '#E5B13A' }]}>
                                <Text style={styles.brandMiniBadgeText}>{flavor.brand}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <Text style={[styles.flavorName, { color: theme.textColor, marginTop: 4 }]}>{flavor.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                          <Text style={{ fontSize: 10, color: isOutOfStock ? '#EF4444' : '#10B981', fontWeight: '700' }}>
                            {isOutOfStock ? '0g in stock (Disabled)' : `${flavor.stock !== undefined ? flavor.stock : 0}g in stock`}
                          </Text>
                        </View>
                        <Text style={[styles.flavorDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                          {flavor.description}
                        </Text>

                        <TouchableOpacity
                          disabled={isOutOfStock && !isAdded}
                          onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                          style={[
                            styles.cardAddBtn,
                            { 
                              backgroundColor: isAdded ? 'rgba(239,68,68,0.12)' : (isOutOfStock ? 'rgba(100,116,139,0.1)' : 'transparent'),
                              borderColor: isAdded ? '#EF4444' : (isOutOfStock ? '#475569' : '#22C55E'),
                              borderWidth: 1.5,
                              marginTop: 8
                            }
                          ]}
                        >
                          {isAdded ? (
                            <>
                              <Trash2 size={13} color="#EF4444" />
                              <Text style={[styles.cardAddBtnText, { color: '#EF4444' }]}>REMOVE</Text>
                            </>
                          ) : (
                            <>
                              <Plus size={13} color={isOutOfStock ? '#64748B' : '#22C55E'} />
                              <Text style={[styles.cardAddBtnText, { color: isOutOfStock ? '#64748B' : '#22C55E' }]}>
                                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BOWL'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* RIGHT SIDE: MIXING CHAMBER & OPTIONS */}
              <View style={[styles.mixingChamberSide, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                <View style={styles.chamberHeader}>
                  {isEditingName ? (
                    <TextInput
                      style={[styles.mixNameInput, { color: theme.textColor, borderColor: '#E5B13A', fontSize: 16 }]}
                      value={customMixName}
                      onChangeText={setCustomMixName}
                      onBlur={() => setIsEditingName(false)}
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.mixNameRow}>
                      <Text style={[styles.mixNameText, { color: theme.textColor }]}>{customMixName}</Text>
                      <Text style={{ fontSize: 14 }}>✏️</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.visualBowlContainer, { borderColor: '#E5B13A', flex: 1, marginBottom: 12 }]}>
                  <View style={styles.bowlTopRim}>
                    <Text style={styles.rimText}>CUSTOM HEAT MANAGEMENT BOWL ({selectedFlavors.length}/5) · {totalFlavorWeight}g TOTAL</Text>
                  </View>

                  {selectedFlavors.length === 0 ? (
                    <View style={styles.emptyChamber}>
                      <Text style={{ fontSize: 44, marginBottom: 8 }}>🧪</Text>
                      <Text style={[styles.emptyChamberTitle, { color: theme.textColor }]}>YOUR BOWL IS EMPTY</Text>
                    </View>
                  ) : (
                    <View style={styles.bowlLiquidLayers}>
                      {flavorsInMix.map((item, idx) => (
                        <View 
                          key={item.flavor.id || `mix_layer_d_${idx}`} 
                          style={[styles.flavorLayer, { backgroundColor: item.flavor.color, flex: item.percentage / 100 }]}
                        >
                          <View style={styles.layerInfoRow}>
                            <Text style={{ fontSize: 16 }}>{item.flavor.emoji}</Text>
                            <Text style={[styles.layerName, { flex: 1 }]} numberOfLines={1}>
                              {item.flavor.brand} • {item.flavor.name}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 6 }}>
                              <TouchableOpacity
                                onPress={() => handleAdjustPercentage(item.flavor.id, -5)}
                                style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4 }}
                              >
                                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>-</Text>
                              </TouchableOpacity>
                              <Text style={[styles.layerPct, { minWidth: 50, textAlign: 'center' }]}>
                                {item.percentage}% ({((item.percentage / 100) * totalFlavorWeight).toFixed(1).replace(/\.0$/, '')}g)
                              </Text>
                              <TouchableOpacity
                                onPress={() => handleAdjustPercentage(item.flavor.id, 5)}
                                style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4 }}
                              >
                                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleRemoveFlavor(item.flavor.id)}
                              style={[styles.removeLayerBtn, { paddingHorizontal: 8, paddingVertical: 4 }]}
                            >
                              <Trash2 size={13} color="#FFFFFF" />
                              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', marginLeft: 4 }}>REMOVE</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {selectedFlavors.length > 0 && totalPercentage !== 100 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 8, marginTop: 6 }}>
                      <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>
                        Total: {totalPercentage}% (Must sum to 100%)
                      </Text>
                      <TouchableOpacity onPress={handleAutoBalance} style={{ backgroundColor: '#E5B13A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: '#000000', fontSize: 10, fontWeight: '900' }}>AUTO-BALANCE</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Action Pills (Surprise & Clear) */}
                <View style={styles.bowlActionsRow}>
                  <TouchableOpacity
                    onPress={handleSurpriseMe}
                    activeOpacity={0.8}
                    style={[styles.actionPill, { backgroundColor: '#E5B13A', flex: 1, paddingVertical: 10 }]}
                  >
                    <Dices size={18} color="#000000" />
                    <Text style={[styles.actionPillText, { color: '#000000' }]}>🎲 SURPRISE ME</Text>
                  </TouchableOpacity>

                  {selectedFlavors.length > 0 && (
                    <TouchableOpacity
                      onPress={handleClearMix}
                      style={[styles.actionPill, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: '#EF4444', flex: 1, paddingVertical: 10 }]}
                    >
                      <Trash2 size={18} color="#EF4444" />
                      <Text style={[styles.actionPillText, { color: '#EF4444' }]}>CLEAR BOWL</Text>
                    </TouchableOpacity>
                  )}
                </View>



                {/* Base Selection */}
                <View style={{ marginTop: 6, marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' }}>
                      HOOKAH BASE
                    </Text>
                    {selectedBaseId !== 'base_water' && (
                      <TouchableOpacity onPress={() => setSelectedBaseId('base_water')}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' }}>
                          SKIP (Standard)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {basesDatabase.map((b: any) => {
                      const isSelected = selectedBaseId === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedBaseId(b.id)}
                          style={{
                            paddingVertical: 5,
                            paddingHorizontal: 9,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSelected ? '#10B981' : 'rgba(255,255,255,0.15)',
                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <Text style={{ color: isSelected ? '#10B981' : '#E2E8F0', fontSize: 11, fontWeight: '800' }}>
                            {b.name} {b.price ? `(+$${b.price})` : '($0)'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Add-on Options: Ice Base & Ice Hose */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => setIceBase(!iceBase)}
                    activeOpacity={0.8}
                    style={[
                      styles.actionPill,
                      { 
                        backgroundColor: iceBase ? 'rgba(0,153,255,0.25)' : 'rgba(255,255,255,0.06)', 
                        borderColor: iceBase ? '#0099FF' : 'rgba(255,255,255,0.2)', 
                        borderWidth: 1.5, 
                        flex: 1, 
                        paddingVertical: 10 
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>🧊</Text>
                    <Text style={{ color: iceBase ? '#0099FF' : theme.textColor, fontWeight: '800', fontSize: 12 }}>
                      {iceBase ? '✓ ICE BASE (+$2.00)' : '+ ICE BASE (+$2.00)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIceHose(!iceHose)}
                    activeOpacity={0.8}
                    style={[
                      styles.actionPill,
                      { 
                        backgroundColor: iceHose ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.06)', 
                        borderColor: iceHose ? '#14B8A6' : 'rgba(255,255,255,0.2)', 
                        borderWidth: 1.5, 
                        flex: 1, 
                        paddingVertical: 10 
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>❄️</Text>
                    <Text style={{ color: iceHose ? '#14B8A6' : theme.textColor, fontWeight: '800', fontSize: 12 }}>
                      {iceHose ? '✓ ICE HOSE (+$6.00)' : '+ ICE HOSE (+$6.00)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Add to Order Button */}
                <TouchableOpacity
                  onPress={handleAddInitiated}
                  disabled={selectedFlavors.length === 0}
                  activeOpacity={0.88}
                  style={[
                    styles.addMixToOrderBtn,
                    { backgroundColor: '#10B981', marginTop: 4 },
                    selectedFlavors.length === 0 && { opacity: 0.4 }
                  ]}
                >
                  <Text style={styles.addMixText}>
                    ADD CUSTOM BOWL TO ORDER (${totalPrice.toFixed(2)})
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '98%',
    height: '94%',
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  labIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labBody: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  flavorExplorerSide: {
    flex: 1.3,
  },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 4,
  },
  brandPillText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  filterControlBlock: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontWeight: '600',
    // @ts-ignore
    outlineStyle: 'none' as any,
  },
  flavorCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  flavorCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
  },
  flavorName: {
    fontWeight: '900',
  },
  flavorDesc: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  brandMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardAddBtnText: {
    fontWeight: '900',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  mobileChamberCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  flavorCardsGridMobile: {
    gap: 8,
  },
  mobileFlavorRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  mobileAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFixedFooter: {
    padding: 12,
    borderTopWidth: 1,
    position: 'relative',
  },
  mixingChamberSide: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    justifyContent: 'space-between',
  },
  chamberHeader: {
    marginBottom: 8,
  },
  mixNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mixNameText: {
    fontWeight: '900',
  },
  mixNameInput: {
    fontSize: 16,
    fontWeight: '900',
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    // @ts-ignore
    outlineStyle: 'none' as any,
  },
  visualBowlContainer: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  bowlTopRim: {
    backgroundColor: 'rgba(229,177,58,0.2)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  rimText: {
    color: '#E5B13A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  emptyChamber: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChamberTitle: {
    fontWeight: '900',
  },
  bowlLiquidLayers: {
    flex: 1,
  },
  flavorLayer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.3)',
  },
  layerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  layerName: {
    color: '#FFFFFF',
    fontWeight: '900',
    flex: 1,
  },
  layerPct: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginRight: 6,
  },
  removeLayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 6,
  },
  bowlActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  addMixToOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addMixText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
