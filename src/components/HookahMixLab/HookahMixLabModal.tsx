import React, { useState, useMemo } from 'react';
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
import { HOOKAH_FLAVORS_DATABASE } from '../../data/hookahMixData';

const BRANDS_LIST = ['ALL', 'Eternal', 'Adalya', 'Fumari', 'Afzal', 'Al Fakhar', 'Starbuzz'];

interface HookahMixLabModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMixToCart: (item: MenuItem, quantity: number, modifiers: SelectedModifier[], specialNotes?: string) => void;
}

export const HookahMixLabModal: React.FC<HookahMixLabModalProps> = ({
  visible,
  onClose,
  onAddMixToCart,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [iceBase, setIceBase] = useState<boolean>(false);
  const [iceHose, setIceHose] = useState<boolean>(false);

  // Active Mix Chamber State
  const [selectedFlavors, setSelectedFlavors] = useState<HookahFlavor[]>([]);
  const [customMixName, setCustomMixName] = useState<string>('ROYAL CUSTOM BOWL');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  // Calculate percentages dynamically
  const flavorsInMix: FlavorInMix[] = useMemo(() => {
    const total = selectedFlavors.length;
    if (total === 0) return [];
    const basePct = Math.floor(100 / total);
    const remainder = 100 - basePct * total;

    return selectedFlavors.map((flavor, idx) => ({
      flavor,
      percentage: idx === 0 ? basePct + remainder : basePct,
    }));
  }, [selectedFlavors]);

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
    if (selectedFlavors.length >= 5) {
      alert("Maximum 5 flavors allowed in a custom bowl.");
      return;
    }
    const newFlavors = [...selectedFlavors, flavor];
    setSelectedFlavors(newFlavors);
    if (customMixName === 'MY CUSTOM BOWL' || customMixName === 'ROYAL CUSTOM BOWL') {
      setCustomMixName(generateMixName(newFlavors));
    }
  };

  // Remove flavor from custom bowl
  const handleRemoveFlavor = (flavorId: string) => {
    const newFlavors = selectedFlavors.filter(f => f.id !== flavorId);
    setSelectedFlavors(newFlavors);
    if (newFlavors.length > 0) {
      setCustomMixName(generateMixName(newFlavors));
    } else {
      setCustomMixName('MY CUSTOM BOWL');
    }
  };

  // Surprise Me Randomizer
  const handleSurpriseMe = () => {
    const pool = selectedBrand === 'ALL' 
      ? HOOKAH_FLAVORS_DATABASE 
      : HOOKAH_FLAVORS_DATABASE.filter(f => f.brand?.toLowerCase() === selectedBrand.toLowerCase());
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 2;
    const randomMix = shuffled.slice(0, count);
    setSelectedFlavors(randomMix);
    if (randomMix.length > 0) {
      setCustomMixName(`${randomMix[0].name.toUpperCase()} MASTERPIECE`);
    }
  };

  // Clear Entire Mix
  const handleClearMix = () => {
    setSelectedFlavors([]);
    setCustomMixName('MY CUSTOM BOWL');
  };

  // Filtered Flavors by Search Query and Brand
  const filteredFlavors = useMemo(() => {
    return HOOKAH_FLAVORS_DATABASE.filter(f => {
      const brandMatch = selectedBrand === 'ALL' || (f.brand && f.brand.toLowerCase() === selectedBrand.toLowerCase());
      if (!brandMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q)) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedBrand]);

  const basePrice = 25.0;
  const totalPrice = basePrice + (iceBase ? 2 : 0) + (iceHose ? 6 : 0);

  // Submit Mix to Cart
  const handleAddMixToCart = () => {
    if (selectedFlavors.length === 0) return;

    const compositionDesc = flavorsInMix
      .map(f => `${f.flavor.brand ? f.flavor.brand + ' ' : ''}${f.flavor.name} (${f.percentage}%)`)
      .join(' • ');

    const selectedOptions: SelectedModifier[] = [];
    if (iceBase) selectedOptions.push({ id: 'OPT_ICE_BASE', optionId: 'OPT_ICE_BASE', optionName: 'Ice Base', name: 'Ice Base', price: 2 });
    if (iceHose) selectedOptions.push({ id: 'OPT_ICE_HOSE', optionId: 'OPT_ICE_HOSE', optionName: 'Ice Hose', name: 'Ice Hose', price: 6 });

    const customHookahItem: MenuItem = {
      id: `custom_mix_${Date.now()}`,
      name: customMixName || 'Custom Hookah Mix',
      price: totalPrice,
      description: `Custom Laboratory Bowl: ${compositionDesc}${iceBase ? ' • Ice Base (+$2)' : ''}${iceHose ? ' • Ice Hose (+$6)' : ''}`,
      category: 'hookah',
      subcategory: 'Mix Lab Creation',
      badge: `🧪 $${totalPrice.toFixed(2)} CUSTOM`,
      emoji: '🧪',
    };

    onAddMixToCart(customHookahItem, 1, selectedOptions, `Composition: ${compositionDesc}`);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
                <Text style={{ color: '#E5B13A', fontSize: 11, fontWeight: '800' }}>
                  $25.00 BASE • SELECT UP TO 5 FLAVORS ACROSS PREMIUM BRANDS
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
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
                {/* 1. VISUAL MIXING BOWL */}
                <View style={[styles.mobileChamberCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                  <View style={styles.chamberHeader}>
                    {isEditingName ? (
                      <TextInput
                        style={[styles.mixNameInput, { color: theme.textColor, borderColor: '#E5B13A' }]}
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
                      <Text style={styles.rimText}>BOWL COMPOSITION ({selectedFlavors.length}/5)</Text>
                    </View>

                    {selectedFlavors.length === 0 ? (
                      <View style={styles.emptyChamber}>
                        <Text style={{ fontSize: 24 }}>🧪</Text>
                        <Text style={[styles.emptyChamberTitle, { color: theme.textColor, fontSize: 12 }]}>
                          SELECT FLAVORS BELOW BY BRAND
                        </Text>
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
                              <Text style={[styles.layerName, { fontSize: 11 }]} numberOfLines={1}>
                                {item.flavor.brand} {item.flavor.name}
                              </Text>
                              <Text style={[styles.layerPct, { fontSize: 11 }]}>{item.percentage}%</Text>
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
                  </View>
                </View>

                {/* 2. BRAND FILTER PILLS */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {BRANDS_LIST.map(bName => {
                    const isAct = selectedBrand.toLowerCase() === bName.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={`brand_m_${bName}`}
                        onPress={() => setSelectedBrand(bName)}
                        style={[
                          styles.brandPill,
                          isAct ? { backgroundColor: '#E5B13A', borderColor: '#E5B13A' } : { backgroundColor: theme.cardColor, borderColor: theme.borderColor }
                        ]}
                      >
                        <Text style={[styles.brandPillText, { color: isAct ? '#000000' : theme.mutedTextColor }]}>
                          {bName.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* 3. SEARCH FILTER */}
                <View style={styles.filterControlBlock}>
                  <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, paddingVertical: 6 }]}>
                    <Search size={16} color={theme.mutedTextColor} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.textColor, fontSize: 12 }]}
                      placeholder={`Search ${selectedBrand === 'ALL' ? '' : selectedBrand + ' '}Flavors...`}
                      placeholderTextColor={theme.mutedTextColor}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>

                {/* 4. FLAVOR LIST */}
                <View style={styles.flavorCardsGridMobile}>
                  {filteredFlavors.map((flavor, idx) => {
                    const isAdded = selectedFlavors.some(f => f.id === flavor.id);
                    return (
                      <TouchableOpacity
                        key={flavor.id || `flv_m_${idx}`}
                        activeOpacity={0.88}
                        onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                        style={[
                          styles.mobileFlavorRowCard,
                          { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                          isAdded && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2 }
                        ]}
                      >
                        <Text style={{ fontSize: 22 }}>{flavor.emoji}</Text>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.flavorName, { color: theme.textColor, fontSize: 13 }]}>{flavor.name}</Text>
                            {flavor.brand ? (
                              <View style={[styles.brandMiniBadge, { backgroundColor: flavor.color || '#E5B13A' }]}>
                                <Text style={styles.brandMiniBadgeText}>{flavor.brand}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.flavorDesc, { color: theme.mutedTextColor, fontSize: 10 }]} numberOfLines={1}>
                            {flavor.description}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                          style={[
                            styles.mobileAddBtn,
                            { backgroundColor: isAdded ? '#EF4444' : '#22C55E' }
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
                  onPress={handleAddMixToCart}
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
                {/* Brand Selector Tabs */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 10 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {BRANDS_LIST.map(bName => {
                    const isAct = selectedBrand.toLowerCase() === bName.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={`brand_d_${bName}`}
                        onPress={() => setSelectedBrand(bName)}
                        style={[
                          styles.brandPill,
                          isAct ? { backgroundColor: '#E5B13A', borderColor: '#E5B13A' } : { backgroundColor: theme.cardColor, borderColor: theme.borderColor }
                        ]}
                      >
                        <Text style={[styles.brandPillText, { color: isAct ? '#000000' : theme.mutedTextColor }]}>
                          {bName.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Search Box */}
                <View style={styles.filterControlBlock}>
                  <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                    <Search size={18} color={theme.mutedTextColor} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.textColor }]}
                      placeholder={`Search ${selectedBrand === 'ALL' ? '' : selectedBrand + ' '}Flavors...`}
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
                    return (
                      <TouchableOpacity
                        key={flavor.id || `flavor_${idx}`}
                        activeOpacity={0.85}
                        onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                        style={[
                          styles.flavorCard,
                          { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                          isAdded && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2 }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 26 }}>{flavor.emoji}</Text>
                          {flavor.brand ? (
                            <View style={[styles.brandMiniBadge, { backgroundColor: flavor.color || '#E5B13A' }]}>
                              <Text style={styles.brandMiniBadgeText}>{flavor.brand}</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={[styles.flavorName, { color: theme.textColor, marginTop: 4 }]}>{flavor.name}</Text>
                        <Text style={[styles.flavorDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                          {flavor.description}
                        </Text>

                        <TouchableOpacity
                          onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                          style={[
                            styles.cardAddBtn,
                            { 
                              backgroundColor: isAdded ? 'rgba(239,68,68,0.12)' : 'transparent',
                              borderColor: isAdded ? '#EF4444' : '#22C55E',
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
                              <Plus size={13} color="#22C55E" />
                              <Text style={[styles.cardAddBtnText, { color: '#22C55E' }]}>ADD TO BOWL</Text>
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
                      style={[styles.mixNameInput, { color: theme.textColor, borderColor: '#E5B13A' }]}
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
                    <Text style={styles.rimText}>CUSTOM HEAT MANAGEMENT BOWL ({selectedFlavors.length}/5)</Text>
                  </View>

                  {selectedFlavors.length === 0 ? (
                    <View style={styles.emptyChamber}>
                      <Text style={{ fontSize: 44, marginBottom: 8 }}>🧪</Text>
                      <Text style={[styles.emptyChamberTitle, { color: theme.textColor }]}>YOUR BOWL IS EMPTY</Text>
                      <Text style={{ color: theme.mutedTextColor, fontSize: 12, marginTop: 4 }}>
                        Select your favorite brand & flavors from the left
                      </Text>
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
                            <Text style={styles.layerName} numberOfLines={1}>
                              {item.flavor.brand} • {item.flavor.name}
                            </Text>
                            <Text style={styles.layerPct}>{item.percentage}%</Text>
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
                  onPress={handleAddMixToCart}
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
